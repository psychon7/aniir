"""
SQLAlchemy models package.

This package exports all SQLAlchemy ORM models for the ERP2025 backend.
Models are organized by domain and map to the DEV_ERP_ECOLED database tables.

IMPORTANT: All active models must be imported here to ensure SQLAlchemy can
resolve string-based relationship references. Import order matters for
models with relationships.

NOTE: Some models are DISABLED because their database tables do not exist.
Disabled models are plain Python classes (not SQLAlchemy models) that raise
NotImplementedError when instantiated. They are NOT imported here.
"""
from app.models.base import Base

# =============================================================================
# Reference/Lookup Tables (TR_* tables) - Import first, no dependencies
# =============================================================================
from app.models.currency import Currency, MainCurrency
from app.models.status import Status
from app.models.vat_rate import VatRate
from app.models.payment_mode import PaymentMode
from app.models.payment_term import PaymentTerm
from app.models.client_type import ClientType
from app.models.product_type import ProductType
from app.models.category import Category
from app.models.role import Role
from app.models.society import Society
from app.models.activity import Activity
from app.models.brand import Brand

# =============================================================================
# Core Entity Tables (TM_* tables) - Import after reference tables
# =============================================================================
from app.models.user import User, Civility
from app.models.client import Client
from app.models.supplier import Supplier, SupplierProduct
from app.models.product import Product, ProductInstance
from app.models.warehouse import Warehouse
from app.models.project import Project

# =============================================================================
# Transaction Tables - Import after core entities
# =============================================================================
from app.models.invoice import ClientInvoice
from app.models.client_invoice_line import ClientInvoiceLine
from app.models.client_invoice_payment import ClientInvoicePayment
from app.models.order import ClientOrder, ClientOrderLine
from app.models.costplan import CostPlan, CostPlanLine
from app.models.delivery_form import DeliveryForm, DeliveryFormLine
from app.models.shipment import ShippingReceiving, ShippingReceivingLine
from app.models.purchase_intent import PurchaseIntent, PurchaseIntentLine
from app.models.supplier_order import SupplierOrder, SupplierOrderLine
from app.models.supplier_invoice import SupplierInvoice, SupplierInvoiceLine

# =============================================================================
# Contact Tables
# =============================================================================
from app.models.client_contact import ClientContact
from app.models.supplier_contact import SupplierContact

# =============================================================================
# Pricing Tables
# =============================================================================
from app.models.client_product_price import ClientProductPrice
from app.models.supplier_product_price import SupplierProductPrice

# =============================================================================
# Delegate Tables
# =============================================================================
from app.models.client_delegate import ClientDelegate

# =============================================================================
# Task/Calendar Tables
# =============================================================================
from app.models.task import Task, TaskType, TaskPriority, TaskStatus

# =============================================================================
# Product Attribute Tables
# =============================================================================
from app.models.product_attribute import ProductAttribute, ProductAttributeValue, AttributeDataType

# =============================================================================
# DISABLED Models - Tables do NOT exist in database
# These are placeholder classes that raise NotImplementedError if instantiated.
# Do NOT import as SQLAlchemy models.
# =============================================================================
# from app.models.chat import ChatThread, ChatParticipant, ChatMessage, ...
# from app.models.quote import Quote, QuoteLine
# from app.models.stock import Stock
# from app.models.stock_movement import StockMovement, StockMovementLine
# from app.models.supply_lot import SupplyLot, SupplyLotLine, SupplyLotCost
# from app.models.payment import Payment, PaymentAllocation
# from app.models.email_log import EmailLog
# from app.models.unit_of_measure import UnitOfMeasure
# from app.models.business_unit import BusinessUnit
# from app.models.document_attachment import DocumentAttachment
# from app.models.drive import DriveFile, DriveFolder

__all__ = [
    # Base
    "Base",
    # Reference tables
    "Currency",
    "MainCurrency",
    "Status",
    "VatRate",
    "PaymentMode",
    "PaymentTerm",
    "ClientType",
    "ProductType",
    "Category",
    "Role",
    "Society",
    "Activity",
    # Core entities
    "User",
    "Civility",
    "Client",
    "Supplier",
    "SupplierProduct",
    "Product",
    "ProductInstance",
    "Warehouse",
    "Project",
    # Transactions
    "ClientInvoice",
    "ClientInvoiceLine",
    "ClientInvoicePayment",
    "ClientOrder",
    "ClientOrderLine",
    "CostPlan",
    "CostPlanLine",
    "DeliveryForm",
    "DeliveryFormLine",
    "ShippingReceiving",
    "ShippingReceivingLine",
    "PurchaseIntent",
    "PurchaseIntentLine",
    "SupplierOrder",
    "SupplierOrderLine",
    "SupplierInvoice",
    "SupplierInvoiceLine",
    # Contacts
    "ClientContact",
    "SupplierContact",
    # Pricing
    "ClientProductPrice",
    "SupplierProductPrice",
    # Delegates
    "ClientDelegate",
    # Tasks/Calendar
    "Task",
    "TaskType",
    "TaskPriority",
    "TaskStatus",
    # Product Attributes
    "ProductAttribute",
    "ProductAttributeValue",
    "AttributeDataType",
]
