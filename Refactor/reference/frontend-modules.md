# Frontend Modules Reference

> **Source**: Extracted from `frontend/DOCUMENTATION/01-FRONTEND-SCREENS.md`
> **Note**: The existing React frontend already has foundation components. This documents all modules to build.

---

## Completed (Existing Frontend)

- [x] Vite + React + TypeScript scaffold
- [x] TanStack Router with file-based routing
- [x] TanStack Query for data fetching
- [x] Zustand auth store with dev bypass
- [x] i18n setup (EN, FR, ZH)
- [x] Axios API client with interceptors
- [x] Elegant UI design system
- [x] Login page with dev mode
- [x] Dashboard with stats, activity feed
- [x] Collapsible sidebar navigation
- [x] Mock API layer for development
- [x] Reusable UI components (DataTable, Form, etc.)
- [x] Clients CRUD module (complete template)
- [x] Dark mode toggle

---

## Module 1: Products (Priority: HIGH)

### Files to Create
```
src/
├── types/product.ts
├── api/products.ts
├── hooks/useProducts.ts
├── components/features/products/
│   ├── ProductForm.tsx
│   ├── ProductCard.tsx
│   └── ProductInstancesTable.tsx
└── routes/_authenticated/products/
    ├── index.tsx
    └── $productId.tsx
```

### Form Fields
| Field | Type | Required |
|-------|------|----------|
| Reference | Auto-generated | Yes |
| Name | Text | Yes |
| Description | Textarea | No |
| Category | Dropdown | No |
| Brand | Dropdown | No |
| Unit of Measure | Dropdown | No |
| Purchase Price | Currency | No |
| Sale Price | Currency | No |
| VAT Rate | Dropdown | No |
| Weight | Number (kg) | No |
| Length/Width/Height | Number (cm) | No |
| Is Active | Toggle | Yes |

### Database Reference
```
TM_PRD_Product: id, reference, name, description, categoryId, brandId,
unitOfMeasureId, purchasePrice, salePrice, vatRateId,
weight, length, width, height, isActive, createdAt, updatedAt
```

---

## Module 2: Suppliers (Priority: HIGH)

### Files to Create
```
src/
├── types/supplier.ts
├── api/suppliers.ts
├── hooks/useSuppliers.ts
├── components/features/suppliers/
│   ├── SupplierForm.tsx
│   └── SupplierCard.tsx
└── routes/_authenticated/suppliers/
    ├── index.tsx
    └── $supplierId.tsx
```

### Form Fields
| Field | Type | Required |
|-------|------|----------|
| Company Name | Text | Yes |
| Contact First Name | Text | No |
| Contact Last Name | Text | No |
| Email | Email | No |
| Phone | Phone | No |
| Mobile | Phone | No |
| Address | Text | No |
| Address 2 | Text | No |
| Postal Code | Text | No |
| City | Text | No |
| Country | Dropdown | No |
| VAT Number | Text | No |
| SIRET | Text | No |
| Website | URL | No |
| Currency | Dropdown | No |
| Payment Terms | Dropdown | No |
| Notes | Textarea | No |

### Database Reference
```
TM_SUP_Supplier: id, reference, companyName, contactFirstName, contactLastName,
email, phone, mobile, address, address2, postalCode, city,
countryId, vatNumber, siret, paymentTermId, currencyId, notes, isActive
```

---

## Module 3: Quotes/Cost Plans (Priority: HIGH)

### Files to Create
```
src/
├── types/quote.ts
├── api/quotes.ts
├── hooks/useQuotes.ts
├── components/features/quotes/
│   ├── QuoteForm.tsx
│   ├── QuoteLinesTable.tsx
│   └── QuoteStatusBadge.tsx
└── routes/_authenticated/quotes/
    ├── index.tsx
    └── $quoteId.tsx
```

### Header Fields
| Field | Type | Required |
|-------|------|----------|
| Reference | Auto-generated | Yes |
| Client | Searchable Dropdown | Yes |
| Quote Date | Date | Yes |
| Valid Until | Date | No (default +30 days) |
| Status | Dropdown | Yes |
| Currency | Dropdown | Yes |
| Discount % | Number | No |
| Notes | Textarea | No |
| Internal Notes | Textarea | No |

### Line Item Fields
| Field | Type |
|-------|------|
| Product | Searchable Dropdown |
| Description | Text |
| Quantity | Number |
| Unit Price | Currency |
| Discount % | Number |
| VAT Rate | Dropdown |
| Line Total | Calculated |

### Actions
- **Generate PDF** - Create PDF for download/email
- **Send by Email** - Send to client email
- **Convert to Order** - Create order from accepted quote

### Database Reference
```
TM_CP_CostPlan: id, reference, clientId, date, validUntil, statusId, currencyId, 
subTotal, totalVat, totalAmount, discount, notes
TM_CP_CostPlanLine: id, costPlanId, productId, description, quantity, unitPrice, 
discount, vatRateId, vatAmount, lineTotal
```

---

## Module 4: Orders (Priority: HIGH)

### Files to Create
```
src/
├── types/order.ts
├── api/orders.ts
├── hooks/useOrders.ts
├── components/features/orders/
│   ├── OrderForm.tsx
│   ├── OrderLinesTable.tsx
│   └── OrderStatusBadge.tsx
└── routes/_authenticated/orders/
    ├── index.tsx
    └── $orderId.tsx
```

### Header Fields
| Field | Type | Required |
|-------|------|----------|
| Reference | Auto-generated | Yes |
| Client | Searchable Dropdown | Yes |
| Linked Quote | Read-only | No |
| Order Date | Date | Yes |
| Required Date | Date | No |
| Status | Dropdown | Yes |
| Payment Status | Badge | Read-only |
| Currency | Dropdown | Yes |
| Shipping Address | Address Form | No |
| Notes | Textarea | No |

### Line Item Fields
Same as Quote lines, plus:
| Field | Type |
|-------|------|
| Delivered Qty | Read-only |

### Actions
- **Confirm Order** - Reserve stock
- **Create Delivery** - Partial or full delivery
- **Create Invoice** - Generate invoice
- **Cancel Order** - Release stock

### Database Reference
```
TM_ORD_ClientOrder: id, reference, clientId, costPlanId, orderDate, requiredDate,
statusId, paymentStatusId, currencyId, shippingAddress, subTotal, totalAmount, paidAmount
TM_ORD_ClientOrderLine: id, orderId, productId, description, quantity, deliveredQuantity,
unitPrice, discount, vatRateId, lineTotal
```

---

## Module 5: Invoices (Priority: HIGH)

### Files to Create
```
src/
├── types/invoice.ts
├── api/invoices.ts
├── hooks/useInvoices.ts
├── components/features/invoices/
│   ├── InvoiceForm.tsx
│   ├── InvoiceLinesTable.tsx
│   └── InvoiceStatusBadge.tsx
└── routes/_authenticated/invoices/
    ├── index.tsx
    └── $invoiceId.tsx
```

### Header Fields
| Field | Type | Required |
|-------|------|----------|
| Reference | Auto-generated (INV-YYYY-XXXX) | Yes |
| Client | Searchable Dropdown | Yes |
| Linked Order | Read-only | No |
| Invoice Date | Date | Yes |
| Due Date | Date | Yes |
| Status | Badge | Read-only |
| Currency | Dropdown | Yes |
| Billing Address | Address Form | No |
| Payment Reference | Text | No |
| Notes | Textarea | No |

### Actions
- **Generate PDF** - Create PDF
- **Download PDF** - Download generated PDF
- **Send by Email** - Send to client
- **Mark as Paid** - Record payment
- **Send E-Invoice** - SuperPDP (Prompt 3)

### Database Reference
```
TM_INV_ClientInvoice: id, reference, clientId, orderId, invoiceDate, dueDate,
statusId, currencyId, billingAddress, subTotal, totalAmount, paidAmount, paidAt
```

---

## Module 6: Deliveries (Priority: MEDIUM)

### Files to Create
```
src/
├── types/delivery.ts
├── api/deliveries.ts
├── hooks/useDeliveries.ts
├── components/features/deliveries/
│   ├── DeliveryForm.tsx
│   └── DeliveryLinesTable.tsx
└── routes/_authenticated/deliveries/
    ├── index.tsx
    └── $deliveryId.tsx
```

### Header Fields
| Field | Type |
|-------|------|
| Reference | Auto-generated |
| Order | Link |
| Client | Read-only |
| Delivery Date | Date |
| Status | Dropdown |
| Carrier | Dropdown |
| Tracking Number | Text |
| Shipping Address | Address |
| Weight (total) | Number |
| Packages | Number |

### Actions
- **Mark as Shipped** - Enter tracking number
- **Mark as Delivered** - Enter signature

### Database Reference
```
TM_DEL_DeliveryForm: id, reference, orderId, clientId, deliveryDate, statusId,
carrierId, trackingNumber, shippingAddress, weight, packages, shippedAt, deliveredAt
```

---

## Module 7: Warehouse/Inventory (Priority: MEDIUM)

### Files to Create
```
src/
├── types/inventory.ts
├── api/warehouse.ts
├── hooks/useWarehouse.ts
├── components/features/warehouse/
│   ├── InventoryTable.tsx
│   ├── StockMovementForm.tsx
│   └── StockAlertBadge.tsx
└── routes/_authenticated/warehouse/
    └── index.tsx
```

### Views
1. **Stock Levels** - Product stock by warehouse
2. **Low Stock Alerts** - Products below MinStockLevel
3. **Movement History** - IN/OUT/TRANSFER/ADJUSTMENT logs

### Actions
- **Stock Adjustment** - Manual adjustment with reason
- **Stock Transfer** - Between warehouses

### Database Reference
```
TM_STK_Stock: id, productId, warehouseId, quantity, reservedQuantity, availableQuantity
TM_STK_StockMovement: id, productId, warehouseId, movementType, quantity, referenceType, referenceId
```

---

## Module 8: Logistics (Priority: MEDIUM)

### Files to Create
```
src/
├── types/logistics.ts
├── api/logistics.ts
├── hooks/useLogistics.ts
├── components/features/logistics/
│   ├── ShipmentCard.tsx
│   └── ShipmentTimeline.tsx
└── routes/_authenticated/logistics/
    └── index.tsx
```

### Features
- Active shipments list
- Shipment status timeline
- Carrier performance metrics
- Tracking URL integration

### Database Reference
```
TM_LOG_Shipment: id, reference, deliveryFormId, carrierId, trackingNumber,
statusId, estimatedDelivery, actualDelivery, cost
```

---

## Module 9: Projects (Priority: LOW)

### Files to Create
```
src/
├── types/project.ts
├── api/projects.ts
├── hooks/useProjects.ts
├── components/features/projects/
│   ├── ProjectForm.tsx
│   ├── ProjectCard.tsx
│   └── ProjectTimeline.tsx
└── routes/_authenticated/projects/
    ├── index.tsx
    └── $projectId.tsx
```

### Header Fields
| Field | Type |
|-------|------|
| Reference | Auto-generated |
| Name | Text |
| Client | Dropdown |
| Description | Textarea |
| Status | Dropdown |
| Start Date | Date |
| End Date | Date |
| Budget | Currency |
| Manager | Dropdown |

### Features
- Project phases/milestones
- Completion percentage tracking
- Linked orders view

### Database Reference
```
TM_PRJ_Project: id, reference, name, clientId, statusId, startDate, endDate, budget
TM_PRJ_ProjectPhase: id, projectId, name, statusId, completionPercent
```

---

## Module 10: Users & Settings (Priority: LOW)

### Files to Create
```
src/
├── types/user.ts
├── api/users.ts
├── hooks/useUsers.ts
├── components/features/users/
│   ├── UserForm.tsx
│   └── UserRoleBadge.tsx
├── components/features/settings/
│   ├── CompanySettings.tsx
│   └── ProfileSettings.tsx
└── routes/_authenticated/
    ├── users/
    │   ├── index.tsx
    │   └── $userId.tsx
    └── settings/
        └── index.tsx
```

### User Management (Admin only)
- Create/edit users
- Role assignment
- Business Unit assignment
- Activate/deactivate

### Settings
- Company information
- User profile
- Language preference
- Notification preferences

---

## Sidebar Navigation Structure

```
Dashboard
─────────────
CRM
  ├── Clients ✅
  └── Suppliers
─────────────
Catalog
  └── Products
─────────────
Sales
  ├── Quotes
  ├── Orders
  └── Invoices
─────────────
Operations
  ├── Deliveries
  ├── Warehouse
  └── Logistics
─────────────
Projects
─────────────
Admin
  ├── Users
  └── Settings
```

---

## Shared Components to Build

| Component | Purpose |
|-----------|---------|
| `SearchableSelect.tsx` | Client/product dropdown with async search |
| `DateRangePicker.tsx` | Report date filters |
| `CurrencyInput.tsx` | Formatted currency input |
| `AddressForm.tsx` | Reusable address fields |
| `FileUpload.tsx` | Document attachments |
| `PDFViewer.tsx` | Invoice/quote preview |
| `ExportButton.tsx` | CSV/Excel export |
| `StatusBadge.tsx` | Colored status indicator |

---

## Testing Checklist (Per Module)

- [ ] List page loads with data
- [ ] Search filters results
- [ ] Pagination works
- [ ] Create form opens and validates
- [ ] Create saves new record
- [ ] Edit form loads existing data
- [ ] Edit saves changes
- [ ] Delete shows confirmation
- [ ] Delete removes record
- [ ] Export to CSV works
- [ ] Mobile responsive
- [ ] Dark mode correct
