"""
Landed Cost models for supply lot costing.

Tables:
  - TR_LCP_LandedCostProfile: Reference table for cost profile templates
  - TR_LCC_LandedCostComponent: Reference table for cost component types
  - TM_LOT_SupplyLot: Master supply lot with status, dates, supplier ref
  - TM_LOT_SupplyLotItem: Line items linking products to lot with quantities
  - TM_FRC_FreightCost: Freight/customs/insurance costs per lot
  - TM_PLC_ProductLandedCost: Computed landed cost per product
  - TM_LCH_LandedCostHistory: History of cost calculations
  - TM_LCL_LandedCostLog: Allocation log entries

Migration: V1.0.0.8__create_landed_cost_tables.sql
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from enum import Enum

from sqlalchemy import (
    Column, Integer, String, DateTime, Numeric, ForeignKey, Boolean, Text
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.models.base import Base


# =============================================================================
# Enums
# =============================================================================

class AllocationStrategy(str, Enum):
    """Cost allocation strategy options."""
    WEIGHT = "WEIGHT"
    VOLUME = "VOLUME"
    VALUE = "VALUE"
    MIXED = "MIXED"


class LotStatus(str, Enum):
    """Supply lot status options."""
    DRAFT = "DRAFT"
    IN_TRANSIT = "IN_TRANSIT"
    ARRIVED = "ARRIVED"
    CLEARED = "CLEARED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class FreightCostType(str, Enum):
    """Type of freight cost."""
    FREIGHT = "FREIGHT"
    CUSTOMS = "CUSTOMS"
    INSURANCE = "INSURANCE"
    LOCAL = "LOCAL"
    HANDLING = "HANDLING"
    OTHER = "OTHER"


# =============================================================================
# Reference Tables
# =============================================================================

class LandedCostProfile(Base):
    """
    Landed cost profile template.
    Maps to TR_LCP_LandedCostProfile table.
    """
    __tablename__ = "TR_LCP_LandedCostProfile"
    __table_args__ = {"extend_existing": True}

    lcp_id: Mapped[int] = mapped_column("lcp_id", Integer, primary_key=True, autoincrement=True)
    lcp_code: Mapped[str] = mapped_column("lcp_code", String(50), nullable=False, unique=True)
    lcp_name: Mapped[str] = mapped_column("lcp_name", String(200), nullable=False)
    lcp_description: Mapped[Optional[str]] = mapped_column("lcp_description", String(1000), nullable=True)
    lcp_default_strategy: Mapped[Optional[str]] = mapped_column("lcp_default_strategy", String(20), nullable=True)
    lcp_is_active: Mapped[bool] = mapped_column("lcp_is_active", Boolean, nullable=False, default=True)
    lcp_soc_id: Mapped[Optional[int]] = mapped_column("lcp_soc_id", Integer, nullable=True)
    lcp_created_at: Mapped[Optional[datetime]] = mapped_column("lcp_created_at", DateTime, nullable=True)
    lcp_updated_at: Mapped[Optional[datetime]] = mapped_column("lcp_updated_at", DateTime, nullable=True)
    lcp_created_by: Mapped[Optional[int]] = mapped_column("lcp_created_by", Integer, nullable=True)
    lcp_updated_by: Mapped[Optional[int]] = mapped_column("lcp_updated_by", Integer, nullable=True)

    # Relationships
    components = relationship("LandedCostComponent", back_populates="profile", lazy="select")


class LandedCostComponent(Base):
    """
    Landed cost component type (e.g., freight, customs, insurance).
    Maps to TR_LCC_LandedCostComponent table.
    """
    __tablename__ = "TR_LCC_LandedCostComponent"
    __table_args__ = {"extend_existing": True}

    lcc_id: Mapped[int] = mapped_column("lcc_id", Integer, primary_key=True, autoincrement=True)
    lcc_lcp_id: Mapped[Optional[int]] = mapped_column(
        "lcc_lcp_id", Integer,
        ForeignKey("TR_LCP_LandedCostProfile.lcp_id"),
        nullable=True
    )
    lcc_code: Mapped[str] = mapped_column("lcc_code", String(50), nullable=False)
    lcc_name: Mapped[str] = mapped_column("lcc_name", String(200), nullable=False)
    lcc_description: Mapped[Optional[str]] = mapped_column("lcc_description", String(1000), nullable=True)
    lcc_type: Mapped[str] = mapped_column("lcc_type", String(20), nullable=False)
    lcc_default_percent: Mapped[Optional[Decimal]] = mapped_column("lcc_default_percent", Numeric(5, 2), nullable=True)
    lcc_is_active: Mapped[bool] = mapped_column("lcc_is_active", Boolean, nullable=False, default=True)
    lcc_sort_order: Mapped[int] = mapped_column("lcc_sort_order", Integer, nullable=False, default=0)
    lcc_created_at: Mapped[Optional[datetime]] = mapped_column("lcc_created_at", DateTime, nullable=True)
    lcc_updated_at: Mapped[Optional[datetime]] = mapped_column("lcc_updated_at", DateTime, nullable=True)

    # Relationships
    profile = relationship("LandedCostProfile", back_populates="components", lazy="select")


# =============================================================================
# Master Tables
# =============================================================================

class SupplyLot(Base):
    """
    Supply lot for tracking imported goods and landed costs.
    Maps to TM_LOT_SupplyLot table.
    """
    __tablename__ = "TM_LOT_SupplyLot"
    __table_args__ = {"extend_existing": True}

    lot_id: Mapped[int] = mapped_column("lot_id", Integer, primary_key=True, autoincrement=True)
    lot_reference: Mapped[str] = mapped_column("lot_reference", String(100), nullable=False)
    lot_name: Mapped[Optional[str]] = mapped_column("lot_name", String(200), nullable=True)
    lot_description: Mapped[Optional[str]] = mapped_column("lot_description", String(1000), nullable=True)

    # Supplier
    lot_sup_id: Mapped[Optional[int]] = mapped_column(
        "lot_sup_id", Integer,
        ForeignKey("TM_SUP_Supplier.sup_id"),
        nullable=True
    )

    # Geography
    lot_origin_country_id: Mapped[Optional[int]] = mapped_column("lot_origin_country_id", Integer, nullable=True)
    lot_destination_country_id: Mapped[Optional[int]] = mapped_column("lot_destination_country_id", Integer, nullable=True)

    # Dates
    lot_ship_date: Mapped[Optional[datetime]] = mapped_column("lot_ship_date", DateTime, nullable=True)
    lot_eta_date: Mapped[Optional[datetime]] = mapped_column("lot_eta_date", DateTime, nullable=True)
    lot_arrival_date: Mapped[Optional[datetime]] = mapped_column("lot_arrival_date", DateTime, nullable=True)

    # Status
    lot_status: Mapped[str] = mapped_column("lot_status", String(20), nullable=False, default="DRAFT")

    # Currency and organization
    lot_cur_id: Mapped[Optional[int]] = mapped_column("lot_cur_id", Integer, nullable=True)
    lot_soc_id: Mapped[Optional[int]] = mapped_column("lot_soc_id", Integer, nullable=True)
    lot_bu_id: Mapped[Optional[int]] = mapped_column("lot_bu_id", Integer, nullable=True)

    # Computed totals (items)
    lot_total_items: Mapped[int] = mapped_column("lot_total_items", Integer, nullable=False, default=0)
    lot_total_quantity: Mapped[Decimal] = mapped_column("lot_total_quantity", Numeric(18, 4), nullable=False, default=Decimal("0"))
    lot_total_weight_kg: Mapped[Decimal] = mapped_column("lot_total_weight_kg", Numeric(18, 4), nullable=False, default=Decimal("0"))
    lot_total_volume_cbm: Mapped[Decimal] = mapped_column("lot_total_volume_cbm", Numeric(18, 6), nullable=False, default=Decimal("0"))
    lot_total_value: Mapped[Decimal] = mapped_column("lot_total_value", Numeric(18, 4), nullable=False, default=Decimal("0"))

    # Computed totals (costs)
    lot_total_freight_cost: Mapped[Decimal] = mapped_column("lot_total_freight_cost", Numeric(18, 4), nullable=False, default=Decimal("0"))
    lot_total_customs_cost: Mapped[Decimal] = mapped_column("lot_total_customs_cost", Numeric(18, 4), nullable=False, default=Decimal("0"))
    lot_total_insurance_cost: Mapped[Decimal] = mapped_column("lot_total_insurance_cost", Numeric(18, 4), nullable=False, default=Decimal("0"))
    lot_total_local_cost: Mapped[Decimal] = mapped_column("lot_total_local_cost", Numeric(18, 4), nullable=False, default=Decimal("0"))
    lot_total_other_cost: Mapped[Decimal] = mapped_column("lot_total_other_cost", Numeric(18, 4), nullable=False, default=Decimal("0"))
    lot_total_landed_cost: Mapped[Decimal] = mapped_column("lot_total_landed_cost", Numeric(18, 4), nullable=False, default=Decimal("0"))

    # Allocation
    lot_allocation_strategy: Mapped[Optional[str]] = mapped_column("lot_allocation_strategy", String(20), nullable=True)
    lot_allocation_completed: Mapped[bool] = mapped_column("lot_allocation_completed", Boolean, nullable=False, default=False)
    lot_allocation_date: Mapped[Optional[datetime]] = mapped_column("lot_allocation_date", DateTime, nullable=True)

    # Notes
    lot_notes: Mapped[Optional[str]] = mapped_column("lot_notes", String(4000), nullable=True)

    # Audit
    lot_created_at: Mapped[Optional[datetime]] = mapped_column("lot_created_at", DateTime, nullable=True)
    lot_updated_at: Mapped[Optional[datetime]] = mapped_column("lot_updated_at", DateTime, nullable=True)
    lot_created_by: Mapped[Optional[int]] = mapped_column("lot_created_by", Integer, nullable=True)
    lot_updated_by: Mapped[Optional[int]] = mapped_column("lot_updated_by", Integer, nullable=True)

    # Relationships
    items = relationship("SupplyLotItem", back_populates="supply_lot", lazy="select", cascade="all, delete-orphan")
    freight_costs = relationship("FreightCost", back_populates="supply_lot", lazy="select", cascade="all, delete-orphan")
    allocation_logs = relationship("LandedCostAllocationLog", back_populates="supply_lot", lazy="select", cascade="all, delete-orphan")
    supplier = relationship("Supplier", lazy="select")


class SupplyLotItem(Base):
    """
    Line item within a supply lot, linking a product to the lot.
    Maps to TM_LOT_SupplyLotItem table.
    """
    __tablename__ = "TM_LOT_SupplyLotItem"
    __table_args__ = {"extend_existing": True}

    sli_id: Mapped[int] = mapped_column("sli_id", Integer, primary_key=True, autoincrement=True)
    sli_lot_id: Mapped[int] = mapped_column(
        "sli_lot_id", Integer,
        ForeignKey("TM_LOT_SupplyLot.lot_id", ondelete="CASCADE"),
        nullable=False
    )
    sli_prd_id: Mapped[Optional[int]] = mapped_column(
        "sli_prd_id", Integer,
        ForeignKey("TM_PRD_Product.prd_id"),
        nullable=True
    )
    sli_pit_id: Mapped[Optional[int]] = mapped_column("sli_pit_id", Integer, nullable=True)
    sli_description: Mapped[Optional[str]] = mapped_column("sli_description", String(500), nullable=True)
    sli_sku: Mapped[Optional[str]] = mapped_column("sli_sku", String(100), nullable=True)

    # Quantities and pricing
    sli_quantity: Mapped[int] = mapped_column("sli_quantity", Integer, nullable=False, default=1)
    sli_unit_price: Mapped[Decimal] = mapped_column("sli_unit_price", Numeric(18, 4), nullable=False, default=Decimal("0"))
    sli_total_price: Mapped[Decimal] = mapped_column("sli_total_price", Numeric(18, 4), nullable=False, default=Decimal("0"))

    # Weight and volume
    sli_weight_kg: Mapped[Optional[Decimal]] = mapped_column("sli_weight_kg", Numeric(18, 4), nullable=True)
    sli_volume_cbm: Mapped[Optional[Decimal]] = mapped_column("sli_volume_cbm", Numeric(18, 6), nullable=True)
    sli_unit_weight_kg: Mapped[Optional[Decimal]] = mapped_column("sli_unit_weight_kg", Numeric(18, 4), nullable=True)
    sli_unit_volume_cbm: Mapped[Optional[Decimal]] = mapped_column("sli_unit_volume_cbm", Numeric(18, 6), nullable=True)

    # Allocated costs
    sli_allocated_freight: Mapped[Decimal] = mapped_column("sli_allocated_freight", Numeric(18, 4), nullable=False, default=Decimal("0"))
    sli_allocated_customs: Mapped[Decimal] = mapped_column("sli_allocated_customs", Numeric(18, 4), nullable=False, default=Decimal("0"))
    sli_allocated_insurance: Mapped[Decimal] = mapped_column("sli_allocated_insurance", Numeric(18, 4), nullable=False, default=Decimal("0"))
    sli_allocated_local: Mapped[Decimal] = mapped_column("sli_allocated_local", Numeric(18, 4), nullable=False, default=Decimal("0"))
    sli_allocated_other: Mapped[Decimal] = mapped_column("sli_allocated_other", Numeric(18, 4), nullable=False, default=Decimal("0"))
    sli_total_allocated_cost: Mapped[Decimal] = mapped_column("sli_total_allocated_cost", Numeric(18, 4), nullable=False, default=Decimal("0"))

    # Landed cost
    sli_landed_cost_per_unit: Mapped[Optional[Decimal]] = mapped_column("sli_landed_cost_per_unit", Numeric(18, 4), nullable=True)
    sli_total_landed_cost: Mapped[Decimal] = mapped_column("sli_total_landed_cost", Numeric(18, 4), nullable=False, default=Decimal("0"))

    # Sort order
    sli_sort_order: Mapped[int] = mapped_column("sli_sort_order", Integer, nullable=False, default=0)

    # Audit
    sli_created_at: Mapped[Optional[datetime]] = mapped_column("sli_created_at", DateTime, nullable=True)
    sli_updated_at: Mapped[Optional[datetime]] = mapped_column("sli_updated_at", DateTime, nullable=True)

    # Relationships
    supply_lot = relationship("SupplyLot", back_populates="items", lazy="select")
    product = relationship("Product", lazy="select")


class FreightCost(Base):
    """
    Freight, customs, insurance, or other cost entry for a supply lot.
    Maps to TM_FRC_FreightCost table.
    """
    __tablename__ = "TM_FRC_FreightCost"
    __table_args__ = {"extend_existing": True}

    frc_id: Mapped[int] = mapped_column("frc_id", Integer, primary_key=True, autoincrement=True)
    frc_lot_id: Mapped[int] = mapped_column(
        "frc_lot_id", Integer,
        ForeignKey("TM_LOT_SupplyLot.lot_id", ondelete="CASCADE"),
        nullable=False
    )
    frc_type: Mapped[str] = mapped_column("frc_type", String(20), nullable=False)
    frc_description: Mapped[Optional[str]] = mapped_column("frc_description", String(500), nullable=True)

    # Amount
    frc_amount: Mapped[Decimal] = mapped_column("frc_amount", Numeric(18, 4), nullable=False, default=Decimal("0"))
    frc_cur_id: Mapped[Optional[int]] = mapped_column("frc_cur_id", Integer, nullable=True)
    frc_exchange_rate: Mapped[Decimal] = mapped_column("frc_exchange_rate", Numeric(18, 6), nullable=False, default=Decimal("1"))
    frc_amount_converted: Mapped[Decimal] = mapped_column("frc_amount_converted", Numeric(18, 4), nullable=False, default=Decimal("0"))

    # Vendor info
    frc_vendor_name: Mapped[Optional[str]] = mapped_column("frc_vendor_name", String(200), nullable=True)
    frc_invoice_ref: Mapped[Optional[str]] = mapped_column("frc_invoice_ref", String(100), nullable=True)
    frc_invoice_date: Mapped[Optional[datetime]] = mapped_column("frc_invoice_date", DateTime, nullable=True)

    # Payment status
    frc_is_paid: Mapped[bool] = mapped_column("frc_is_paid", Boolean, nullable=False, default=False)
    frc_paid_date: Mapped[Optional[datetime]] = mapped_column("frc_paid_date", DateTime, nullable=True)

    # Notes
    frc_notes: Mapped[Optional[str]] = mapped_column("frc_notes", String(2000), nullable=True)

    # Audit
    frc_created_at: Mapped[Optional[datetime]] = mapped_column("frc_created_at", DateTime, nullable=True)
    frc_updated_at: Mapped[Optional[datetime]] = mapped_column("frc_updated_at", DateTime, nullable=True)
    frc_created_by: Mapped[Optional[int]] = mapped_column("frc_created_by", Integer, nullable=True)
    frc_updated_by: Mapped[Optional[int]] = mapped_column("frc_updated_by", Integer, nullable=True)

    # Relationships
    supply_lot = relationship("SupplyLot", back_populates="freight_costs", lazy="select")


# =============================================================================
# Computed / Derived Tables
# =============================================================================

class ProductLandedCost(Base):
    """
    Computed landed cost per product, derived from supply lot allocation.
    Maps to TM_PLC_ProductLandedCost table.
    """
    __tablename__ = "TM_PLC_ProductLandedCost"
    __table_args__ = {"extend_existing": True}

    plc_id: Mapped[int] = mapped_column("plc_id", Integer, primary_key=True, autoincrement=True)
    plc_prd_id: Mapped[int] = mapped_column(
        "plc_prd_id", Integer,
        ForeignKey("TM_PRD_Product.prd_id"),
        nullable=False
    )
    plc_lot_id: Mapped[Optional[int]] = mapped_column(
        "plc_lot_id", Integer,
        ForeignKey("TM_LOT_SupplyLot.lot_id"),
        nullable=True
    )
    plc_sli_id: Mapped[Optional[int]] = mapped_column(
        "plc_sli_id", Integer,
        ForeignKey("TM_LOT_SupplyLotItem.sli_id"),
        nullable=True
    )

    # Cost breakdown
    plc_unit_purchase_price: Mapped[Decimal] = mapped_column("plc_unit_purchase_price", Numeric(18, 4), nullable=False, default=Decimal("0"))
    plc_allocated_freight: Mapped[Decimal] = mapped_column("plc_allocated_freight", Numeric(18, 4), nullable=False, default=Decimal("0"))
    plc_allocated_customs: Mapped[Decimal] = mapped_column("plc_allocated_customs", Numeric(18, 4), nullable=False, default=Decimal("0"))
    plc_allocated_insurance: Mapped[Decimal] = mapped_column("plc_allocated_insurance", Numeric(18, 4), nullable=False, default=Decimal("0"))
    plc_allocated_other: Mapped[Decimal] = mapped_column("plc_allocated_other", Numeric(18, 4), nullable=False, default=Decimal("0"))
    plc_total_landed_cost_per_unit: Mapped[Decimal] = mapped_column("plc_total_landed_cost_per_unit", Numeric(18, 4), nullable=False, default=Decimal("0"))

    # Quantity and total
    plc_quantity: Mapped[int] = mapped_column("plc_quantity", Integer, nullable=False, default=1)
    plc_total_landed_cost: Mapped[Decimal] = mapped_column("plc_total_landed_cost", Numeric(18, 4), nullable=False, default=Decimal("0"))

    # Strategy used
    plc_strategy: Mapped[Optional[str]] = mapped_column("plc_strategy", String(20), nullable=True)

    # Currency
    plc_cur_id: Mapped[Optional[int]] = mapped_column("plc_cur_id", Integer, nullable=True)

    # Status
    plc_is_current: Mapped[bool] = mapped_column("plc_is_current", Boolean, nullable=False, default=True)

    # Audit
    plc_calculated_at: Mapped[Optional[datetime]] = mapped_column("plc_calculated_at", DateTime, nullable=True)
    plc_calculated_by: Mapped[Optional[int]] = mapped_column("plc_calculated_by", Integer, nullable=True)

    # Relationships
    product = relationship("Product", lazy="select")
    supply_lot = relationship("SupplyLot", lazy="select")
    supply_lot_item = relationship("SupplyLotItem", lazy="select")


# =============================================================================
# History / Log Tables
# =============================================================================

class LandedCostHistory(Base):
    """
    History record of landed cost calculations.
    Maps to TM_LCH_LandedCostHistory table.
    """
    __tablename__ = "TM_LCH_LandedCostHistory"
    __table_args__ = {"extend_existing": True}

    lch_id: Mapped[int] = mapped_column("lch_id", Integer, primary_key=True, autoincrement=True)
    lch_lot_id: Mapped[int] = mapped_column(
        "lch_lot_id", Integer,
        ForeignKey("TM_LOT_SupplyLot.lot_id"),
        nullable=False
    )
    lch_prd_id: Mapped[Optional[int]] = mapped_column(
        "lch_prd_id", Integer,
        ForeignKey("TM_PRD_Product.prd_id"),
        nullable=True
    )
    lch_sli_id: Mapped[Optional[int]] = mapped_column("lch_sli_id", Integer, nullable=True)

    # Snapshot of costs at calculation time
    lch_strategy: Mapped[str] = mapped_column("lch_strategy", String(20), nullable=False)
    lch_unit_purchase_price: Mapped[Optional[Decimal]] = mapped_column("lch_unit_purchase_price", Numeric(18, 4), nullable=True)
    lch_allocated_freight: Mapped[Optional[Decimal]] = mapped_column("lch_allocated_freight", Numeric(18, 4), nullable=True)
    lch_allocated_customs: Mapped[Optional[Decimal]] = mapped_column("lch_allocated_customs", Numeric(18, 4), nullable=True)
    lch_allocated_insurance: Mapped[Optional[Decimal]] = mapped_column("lch_allocated_insurance", Numeric(18, 4), nullable=True)
    lch_allocated_other: Mapped[Optional[Decimal]] = mapped_column("lch_allocated_other", Numeric(18, 4), nullable=True)
    lch_landed_cost_per_unit: Mapped[Optional[Decimal]] = mapped_column("lch_landed_cost_per_unit", Numeric(18, 4), nullable=True)
    lch_total_landed_cost: Mapped[Optional[Decimal]] = mapped_column("lch_total_landed_cost", Numeric(18, 4), nullable=True)

    # Notes
    lch_notes: Mapped[Optional[str]] = mapped_column("lch_notes", String(2000), nullable=True)

    # Audit
    lch_calculated_at: Mapped[Optional[datetime]] = mapped_column("lch_calculated_at", DateTime, nullable=True)
    lch_calculated_by: Mapped[Optional[int]] = mapped_column("lch_calculated_by", Integer, nullable=True)

    # Relationships
    supply_lot = relationship("SupplyLot", lazy="select")
    product = relationship("Product", lazy="select")


class LandedCostAllocationLog(Base):
    """
    Log entry for a landed cost allocation run.
    Maps to TM_LCL_LandedCostLog table.
    """
    __tablename__ = "TM_LCL_LandedCostLog"
    __table_args__ = {"extend_existing": True}

    lcl_id: Mapped[int] = mapped_column("lcl_id", Integer, primary_key=True, autoincrement=True)
    lcl_lot_id: Mapped[int] = mapped_column(
        "lcl_lot_id", Integer,
        ForeignKey("TM_LOT_SupplyLot.lot_id", ondelete="CASCADE"),
        nullable=False
    )
    lcl_strategy: Mapped[str] = mapped_column("lcl_strategy", String(20), nullable=False)
    lcl_status: Mapped[str] = mapped_column("lcl_status", String(20), nullable=False, default="PENDING")

    # Cost totals at time of allocation
    lcl_total_freight: Mapped[Decimal] = mapped_column("lcl_total_freight", Numeric(18, 4), nullable=False, default=Decimal("0"))
    lcl_total_customs: Mapped[Decimal] = mapped_column("lcl_total_customs", Numeric(18, 4), nullable=False, default=Decimal("0"))
    lcl_total_insurance: Mapped[Decimal] = mapped_column("lcl_total_insurance", Numeric(18, 4), nullable=False, default=Decimal("0"))
    lcl_total_local: Mapped[Decimal] = mapped_column("lcl_total_local", Numeric(18, 4), nullable=False, default=Decimal("0"))
    lcl_total_other: Mapped[Decimal] = mapped_column("lcl_total_other", Numeric(18, 4), nullable=False, default=Decimal("0"))
    lcl_total_allocated: Mapped[Decimal] = mapped_column("lcl_total_allocated", Numeric(18, 4), nullable=False, default=Decimal("0"))

    # Item count
    lcl_items_count: Mapped[int] = mapped_column("lcl_items_count", Integer, nullable=False, default=0)

    # Error tracking
    lcl_error_message: Mapped[Optional[str]] = mapped_column("lcl_error_message", String(2000), nullable=True)

    # Audit
    lcl_calculated_at: Mapped[Optional[datetime]] = mapped_column("lcl_calculated_at", DateTime, nullable=True)
    lcl_calculated_by: Mapped[Optional[int]] = mapped_column("lcl_calculated_by", Integer, nullable=True)

    # Relationships
    supply_lot = relationship("SupplyLot", back_populates="allocation_logs", lazy="select")
