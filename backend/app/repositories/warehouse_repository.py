"""
Repository for Warehouse, Stock, and Stock Movement data access operations.
"""
import re
from typing import Optional, List, Tuple
from decimal import Decimal
from datetime import datetime
from sqlalchemy import select, func, and_, or_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.warehouse import Warehouse
from app.models.inventory import Inventory, InventoryRecord, PreInventory, ProductShelves, Shelf
from app.models.client import Client
from app.models.country import Country
from app.models.product import Product
from app.models.shipment import ShippingReceiving, ShippingReceivingLine
from app.schemas.warehouse import (
    WarehouseCreate, WarehouseUpdate, WarehouseSearchParams,
    StockCreate, StockUpdate, StockSearchParams,
    StockMovementCreate, StockMovementUpdate, StockMovementSearchParams,
    StockMovementLineCreate, StockMovementLineUpdate,
    MovementStatus, MovementType
)


class WarehouseRepository:
    """Repository for warehouse related data operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # =====================
    # Warehouse Operations
    # =====================

    async def create_warehouse(self, data: WarehouseCreate) -> Warehouse:
        """Create a new warehouse."""
        country_name = None
        if data.wh_country_id:
            result = await self.db.execute(
                select(Country.cou_name).where(Country.cou_id == data.wh_country_id)
            )
            country_name = result.scalar_one_or_none()

        warehouse = Warehouse(
            whs_code=data.wh_code,
            whs_name=data.wh_name,
            whs_address1=data.wh_address,
            whs_city=data.wh_city,
            whs_country=country_name
        )

        self.db.add(warehouse)
        await self.db.flush()
        await self.db.refresh(warehouse)
        return warehouse

    async def get_warehouse(self, warehouse_id: int) -> Optional[Warehouse]:
        """Get a warehouse by ID."""
        result = await self.db.execute(
            select(Warehouse).where(Warehouse.whs_id == warehouse_id)
        )
        return result.scalar_one_or_none()

    async def get_warehouse_by_code(self, code: str) -> Optional[Warehouse]:
        """Get a warehouse by code."""
        result = await self.db.execute(
            select(Warehouse).where(Warehouse.whs_code == code)
        )
        return result.scalar_one_or_none()

    async def update_warehouse(
        self,
        warehouse_id: int,
        data: WarehouseUpdate
    ) -> Optional[Warehouse]:
        """Update a warehouse."""
        warehouse = await self.get_warehouse(warehouse_id)
        if not warehouse:
            return None

        update_data = data.model_dump(exclude_unset=True)
        if "wh_code" in update_data and update_data["wh_code"] is not None:
            warehouse.whs_code = update_data["wh_code"]
        if "wh_name" in update_data and update_data["wh_name"] is not None:
            warehouse.whs_name = update_data["wh_name"]
        if "wh_address" in update_data and update_data["wh_address"] is not None:
            warehouse.whs_address1 = update_data["wh_address"]
        if "wh_city" in update_data and update_data["wh_city"] is not None:
            warehouse.whs_city = update_data["wh_city"]
        if "wh_country_id" in update_data and update_data["wh_country_id"] is not None:
            result = await self.db.execute(
                select(Country.cou_name).where(Country.cou_id == update_data["wh_country_id"])
            )
            warehouse.whs_country = result.scalar_one_or_none()

        await self.db.flush()
        await self.db.refresh(warehouse)
        return warehouse

    async def delete_warehouse(self, warehouse_id: int) -> bool:
        """Delete a warehouse."""
        warehouse = await self.get_warehouse(warehouse_id)
        if not warehouse:
            return False

        await self.db.delete(warehouse)
        await self.db.flush()
        return True

    async def search_warehouses(
        self,
        params: WarehouseSearchParams
    ) -> Tuple[List[Warehouse], int]:
        """Search warehouses with filters and pagination."""
        query = select(Warehouse)
        count_query = select(func.count(Warehouse.whs_id))

        conditions = []

        if params.search:
            search_term = f"%{params.search}%"
            conditions.append(
                or_(
                    Warehouse.whs_code.ilike(search_term),
                    Warehouse.whs_name.ilike(search_term)
                )
            )

        if params.city:
            conditions.append(Warehouse.whs_city.ilike(f"%{params.city}%"))
        if params.country_id:
            result = await self.db.execute(
                select(Country.cou_name).where(Country.cou_id == params.country_id)
            )
            country_name = result.scalar_one_or_none()
            if country_name:
                conditions.append(Warehouse.whs_country == country_name)

        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        # Sorting
        sort_map = {
            "wh_name": Warehouse.whs_name,
            "wh_code": Warehouse.whs_code,
            "wh_city": Warehouse.whs_city,
            "wh_id": Warehouse.whs_id,
        }
        sort_column = sort_map.get(params.sort_by or "wh_name", Warehouse.whs_name)
        if params.sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Pagination
        query = query.offset(params.skip).limit(params.limit)

        result = await self.db.execute(query)
        warehouses = list(result.scalars().all())

        count_result = await self.db.execute(count_query)
        total = count_result.scalar_one()

        return warehouses, total

    async def get_all_warehouses(
        self,
        active_only: bool = True
    ) -> List[Warehouse]:
        """Get all warehouses."""
        query = select(Warehouse).order_by(Warehouse.whs_name)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_default_warehouse(self) -> Optional[Warehouse]:
        """Get the default warehouse."""
        result = await self.db.execute(
            select(Warehouse).order_by(Warehouse.whs_id.asc()).limit(1)
        )
        return result.scalar_one_or_none()

    async def count_warehouses(self, active_only: bool = False) -> int:
        """Count warehouses."""
        query = select(func.count(Warehouse.whs_id))
        result = await self.db.execute(query)
        return result.scalar_one()

    async def check_code_exists(
        self,
        code: str,
        exclude_id: Optional[int] = None
    ) -> bool:
        """Check if a warehouse code already exists."""
        query = select(func.count(Warehouse.whs_id)).where(
            Warehouse.whs_code == code
        )
        if exclude_id:
            query = query.where(Warehouse.whs_id != exclude_id)
        result = await self.db.execute(query)
        return result.scalar_one() > 0

    async def get_warehouse_lookup(
        self,
        search: Optional[str] = None,
        active_only: bool = True,
        limit: int = 50
    ) -> List[dict]:
        """Get warehouses for dropdown/lookup."""
        query = select(
            Warehouse.whs_id,
            Warehouse.whs_code,
            Warehouse.whs_name
        )

        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Warehouse.whs_code.ilike(search_term),
                    Warehouse.whs_name.ilike(search_term)
                )
            )

        query = query.order_by(Warehouse.whs_name).limit(limit)

        result = await self.db.execute(query)
        rows = result.all()

        return [
            {
                "id": row.whs_id,
                "code": row.whs_code,
                "name": row.whs_name,
                "is_default": False,
                "display_name": f"{row.whs_code} - {row.whs_name}"
            }
            for row in rows
        ]


class StockRepository:
    """Repository for stock related data operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _reserved_subquery(self):
        return (
            select(
                PreInventory.inv_id.label("inv_id"),
                func.coalesce(func.sum(PreInventory.piv_quantity), 0).label("reserved")
            )
            .group_by(PreInventory.inv_id)
            .subquery()
        )

    def _shelf_subquery(self):
        return (
            select(
                ProductShelves.inv_id.label("inv_id"),
                func.min(ProductShelves.whs_id).label("whs_id"),
                func.min(ProductShelves.she_id).label("she_id"),
            )
            .group_by(ProductShelves.inv_id)
            .subquery()
        )

    async def create_stock(self, data: StockCreate) -> Inventory:
        """Create a new inventory record."""
        now = datetime.utcnow()

        product = None
        if data.prd_id:
            result = await self.db.execute(
                select(Product).where(Product.prd_id == data.prd_id)
            )
            product = result.scalar_one_or_none()

        inventory = Inventory(
            prd_id=data.prd_id,
            pit_id=data.pit_id,
            prd_name=product.prd_name if product else None,
            prd_ref=product.prd_ref if product else None,
            prd_description=getattr(product, 'prd_description', None) if product else None,
            inv_quantity=data.stk_quantity,
            inv_d_update=now,
            inv_description=data.stk_notes,
        )

        self.db.add(inventory)
        await self.db.flush()

        if data.stk_quantity_reserved and data.stk_quantity_reserved > 0:
            pre_inv = PreInventory(
                inv_id=inventory.inv_id,
                piv_quantity=data.stk_quantity_reserved,
                piv_d_update=now,
            )
            self.db.add(pre_inv)

        if data.whs_id:
            shelf = await self._get_default_shelf(data.whs_id)
            if shelf:
                product_shelf = ProductShelves(
                    inv_id=inventory.inv_id,
                    whs_id=data.whs_id,
                    she_id=shelf.she_id,
                )
                self.db.add(product_shelf)

        await self.db.flush()
        await self.db.refresh(inventory)
        return inventory

    async def get_stock(self, stock_id: int) -> Optional[Inventory]:
        """Get inventory by ID."""
        result = await self.db.execute(
            select(Inventory)
            .options(
                selectinload(Inventory.product),
                selectinload(Inventory.product_instance),
                selectinload(Inventory.pre_inventory),
                selectinload(Inventory.product_shelves).selectinload(ProductShelves.warehouse),
                selectinload(Inventory.product_shelves).selectinload(ProductShelves.shelf),
            )
            .where(Inventory.inv_id == stock_id)
        )
        return result.scalar_one_or_none()

    async def get_stock_by_product_warehouse(
        self,
        prd_id: int,
        whs_id: Optional[int],
        soc_id: int,
        pit_id: Optional[int] = None
    ) -> Optional[Inventory]:
        """Get inventory by product and warehouse."""
        query = select(Inventory).where(Inventory.prd_id == prd_id)

        if pit_id is not None:
            query = query.where(Inventory.pit_id == pit_id)

        if whs_id is not None:
            query = query.join(
                ProductShelves,
                ProductShelves.inv_id == Inventory.inv_id
            ).where(ProductShelves.whs_id == whs_id)
        else:
            query = query.outerjoin(
                ProductShelves,
                ProductShelves.inv_id == Inventory.inv_id
            ).where(ProductShelves.inv_id.is_(None))

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def update_stock(
        self,
        stock_id: int,
        data: StockUpdate
    ) -> Optional[Inventory]:
        """Update inventory record."""
        inventory = await self.get_stock(stock_id)
        if not inventory:
            return None

        update_data = data.model_dump(exclude_unset=True)
        if "stk_quantity" in update_data and update_data["stk_quantity"] is not None:
            inventory.inv_quantity = update_data["stk_quantity"]

        if "stk_notes" in update_data:
            inventory.inv_description = update_data["stk_notes"]

        inventory.inv_d_update = datetime.utcnow()

        await self.db.flush()
        await self.db.refresh(inventory)
        return inventory

    async def adjust_stock_quantity(
        self,
        stock_id: int,
        adjustment: Decimal,
        reason: Optional[str] = None
    ) -> Optional[Inventory]:
        """Adjust inventory quantity and write record."""
        inventory = await self.get_stock(stock_id)
        if not inventory:
            return None

        current_qty = inventory.inv_quantity or Decimal("0")
        inventory.inv_quantity = current_qty + adjustment
        inventory.inv_d_update = datetime.utcnow()
        if reason:
            inventory.inv_description = reason

        record = InventoryRecord(
            inv_id=inventory.inv_id,
            invr_d_record=datetime.utcnow(),
            invr_quantity=adjustment,
        )
        self.db.add(record)

        await self.db.flush()
        await self.db.refresh(inventory)
        return inventory

    async def reserve_stock(
        self,
        stock_id: int,
        quantity: Decimal
    ) -> Optional[Inventory]:
        """Reserve inventory quantity using pre-inventory."""
        inventory = await self.get_stock(stock_id)
        if not inventory:
            return None

        now = datetime.utcnow()
        pre_inv = None
        if inventory.pre_inventory:
            pre_inv = inventory.pre_inventory[0]

        if pre_inv:
            pre_inv.piv_quantity = (pre_inv.piv_quantity or Decimal("0")) + quantity
            pre_inv.piv_d_update = now
        else:
            pre_inv = PreInventory(
                inv_id=inventory.inv_id,
                piv_quantity=quantity,
                piv_d_update=now,
            )
            self.db.add(pre_inv)

        await self.db.flush()
        await self.db.refresh(inventory)
        return inventory

    async def release_reservation(
        self,
        stock_id: int,
        quantity: Decimal
    ) -> Optional[Inventory]:
        """Release reserved inventory quantity."""
        inventory = await self.get_stock(stock_id)
        if not inventory:
            return None

        if inventory.pre_inventory:
            pre_inv = inventory.pre_inventory[0]
            current = pre_inv.piv_quantity or Decimal("0")
            pre_inv.piv_quantity = max(Decimal("0"), current - quantity)
            pre_inv.piv_d_update = datetime.utcnow()

        await self.db.flush()
        await self.db.refresh(inventory)
        return inventory

    async def delete_stock(self, stock_id: int) -> bool:
        """Delete an inventory record."""
        result = await self.db.execute(
            delete(Inventory).where(Inventory.inv_id == stock_id)
        )
        return result.rowcount > 0

    async def search_stock(
        self,
        params: StockSearchParams
    ) -> Tuple[List[dict], int]:
        """Search inventory with filters and pagination."""
        reserved_subq = self._reserved_subquery()
        shelf_subq = self._shelf_subquery()

        available_expr = (
            func.coalesce(Inventory.inv_quantity, 0)
            - func.coalesce(reserved_subq.c.reserved, 0)
        )

        query = select(
            Inventory.inv_id.label("stk_id"),
            Inventory.prd_id.label("prd_id"),
            Inventory.pit_id.label("pit_id"),
            Inventory.prd_name.label("product_name"),
            Inventory.prd_ref.label("product_ref"),
            func.coalesce(Inventory.inv_quantity, 0).label("stk_quantity"),
            func.coalesce(reserved_subq.c.reserved, 0).label("stk_quantity_reserved"),
            available_expr.label("stk_quantity_available"),
            shelf_subq.c.whs_id.label("whs_id"),
            Warehouse.whs_name.label("warehouse_name"),
            Warehouse.whs_code.label("warehouse_code"),
        ).select_from(Inventory)

        query = query.outerjoin(reserved_subq, reserved_subq.c.inv_id == Inventory.inv_id)
        query = query.outerjoin(shelf_subq, shelf_subq.c.inv_id == Inventory.inv_id)
        query = query.outerjoin(Warehouse, Warehouse.whs_id == shelf_subq.c.whs_id)

        count_query = select(func.count(Inventory.inv_id)).select_from(Inventory)

        conditions = []

        if params.search:
            search_term = f"%{params.search}%"
            conditions.append(
                or_(
                    Inventory.prd_name.ilike(search_term),
                    Inventory.prd_ref.ilike(search_term)
                )
            )

        if params.prd_id:
            conditions.append(Inventory.prd_id == params.prd_id)
        if params.whs_id:
            conditions.append(shelf_subq.c.whs_id == params.whs_id)
        if params.low_stock_only:
            conditions.append(available_expr <= 0)
        if params.out_of_stock_only:
            conditions.append(available_expr <= 0)

        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        sort_map = {
            "stk_id": Inventory.inv_id,
            "product_name": Inventory.prd_name,
            "product_ref": Inventory.prd_ref,
            "stk_quantity": Inventory.inv_quantity,
            "stk_quantity_available": available_expr,
            "stk_quantity_reserved": reserved_subq.c.reserved,
            "warehouse_name": Warehouse.whs_name,
        }
        sort_column = sort_map.get(params.sort_by or "stk_id", Inventory.inv_id)
        if params.sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        query = query.offset(params.skip).limit(params.limit)

        result = await self.db.execute(query)
        rows = result.all()

        items = [
            {
                "stk_id": row.stk_id,
                "prd_id": row.prd_id or 0,
                "whs_id": row.whs_id,
                "stk_quantity": row.stk_quantity or Decimal("0"),
                "stk_quantity_reserved": row.stk_quantity_reserved or Decimal("0"),
                "stk_quantity_available": row.stk_quantity_available or Decimal("0"),
                "stk_is_active": True,
                "product_name": row.product_name,
                "product_ref": row.product_ref,
                "warehouse_name": row.warehouse_name,
            }
            for row in rows
        ]

        count_result = await self.db.execute(count_query)
        total = count_result.scalar_one() or 0

        return items, total

    async def get_stock_by_warehouse(
        self,
        whs_id: int,
        soc_id: Optional[int] = None,
        active_only: bool = True
    ) -> List[Inventory]:
        """Get inventory records by warehouse."""
        query = select(Inventory).join(
            ProductShelves,
            ProductShelves.inv_id == Inventory.inv_id
        ).where(ProductShelves.whs_id == whs_id)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_low_stock_items(
        self,
        soc_id: Optional[int] = None,
        limit: int = 50
    ) -> List[Inventory]:
        """Get low stock items (available <= 0)."""
        reserved_subq = self._reserved_subquery()
        available_expr = (
            func.coalesce(Inventory.inv_quantity, 0)
            - func.coalesce(reserved_subq.c.reserved, 0)
        )

        query = (
            select(Inventory)
            .outerjoin(reserved_subq, reserved_subq.c.inv_id == Inventory.inv_id)
            .where(available_expr <= 0)
            .order_by(available_expr.asc())
            .limit(limit)
        )

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_stock_summary(
        self,
        soc_id: Optional[int] = None,
        whs_id: Optional[int] = None
    ) -> dict:
        """Get stock level summary."""
        reserved_subq = self._reserved_subquery()
        shelf_subq = self._shelf_subquery()

        available_expr = (
            func.coalesce(Inventory.inv_quantity, 0)
            - func.coalesce(reserved_subq.c.reserved, 0)
        )

        query = select(
            func.count(Inventory.inv_id).label("total_items"),
            func.coalesce(func.sum(Inventory.inv_quantity), 0).label("total_quantity"),
            func.sum(
                func.case((available_expr <= 0, 1), else_=0)
            ).label("low_stock_count"),
            func.sum(
                func.case((available_expr <= 0, 1), else_=0)
            ).label("out_of_stock_count"),
        ).select_from(Inventory)

        query = query.outerjoin(reserved_subq, reserved_subq.c.inv_id == Inventory.inv_id)
        query = query.outerjoin(shelf_subq, shelf_subq.c.inv_id == Inventory.inv_id)

        if whs_id:
            query = query.where(shelf_subq.c.whs_id == whs_id)

        result = await self.db.execute(query)
        row = result.first()

        return {
            "total_items": row.total_items or 0,
            "total_quantity": row.total_quantity or Decimal("0"),
            "total_value": Decimal("0"),
            "low_stock_count": row.low_stock_count or 0,
            "out_of_stock_count": row.out_of_stock_count or 0,
        }

    async def _get_default_shelf(self, whs_id: int) -> Optional[Shelf]:
        result = await self.db.execute(
            select(Shelf).where(Shelf.whs_id == whs_id).order_by(Shelf.she_id.asc()).limit(1)
        )
        return result.scalar_one_or_none()

class StockMovementRepository:
    """Repository for stock movement related data operations."""

    _TYPE_TAG = "ERP2025_TYPE"
    _STATUS_TAG = "ERP2025_STATUS"

    def __init__(self, db: AsyncSession):
        self.db = db

    @classmethod
    def _extract_meta(cls, description: Optional[str]) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        if not description:
            return None, None, None

        type_match = re.search(rf"\[{cls._TYPE_TAG}:([A-Z_]+)\]", description)
        status_match = re.search(rf"\[{cls._STATUS_TAG}:([A-Z_]+)\]", description)

        cleaned = re.sub(rf"\s*\[{cls._TYPE_TAG}:[A-Z_]+\]", "", description)
        cleaned = re.sub(rf"\s*\[{cls._STATUS_TAG}:[A-Z_]+\]", "", cleaned)
        cleaned = cleaned.strip() or None

        type_tag = type_match.group(1) if type_match else None
        status_tag = status_match.group(1) if status_match else None
        return cleaned, type_tag, status_tag

    @classmethod
    def _build_description(
        cls,
        base: Optional[str],
        type_tag: Optional[str],
        status_tag: Optional[str]
    ) -> Optional[str]:
        cleaned, _, _ = cls._extract_meta(base)
        tags = []
        if type_tag:
            tags.append(f"[{cls._TYPE_TAG}:{type_tag}]")
        if status_tag:
            tags.append(f"[{cls._STATUS_TAG}:{status_tag}]")

        if not tags:
            return cleaned
        if cleaned:
            return f"{cleaned} {' '.join(tags)}"
        return " ".join(tags)

    @classmethod
    def _type_from_code(cls, code: Optional[str]) -> Optional[MovementType]:
        if not code or "-" not in code:
            return None
        prefix = code.split("-", 1)[0]
        prefix_map = {
            "RCV": MovementType.RECEIPT,
            "SHP": MovementType.SHIPMENT,
            "TRF": MovementType.TRANSFER,
            "ADJ": MovementType.ADJUSTMENT,
            "RTI": MovementType.RETURN_IN,
            "RTO": MovementType.RETURN_OUT,
            "DMG": MovementType.DAMAGE,
            "DES": MovementType.DESTROY,
            "LOT": MovementType.LOAN_OUT,
            "LIN": MovementType.LOAN_IN,
        }
        return prefix_map.get(prefix)

    def _infer_movement_type(self, movement: ShippingReceiving) -> MovementType:
        _, type_tag, _ = self._extract_meta(movement.srv_description)
        if type_tag and type_tag in MovementType.__members__:
            return MovementType[type_tag]

        code_type = self._type_from_code(movement.srv_code)
        if code_type in {MovementType.TRANSFER, MovementType.ADJUSTMENT}:
            return code_type

        if movement.srv_is_return_client:
            return MovementType.RETURN_IN
        if movement.srv_is_return_supplier:
            return MovementType.RETURN_OUT
        if movement.srv_is_destroy:
            return MovementType.DESTROY
        if movement.srv_is_damaged:
            return MovementType.DAMAGE
        if movement.srv_is_lend:
            return MovementType.LOAN_IN if movement.srv_is_rev else MovementType.LOAN_OUT
        if movement.srv_is_rev:
            return MovementType.RECEIPT
        return MovementType.SHIPMENT

    def _infer_movement_status(self, movement: ShippingReceiving) -> MovementStatus:
        _, _, status_tag = self._extract_meta(movement.srv_description)
        if status_tag and status_tag in MovementStatus.__members__:
            return MovementStatus[status_tag]
        return MovementStatus.COMPLETED if movement.srv_valid else MovementStatus.CANCELLED

    def _movement_flags_from_type(self, movement_type: MovementType) -> dict:
        is_rev = movement_type in {
            MovementType.RECEIPT,
            MovementType.RETURN_IN,
            MovementType.LOAN_IN,
            MovementType.ADJUSTMENT,
        }
        return {
            "srv_is_rev": is_rev,
            "srv_is_lend": movement_type in {MovementType.LOAN_IN, MovementType.LOAN_OUT},
            "srv_is_return_client": movement_type == MovementType.RETURN_IN,
            "srv_is_return_supplier": movement_type == MovementType.RETURN_OUT,
            "srv_is_destroy": movement_type == MovementType.DESTROY,
            "srv_is_damaged": movement_type == MovementType.DAMAGE,
        }

    def _valid_from_status(self, status: MovementStatus) -> bool:
        return status == MovementStatus.COMPLETED

    async def _get_default_warehouse_id(self) -> Optional[int]:
        result = await self.db.execute(
            select(Warehouse.whs_id).order_by(Warehouse.whs_id.asc()).limit(1)
        )
        return result.scalar_one_or_none()

    async def _get_default_shelf_id(self, whs_id: int) -> Optional[int]:
        result = await self.db.execute(
            select(Shelf.she_id)
            .where(Shelf.whs_id == whs_id)
            .order_by(Shelf.she_id.asc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def _resolve_client_name(self, cli_id: Optional[int], external_party: Optional[str]) -> Optional[str]:
        if external_party:
            return external_party
        if not cli_id:
            return None
        result = await self.db.execute(
            select(Client).where(Client.cli_id == cli_id)
        )
        client = result.scalar_one_or_none()
        return client.cli_name if client else None

    async def _generate_reference(self, movement_type: str) -> str:
        """Generate a unique movement reference."""
        prefix_map = {
            "RECEIPT": "RCV",
            "SHIPMENT": "SHP",
            "TRANSFER": "TRF",
            "ADJUSTMENT": "ADJ",
            "RETURN_IN": "RTI",
            "RETURN_OUT": "RTO",
            "DAMAGE": "DMG",
            "DESTROY": "DES",
            "LOAN_OUT": "LOT",
            "LOAN_IN": "LIN",
        }
        prefix = prefix_map.get(movement_type, "STM")

        result = await self.db.execute(
            select(func.count(ShippingReceiving.srv_id))
            .where(ShippingReceiving.srv_code.like(f"{prefix}-%"))
        )
        count = result.scalar_one()
        return f"{prefix}-{str(count + 1).zfill(6)}"

    async def create_movement(
        self,
        data: StockMovementCreate
    ) -> ShippingReceiving:
        """Create a new stock movement with lines."""
        reference = await self._generate_reference(data.stm_type.value)
        whs_id = data.stm_whs_id or await self._get_default_warehouse_id()

        shelf_id = None
        if whs_id is not None:
            shelf_id = await self._get_default_shelf_id(whs_id)

        if data.lines and (whs_id is None or shelf_id is None):
            raise ValueError("Movement lines require a warehouse with at least one shelf")

        flags = self._movement_flags_from_type(data.stm_type)
        status_tag = MovementStatus.DRAFT.value
        description = self._build_description(data.stm_description, data.stm_type.value, status_tag)

        movement = ShippingReceiving(
            srv_is_rev=flags["srv_is_rev"],
            srv_time=data.stm_date,
            srv_code=reference,
            srv_description=description,
            usr_creator_id=1,
            srv_total_quantity=Decimal("0"),
            srv_total_real=None,
            srv_is_lend=flags["srv_is_lend"],
            srv_d_lend_return_pre=data.stm_loan_return_date,
            srv_is_return_client=flags["srv_is_return_client"],
            srv_d_return_client=data.stm_date if flags["srv_is_return_client"] else None,
            srv_is_destroy=flags["srv_is_destroy"],
            srv_d_destroy=data.stm_date if flags["srv_is_destroy"] else None,
            srv_is_return_supplier=flags["srv_is_return_supplier"],
            srv_d_return_supplier=data.stm_date if flags["srv_is_return_supplier"] else None,
            srv_is_damaged=flags["srv_is_damaged"],
            srv_d_damaged=data.stm_date if flags["srv_is_damaged"] else None,
            srv_client=await self._resolve_client_name(data.stm_cli_id, data.stm_external_party),
            srv_valid=False,
        )

        self.db.add(movement)
        await self.db.flush()

        total_quantity = Decimal("0")
        total_real = Decimal("0")
        has_real = False

        for line_data in data.lines:
            line_quantity = line_data.sml_quantity or Decimal("0")
            line_real = line_data.sml_quantity_actual

            line = ShippingReceivingLine(
                srv_id=movement.srv_id,
                srl_quantity=line_quantity,
                srl_unit_price=line_data.sml_unit_price,
                srl_total_price=(line_quantity * line_data.sml_unit_price) if line_data.sml_unit_price else None,
                prd_id=line_data.sml_prd_id,
                pit_id=line_data.sml_pit_id,
                srl_prd_ref=line_data.sml_prd_ref,
                srl_prd_name=line_data.sml_prd_name,
                srl_prd_des=None,
                srl_description=line_data.sml_description,
                srl_quantity_real=line_real,
                srl_total_price_real=(line_real * line_data.sml_unit_price) if (line_real is not None and line_data.sml_unit_price) else None,
                whs_id=whs_id,
                she_id=shelf_id,
            )

            total_quantity += line_quantity
            if line_real is not None:
                total_real += line_real
                has_real = True

            self.db.add(line)

        movement.srv_total_quantity = total_quantity
        movement.srv_total_real = total_real if has_real else None

        await self.db.flush()
        await self.db.refresh(movement)
        return movement

    async def get_movement(self, movement_id: int) -> Optional[ShippingReceiving]:
        """Get a stock movement by ID with lines."""
        result = await self.db.execute(
            select(ShippingReceiving)
            .options(selectinload(ShippingReceiving.lines))
            .where(ShippingReceiving.srv_id == movement_id)
        )
        return result.scalar_one_or_none()

    async def get_movement_by_reference(
        self,
        reference: str
    ) -> Optional[ShippingReceiving]:
        """Get a stock movement by reference."""
        result = await self.db.execute(
            select(ShippingReceiving)
            .options(selectinload(ShippingReceiving.lines))
            .where(ShippingReceiving.srv_code == reference)
        )
        return result.scalar_one_or_none()

    async def update_movement(
        self,
        movement_id: int,
        data: StockMovementUpdate
    ) -> Optional[ShippingReceiving]:
        """Update a stock movement."""
        movement = await self.get_movement(movement_id)
        if not movement:
            return None

        update_data = data.model_dump(exclude_unset=True)
        clean_desc, type_tag, status_tag = self._extract_meta(movement.srv_description)

        if "stm_description" in update_data:
            clean_desc = update_data.get("stm_description")
        if "stm_status" in update_data and update_data["stm_status"] is not None:
            status_value = update_data["stm_status"]
            status_tag = status_value.value if hasattr(status_value, "value") else str(status_value)
            movement.srv_valid = self._valid_from_status(MovementStatus(status_tag))
        if "stm_date" in update_data and update_data["stm_date"] is not None:
            movement.srv_time = update_data["stm_date"]
        if "stm_loan_return_date" in update_data:
            movement.srv_d_lend_return_pre = update_data.get("stm_loan_return_date")

        movement.srv_description = self._build_description(clean_desc, type_tag, status_tag)

        if "stm_whs_id" in update_data and update_data["stm_whs_id"] is not None:
            whs_id = update_data["stm_whs_id"]
            shelf_id = await self._get_default_shelf_id(whs_id)
            if shelf_id is None:
                raise ValueError("Selected warehouse has no shelves")
            for line in movement.lines:
                line.whs_id = whs_id
                line.she_id = shelf_id

        await self.db.flush()
        await self.db.refresh(movement)
        return movement

    async def update_movement_status(
        self,
        movement_id: int,
        status: MovementStatus,
        validated_by: Optional[int] = None
    ) -> Optional[ShippingReceiving]:
        """Update movement status."""
        movement = await self.get_movement(movement_id)
        if not movement:
            return None

        clean_desc, type_tag, _ = self._extract_meta(movement.srv_description)
        movement.srv_description = self._build_description(clean_desc, type_tag, status.value)
        movement.srv_valid = self._valid_from_status(status)

        await self.db.flush()
        await self.db.refresh(movement)
        return movement

    async def delete_movement(self, movement_id: int) -> bool:
        """Delete a stock movement and its lines."""
        movement = await self.get_movement(movement_id)
        if not movement:
            return False

        await self.db.delete(movement)
        await self.db.flush()
        return True

    def _movement_type_condition(self, movement_type: MovementType):
        if movement_type == MovementType.RETURN_IN:
            return ShippingReceiving.srv_is_return_client == True
        if movement_type == MovementType.RETURN_OUT:
            return ShippingReceiving.srv_is_return_supplier == True
        if movement_type == MovementType.DESTROY:
            return ShippingReceiving.srv_is_destroy == True
        if movement_type == MovementType.DAMAGE:
            return ShippingReceiving.srv_is_damaged == True
        if movement_type == MovementType.LOAN_IN:
            return and_(ShippingReceiving.srv_is_lend == True, ShippingReceiving.srv_is_rev == True)
        if movement_type == MovementType.LOAN_OUT:
            return and_(ShippingReceiving.srv_is_lend == True, ShippingReceiving.srv_is_rev == False)
        if movement_type == MovementType.RECEIPT:
            return and_(
                ShippingReceiving.srv_is_rev == True,
                or_(ShippingReceiving.srv_is_return_client == False, ShippingReceiving.srv_is_return_client.is_(None)),
                or_(ShippingReceiving.srv_is_return_supplier == False, ShippingReceiving.srv_is_return_supplier.is_(None)),
                or_(ShippingReceiving.srv_is_destroy == False, ShippingReceiving.srv_is_destroy.is_(None)),
                or_(ShippingReceiving.srv_is_damaged == False, ShippingReceiving.srv_is_damaged.is_(None)),
                or_(ShippingReceiving.srv_is_lend == False, ShippingReceiving.srv_is_lend.is_(None)),
            )
        if movement_type == MovementType.SHIPMENT:
            return and_(
                ShippingReceiving.srv_is_rev == False,
                or_(ShippingReceiving.srv_is_return_client == False, ShippingReceiving.srv_is_return_client.is_(None)),
                or_(ShippingReceiving.srv_is_return_supplier == False, ShippingReceiving.srv_is_return_supplier.is_(None)),
                or_(ShippingReceiving.srv_is_destroy == False, ShippingReceiving.srv_is_destroy.is_(None)),
                or_(ShippingReceiving.srv_is_damaged == False, ShippingReceiving.srv_is_damaged.is_(None)),
                or_(ShippingReceiving.srv_is_lend == False, ShippingReceiving.srv_is_lend.is_(None)),
            )
        if movement_type in {MovementType.TRANSFER, MovementType.ADJUSTMENT}:
            prefix = "TRF" if movement_type == MovementType.TRANSFER else "ADJ"
            return ShippingReceiving.srv_code.like(f"{prefix}-%")
        return None

    def _movement_status_condition(self, status: MovementStatus):
        if status == MovementStatus.COMPLETED:
            return ShippingReceiving.srv_valid == True
        return ShippingReceiving.srv_valid == False

    async def search_movements(
        self,
        params: StockMovementSearchParams
    ) -> Tuple[List[dict], int]:
        """Search stock movements with filters and pagination."""
        line_agg = (
            select(
                ShippingReceivingLine.srv_id.label("srv_id"),
                func.min(ShippingReceivingLine.whs_id).label("whs_id"),
                func.count(ShippingReceivingLine.srl_id).label("total_lines"),
                func.coalesce(func.sum(ShippingReceivingLine.srl_quantity), 0).label("total_quantity"),
            )
            .group_by(ShippingReceivingLine.srv_id)
            .subquery()
        )

        query = (
            select(
                ShippingReceiving,
                Warehouse.whs_name.label("warehouse_name"),
                line_agg.c.total_lines,
                line_agg.c.total_quantity,
            )
            .outerjoin(line_agg, line_agg.c.srv_id == ShippingReceiving.srv_id)
            .outerjoin(Warehouse, Warehouse.whs_id == line_agg.c.whs_id)
        )

        count_query = select(func.count(ShippingReceiving.srv_id))

        conditions = []

        if params.search:
            search_term = f"%{params.search}%"
            conditions.append(
                or_(
                    ShippingReceiving.srv_code.ilike(search_term),
                    ShippingReceiving.srv_description.ilike(search_term),
                    ShippingReceiving.srv_client.ilike(search_term),
                )
            )

        if params.stm_type:
            condition = self._movement_type_condition(params.stm_type)
            if condition is not None:
                conditions.append(condition)

        if params.stm_status:
            conditions.append(self._movement_status_condition(params.stm_status))

        if params.whs_id:
            conditions.append(line_agg.c.whs_id == params.whs_id)

        if params.cli_id:
            client_name = await self._resolve_client_name(params.cli_id, None)
            if client_name:
                conditions.append(ShippingReceiving.srv_client == client_name)

        if params.date_from:
            conditions.append(ShippingReceiving.srv_time >= params.date_from)
        if params.date_to:
            conditions.append(ShippingReceiving.srv_time <= params.date_to)

        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        sort_map = {
            "stm_date": ShippingReceiving.srv_time,
            "stm_reference": ShippingReceiving.srv_code,
            "stm_status": ShippingReceiving.srv_valid,
            "stm_total_quantity": ShippingReceiving.srv_total_quantity,
            "stm_id": ShippingReceiving.srv_id,
        }
        sort_column = sort_map.get(params.sort_by or "stm_date", ShippingReceiving.srv_time)
        if params.sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        query = query.offset(params.skip).limit(params.limit)

        result = await self.db.execute(query)
        rows = result.all()

        items = []
        for row in rows:
            movement = row[0]
            total_quantity = movement.srv_total_quantity
            if total_quantity is None:
                total_quantity = row.total_quantity or Decimal("0")

            movement_type = self._infer_movement_type(movement)
            movement_status = self._infer_movement_status(movement)

            items.append({
                "stm_id": movement.srv_id,
                "stm_reference": movement.srv_code,
                "stm_type": movement_type.value,
                "stm_status": movement_status.value,
                "stm_date": movement.srv_time,
                "stm_total_quantity": total_quantity or Decimal("0"),
                "stm_total_lines": row.total_lines or 0,
                "warehouse_name": row.warehouse_name,
            })

        count_result = await self.db.execute(count_query)
        total = count_result.scalar_one() or 0

        return items, total

    async def get_movements_by_warehouse(
        self,
        whs_id: int,
        limit: int = 50
    ) -> List[ShippingReceiving]:
        """Get recent movements for a warehouse."""
        result = await self.db.execute(
            select(ShippingReceiving)
            .join(ShippingReceivingLine, ShippingReceivingLine.srv_id == ShippingReceiving.srv_id)
            .where(ShippingReceivingLine.whs_id == whs_id)
            .order_by(ShippingReceiving.srv_time.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    # =====================
    # Movement Line Operations
    # =====================

    async def add_movement_line(
        self,
        movement_id: int,
        data: StockMovementLineCreate
    ) -> Optional[ShippingReceivingLine]:
        """Add a line to an existing movement."""
        movement = await self.get_movement(movement_id)
        if not movement:
            return None

        whs_id = None
        she_id = None
        if movement.lines:
            whs_id = movement.lines[0].whs_id
            she_id = movement.lines[0].she_id
        else:
            whs_id = await self._get_default_warehouse_id()
            if whs_id is not None:
                she_id = await self._get_default_shelf_id(whs_id)

        if whs_id is None or she_id is None:
            raise ValueError("Movement line requires a warehouse with at least one shelf")

        line_quantity = data.sml_quantity or Decimal("0")
        line_real = data.sml_quantity_actual

        line = ShippingReceivingLine(
            srv_id=movement_id,
            srl_quantity=line_quantity,
            srl_unit_price=data.sml_unit_price,
            srl_total_price=(line_quantity * data.sml_unit_price) if data.sml_unit_price else None,
            prd_id=data.sml_prd_id,
            pit_id=data.sml_pit_id,
            srl_prd_ref=data.sml_prd_ref,
            srl_prd_name=data.sml_prd_name,
            srl_prd_des=None,
            srl_description=data.sml_description,
            srl_quantity_real=line_real,
            srl_total_price_real=(line_real * data.sml_unit_price) if (line_real is not None and data.sml_unit_price) else None,
            whs_id=whs_id,
            she_id=she_id,
        )

        self.db.add(line)

        await self._recalculate_totals(movement)

        await self.db.flush()
        await self.db.refresh(line)
        return line

    async def update_movement_line(
        self,
        line_id: int,
        data: StockMovementLineUpdate
    ) -> Optional[ShippingReceivingLine]:
        """Update a movement line."""
        result = await self.db.execute(
            select(ShippingReceivingLine)
            .where(ShippingReceivingLine.srl_id == line_id)
        )
        line = result.scalar_one_or_none()
        if not line:
            return None

        update_data = data.model_dump(exclude_unset=True)
        if "sml_quantity" in update_data and update_data["sml_quantity"] is not None:
            line.srl_quantity = update_data["sml_quantity"]
            if line.srl_unit_price is not None:
                line.srl_total_price = line.srl_quantity * line.srl_unit_price
        if "sml_quantity_actual" in update_data:
            line.srl_quantity_real = update_data.get("sml_quantity_actual")
            if line.srl_quantity_real is not None and line.srl_unit_price is not None:
                line.srl_total_price_real = line.srl_quantity_real * line.srl_unit_price

        movement = await self.get_movement(line.srv_id)
        if movement:
            await self._recalculate_totals(movement)

        await self.db.flush()
        await self.db.refresh(line)
        return line

    async def delete_movement_line(self, line_id: int) -> bool:
        """Delete a movement line."""
        result = await self.db.execute(
            select(ShippingReceivingLine)
            .where(ShippingReceivingLine.srl_id == line_id)
        )
        line = result.scalar_one_or_none()
        if not line:
            return False

        movement = await self.get_movement(line.srv_id)
        await self.db.delete(line)
        if movement:
            await self._recalculate_totals(movement)

        await self.db.flush()
        return True

    async def get_movement_lines(
        self,
        movement_id: int
    ) -> List[ShippingReceivingLine]:
        """Get all lines for a movement."""
        result = await self.db.execute(
            select(ShippingReceivingLine)
            .where(ShippingReceivingLine.srv_id == movement_id)
            .order_by(ShippingReceivingLine.srl_id)
        )
        return list(result.scalars().all())

    async def _recalculate_totals(self, movement: ShippingReceiving) -> None:
        result = await self.db.execute(
            select(
                func.coalesce(func.sum(ShippingReceivingLine.srl_quantity), 0).label("total_quantity"),
                func.coalesce(func.sum(ShippingReceivingLine.srl_quantity_real), 0).label("total_real"),
            ).where(ShippingReceivingLine.srv_id == movement.srv_id)
        )
        row = result.first()
        movement.srv_total_quantity = row.total_quantity or Decimal("0")
        movement.srv_total_real = row.total_real
