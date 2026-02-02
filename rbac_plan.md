# Enterprise RBAC System Implementation Plan

## ERP2025 - Role-Based Access Control with Multi-Tenant Data Isolation

**Version:** 2.0.0
**Created:** 2026-02-02
**Status:** Ready for Implementation
**Database Verified:** ✅ Yes (2026-02-02)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Database Analysis](#2-database-analysis)
3. [Architecture Overview](#3-architecture-overview)
4. [Database Schema Design](#4-database-schema-design)
5. [Backend Implementation](#5-backend-implementation)
6. [Frontend Implementation](#6-frontend-implementation)
7. [Admin UI Specifications](#7-admin-ui-specifications)
8. [Implementation Roadmap](#8-implementation-roadmap)
9. [Testing Strategy](#9-testing-strategy)
10. [Task Breakdown](#10-task-breakdown)

---

## 1. Executive Summary

### 1.1 Objectives

Implement an enterprise-grade Role-Based Access Control (RBAC) system by **leveraging existing database tables** and adding minimal new infrastructure:

- ✅ **Use Existing RBAC Tables**: `TR_ROL_Role`, `TR_SCR_Screen`, `TR_RIT_Right` (348 permission records)
- 🆕 **Add Business Units**: Enable sub-organization data isolation (LED, HVAC, Domotics)
- 🆕 **Add API Mapping**: Connect existing screens to REST API endpoints
- 🔧 **Fix Backend**: Replace hardcoded role checks with database-driven permissions
- 🎨 **Build Admin UI**: Self-service role and permission management

### 1.2 Key Benefits

- **Zero Permission Data Migration**: 348 existing permission records work as-is
- **Faster Implementation**: No need to recreate permission infrastructure
- **Data-Driven**: Backend queries actual database instead of hardcoded checks
- **Scalable**: Supports hierarchical roles and business unit isolation

### 1.3 What's Already There (Verified)

| Component | Status | Records | Action |
|-----------|--------|---------|--------|
| 5 System Roles | ✅ EXISTS | Admin, Manager, Assistant, Comptable, Commercial | Enhance with new columns |
| 58 Screens/Modules | ✅ EXISTS | ClientOrder, Invoice, Product, etc. | Map to API resources |
| 348 Permission Records | ✅ EXISTS | Role-Screen-Action matrix | Use directly |
| 8 Permission Actions | ✅ EXISTS | read, create, modify, delete, validate, cancel, activate, super | Map to HTTP methods |

### 1.4 What We Need to Add

| Component | Type | Purpose |
|-----------|------|---------|
| Business Units | New Table | LED, HVAC, Domotics divisions |
| User-BU Assignment | New Table | Multi-BU user access |
| Screen-API Mapping | New Table | Bridge screens to `/api/v1/orders` endpoints |
| RBAC Audit Log | New Table | Track permission changes |
| SQLAlchemy Models | New Code | Python models for existing tables |
| RBACService | New Code | Permission checking logic |

---

## 2. Database Analysis

> **⚠️ CRITICAL**: This analysis is from **direct database inspection** on 2026-02-02.
> Database: `DEV_ERP_ECOLED` @ `47.254.130.238:1433`

### 2.1 Existing RBAC System (DO NOT RECREATE)

The database already has a complete Screen-Role-Permission system:

```
┌─────────────────────────────────────────────────────────────┐
│                    EXISTING RBAC TABLES                      │
├────────────────────────┬────────┬─────────────────────────────┤
│ Table                  │Records │ Purpose                     │
├────────────────────────┼────────┼─────────────────────────────┤
│ TR_ROL_Role            │ 5      │ Role definitions            │
│ TR_SCR_Screen          │ 58     │ Screen/Module registry      │
│ TR_RIT_Right           │ 348    │ Role×Screen permission map  │
│ TM_USR_User            │ 25+    │ Users (has rol_id, soc_id)  │
│ TR_SOC_Society         │ 1      │ Organization/Tenant         │
└────────────────────────┴────────┴─────────────────────────────┘
```

### 2.2 Existing Roles (TR_ROL_Role)

```sql
SELECT rol_id, rol_name, rol_level, rol_active FROM TR_ROL_Role;
```

| rol_id | rol_name | rol_level | rol_active | Description |
|--------|----------|-----------|------------|-------------|
| 1 | Admin | 99 | true | Full system access |
| 5 | Manager | 89 | true | Management level |
| 2 | Assistant | 79 | true | Administrative support |
| 4 | Comptable | 69 | true | Finance/Accounting |
| 3 | Commercial | 59 | true | Sales team |

**Proposed Hierarchy**:
```
Admin (1)
  └─ Manager (5)
      ├─ Assistant (2)
      ├─ Comptable (4)
      └─ Commercial (3)
```

### 2.3 Existing Screens (TR_SCR_Screen) - 58 Total

Sample screens by module:

| Parent Module | Screens |
|---------------|---------|
| **Admin** | ImportData, EnterpriseSetting |
| **Client** | Client, ClientApplication, ClientPrice, SearchClient |
| **ClientInvoice** | ClientInvoice, ClientInvoiceA, ClientInvoiceStatment, SearchClientInvoice |
| **ClientOrder** | ClientOrder, ClientOrderDeliveryFormList, SearchClientOrder |
| **CostPlan** | CostPlan, CostPlanClientInvoiceList, CostPlanClientOrderList, SearchCostPlan |
| **Product** | Product, ProductAttribute, ProductExpress, RecommandedProduct, SearchProduct |
| **Supplier** | Supplier, SupplierProduct, SearchSupplier |
| **SupplierInvoice** | SupplierInvoice, SearchSupplierInvoice |
| **SupplierOrder** | SupplierOrder, SearchSupplierOrder |
| **Warehouse** | Warehouse, ProductInventory, Shelves, WarehouseVoucher, SearchVoucher |
| **Users** | Users |
| **Logistics** | Logistics, SearchLogistics |

### 2.4 Permission Actions (TR_RIT_Right Columns)

Each permission record has 8 boolean columns:

| Column | Purpose | API Mapping |
|--------|---------|-------------|
| `rit_read` | View screen/data | `GET /api/v1/resource` |
| `rit_create` | Create new records | `POST /api/v1/resource` |
| `rit_modify` | Edit existing records | `PUT/PATCH /api/v1/resource/{id}` |
| `rit_delete` | Delete records | `DELETE /api/v1/resource/{id}` |
| `rit_valid` | Validate/Approve | `POST /api/v1/resource/{id}/approve` |
| `rit_cancel` | Cancel/Void | `POST /api/v1/resource/{id}/cancel` |
| `rit_active` | Activate/Deactivate | `PATCH /api/v1/resource/{id}/activate` |
| `rit_super_right` | Full access (bypass all) | All actions |

**Example Permission Record**:
```sql
-- Admin has full access to ImportData screen
rit_id=1, scr_id=1, rol_id=1
rit_read=1, rit_create=1, rit_modify=1, rit_delete=1,
rit_valid=1, rit_cancel=1, rit_active=1, rit_super_right=1
```

### 2.5 Current Backend Problem

The backend **IGNORES** the existing permission system:

```python
# backend/app/api/deps.py - Current hardcoded approach
def get_current_admin_user(current_user: User = Depends(get_current_active_user)):
    if current_user.usr_super_right or current_user.rol_id in (1, 5):
        return current_user
    raise HTTPException(status_code=403, detail="Not authorized")
```

**Problem**: Never queries `TR_RIT_Right` table! Ignores 348 existing permission records.

**Solution**: Replace with `RBACService` that queries the database.

### 2.6 What's Missing for Enterprise RBAC

| Feature | Current State | Gap |
|---------|---------------|-----|
| **Business Units** | `TR_DEP_Department` = French geography (97 departments) | Need actual BU table (LED/HVAC/Domotics) |
| **User-BU Assignment** | None | Need junction table for multi-BU users |
| **BU on Entities** | No `bu_id` column on orders/invoices | Need to add FK columns |
| **Role Hierarchy** | No `parent_id` on roles | Cannot inherit permissions |
| **Role Scoping** | All roles are global | Cannot create org-specific roles |
| **API Mapping** | Screens not linked to API endpoints | Need mapping table |
| **RBAC Audit** | `TS_ULG_User_Log` = page visits only | Need permission change audit |

---

## 3. Architecture Overview

### 3.1 RBAC Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                          │
│  GET /api/v1/orders?bu_id=1                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               JWT TOKEN VALIDATION                           │
│  Extract: user_id, rol_id, soc_id, bu_ids                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              PERMISSION CHECK (RBACService)                  │
│                                                              │
│  1. Map API endpoint → Screen                               │
│     /orders → scr_id=12 (ClientOrder)                       │
│                                                              │
│  2. Map HTTP method → Action                                │
│     GET → 'read' → rit_read                                 │
│                                                              │
│  3. Query TR_RIT_Right                                      │
│     WHERE rol_id=? AND scr_id=12                            │
│                                                              │
│  4. Check permission column                                 │
│     IF rit_super_right=1 OR rit_read=1: ALLOW              │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │ DENIED                    │ ALLOWED
         ▼                           ▼
┌──────────────────┐      ┌──────────────────────────────────┐
│ Return 403       │      │  DATA ISOLATION FILTER           │
│ Forbidden        │      │                                  │
└──────────────────┘      │  1. Filter by soc_id             │
                          │     WHERE soc_id = user.soc_id   │
                          │                                  │
                          │  2. Filter by bu_id (if set)     │
                          │     WHERE bu_id IN user.bu_ids   │
                          │                                  │
                          └──────────┬───────────────────────┘
                                     │
                                     ▼
                          ┌──────────────────────────────────┐
                          │  RETURN FILTERED DATA            │
                          │  Log to TM_AUL_AuditLog          │
                          └──────────────────────────────────┘
```

### 3.2 Multi-Tenant Isolation Model

```
┌─────────────────────────────────────────────────────────────┐
│             ORGANIZATION (Society = AX TECH)                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  BUSINESS UNITS                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │  │
│  │  │   LED    │  │   HVAC   │  │ Domotics │            │  │
│  │  │ bu_id=1  │  │ bu_id=2  │  │ bu_id=3  │            │  │
│  │  └──────────┘  └──────────┘  └──────────┘            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                      USERS                             │  │
│  │  • Alice: Admin (all BUs)                             │  │
│  │  • Bob: Manager (LED + HVAC only)                     │  │
│  │  • Carol: Commercial (LED only)                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Data Isolation:                                            │
│  - Alice sees: ALL orders                                   │
│  - Bob sees: Orders where bu_id IN (1, 2)                  │
│  - Carol sees: Orders where bu_id = 1                      │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Permission Inheritance

```
System Roles (cannot modify):
  Admin (rol_id=1, level=99, rol_is_system=true)
    └─ Manager (rol_id=5, level=89, parent_id=1)
        ├─ Assistant (rol_id=2, level=79, parent_id=5)
        ├─ Comptable (rol_id=4, level=69, parent_id=5)
        └─ Commercial (rol_id=3, level=59, parent_id=5)

Custom Roles (user can create):
  Sales Director (rol_id=6, soc_id=1, parent_id=5)
    └─ Sales Rep (rol_id=7, soc_id=1, parent_id=6)
```

---

## 4. Database Schema Design

> **DESIGN PRINCIPLE**: Extend existing tables, don't replace them.

### 4.1 Tables to MODIFY (Add Columns)

#### 4.1.1 Enhance TR_ROL_Role

```sql
-- Add new columns for role hierarchy and scoping
ALTER TABLE TR_ROL_Role
  ADD rol_soc_id INT NULL,                    -- NULL = system role, NOT NULL = org-specific
  ADD rol_parent_id INT NULL,                 -- Parent role for inheritance
  ADD rol_is_system BIT DEFAULT 0,            -- Cannot delete/modify system roles
  ADD rol_scope VARCHAR(50) DEFAULT 'organization',  -- 'system', 'organization', 'business_unit'
  ADD rol_description NVARCHAR(500) NULL;

-- Add foreign keys
ALTER TABLE TR_ROL_Role
  ADD CONSTRAINT FK_Role_Society
    FOREIGN KEY (rol_soc_id) REFERENCES TR_SOC_Society(soc_id);

ALTER TABLE TR_ROL_Role
  ADD CONSTRAINT FK_Role_Parent
    FOREIGN KEY (rol_parent_id) REFERENCES TR_ROL_Role(rol_id);

-- Update existing 5 roles to be system roles
UPDATE TR_ROL_Role SET
  rol_is_system = 1,
  rol_scope = 'system',
  rol_description = 'Full system administrator'
WHERE rol_id = 1;

UPDATE TR_ROL_Role SET
  rol_is_system = 1,
  rol_scope = 'organization',
  rol_parent_id = 1,
  rol_description = 'Management level with team oversight'
WHERE rol_id = 5;

UPDATE TR_ROL_Role SET
  rol_is_system = 1,
  rol_scope = 'organization',
  rol_parent_id = 5,
  rol_description = 'Administrative support staff'
WHERE rol_id = 2;

UPDATE TR_ROL_Role SET
  rol_is_system = 1,
  rol_scope = 'organization',
  rol_parent_id = 5,
  rol_description = 'Finance and accounting'
WHERE rol_id = 4;

UPDATE TR_ROL_Role SET
  rol_is_system = 1,
  rol_scope = 'organization',
  rol_parent_id = 5,
  rol_description = 'Sales and commercial operations'
WHERE rol_id = 3;
```

#### 4.1.2 Add BU to Transaction Tables

```sql
-- Add business unit FK to major entities
ALTER TABLE TM_COD_Client_Order ADD bu_id INT NULL;
ALTER TABLE TM_COD_Client_Order ADD CONSTRAINT FK_Order_BU
  FOREIGN KEY (bu_id) REFERENCES TR_BU_BusinessUnit(bu_id);

ALTER TABLE TM_CIN_Client_Invoice ADD bu_id INT NULL;
ALTER TABLE TM_CIN_Client_Invoice ADD CONSTRAINT FK_Invoice_BU
  FOREIGN KEY (bu_id) REFERENCES TR_BU_BusinessUnit(bu_id);

ALTER TABLE TM_CPL_Cost_Plan ADD bu_id INT NULL;
ALTER TABLE TM_CPL_Cost_Plan ADD CONSTRAINT FK_CostPlan_BU
  FOREIGN KEY (bu_id) REFERENCES TR_BU_BusinessUnit(bu_id);

ALTER TABLE TM_CLI_CLient ADD bu_id INT NULL;
ALTER TABLE TM_CLI_CLient ADD CONSTRAINT FK_Client_BU
  FOREIGN KEY (bu_id) REFERENCES TR_BU_BusinessUnit(bu_id);

ALTER TABLE TM_PRD_Product ADD bu_id INT NULL;
ALTER TABLE TM_PRD_Product ADD CONSTRAINT FK_Product_BU
  FOREIGN KEY (bu_id) REFERENCES TR_BU_BusinessUnit(bu_id);

ALTER TABLE TM_PRJ_Project ADD bu_id INT NULL;
ALTER TABLE TM_PRJ_Project ADD CONSTRAINT FK_Project_BU
  FOREIGN KEY (bu_id) REFERENCES TR_BU_BusinessUnit(bu_id);
```

### 4.2 Tables to CREATE (New)

#### 4.2.1 Business Unit Table

```sql
CREATE TABLE TR_BU_BusinessUnit (
  bu_id INT IDENTITY(1,1) PRIMARY KEY,
  soc_id INT NOT NULL,
  bu_code VARCHAR(50) NOT NULL,              -- 'LED', 'HVAC', 'DOMOTICS'
  bu_name NVARCHAR(200) NOT NULL,            -- 'LED Lighting Division'
  bu_color VARCHAR(7),                       -- '#3B82F6' for UI theming
  bu_is_active BIT DEFAULT 1,
  bu_parent_id INT NULL,                     -- For nested business units
  bu_d_creation DATETIME DEFAULT GETDATE(),
  bu_d_update DATETIME DEFAULT GETDATE(),

  CONSTRAINT FK_BU_Society
    FOREIGN KEY (soc_id) REFERENCES TR_SOC_Society(soc_id),
  CONSTRAINT FK_BU_Parent
    FOREIGN KEY (bu_parent_id) REFERENCES TR_BU_BusinessUnit(bu_id),
  CONSTRAINT UQ_BU_Code_Soc UNIQUE (soc_id, bu_code)
);

-- Seed initial business units
INSERT INTO TR_BU_BusinessUnit (soc_id, bu_code, bu_name, bu_color) VALUES
(1, 'LED',        'LED Lighting',       '#3B82F6'),  -- Blue
(1, 'HVAC',       'HVAC Systems',       '#10B981'),  -- Green
(1, 'DOMOTICS',   'Domotics & Smart',   '#EC4899'),  -- Pink
(1, 'ACCESSORIES','Accessories',        '#8B5CF6'),  -- Purple
(1, 'WAVECONCEPT','WaveConcept',        '#F97316');  -- Orange
```

#### 4.2.2 User-Business Unit Junction

```sql
CREATE TABLE TJ_UBU_User_BusinessUnit (
  ubu_id INT IDENTITY(1,1) PRIMARY KEY,
  usr_id INT NOT NULL,
  bu_id INT NOT NULL,
  ubu_is_primary BIT DEFAULT 0,              -- Primary BU for user
  ubu_is_manager BIT DEFAULT 0,              -- BU manager designation
  ubu_d_creation DATETIME DEFAULT GETDATE(),

  CONSTRAINT FK_UserBU_User
    FOREIGN KEY (usr_id) REFERENCES TM_USR_User(usr_id) ON DELETE CASCADE,
  CONSTRAINT FK_UserBU_BU
    FOREIGN KEY (bu_id) REFERENCES TR_BU_BusinessUnit(bu_id) ON DELETE CASCADE,
  CONSTRAINT UQ_User_BU UNIQUE (usr_id, bu_id)
);

CREATE INDEX IX_UserBU_User ON TJ_UBU_User_BusinessUnit(usr_id);
CREATE INDEX IX_UserBU_BU ON TJ_UBU_User_BusinessUnit(bu_id);
```

#### 4.2.3 Screen-to-API Mapping

```sql
CREATE TABLE TR_SAM_Screen_API_Mapping (
  sam_id INT IDENTITY(1,1) PRIMARY KEY,
  scr_id INT NOT NULL,                       -- FK to existing TR_SCR_Screen
  sam_api_resource VARCHAR(100) NOT NULL,    -- 'orders', 'invoices', 'clients'
  sam_api_endpoint VARCHAR(200),             -- '/api/v1/orders' (optional)
  sam_description NVARCHAR(500),

  CONSTRAINT FK_SAM_Screen
    FOREIGN KEY (scr_id) REFERENCES TR_SCR_Screen(scr_id)
);

-- Seed mappings for major resources
INSERT INTO TR_SAM_Screen_API_Mapping (scr_id, sam_api_resource, sam_api_endpoint, sam_description) VALUES
-- Client Module
(7,  'clients',           '/api/v1/clients',           'Client management'),
(9,  'clients',           '/api/v1/clients',           'Client search'),

-- Orders Module
(12, 'orders',            '/api/v1/orders',            'Client order management'),
(14, 'orders',            '/api/v1/orders',            'Order search'),

-- Invoices Module
(10, 'invoices',          '/api/v1/invoices',          'Client invoice management'),
(11, 'invoices',          '/api/v1/invoices',          'Invoice search'),

-- Quotes/Cost Plans
(17, 'quotes',            '/api/v1/cost-plans',        'Quote/Cost plan management'),
(20, 'quotes',            '/api/v1/cost-plans',        'Quote search'),

-- Products
(26, 'products',          '/api/v1/products',          'Product management'),
(30, 'products',          '/api/v1/products',          'Product search'),

-- Suppliers
(40, 'suppliers',         '/api/v1/suppliers',         'Supplier management'),
(39, 'suppliers',         '/api/v1/suppliers',         'Supplier search'),

-- Supplier Orders & Invoices
(46, 'supplier-orders',   '/api/v1/supplier-orders',   'Supplier order management'),
(44, 'supplier-invoices', '/api/v1/supplier-invoices', 'Supplier invoice management'),

-- Projects
(32, 'projects',          '/api/v1/projects',          'Project management'),
(36, 'projects',          '/api/v1/projects',          'Project search'),

-- Warehouse
(51, 'warehouse',         '/api/v1/warehouse',         'Warehouse management'),
(48, 'inventory',         '/api/v1/inventory',         'Inventory management'),

-- Logistics
(23, 'logistics',         '/api/v1/logistics',         'Logistics management'),

-- Delivery
(21, 'deliveries',        '/api/v1/deliveries',        'Delivery form management'),
(22, 'deliveries',        '/api/v1/deliveries',        'Delivery search'),

-- Users
(47, 'users',             '/api/v1/users',             'User management'),

-- Admin
(1,  'admin',             '/api/v1/admin/import',      'Data import'),
(2,  'admin',             '/api/v1/admin/settings',    'Enterprise settings');
```

#### 4.2.4 RBAC Audit Log

```sql
CREATE TABLE TM_AUL_AuditLog (
  aul_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  aul_timestamp DATETIME DEFAULT GETDATE(),
  aul_user_id INT,
  aul_user_login VARCHAR(200),
  aul_soc_id INT,
  aul_bu_id INT NULL,
  aul_action VARCHAR(50) NOT NULL,           -- 'read', 'create', 'update', 'delete', 'login'
  aul_resource VARCHAR(100) NOT NULL,        -- 'orders', 'invoices', 'permissions'
  aul_resource_id VARCHAR(50),               -- Entity ID
  aul_details NVARCHAR(MAX),                 -- JSON with before/after values
  aul_ip_address VARCHAR(45),
  aul_user_agent VARCHAR(500),
  aul_status VARCHAR(20) DEFAULT 'success',  -- 'success', 'denied', 'error'

  INDEX IX_AuditLog_Timestamp (aul_timestamp),
  INDEX IX_AuditLog_User (aul_user_id),
  INDEX IX_AuditLog_Resource (aul_resource, aul_resource_id),
  INDEX IX_AuditLog_Society (aul_soc_id)
);
```

### 4.3 Permission Mapping Reference

Map existing `TR_RIT_Right` columns to API actions:

| TR_RIT_Right Column | API HTTP Method | API Endpoints |
|---------------------|-----------------|---------------|
| `rit_read` | `GET` | `/resource`, `/resource/{id}` |
| `rit_create` | `POST` | `/resource` |
| `rit_modify` | `PUT`, `PATCH` | `/resource/{id}` |
| `rit_delete` | `DELETE` | `/resource/{id}` |
| `rit_valid` | `POST` | `/resource/{id}/approve`, `/resource/{id}/validate`, `/resource/{id}/send` |
| `rit_cancel` | `POST` | `/resource/{id}/cancel`, `/resource/{id}/void` |
| `rit_active` | `PATCH` | `/resource/{id}/activate`, `/resource/{id}/deactivate` |
| `rit_super_right` | `ALL` | Bypass all checks |

---

## 5. Backend Implementation

### 5.1 SQLAlchemy Models

#### 5.1.1 Screen Model (Existing Table)

**File**: `backend/app/models/screen.py`

```python
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.models.base import Base


class Screen(Base):
    """Maps to EXISTING TR_SCR_Screen table (58 records)."""
    __tablename__ = "TR_SCR_Screen"

    scr_id = Column(Integer, primary_key=True)
    scr_name = Column(String(200), nullable=False)
    scr_parent_name = Column(String(200))

    # Relationships
    rights = relationship("Right", back_populates="screen")
    api_mappings = relationship("ScreenApiMapping", back_populates="screen")


class ScreenApiMapping(Base):
    """Maps screens to API resources (NEW table)."""
    __tablename__ = "TR_SAM_Screen_API_Mapping"

    sam_id = Column(Integer, primary_key=True, autoincrement=True)
    scr_id = Column(Integer, ForeignKey("TR_SCR_Screen.scr_id"), nullable=False)
    sam_api_resource = Column(String(100), nullable=False)
    sam_api_endpoint = Column(String(200))
    sam_description = Column(String(500))

    # Relationships
    screen = relationship("Screen", back_populates="api_mappings")
```

#### 5.1.2 Right Model (Existing Table)

**File**: `backend/app/models/right.py`

```python
from sqlalchemy import Column, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base


class Right(Base):
    """Maps to EXISTING TR_RIT_Right table (348 records)."""
    __tablename__ = "TR_RIT_Right"

    rit_id = Column(Integer, primary_key=True)
    scr_id = Column(Integer, ForeignKey("TR_SCR_Screen.scr_id"), nullable=False)
    rol_id = Column(Integer, ForeignKey("TR_ROL_Role.rol_id"), nullable=False)

    # Permission flags (existing columns)
    rit_read = Column(Boolean, nullable=False, default=False)
    rit_create = Column(Boolean, nullable=False, default=False)
    rit_modify = Column(Boolean, nullable=False, default=False)
    rit_delete = Column(Boolean, nullable=False, default=False)
    rit_valid = Column(Boolean, nullable=False, default=False)
    rit_cancel = Column(Boolean, nullable=False, default=False)
    rit_active = Column(Boolean, nullable=False, default=False)
    rit_super_right = Column(Boolean, nullable=False, default=False)

    # Relationships
    screen = relationship("Screen", back_populates="rights")
    role = relationship("Role", back_populates="rights")

    def has_action(self, action: str) -> bool:
        """Check if this right grants the specified action."""
        if self.rit_super_right:
            return True

        action_map = {
            'read': self.rit_read,
            'list': self.rit_read,
            'create': self.rit_create,
            'update': self.rit_modify,
            'modify': self.rit_modify,
            'delete': self.rit_delete,
            'validate': self.rit_valid,
            'approve': self.rit_valid,
            'send': self.rit_valid,
            'cancel': self.rit_cancel,
            'void': self.rit_cancel,
            'activate': self.rit_active,
            'deactivate': self.rit_active,
        }
        return action_map.get(action, False)
```

#### 5.1.3 Enhanced Role Model

**File**: `backend/app/models/role.py` (UPDATE)

```python
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base


class Role(Base):
    """Enhanced Role model with hierarchy and scope."""
    __tablename__ = "TR_ROL_Role"

    rol_id = Column(Integer, primary_key=True, autoincrement=True)
    rol_name = Column(String(200), nullable=False)
    rol_active = Column(Boolean, default=True)
    rol_level = Column(Integer, default=0)

    # New fields (to be added via migration)
    rol_soc_id = Column(Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=True)
    rol_parent_id = Column(Integer, ForeignKey("TR_ROL_Role.rol_id"), nullable=True)
    rol_is_system = Column(Boolean, default=False)
    rol_scope = Column(String(50), default="organization")
    rol_description = Column(String(500))

    # Relationships
    users = relationship("User", back_populates="role")
    society = relationship("Society", back_populates="custom_roles")
    parent_role = relationship("Role", remote_side=[rol_id], backref="child_roles")
    rights = relationship("Right", back_populates="role")
```

#### 5.1.4 Business Unit Models

**File**: `backend/app/models/business_unit.py`

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base


class BusinessUnit(Base):
    """Business Unit for sub-organization data isolation."""
    __tablename__ = "TR_BU_BusinessUnit"

    bu_id = Column(Integer, primary_key=True, autoincrement=True)
    soc_id = Column(Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=False)
    bu_code = Column(String(50), nullable=False)
    bu_name = Column(String(200), nullable=False)
    bu_color = Column(String(7))  # Hex color
    bu_is_active = Column(Boolean, default=True)
    bu_parent_id = Column(Integer, ForeignKey("TR_BU_BusinessUnit.bu_id"), nullable=True)
    bu_d_creation = Column(DateTime, default=datetime.utcnow)
    bu_d_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    society = relationship("Society", back_populates="business_units")
    parent = relationship("BusinessUnit", remote_side=[bu_id], backref="children")
    user_assignments = relationship("UserBusinessUnit", back_populates="business_unit")


class UserBusinessUnit(Base):
    """User-BusinessUnit junction for multi-BU assignment."""
    __tablename__ = "TJ_UBU_User_BusinessUnit"

    ubu_id = Column(Integer, primary_key=True, autoincrement=True)
    usr_id = Column(Integer, ForeignKey("TM_USR_User.usr_id", ondelete="CASCADE"), nullable=False)
    bu_id = Column(Integer, ForeignKey("TR_BU_BusinessUnit.bu_id", ondelete="CASCADE"), nullable=False)
    ubu_is_primary = Column(Boolean, default=False)
    ubu_is_manager = Column(Boolean, default=False)
    ubu_d_creation = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="business_unit_assignments")
    business_unit = relationship("BusinessUnit", back_populates="user_assignments")
```

#### 5.1.5 Audit Log Model

**File**: `backend/app/models/audit_log.py`

```python
from sqlalchemy import Column, BigInteger, Integer, String, DateTime, Text
from datetime import datetime
from app.models.base import Base


class AuditLog(Base):
    """Audit trail for RBAC actions."""
    __tablename__ = "TM_AUL_AuditLog"

    aul_id = Column(BigInteger, primary_key=True, autoincrement=True)
    aul_timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    aul_user_id = Column(Integer, index=True)
    aul_user_login = Column(String(200))
    aul_soc_id = Column(Integer, index=True)
    aul_bu_id = Column(Integer)
    aul_action = Column(String(50), nullable=False)
    aul_resource = Column(String(100), nullable=False, index=True)
    aul_resource_id = Column(String(50))
    aul_details = Column(Text)  # JSON
    aul_ip_address = Column(String(45))
    aul_user_agent = Column(String(500))
    aul_status = Column(String(20), default="success")
```

### 5.2 RBAC Service

**File**: `backend/app/services/rbac_service.py`

```python
from typing import Dict, List, Optional, Set
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
import json

from app.models.user import User
from app.models.right import Right
from app.models.screen import Screen, ScreenApiMapping
from app.models.business_unit import UserBusinessUnit
from app.models.audit_log import AuditLog


class RBACService:
    """
    Enterprise RBAC Service using EXISTING TR_RIT_Right table.

    Permission check format: has_permission(user, api_resource, action)
    Example: has_permission(user, 'orders', 'create')
    """

    # Map API actions to TR_RIT_Right column names
    ACTION_COLUMN_MAP = {
        'read': 'rit_read',
        'list': 'rit_read',
        'create': 'rit_create',
        'update': 'rit_modify',
        'modify': 'rit_modify',
        'delete': 'rit_delete',
        'approve': 'rit_valid',
        'validate': 'rit_valid',
        'send': 'rit_valid',
        'cancel': 'rit_cancel',
        'void': 'rit_cancel',
        'activate': 'rit_active',
        'deactivate': 'rit_active',
    }

    def __init__(self, db: Session):
        self.db = db
        self._screen_api_map: Optional[Dict[str, int]] = None

    def _load_screen_api_map(self) -> Dict[str, int]:
        """Load screen-to-API mapping from database (cached)."""
        if self._screen_api_map is not None:
            return self._screen_api_map

        self._screen_api_map = {}
        query = select(ScreenApiMapping)
        result = self.db.execute(query)
        for mapping in result.scalars():
            self._screen_api_map[mapping.sam_api_resource] = mapping.scr_id

        return self._screen_api_map

    def has_permission(self, user: User, api_resource: str, action: str) -> bool:
        """
        Check if user has permission to perform action on resource.

        Args:
            user: User object
            api_resource: API resource name (e.g., 'orders', 'invoices')
            action: Action name (e.g., 'read', 'create', 'delete')

        Returns:
            True if user has permission, False otherwise
        """
        # Super admin bypass
        if user.usr_super_right:
            return True

        # Get screen ID for this API resource
        screen_map = self._load_screen_api_map()
        scr_id = screen_map.get(api_resource)
        if not scr_id:
            # No mapping found - deny by default
            return False

        # Get right column name for this action
        column_name = self.ACTION_COLUMN_MAP.get(action)
        if not column_name:
            return False

        # Query TR_RIT_Right for this role + screen
        query = select(Right).where(
            and_(
                Right.rol_id == user.rol_id,
                Right.scr_id == scr_id
            )
        )
        result = self.db.execute(query)
        right = result.scalar_one_or_none()

        if not right:
            return False

        # Check super_right flag (grants all)
        if right.rit_super_right:
            return True

        # Check specific permission column
        return getattr(right, column_name, False)

    def get_user_permissions(self, user: User) -> Dict[str, Dict[str, bool]]:
        """
        Get all permissions for a user.

        Returns:
            Dict like {'orders': {'read': True, 'create': True, ...}, ...}
        """
        permissions: Dict[str, Dict[str, bool]] = {}

        # Super admin gets everything
        if user.usr_super_right:
            screen_map = self._load_screen_api_map()
            for api_resource in screen_map.keys():
                permissions[api_resource] = {
                    'read': True, 'create': True, 'update': True, 'delete': True,
                    'approve': True, 'cancel': True, 'activate': True
                }
            return permissions

        # Query all rights for user's role, joined with API mappings
        query = (
            select(Right, ScreenApiMapping)
            .join(ScreenApiMapping, Right.scr_id == ScreenApiMapping.scr_id)
            .where(Right.rol_id == user.rol_id)
        )
        result = self.db.execute(query)

        for right, mapping in result:
            api_resource = mapping.sam_api_resource

            # Build permission map for this resource
            permissions[api_resource] = {
                'read': right.rit_read or right.rit_super_right,
                'create': right.rit_create or right.rit_super_right,
                'update': right.rit_modify or right.rit_super_right,
                'delete': right.rit_delete or right.rit_super_right,
                'approve': right.rit_valid or right.rit_super_right,
                'cancel': right.rit_cancel or right.rit_super_right,
                'activate': right.rit_active or right.rit_super_right,
            }

        return permissions

    def get_user_business_units(self, user_id: int) -> List[int]:
        """Get list of business unit IDs user can access."""
        query = select(UserBusinessUnit.bu_id).where(
            UserBusinessUnit.usr_id == user_id
        )
        result = self.db.execute(query)
        return [row[0] for row in result.fetchall()]

    def can_access_business_unit(self, user: User, bu_id: int) -> bool:
        """Check if user can access specific business unit."""
        # Super admin can access all
        if user.usr_super_right:
            return True

        # Get user's BU assignments
        user_bus = self.get_user_business_units(user.usr_id)

        # No BU restrictions = can access all
        if not user_bus:
            return True

        return bu_id in user_bus

    def log_access(
        self,
        user_id: int,
        user_login: str,
        soc_id: int,
        action: str,
        resource: str,
        resource_id: Optional[str] = None,
        details: Optional[Dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        status: str = "success",
        bu_id: Optional[int] = None
    ):
        """Log access attempt to audit trail."""
        log = AuditLog(
            aul_user_id=user_id,
            aul_user_login=user_login,
            aul_soc_id=soc_id,
            aul_bu_id=bu_id,
            aul_action=action,
            aul_resource=resource,
            aul_resource_id=resource_id,
            aul_details=json.dumps(details) if details else None,
            aul_ip_address=ip_address,
            aul_user_agent=user_agent,
            aul_status=status
        )
        self.db.add(log)
        self.db.commit()


def get_rbac_service(db: Session) -> RBACService:
    """Dependency injection factory."""
    return RBACService(db)
```

### 5.3 Permission Dependencies

**File**: `backend/app/api/deps.py` (UPDATE)

```python
from typing import List
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.services.rbac_service import RBACService, get_rbac_service


class PermissionChecker:
    """Dependency class for permission checking."""

    def __init__(self, api_resource: str, action: str):
        self.api_resource = api_resource
        self.action = action

    def __call__(
        self,
        request: Request,
        current_user: User = Depends(get_current_active_user),
        rbac_service: RBACService = Depends(get_rbac_service),
        db: Session = Depends(get_db)
    ) -> User:
        """Check if user has required permission."""

        # Check permission
        has_access = rbac_service.has_permission(
            current_user,
            self.api_resource,
            self.action
        )

        if not has_access:
            # Log denied access
            rbac_service.log_access(
                user_id=current_user.usr_id,
                user_login=current_user.usr_login,
                soc_id=current_user.soc_id,
                action=self.action,
                resource=self.api_resource,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
                status="denied"
            )

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "insufficient_permissions",
                    "required": f"{self.api_resource}.{self.action}",
                    "message": "You do not have permission to perform this action"
                }
            )

        return current_user


# Convenience functions
def require_permission(api_resource: str, action: str):
    """Factory for permission-based access control."""
    return Depends(PermissionChecker(api_resource, action))


# Pre-defined permission dependencies
RequireOrdersRead = require_permission("orders", "read")
RequireOrdersCreate = require_permission("orders", "create")
RequireOrdersUpdate = require_permission("orders", "update")
RequireOrdersDelete = require_permission("orders", "delete")

RequireInvoicesRead = require_permission("invoices", "read")
RequireInvoicesCreate = require_permission("invoices", "create")
RequireInvoicesUpdate = require_permission("invoices", "update")
RequireInvoicesSend = require_permission("invoices", "send")
RequireInvoicesVoid = require_permission("invoices", "void")

RequireClientsRead = require_permission("clients", "read")
RequireClientsCreate = require_permission("clients", "create")
RequireClientsUpdate = require_permission("clients", "update")

RequireProductsRead = require_permission("products", "read")
RequireProductsCreate = require_permission("products", "create")

RequireUsersManage = require_permission("users", "update")
```

### 5.4 Example API Endpoint Usage

**File**: `backend/app/api/v1/orders.py` (EXAMPLE)

```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.api.deps import (
    get_current_active_user,
    RequireOrdersRead,
    RequireOrdersCreate,
    RequireOrdersUpdate,
    RequireOrdersDelete,
    require_permission
)
from app.services.rbac_service import get_rbac_service, RBACService
from app.models.user import User
from app.schemas.order import OrderResponse, OrderCreate, OrderUpdate


router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("/", response_model=List[OrderResponse])
def list_orders(
    bu_id: Optional[int] = Query(None),
    current_user: User = RequireOrdersRead,  # Uses permission check
    rbac_service: RBACService = Depends(get_rbac_service),
    db: Session = Depends(get_db)
):
    """List orders with data isolation."""

    # Base query with tenant filter
    query = db.query(Order).filter(Order.soc_id == current_user.soc_id)

    # Apply BU filter if user has BU restrictions
    user_bus = rbac_service.get_user_business_units(current_user.usr_id)
    if user_bus:
        query = query.filter(Order.bu_id.in_(user_bus))

    # Apply requested BU filter (if user has access)
    if bu_id is not None:
        if not rbac_service.can_access_business_unit(current_user, bu_id):
            raise HTTPException(403, "Cannot access this business unit")
        query = query.filter(Order.bu_id == bu_id)

    return query.all()


@router.post("/", response_model=OrderResponse, status_code=201)
def create_order(
    data: OrderCreate,
    current_user: User = RequireOrdersCreate,  # Permission check
    rbac_service: RBACService = Depends(get_rbac_service),
    db: Session = Depends(get_db)
):
    """Create a new order."""

    # Validate BU access if bu_id is set
    if data.bu_id and not rbac_service.can_access_business_unit(current_user, data.bu_id):
        raise HTTPException(403, "Cannot create order in this business unit")

    order = Order(**data.dict(), soc_id=current_user.soc_id)
    db.add(order)
    db.commit()
    db.refresh(order)

    # Log the creation
    rbac_service.log_access(
        user_id=current_user.usr_id,
        user_login=current_user.usr_login,
        soc_id=current_user.soc_id,
        bu_id=order.bu_id,
        action="create",
        resource="orders",
        resource_id=str(order.cod_id),
        status="success"
    )

    return order


@router.put("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    data: OrderUpdate,
    current_user: User = RequireOrdersUpdate,
    db: Session = Depends(get_db)
):
    """Update an order."""
    order = db.query(Order).filter(
        Order.cod_id == order_id,
        Order.soc_id == current_user.soc_id  # Tenant isolation
    ).first()

    if not order:
        raise HTTPException(404, "Order not found")

    # Update logic...
    return order


@router.post("/{order_id}/approve")
def approve_order(
    order_id: int,
    current_user: User = Depends(require_permission("orders", "approve")),
    db: Session = Depends(get_db)
):
    """Approve an order (requires rit_valid permission)."""
    # Approval logic...
    pass


@router.delete("/{order_id}", status_code=204)
def delete_order(
    order_id: int,
    current_user: User = RequireOrdersDelete,
    db: Session = Depends(get_db)
):
    """Delete an order."""
    # Delete logic...
    pass
```

### 5.5 RBAC Admin API

**File**: `backend/app/api/v1/rbac.py`

```python
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.api.deps import get_current_active_user, require_permission
from app.services.rbac_service import RBACService, get_rbac_service
from app.models.user import User
from app.models.role import Role
from app.models.business_unit import BusinessUnit, UserBusinessUnit


router = APIRouter(prefix="/rbac", tags=["RBAC"])


# ========== Schemas ==========

class PermissionInfo(BaseModel):
    resource: str
    actions: dict  # {'read': True, 'create': False, ...}


class UserPermissionsResponse(BaseModel):
    user_id: int
    role_name: str
    permissions: Dict[str, Dict[str, bool]]
    business_units: List[int]
    is_super_admin: bool


class BusinessUnitResponse(BaseModel):
    bu_id: int
    bu_code: str
    bu_name: str
    bu_color: Optional[str]
    bu_is_active: bool

    class Config:
        from_attributes = True


class BusinessUnitCreate(BaseModel):
    bu_code: str
    bu_name: str
    bu_color: Optional[str] = None


# ========== Endpoints ==========

@router.get("/permissions/my", response_model=UserPermissionsResponse)
def get_my_permissions(
    current_user: User = Depends(get_current_active_user),
    rbac_service: RBACService = Depends(get_rbac_service)
):
    """Get current user's permissions."""
    permissions = rbac_service.get_user_permissions(current_user)
    bu_ids = rbac_service.get_user_business_units(current_user.usr_id)

    return UserPermissionsResponse(
        user_id=current_user.usr_id,
        role_name=current_user.role.rol_name if current_user.role else "Unknown",
        permissions=permissions,
        business_units=bu_ids,
        is_super_admin=current_user.usr_super_right
    )


@router.get("/business-units", response_model=List[BusinessUnitResponse])
def list_business_units(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List business units in user's organization."""
    query = db.query(BusinessUnit).filter(
        BusinessUnit.soc_id == current_user.soc_id,
        BusinessUnit.bu_is_active == True
    )
    return query.all()


@router.post("/business-units", response_model=BusinessUnitResponse, status_code=201)
def create_business_unit(
    data: BusinessUnitCreate,
    current_user: User = Depends(require_permission("admin", "create")),
    db: Session = Depends(get_db)
):
    """Create a new business unit."""
    bu = BusinessUnit(
        soc_id=current_user.soc_id,
        **data.dict()
    )
    db.add(bu)
    db.commit()
    db.refresh(bu)
    return bu


@router.post("/users/{user_id}/business-units/{bu_id}")
def assign_user_to_business_unit(
    user_id: int,
    bu_id: int,
    is_primary: bool = False,
    is_manager: bool = False,
    current_user: User = Depends(require_permission("users", "update")),
    db: Session = Depends(get_db)
):
    """Assign user to a business unit."""
    # Check if assignment already exists
    existing = db.query(UserBusinessUnit).filter(
        UserBusinessUnit.usr_id == user_id,
        UserBusinessUnit.bu_id == bu_id
    ).first()

    if existing:
        existing.ubu_is_primary = is_primary
        existing.ubu_is_manager = is_manager
    else:
        assignment = UserBusinessUnit(
            usr_id=user_id,
            bu_id=bu_id,
            ubu_is_primary=is_primary,
            ubu_is_manager=is_manager
        )
        db.add(assignment)

    db.commit()
    return {"message": "User assigned to business unit"}


@router.delete("/users/{user_id}/business-units/{bu_id}")
def remove_user_from_business_unit(
    user_id: int,
    bu_id: int,
    current_user: User = Depends(require_permission("users", "update")),
    db: Session = Depends(get_db)
):
    """Remove user from a business unit."""
    assignment = db.query(UserBusinessUnit).filter(
        UserBusinessUnit.usr_id == user_id,
        UserBusinessUnit.bu_id == bu_id
    ).first()

    if assignment:
        db.delete(assignment)
        db.commit()

    return {"message": "User removed from business unit"}
```

---

## 6. Frontend Implementation

### 6.1 Permission Store

**File**: `frontend/src/stores/permissionStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BusinessUnit {
  bu_id: number;
  bu_code: string;
  bu_name: string;
  bu_color?: string;
}

interface PermissionState {
  // Resource → Action → Boolean
  permissions: Record<string, Record<string, boolean>>;
  businessUnits: BusinessUnit[];
  isSuperAdmin: boolean;
  isLoaded: boolean;

  // Actions
  setPermissions: (permissions: Record<string, Record<string, boolean>>) => void;
  setBusinessUnits: (units: BusinessUnit[]) => void;
  setIsSuperAdmin: (value: boolean) => void;
  clearPermissions: () => void;

  // Checks
  can: (resource: string, action: string) => boolean;
  canAny: (resource: string, actions: string[]) => boolean;
  canAll: (resource: string, actions: string[]) => boolean;
}

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set, get) => ({
      permissions: {},
      businessUnits: [],
      isSuperAdmin: false,
      isLoaded: false,

      setPermissions: (permissions) => set({ permissions, isLoaded: true }),
      setBusinessUnits: (units) => set({ businessUnits: units }),
      setIsSuperAdmin: (value) => set({ isSuperAdmin: value }),
      clearPermissions: () => set({
        permissions: {},
        businessUnits: [],
        isSuperAdmin: false,
        isLoaded: false
      }),

      can: (resource, action) => {
        const { permissions, isSuperAdmin } = get();
        if (isSuperAdmin) return true;
        return permissions[resource]?.[action] ?? false;
      },

      canAny: (resource, actions) => {
        return actions.some(action => get().can(resource, action));
      },

      canAll: (resource, actions) => {
        return actions.every(action => get().can(resource, action));
      },
    }),
    {
      name: 'erp-permissions',
    }
  )
);
```

### 6.2 Permission Hook

**File**: `frontend/src/hooks/usePermissions.ts`

```typescript
import { useCallback, useMemo } from 'react';
import { usePermissionStore } from '@/stores/permissionStore';

export function usePermissions() {
  const store = usePermissionStore();

  return {
    can: store.can,
    canAny: store.canAny,
    canAll: store.canAll,
    permissions: store.permissions,
    businessUnits: store.businessUnits,
    isSuperAdmin: store.isSuperAdmin,
    isLoaded: store.isLoaded,
  };
}

// Resource-specific hooks
export function useOrderPermissions() {
  const { can } = usePermissions();

  return useMemo(() => ({
    canCreate: can('orders', 'create'),
    canRead: can('orders', 'read'),
    canUpdate: can('orders', 'update'),
    canDelete: can('orders', 'delete'),
    canApprove: can('orders', 'approve'),
  }), [can]);
}

export function useInvoicePermissions() {
  const { can } = usePermissions();

  return useMemo(() => ({
    canCreate: can('invoices', 'create'),
    canRead: can('invoices', 'read'),
    canUpdate: can('invoices', 'update'),
    canDelete: can('invoices', 'delete'),
    canSend: can('invoices', 'send'),
    canVoid: can('invoices', 'void'),
  }), [can]);
}
```

### 6.3 Permission Guard Component

**File**: `frontend/src/components/auth/PermissionGuard.tsx`

```typescript
import React, { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  resource: string;
  action: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({
  resource,
  action,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { can, isLoaded } = usePermissions();

  if (!isLoaded) {
    return null; // Or loading spinner
  }

  if (!can(resource, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Usage in components:
// <PermissionGuard resource="orders" action="create">
//   <Button>Create Order</Button>
// </PermissionGuard>
```

### 6.4 Load Permissions on Login

**File**: `frontend/src/stores/authStore.ts` (UPDATE)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/api/client';
import { usePermissionStore } from './permissionStore';

interface AuthState {
  // ... existing auth fields

  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ... existing state

      login: async (username, password) => {
        // 1. Call login API
        const response = await apiClient.post('/auth/login', { username, password });
        const { access_token, user } = response.data;

        // 2. Store token
        set({
          token: access_token,
          user,
          isAuthenticated: true
        });

        // 3. Load permissions
        const permResponse = await apiClient.get('/rbac/permissions/my');
        const { permissions, business_units, is_super_admin } = permResponse.data;

        // 4. Update permission store
        usePermissionStore.getState().setPermissions(permissions);
        usePermissionStore.getState().setBusinessUnits(business_units);
        usePermissionStore.getState().setIsSuperAdmin(is_super_admin);
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
        usePermissionStore.getState().clearPermissions();
      },
    }),
    {
      name: 'erp-auth',
    }
  )
);
```

### 6.5 Business Unit Selector

**File**: `frontend/src/components/auth/BusinessUnitSelector.tsx`

```typescript
import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BusinessUnitSelectorProps {
  value?: number;
  onChange: (buId: number | undefined) => void;
  showAll?: boolean;
}

export function BusinessUnitSelector({
  value,
  onChange,
  showAll = true,
}: BusinessUnitSelectorProps) {
  const { businessUnits, isSuperAdmin } = usePermissions();

  return (
    <Select
      value={value?.toString() ?? 'all'}
      onValueChange={(v) => onChange(v === 'all' ? undefined : parseInt(v))}
    >
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select business unit" />
      </SelectTrigger>
      <SelectContent>
        {(showAll || isSuperAdmin || businessUnits.length === 0) && (
          <SelectItem value="all">All Business Units</SelectItem>
        )}
        {businessUnits.map((bu) => (
          <SelectItem key={bu.bu_id} value={bu.bu_id.toString()}>
            <span className="flex items-center gap-2">
              {bu.bu_color && (
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: bu.bu_color }}
                />
              )}
              {bu.bu_name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

---

## 7. Admin UI Specifications

### 7.1 Admin Routes

```
/admin
├── /roles                    # Role management
│   ├── /                     # List roles with permissions
│   └── /:roleId              # Edit role permissions matrix
├── /business-units           # Business unit management
│   ├── /                     # List BUs
│   ├── /create               # Create BU
│   └── /:buId/users          # Manage BU users
├── /users                    # User management
│   └── /:userId/access       # User permissions & BU assignment
└── /audit-logs               # Audit trail viewer
```

### 7.2 Role Management Page

**Route**: `/admin/roles`

**Features**:
- Table showing all 5 system roles + custom roles
- System roles marked with badge (cannot delete)
- Permission count per role
- User count per role
- Click role → view/edit permission matrix

**Permission Matrix Editor**:

```
┌──────────────────────────────────────────────────────────────┐
│ Role: Commercial (rol_id=3)                        [Save]    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Resource      │ Read │ Create │ Update │ Delete │ Special  │
│  ────────────────────────────────────────────────────────────│
│  Orders        │  ✓   │   ✓    │   ✓    │   ○    │ Approve: ✓ │
│  Quotes        │  ✓   │   ✓    │   ✓    │   ✓    │ Send: ✓    │
│  Invoices      │  ✓   │   ○    │   ○    │   ○    │ Send: ○    │
│  Clients       │  ✓   │   ✓    │   ✓    │   ○    │            │
│  Products      │  ✓   │   ○    │   ○    │   ○    │            │
│  Suppliers     │  ✓   │   ○    │   ○    │   ○    │            │
│  Users         │  ○   │   ○    │   ○    │   ○    │            │
│                                                              │
│  Legend: ✓ = Allowed, ○ = Denied                            │
│                                                              │
│  Inherits from: Manager                                     │
│  Inherited permissions: products.read, suppliers.read       │
└──────────────────────────────────────────────────────────────┘
```

**Implementation**: Query `TR_RIT_Right` for this role, display checkboxes for each permission column.

### 7.3 Business Unit Management

**Route**: `/admin/business-units`

**Features**:
- Card grid of business units with color badges
- Show user count per BU
- Show order/invoice/client count per BU
- Create/edit/deactivate BUs
- Assign users to BUs

### 7.4 User Access Management

**Route**: `/admin/users/:userId/access`

**Features**:
- Show current role
- Show effective permissions (inherited from role)
- Assign/remove business units
- Set primary BU
- Designate as BU manager

### 7.5 Audit Log Viewer

**Route**: `/admin/audit-logs`

**Features**:
- Table with filters: date range, user, resource, action, status
- Export to CSV
- Expandable rows showing JSON details
- Color-coded status (green=success, red=denied, yellow=error)

---

## 8. Implementation Roadmap

### Phase 1: Database Setup (Week 1)
**Goal**: Create new tables and modify existing ones

- [ ] Write migration for `TR_BU_BusinessUnit`
- [ ] Write migration for `TJ_UBU_User_BusinessUnit`
- [ ] Write migration for `TR_SAM_Screen_API_Mapping`
- [ ] Write migration for `TM_AUL_AuditLog`
- [ ] Write migration to add columns to `TR_ROL_Role`
- [ ] Write migration to add `bu_id` to transaction tables
- [ ] Seed `TR_BU_BusinessUnit` with 5 business units
- [ ] Seed `TR_SAM_Screen_API_Mapping` with screen-to-API mappings
- [ ] Update existing 5 roles with hierarchy

**Deliverable**: All tables created, seeded, and verified

### Phase 2: Backend Core (Week 2)
**Goal**: Implement RBAC service and models

- [ ] Create SQLAlchemy models for existing tables (`Screen`, `Right`)
- [ ] Create SQLAlchemy models for new tables (`BusinessUnit`, `UserBusinessUnit`, `AuditLog`)
- [ ] Implement `RBACService` with permission checking
- [ ] Write unit tests for `RBACService`
- [ ] Create permission dependency decorators
- [ ] Create RBAC API router (`/api/v1/rbac`)

**Deliverable**: Working RBAC service with tests

### Phase 3: Backend Integration (Week 3)
**Goal**: Migrate endpoints to use new permissions

- [ ] Replace hardcoded admin checks in `deps.py`
- [ ] Update `/api/v1/orders` to use permissions
- [ ] Update `/api/v1/invoices` to use permissions
- [ ] Update `/api/v1/clients` to use permissions
- [ ] Update `/api/v1/products` to use permissions
- [ ] Add data isolation filters (soc_id + bu_id)
- [ ] Add audit logging to critical endpoints
- [ ] Write integration tests

**Deliverable**: All major endpoints protected by RBAC

### Phase 4: Frontend Core (Week 4)
**Goal**: Build permission infrastructure

- [ ] Create `permissionStore`
- [ ] Create `usePermissions` hook
- [ ] Create `PermissionGuard` component
- [ ] Create `BusinessUnitSelector` component
- [ ] Update auth flow to load permissions
- [ ] Update existing pages to show/hide buttons based on permissions

**Deliverable**: Frontend permission system working

### Phase 5: Admin UI (Week 5)
**Goal**: Build admin interface

- [ ] Build role list page
- [ ] Build permission matrix editor
- [ ] Build business unit list page
- [ ] Build business unit form
- [ ] Build user access management page
- [ ] Build audit log viewer

**Deliverable**: Complete admin interface

### Phase 6: Testing & Polish (Week 6)
**Goal**: Comprehensive testing and documentation

- [ ] E2E tests for admin workflow
- [ ] E2E tests for permission enforcement
- [ ] Performance testing
- [ ] Security review
- [ ] User documentation
- [ ] API documentation
- [ ] Deployment to staging

**Deliverable**: Production-ready RBAC system

---

## 9. Testing Strategy

### 9.1 Unit Tests

**Backend** (`pytest`):

```python
# tests/test_rbac_service.py

def test_super_admin_has_all_permissions(db_session):
    user = User(usr_super_right=True, rol_id=1)
    rbac = RBACService(db_session)
    assert rbac.has_permission(user, 'orders', 'create') == True
    assert rbac.has_permission(user, 'invoices', 'delete') == True


def test_role_permission_from_database(db_session):
    # Create test right: Commercial can read orders
    right = Right(rol_id=3, scr_id=12, rit_read=True, rit_create=False)
    db_session.add(right)
    db_session.commit()

    user = User(rol_id=3, usr_super_right=False)
    rbac = RBACService(db_session)

    assert rbac.has_permission(user, 'orders', 'read') == True
    assert rbac.has_permission(user, 'orders', 'create') == False


def test_business_unit_access(db_session):
    user = User(usr_id=1, rol_id=3)
    assignment = UserBusinessUnit(usr_id=1, bu_id=1)
    db_session.add(assignment)
    db_session.commit()

    rbac = RBACService(db_session)
    assert rbac.can_access_business_unit(user, 1) == True
    assert rbac.can_access_business_unit(user, 2) == False
```

**Frontend** (`vitest`):

```typescript
// src/stores/__tests__/permissionStore.test.ts

import { renderHook, act } from '@testing-library/react';
import { usePermissionStore } from '../permissionStore';

test('can check permission', () => {
  const { result } = renderHook(() => usePermissionStore());

  act(() => {
    result.current.setPermissions({
      orders: { read: true, create: false }
    });
  });

  expect(result.current.can('orders', 'read')).toBe(true);
  expect(result.current.can('orders', 'create')).toBe(false);
});
```

### 9.2 Integration Tests

```python
# tests/test_api_permissions.py

def test_order_list_requires_permission(client, auth_token):
    # User without permission
    response = client.get("/api/v1/orders", headers={"Authorization": f"Bearer {auth_token}"})
    assert response.status_code == 403


def test_order_list_with_permission(client, admin_token):
    # Admin with permission
    response = client.get("/api/v1/orders", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200


def test_data_isolation_by_tenant(client, user1_token, user2_token):
    # User 1 (soc_id=1) creates order
    order = client.post("/api/v1/orders", json={...}, headers={"Authorization": f"Bearer {user1_token}"})
    order_id = order.json()["cod_id"]

    # User 2 (soc_id=2) cannot see it
    response = client.get(f"/api/v1/orders/{order_id}", headers={"Authorization": f"Bearer {user2_token}"})
    assert response.status_code == 404
```

### 9.3 E2E Tests

Using Playwright:

```typescript
// e2e/rbac.spec.ts

test('Admin can create role and assign permissions', async ({ page }) => {
  await page.goto('/admin/roles');

  // Click create role
  await page.click('text=Create Role');
  await page.fill('input[name="rol_name"]', 'Sales Director');

  // Check permissions
  await page.check('input[name="orders.read"]');
  await page.check('input[name="orders.create"]');

  // Save
  await page.click('button:text("Save")');

  // Verify role appears
  await expect(page.locator('text=Sales Director')).toBeVisible();
});


test('User without permission cannot access protected page', async ({ page }) => {
  // Login as commercial user
  await page.goto('/login');
  await page.fill('input[name="username"]', 'commercial');
  await page.fill('input[name="password"]', 'password');
  await page.click('button:text("Login")');

  // Try to access admin page
  await page.goto('/admin/users');

  // Should redirect to unauthorized
  await expect(page).toHaveURL('/unauthorized');
});
```

---

## 10. Task Breakdown

### 10.1 Database Tasks

| ID | Task | Hours | Priority |
|----|------|-------|----------|
| DB1 | Create `TR_BU_BusinessUnit` table migration | 2 | HIGH |
| DB2 | Create `TJ_UBU_User_BusinessUnit` table migration | 2 | HIGH |
| DB3 | Create `TR_SAM_Screen_API_Mapping` table migration | 2 | HIGH |
| DB4 | Create `TM_AUL_AuditLog` table migration | 2 | MEDIUM |
| DB5 | Add columns to `TR_ROL_Role` migration | 2 | HIGH |
| DB6 | Add `bu_id` to transaction tables migration | 3 | HIGH |
| DB7 | Seed business units | 1 | HIGH |
| DB8 | Seed screen-API mappings | 2 | HIGH |
| DB9 | Update existing roles with hierarchy | 1 | MEDIUM |
| DB10 | Write rollback scripts | 2 | MEDIUM |

**Subtotal: 19 hours**

### 10.2 Backend Tasks

| ID | Task | Hours | Priority |
|----|------|-------|----------|
| BE1 | Create `Screen` model | 1 | HIGH |
| BE2 | Create `Right` model | 2 | HIGH |
| BE3 | Create `ScreenApiMapping` model | 1 | HIGH |
| BE4 | Update `Role` model | 2 | HIGH |
| BE5 | Create `BusinessUnit` model | 2 | HIGH |
| BE6 | Create `UserBusinessUnit` model | 2 | HIGH |
| BE7 | Create `AuditLog` model | 1 | MEDIUM |
| BE8 | Implement `RBACService.has_permission()` | 4 | HIGH |
| BE9 | Implement `RBACService.get_user_permissions()` | 3 | HIGH |
| BE10 | Implement `RBACService.get_user_business_units()` | 2 | MEDIUM |
| BE11 | Implement `RBACService.log_access()` | 2 | MEDIUM |
| BE12 | Create `PermissionChecker` dependency | 3 | HIGH |
| BE13 | Create RBAC API router | 4 | MEDIUM |
| BE14 | Update `/api/v1/orders` endpoints | 3 | HIGH |
| BE15 | Update `/api/v1/invoices` endpoints | 3 | HIGH |
| BE16 | Update `/api/v1/clients` endpoints | 2 | MEDIUM |
| BE17 | Update `/api/v1/products` endpoints | 2 | MEDIUM |
| BE18 | Update remaining endpoints | 6 | MEDIUM |
| BE19 | Write unit tests for `RBACService` | 6 | HIGH |
| BE20 | Write integration tests | 6 | HIGH |

**Subtotal: 57 hours**

### 10.3 Frontend Tasks

| ID | Task | Hours | Priority |
|----|------|-------|----------|
| FE1 | Create `permissionStore` | 3 | HIGH |
| FE2 | Create `usePermissions` hook | 2 | HIGH |
| FE3 | Create `PermissionGuard` component | 2 | HIGH |
| FE4 | Create `BusinessUnitSelector` component | 2 | MEDIUM |
| FE5 | Update auth flow to load permissions | 3 | HIGH |
| FE6 | Build role list page | 4 | MEDIUM |
| FE7 | Build permission matrix editor | 8 | MEDIUM |
| FE8 | Build business unit list page | 3 | MEDIUM |
| FE9 | Build business unit form | 3 | MEDIUM |
| FE10 | Build user access management page | 5 | MEDIUM |
| FE11 | Build audit log viewer | 4 | LOW |
| FE12 | Update orders page with permission guards | 2 | HIGH |
| FE13 | Update invoices page with permission guards | 2 | HIGH |
| FE14 | Update remaining pages | 4 | MEDIUM |
| FE15 | Write component tests | 5 | HIGH |
| FE16 | Write E2E tests | 6 | HIGH |

**Subtotal: 58 hours**

### 10.4 Total Estimate

| Category | Hours |
|----------|-------|
| Database | 19 |
| Backend | 57 |
| Frontend | 58 |
| Documentation | 8 |
| Testing & QA | 12 |
| Buffer (20%) | 31 |
| **TOTAL** | **185 hours** |

**Estimated Timeline**: 5-6 weeks (1 developer) or 3-4 weeks (2 developers)

---

## Appendix A: Screen-to-API Mapping Reference

| scr_id | Screen Name | API Resource | API Endpoint |
|--------|-------------|--------------|--------------|
| 1 | ImportData | admin | /api/v1/admin/import |
| 2 | EnterpriseSetting | admin | /api/v1/admin/settings |
| 7 | Client | clients | /api/v1/clients |
| 9 | SearchClient | clients | /api/v1/clients |
| 10 | ClientInvoice | invoices | /api/v1/invoices |
| 11 | SearchClientInvoice | invoices | /api/v1/invoices |
| 12 | ClientOrder | orders | /api/v1/orders |
| 14 | SearchClientOrder | orders | /api/v1/orders |
| 17 | CostPlan | quotes | /api/v1/cost-plans |
| 20 | SearchCostPlan | quotes | /api/v1/cost-plans |
| 21 | DeliveryForm | deliveries | /api/v1/deliveries |
| 22 | SearchDeliveryForm | deliveries | /api/v1/deliveries |
| 23 | Logistics | logistics | /api/v1/logistics |
| 26 | Product | products | /api/v1/products |
| 30 | SearchProduct | products | /api/v1/products |
| 32 | Project | projects | /api/v1/projects |
| 36 | SearchProject | projects | /api/v1/projects |
| 39 | SearchSupplier | suppliers | /api/v1/suppliers |
| 40 | Supplier | suppliers | /api/v1/suppliers |
| 44 | SupplierInvoice | supplier-invoices | /api/v1/supplier-invoices |
| 46 | SupplierOrder | supplier-orders | /api/v1/supplier-orders |
| 47 | Users | users | /api/v1/users |
| 48 | ProductInventory | inventory | /api/v1/inventory |
| 51 | Warehouse | warehouse | /api/v1/warehouse |

---

## Appendix B: Quick Start Commands

### Database Migrations

```bash
# Run migrations
cd backend
alembic revision -m "Add RBAC tables"
alembic upgrade head

# Seed data
python scripts/seed_rbac.py
```

### Run Tests

```bash
# Backend tests
cd backend
pytest tests/test_rbac_service.py -v
pytest tests/test_api_permissions.py -v

# Frontend tests
cd frontend
npm test -- permissionStore.test.ts
npm run test:e2e
```

### Start Development

```bash
# Backend
cd backend
uvicorn app.main:app --reload

# Frontend
cd frontend
npm run dev
```

---

## Appendix C: Migration Checklist

### Pre-Migration
- [ ] Backup database
- [ ] Review all migration scripts
- [ ] Test migrations in dev environment
- [ ] Verify existing 348 permission records are intact

### During Migration
- [ ] Run migrations in order
- [ ] Verify new tables created
- [ ] Verify new columns added
- [ ] Run seed scripts
- [ ] Test permission queries

### Post-Migration
- [ ] Verify existing users still have access
- [ ] Test role-based permission checks
- [ ] Test business unit assignments
- [ ] Monitor audit logs
- [ ] Update API documentation

### Rollback Plan
- [ ] Keep rollback scripts ready
- [ ] Document rollback procedure
- [ ] Test rollback in dev environment

---

**END OF PLAN**

*Version 2.0.0 - Clean, consistent, and ready for implementation*
