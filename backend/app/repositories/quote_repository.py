"""
Repository for Quote data access operations.
"""
from typing import Optional, List, Tuple
from decimal import Decimal
from datetime import datetime
from sqlalchemy import select, func, and_, or_, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.quote import Quote, QuoteLine
from app.schemas.quote import (
    QuoteCreate, QuoteUpdate,
    QuoteLineCreate, QuoteLineUpdate,
    QuoteSearchParams
)


class QuoteRepository:
    """Repository for quote related data operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # =====================
    # Quote Operations
    # =====================

    async def create_quote(
        self,
        data: QuoteCreate,
        reference: str,
        created_by: Optional[int] = None
    ) -> Quote:
        """Create a new quote."""
        quote = Quote(
            quo_reference=reference,
            quo_cli_id=data.quo_cli_id,
            quo_date=data.quo_date,
            quo_valid_until=data.quo_valid_until,
            quo_sta_id=data.quo_sta_id,
            quo_cur_id=data.quo_cur_id,
            quo_shipping_address=data.quo_shipping_address,
            quo_shipping_city=data.quo_shipping_city,
            quo_shipping_postal_code=data.quo_shipping_postal_code,
            quo_shipping_country_id=data.quo_shipping_country_id,
            quo_billing_address=data.quo_billing_address,
            quo_billing_city=data.quo_billing_city,
            quo_billing_postal_code=data.quo_billing_postal_code,
            quo_billing_country_id=data.quo_billing_country_id,
            quo_discount=data.quo_discount or Decimal("0"),
            quo_notes=data.quo_notes,
            quo_internal_notes=data.quo_internal_notes,
            quo_terms_conditions=data.quo_terms_conditions,
            quo_bu_id=data.quo_bu_id,
            quo_soc_id=data.quo_soc_id,
            quo_created_by=created_by
        )

        self.db.add(quote)
        await self.db.flush()

        # Add lines if provided
        if data.lines:
            for idx, line_data in enumerate(data.lines, start=1):
                await self._add_quote_line(quote.quo_id, line_data, idx)

        # Recalculate totals
        await self._recalculate_quote_totals(quote.quo_id)

        await self.db.refresh(quote)
        return quote

    async def get_quote(self, quote_id: int) -> Optional[Quote]:
        """Get a quote by ID with lines."""
        result = await self.db.execute(
            select(Quote)
            .options(selectinload(Quote.lines))
            .where(Quote.quo_id == quote_id)
        )
        return result.scalar_one_or_none()

    async def get_quote_by_reference(self, reference: str) -> Optional[Quote]:
        """Get a quote by reference."""
        result = await self.db.execute(
            select(Quote).where(Quote.quo_reference == reference)
        )
        return result.scalar_one_or_none()

    async def update_quote(
        self,
        quote_id: int,
        data: QuoteUpdate
    ) -> Optional[Quote]:
        """Update a quote."""
        quote = await self.get_quote(quote_id)
        if not quote:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(quote, field, value)

        quote.quo_updated_at = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(quote)
        return quote

    async def delete_quote(self, quote_id: int) -> bool:
        """Delete a quote and all related data."""
        quote = await self.get_quote(quote_id)
        if not quote:
            return False

        await self.db.delete(quote)
        await self.db.flush()
        return True

    async def search_quotes(
        self,
        params: QuoteSearchParams
    ) -> Tuple[List[Quote], int]:
        """Search quotes with filters and pagination."""
        query = select(Quote)
        count_query = select(func.count(Quote.quo_id))

        conditions = []

        if params.reference:
            conditions.append(Quote.quo_reference.ilike(f"%{params.reference}%"))
        if params.client_id:
            conditions.append(Quote.quo_cli_id == params.client_id)
        if params.status_id:
            conditions.append(Quote.quo_sta_id == params.status_id)
        if params.date_from:
            conditions.append(Quote.quo_date >= params.date_from)
        if params.date_to:
            conditions.append(Quote.quo_date <= params.date_to)
        if params.valid_from:
            conditions.append(Quote.quo_valid_until >= params.valid_from)
        if params.valid_to:
            conditions.append(Quote.quo_valid_until <= params.valid_to)
        if params.converted_to_order is not None:
            conditions.append(Quote.quo_converted_to_order == params.converted_to_order)
        if params.society_id:
            conditions.append(Quote.quo_soc_id == params.society_id)
        if params.bu_id:
            conditions.append(Quote.quo_bu_id == params.bu_id)
        if params.min_amount is not None:
            conditions.append(Quote.quo_total_amount >= params.min_amount)
        if params.max_amount is not None:
            conditions.append(Quote.quo_total_amount <= params.max_amount)

        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        # Sorting
        sort_column = getattr(Quote, params.sort_by, Quote.quo_created_at)
        if params.sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Pagination
        offset = (params.page - 1) * params.page_size
        query = query.offset(offset).limit(params.page_size)

        # Execute queries
        result = await self.db.execute(query)
        quotes = list(result.scalars().all())

        count_result = await self.db.execute(count_query)
        total = count_result.scalar_one()

        return quotes, total

    async def generate_reference(self) -> str:
        """Generate a unique quote reference."""
        year = datetime.now().strftime("%Y")
        prefix = f"QUO-{year}-"

        # Get the latest reference number for this year
        result = await self.db.execute(
            select(Quote.quo_reference)
            .where(Quote.quo_reference.like(f"{prefix}%"))
            .order_by(Quote.quo_reference.desc())
            .limit(1)
        )
        latest_ref = result.scalar_one_or_none()

        if latest_ref:
            # Extract the number part and increment
            try:
                num_part = int(latest_ref.replace(prefix, ""))
                next_num = num_part + 1
            except ValueError:
                next_num = 1
        else:
            next_num = 1

        return f"{prefix}{next_num:05d}"

    # =====================
    # Quote Line Operations
    # =====================

    async def add_quote_line(
        self,
        quote_id: int,
        data: QuoteLineCreate
    ) -> Optional[QuoteLine]:
        """Add a line to a quote."""
        quote = await self.get_quote(quote_id)
        if not quote:
            return None

        # Get next line number
        max_line_result = await self.db.execute(
            select(func.max(QuoteLine.qul_line_number))
            .where(QuoteLine.qul_quo_id == quote_id)
        )
        max_line = max_line_result.scalar_one() or 0

        line = await self._add_quote_line(quote_id, data, max_line + 1)
        await self._recalculate_quote_totals(quote_id)
        return line

    async def _add_quote_line(
        self,
        quote_id: int,
        data: QuoteLineCreate,
        line_number: int
    ) -> QuoteLine:
        """Internal method to add a quote line."""
        # Calculate line totals
        subtotal = data.qul_quantity * data.qul_unit_price
        discount_amount = subtotal * (data.qul_discount / Decimal("100"))
        net_amount = subtotal - discount_amount

        # TODO: Get VAT rate from database and calculate VAT amount
        # For now, we'll set a placeholder
        vat_amount = Decimal("0")  # Will be calculated when VAT rate is fetched
        line_total = net_amount + vat_amount

        line = QuoteLine(
            qul_quo_id=quote_id,
            qul_line_number=line_number,
            qul_prd_id=data.qul_prd_id,
            qul_description=data.qul_description,
            qul_quantity=data.qul_quantity,
            qul_unit_price=data.qul_unit_price,
            qul_discount=data.qul_discount,
            qul_vat_id=data.qul_vat_id,
            qul_vat_amount=vat_amount,
            qul_line_total=line_total,
            qul_sort_order=data.qul_sort_order if data.qul_sort_order else line_number
        )

        self.db.add(line)
        await self.db.flush()
        return line

    async def update_quote_line(
        self,
        line_id: int,
        data: QuoteLineUpdate
    ) -> Optional[QuoteLine]:
        """Update a quote line."""
        result = await self.db.execute(
            select(QuoteLine).where(QuoteLine.qul_id == line_id)
        )
        line = result.scalar_one_or_none()
        if not line:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(line, field, value)

        # Recalculate line totals
        subtotal = line.qul_quantity * line.qul_unit_price
        discount_amount = subtotal * (line.qul_discount / Decimal("100"))
        net_amount = subtotal - discount_amount

        # TODO: Fetch VAT rate and calculate VAT amount
        line.qul_line_total = net_amount + line.qul_vat_amount

        await self.db.flush()

        # Recalculate quote totals
        await self._recalculate_quote_totals(line.qul_quo_id)

        await self.db.refresh(line)
        return line

    async def delete_quote_line(self, line_id: int) -> bool:
        """Delete a quote line."""
        result = await self.db.execute(
            select(QuoteLine).where(QuoteLine.qul_id == line_id)
        )
        line = result.scalar_one_or_none()
        if not line:
            return False

        quote_id = line.qul_quo_id
        await self.db.delete(line)
        await self.db.flush()

        # Recalculate quote totals
        await self._recalculate_quote_totals(quote_id)

        # Renumber remaining lines
        await self._renumber_lines(quote_id)

        return True

    async def get_quote_lines(self, quote_id: int) -> List[QuoteLine]:
        """Get all lines for a quote."""
        result = await self.db.execute(
            select(QuoteLine)
            .where(QuoteLine.qul_quo_id == quote_id)
            .order_by(QuoteLine.qul_sort_order, QuoteLine.qul_line_number)
        )
        return list(result.scalars().all())

    async def get_quote_line(self, line_id: int) -> Optional[QuoteLine]:
        """Get a specific quote line."""
        result = await self.db.execute(
            select(QuoteLine).where(QuoteLine.qul_id == line_id)
        )
        return result.scalar_one_or_none()

    # =====================
    # Helper Methods
    # =====================

    async def _recalculate_quote_totals(self, quote_id: int) -> None:
        """Recalculate quote totals from lines."""
        result = await self.db.execute(
            select(
                func.coalesce(func.sum(QuoteLine.qul_line_total - QuoteLine.qul_vat_amount), Decimal("0")).label("sub_total"),
                func.coalesce(func.sum(QuoteLine.qul_vat_amount), Decimal("0")).label("total_vat"),
                func.coalesce(func.sum(QuoteLine.qul_line_total), Decimal("0")).label("total_amount")
            )
            .where(QuoteLine.qul_quo_id == quote_id)
        )
        totals = result.one()

        await self.db.execute(
            update(Quote)
            .where(Quote.quo_id == quote_id)
            .values(
                quo_sub_total=totals.sub_total or Decimal("0"),
                quo_total_vat=totals.total_vat or Decimal("0"),
                quo_total_amount=totals.total_amount or Decimal("0"),
                quo_updated_at=datetime.utcnow()
            )
        )
        await self.db.flush()

    async def _renumber_lines(self, quote_id: int) -> None:
        """Renumber lines after deletion to keep sequential numbering."""
        lines = await self.get_quote_lines(quote_id)
        for idx, line in enumerate(lines, start=1):
            if line.qul_line_number != idx:
                await self.db.execute(
                    update(QuoteLine)
                    .where(QuoteLine.qul_id == line.qul_id)
                    .values(qul_line_number=idx)
                )
        await self.db.flush()

    async def mark_as_converted(
        self,
        quote_id: int,
        order_id: int
    ) -> Optional[Quote]:
        """Mark a quote as converted to an order."""
        await self.db.execute(
            update(Quote)
            .where(Quote.quo_id == quote_id)
            .values(
                quo_converted_to_order=True,
                quo_ord_id=order_id,
                quo_converted_at=datetime.utcnow(),
                quo_updated_at=datetime.utcnow()
            )
        )
        await self.db.flush()
        return await self.get_quote(quote_id)

    async def duplicate_quote(
        self,
        quote_id: int,
        new_reference: str,
        new_valid_until: Optional[datetime] = None,
        new_client_id: Optional[int] = None,
        created_by: Optional[int] = None
    ) -> Optional[Quote]:
        """Duplicate an existing quote."""
        original = await self.get_quote(quote_id)
        if not original:
            return None

        # Create new quote
        new_quote = Quote(
            quo_reference=new_reference,
            quo_cli_id=new_client_id or original.quo_cli_id,
            quo_date=datetime.utcnow(),
            quo_valid_until=new_valid_until or original.quo_valid_until,
            quo_sta_id=original.quo_sta_id,
            quo_cur_id=original.quo_cur_id,
            quo_shipping_address=original.quo_shipping_address,
            quo_shipping_city=original.quo_shipping_city,
            quo_shipping_postal_code=original.quo_shipping_postal_code,
            quo_shipping_country_id=original.quo_shipping_country_id,
            quo_billing_address=original.quo_billing_address,
            quo_billing_city=original.quo_billing_city,
            quo_billing_postal_code=original.quo_billing_postal_code,
            quo_billing_country_id=original.quo_billing_country_id,
            quo_discount=original.quo_discount,
            quo_notes=original.quo_notes,
            quo_internal_notes=original.quo_internal_notes,
            quo_terms_conditions=original.quo_terms_conditions,
            quo_bu_id=original.quo_bu_id,
            quo_soc_id=original.quo_soc_id,
            quo_created_by=created_by
        )

        self.db.add(new_quote)
        await self.db.flush()

        # Copy lines
        for line in original.lines:
            new_line = QuoteLine(
                qul_quo_id=new_quote.quo_id,
                qul_line_number=line.qul_line_number,
                qul_prd_id=line.qul_prd_id,
                qul_description=line.qul_description,
                qul_quantity=line.qul_quantity,
                qul_unit_price=line.qul_unit_price,
                qul_discount=line.qul_discount,
                qul_vat_id=line.qul_vat_id,
                qul_vat_amount=line.qul_vat_amount,
                qul_line_total=line.qul_line_total,
                qul_sort_order=line.qul_sort_order
            )
            self.db.add(new_line)

        await self.db.flush()

        # Recalculate totals
        await self._recalculate_quote_totals(new_quote.quo_id)

        await self.db.refresh(new_quote)
        return new_quote
