"""
Delivery Service for managing delivery forms and delivery form lines.

This service provides business logic for:
- Delivery form CRUD operations
- Delivery form line management
- Delivery status management (ship, deliver)
- Delivery search and lookup
"""
from typing import Optional, List
from decimal import Decimal
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.delivery_form import DeliveryForm, DeliveryFormLine
from app.models.client import Client
from app.models.order import ClientOrder
from app.models.society import Society
from app.repositories.delivery_repository import DeliveryRepository
from app.schemas.delivery import (
    DeliveryFormCreate, DeliveryFormUpdate,
    DeliveryFormLineCreate, DeliveryFormLineUpdate,
    DeliveryFormSearchParams,
    DeliveryFormResponse, DeliveryFormWithLinesResponse,
    DeliveryFormListResponse, DeliveryFormListPaginatedResponse,
    DeliveryFormLineResponse, DeliveryDetailResponse,
    DeliveryShipRequest, DeliveryDeliverRequest
)

logger = logging.getLogger(__name__)


class DeliveryServiceError(Exception):
    """Base exception for delivery service errors."""
    pass


class DeliveryNotFoundError(DeliveryServiceError):
    """Raised when a delivery form is not found."""
    pass


class DeliveryLineNotFoundError(DeliveryServiceError):
    """Raised when a delivery form line is not found."""
    pass


class DeliveryDuplicateReferenceError(DeliveryServiceError):
    """Raised when a delivery reference already exists."""
    pass


class DeliveryAlreadyShippedError(DeliveryServiceError):
    """Raised when trying to ship an already shipped delivery."""
    pass


class DeliveryAlreadyDeliveredError(DeliveryServiceError):
    """Raised when trying to deliver an already delivered delivery."""
    pass


class DeliveryNotShippedError(DeliveryServiceError):
    """Raised when trying to deliver a delivery that hasn't been shipped."""
    pass


class DeliveryService:
    """
    Service for managing delivery forms.

    Delivery forms represent shipping documents for client orders.
    They track the shipment status, carrier info, and delivery confirmation.
    Status flow: Pending -> Shipped -> Delivered
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = DeliveryRepository(db)

    # =====================
    # Delivery Form Operations
    # =====================

    async def create_delivery(self, data: DeliveryFormCreate) -> DeliveryFormWithLinesResponse:
        """
        Create a new delivery form.

        Args:
            data: Delivery form creation data with lines

        Returns:
            Created delivery form with lines

        Raises:
            DeliveryDuplicateReferenceError: If reference already exists
        """
        # Check for duplicate reference
        if await self.repository.check_reference_exists(data.del_reference):
            raise DeliveryDuplicateReferenceError(
                f"Delivery with reference '{data.del_reference}' already exists"
            )

        delivery = await self.repository.create_delivery(data)
        return await self._delivery_to_detail_response(delivery)

    async def get_delivery(self, delivery_id: int) -> DeliveryFormWithLinesResponse:
        """
        Get a delivery form by ID with all lines.

        Args:
            delivery_id: Delivery form ID

        Returns:
            Delivery form with lines

        Raises:
            DeliveryNotFoundError: If delivery form not found
        """
        delivery = await self.repository.get_delivery(delivery_id)
        if not delivery:
            raise DeliveryNotFoundError(f"Delivery form {delivery_id} not found")
        return await self._delivery_to_detail_response(delivery)

    async def get_delivery_by_reference(
        self,
        reference: str
    ) -> DeliveryFormWithLinesResponse:
        """
        Get a delivery form by reference.

        Args:
            reference: Delivery form reference code

        Returns:
            Delivery form with lines

        Raises:
            DeliveryNotFoundError: If delivery form not found
        """
        delivery = await self.repository.get_delivery_by_reference(reference)
        if not delivery:
            raise DeliveryNotFoundError(
                f"Delivery form with reference '{reference}' not found"
            )
        return await self._delivery_to_detail_response(delivery)

    async def get_delivery_detail(self, delivery_id: int) -> dict:
        """
        Get delivery form by ID with resolved lookup names.
        Returns a dict suitable for DeliveryDetailResponse.

        Args:
            delivery_id: Delivery form ID

        Returns:
            dict with all delivery data and resolved lookup names

        Raises:
            DeliveryNotFoundError: If delivery form not found
        """
        # Get delivery with lines using actual DB column name
        stmt = select(DeliveryForm).options(
            selectinload(DeliveryForm.lines)
        ).where(DeliveryForm.dfo_id == delivery_id)

        result = await self.db.execute(stmt)
        delivery = result.scalar_one_or_none()

        if not delivery:
            raise DeliveryNotFoundError(f"Delivery form {delivery_id} not found")

        # Build base response from ORM object
        response_data = DeliveryDetailResponse.model_validate(delivery).model_dump()

        # Resolve lookup names
        # Client
        if delivery.cli_id:
            stmt = select(Client).where(Client.cli_id == delivery.cli_id)
            result = await self.db.execute(stmt)
            client = result.scalar_one_or_none()
            if client:
                response_data["clientName"] = client.cli_company_name

        # Order
        if delivery.cod_id:
            stmt = select(ClientOrder).where(ClientOrder.cod_id == delivery.cod_id)
            result = await self.db.execute(stmt)
            order = result.scalar_one_or_none()
            if order:
                response_data["orderReference"] = order.cod_code

        # Society
        if delivery.soc_id:
            stmt = select(Society).where(Society.soc_id == delivery.soc_id)
            result = await self.db.execute(stmt)
            society = result.scalar_one_or_none()
            if society:
                response_data["societyName"] = society.soc_society_name

        return response_data

    async def update_delivery(
        self,
        delivery_id: int,
        data: DeliveryFormUpdate
    ) -> DeliveryFormWithLinesResponse:
        """
        Update a delivery form.

        Args:
            delivery_id: Delivery form ID
            data: Update data

        Returns:
            Updated delivery form

        Raises:
            DeliveryNotFoundError: If delivery form not found
            DeliveryDuplicateReferenceError: If new reference already exists
        """
        delivery = await self.repository.get_delivery(delivery_id)
        if not delivery:
            raise DeliveryNotFoundError(f"Delivery form {delivery_id} not found")

        # Check for duplicate reference if reference is being updated
        if data.del_reference and data.del_reference != delivery.del_reference:
            if await self.repository.check_reference_exists(
                data.del_reference, exclude_id=delivery_id
            ):
                raise DeliveryDuplicateReferenceError(
                    f"Delivery with reference '{data.del_reference}' already exists"
                )

        delivery = await self.repository.update_delivery(delivery_id, data)
        return await self._delivery_to_detail_response(delivery)

    async def delete_delivery(self, delivery_id: int) -> bool:
        """
        Delete a delivery form and all its lines.

        Args:
            delivery_id: Delivery form ID

        Returns:
            True if deleted

        Raises:
            DeliveryNotFoundError: If delivery form not found
        """
        deleted = await self.repository.delete_delivery(delivery_id)
        if not deleted:
            raise DeliveryNotFoundError(f"Delivery form {delivery_id} not found")
        return True

    async def search_deliveries(
        self,
        params: DeliveryFormSearchParams
    ) -> DeliveryFormListPaginatedResponse:
        """
        Search delivery forms with filters and pagination.

        Args:
            params: Search parameters

        Returns:
            Paginated list of delivery forms
        """
        deliveries, total = await self.repository.search_deliveries(params)

        items = [
            DeliveryFormListResponse.model_validate(delivery)
            for delivery in deliveries
        ]

        return DeliveryFormListPaginatedResponse(
            items=items,
            total=total,
            skip=params.skip,
            limit=params.limit
        )

    async def get_deliveries_by_order(
        self,
        order_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[DeliveryFormListResponse]:
        """
        Get all delivery forms for an order.

        Args:
            order_id: Order ID
            skip: Number to skip
            limit: Max to return

        Returns:
            List of delivery forms
        """
        deliveries = await self.repository.get_deliveries_by_order(order_id, skip, limit)
        return [DeliveryFormListResponse.model_validate(d) for d in deliveries]

    async def get_deliveries_by_client(
        self,
        client_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[DeliveryFormListResponse]:
        """
        Get all delivery forms for a client.

        Args:
            client_id: Client ID
            skip: Number to skip
            limit: Max to return

        Returns:
            List of delivery forms
        """
        deliveries = await self.repository.get_deliveries_by_client(client_id, skip, limit)
        return [DeliveryFormListResponse.model_validate(d) for d in deliveries]

    async def count_deliveries(
        self,
        order_id: Optional[int] = None,
        client_id: Optional[int] = None,
        status_id: Optional[int] = None
    ) -> int:
        """
        Count delivery forms.

        Args:
            order_id: Optional order filter
            client_id: Optional client filter
            status_id: Optional status filter

        Returns:
            Delivery form count
        """
        return await self.repository.count_deliveries(order_id, client_id, status_id)

    # =====================
    # Status Operations
    # =====================

    async def ship_delivery(
        self,
        delivery_id: int,
        data: DeliveryShipRequest
    ) -> DeliveryFormWithLinesResponse:
        """
        Mark a delivery as shipped.

        Args:
            delivery_id: Delivery form ID
            data: Ship request with optional tracking info

        Returns:
            Updated delivery form

        Raises:
            DeliveryNotFoundError: If delivery form not found
            DeliveryAlreadyShippedError: If already shipped
        """
        delivery = await self.repository.get_delivery(delivery_id)
        if not delivery:
            raise DeliveryNotFoundError(f"Delivery form {delivery_id} not found")

        if delivery.del_shipped_at is not None:
            raise DeliveryAlreadyShippedError(
                f"Delivery form {delivery_id} has already been shipped"
            )

        delivery = await self.repository.mark_shipped(
            delivery_id,
            tracking_number=data.del_tracking_number,
            carrier_id=data.del_car_id
        )
        return await self._delivery_to_detail_response(delivery)

    async def deliver_delivery(
        self,
        delivery_id: int,
        data: DeliveryDeliverRequest
    ) -> DeliveryFormWithLinesResponse:
        """
        Mark a delivery as delivered.

        Args:
            delivery_id: Delivery form ID
            data: Deliver request with optional signature

        Returns:
            Updated delivery form

        Raises:
            DeliveryNotFoundError: If delivery form not found
            DeliveryNotShippedError: If not yet shipped
            DeliveryAlreadyDeliveredError: If already delivered
        """
        delivery = await self.repository.get_delivery(delivery_id)
        if not delivery:
            raise DeliveryNotFoundError(f"Delivery form {delivery_id} not found")

        if delivery.del_shipped_at is None:
            raise DeliveryNotShippedError(
                f"Delivery form {delivery_id} must be shipped before it can be delivered"
            )

        if delivery.del_delivered_at is not None:
            raise DeliveryAlreadyDeliveredError(
                f"Delivery form {delivery_id} has already been delivered"
            )

        delivery = await self.repository.mark_delivered(
            delivery_id,
            signed_by=data.del_signed_by
        )
        return await self._delivery_to_detail_response(delivery)

    # =====================
    # Delivery Form Line Operations
    # =====================

    async def create_line(
        self,
        delivery_id: int,
        data: DeliveryFormLineCreate
    ) -> DeliveryFormLineResponse:
        """
        Create a new delivery form line.

        Args:
            delivery_id: Delivery form ID
            data: Line creation data

        Returns:
            Created line

        Raises:
            DeliveryNotFoundError: If parent delivery form not found
        """
        # Verify delivery exists
        delivery = await self.repository.get_delivery(delivery_id)
        if not delivery:
            raise DeliveryNotFoundError(f"Delivery form {delivery_id} not found")

        line = await self.repository.create_line(delivery_id, data)
        return DeliveryFormLineResponse.model_validate(line)

    async def get_line(self, line_id: int) -> DeliveryFormLineResponse:
        """
        Get a delivery form line by ID.

        Args:
            line_id: Line ID

        Returns:
            Delivery form line

        Raises:
            DeliveryLineNotFoundError: If line not found
        """
        line = await self.repository.get_line(line_id)
        if not line:
            raise DeliveryLineNotFoundError(f"Delivery form line {line_id} not found")
        return DeliveryFormLineResponse.model_validate(line)

    async def update_line(
        self,
        line_id: int,
        data: DeliveryFormLineUpdate
    ) -> DeliveryFormLineResponse:
        """
        Update a delivery form line.

        Args:
            line_id: Line ID
            data: Update data

        Returns:
            Updated line

        Raises:
            DeliveryLineNotFoundError: If line not found
        """
        line = await self.repository.get_line(line_id)
        if not line:
            raise DeliveryLineNotFoundError(f"Delivery form line {line_id} not found")

        line = await self.repository.update_line(line_id, data)
        return DeliveryFormLineResponse.model_validate(line)

    async def delete_line(self, line_id: int) -> bool:
        """
        Delete a delivery form line.

        Args:
            line_id: Line ID

        Returns:
            True if deleted

        Raises:
            DeliveryLineNotFoundError: If line not found
        """
        deleted = await self.repository.delete_line(line_id)
        if not deleted:
            raise DeliveryLineNotFoundError(f"Delivery form line {line_id} not found")
        return True

    async def get_lines_by_delivery(
        self,
        delivery_id: int
    ) -> List[DeliveryFormLineResponse]:
        """
        Get all lines for a delivery form.

        Args:
            delivery_id: Delivery form ID

        Returns:
            List of lines

        Raises:
            DeliveryNotFoundError: If delivery form not found
        """
        delivery = await self.repository.get_delivery(delivery_id)
        if not delivery:
            raise DeliveryNotFoundError(f"Delivery form {delivery_id} not found")

        lines = await self.repository.get_lines_by_delivery(delivery_id)
        return [DeliveryFormLineResponse.model_validate(l) for l in lines]

    # =====================
    # Lookup Operations
    # =====================

    async def get_delivery_lookup(
        self,
        order_id: Optional[int] = None,
        client_id: Optional[int] = None,
        search: Optional[str] = None,
        limit: int = 50
    ) -> List[dict]:
        """
        Get delivery forms for dropdown/lookup.

        Args:
            order_id: Optional order filter
            client_id: Optional client filter
            search: Optional search term
            limit: Max results

        Returns:
            List of lookup items
        """
        return await self.repository.get_delivery_lookup(
            order_id, client_id, search, limit
        )

    # =====================
    # Helper Methods
    # =====================

    async def _delivery_to_detail_response(
        self,
        delivery: DeliveryForm
    ) -> DeliveryFormWithLinesResponse:
        """Convert a DeliveryForm to DeliveryFormWithLinesResponse."""
        lines = await self.repository.get_lines_by_delivery(delivery.del_id)

        return DeliveryFormWithLinesResponse(
            del_id=delivery.del_id,
            del_reference=delivery.del_reference,
            del_ord_id=delivery.del_ord_id,
            del_cli_id=delivery.del_cli_id,
            del_delivery_date=delivery.del_delivery_date,
            del_sta_id=delivery.del_sta_id,
            del_car_id=delivery.del_car_id,
            del_tracking_number=delivery.del_tracking_number,
            del_shipping_address=delivery.del_shipping_address,
            del_shipping_city=delivery.del_shipping_city,
            del_shipping_postal_code=delivery.del_shipping_postal_code,
            del_shipping_country_id=delivery.del_shipping_country_id,
            del_weight=delivery.del_weight,
            del_packages=delivery.del_packages,
            del_notes=delivery.del_notes,
            del_shipped_at=delivery.del_shipped_at,
            del_delivered_at=delivery.del_delivered_at,
            del_signed_by=delivery.del_signed_by,
            del_created_by=delivery.del_created_by,
            del_created_at=delivery.del_created_at,
            del_updated_at=delivery.del_updated_at,
            lines=[
                DeliveryFormLineResponse.model_validate(l) for l in lines
            ]
        )
