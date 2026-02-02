# Business Logic Reference

> **Source**: Extracted from `frontend/DOCUMENTATION/04-BUSINESS-LOGIC.md`
> **Critical**: All business rules MUST be preserved in FastAPI services.

---

## Service Architecture

```
API Router → Service → Repository (SQLAlchemy) → SQL Server
                ↓
            Pydantic Schema (DTO)
```

---

## Reference Generation Patterns

All entities use auto-generated references. **MUST implement these patterns exactly.**

### Client Reference
```python
def generate_client_reference() -> str:
    """Generate CLI-0001, CLI-0002, etc."""
    last_ref = db.query(Client).order_by(Client.id.desc()).first()
    if last_ref:
        last_num = int(last_ref.reference.split('-')[1])
        return f"CLI-{(last_num + 1):04d}"
    return "CLI-0001"
```

### Supplier Reference
```python
def generate_supplier_reference() -> str:
    """Generate SUP-0001, SUP-0002, etc."""
    # Same pattern as client
    return f"SUP-{next_num:04d}"
```

### Product Reference
```python
def generate_product_reference() -> str:
    """Generate PRD-0001 or use custom SKU"""
    return f"PRD-{next_num:04d}"
```

### Quote Reference
```python
def generate_quote_reference() -> str:
    """Generate QUO-0001, QUO-0002, etc."""
    return f"QUO-{next_num:04d}"
```

### Order Reference
```python
def generate_order_reference() -> str:
    """Generate ORD-0001, ORD-0002, etc."""
    return f"ORD-{next_num:04d}"
```

### Invoice Reference (Year-Based)
```python
def generate_invoice_reference(society_id: int, year: int) -> str:
    """Generate INV-2024-0001, INV-2024-0002, etc. (resets each year)"""
    prefix = f"INV-{year}"
    last = db.query(ClientInvoice).filter(
        ClientInvoice.reference.like(f"{prefix}%"),
        ClientInvoice.society_id == society_id
    ).order_by(ClientInvoice.id.desc()).first()
    
    next_num = 1
    if last:
        num_part = last.reference.split('-')[-1]
        next_num = int(num_part) + 1
    
    return f"{prefix}-{next_num:04d}"
```

### Delivery Reference
```python
def generate_delivery_reference() -> str:
    """Generate DEL-0001, DEL-0002, etc."""
    return f"DEL-{next_num:04d}"
```

### Project Reference
```python
def generate_project_reference() -> str:
    """Generate PRJ-0001, PRJ-0002, etc."""
    return f"PRJ-{next_num:04d}"
```

---

## Price Calculation

### Sale Price with Client Discount
```python
def calculate_sale_price(product_id: int, client_id: int) -> Decimal:
    """Apply client-specific and client-type discounts"""
    product = get_product(product_id)
    client = get_client(client_id)
    
    base_price = product.sale_price
    
    # Apply client-specific discount
    if client.discount and client.discount > 0:
        base_price = base_price * (1 - client.discount / 100)
    
    # Apply client type discount (if any)
    type_discount = get_client_type_discount(client.client_type_id)
    if type_discount > 0:
        base_price = base_price * (1 - type_discount / 100)
    
    return round(base_price, 2)
```

---

## Document Total Calculations

### Quote/Order/Invoice Total Calculation
```python
def recalculate_totals(document_id: int, document_type: str) -> None:
    """Recalculate totals for quote, order, or invoice"""
    document = get_document(document_id, document_type)
    lines = get_document_lines(document_id, document_type)
    
    sub_total = Decimal('0')
    total_vat = Decimal('0')
    
    for line in lines:
        # Line subtotal (before VAT)
        line_sub_total = line.quantity * line.unit_price
        
        # Apply line discount
        if line.discount and line.discount > 0:
            line_sub_total = line_sub_total * (1 - line.discount / 100)
        
        # Calculate VAT
        vat_rate = get_vat_rate(line.vat_rate_id)
        line_vat = line_sub_total * (vat_rate.rate / 100)
        
        # Update line
        line.vat_amount = round(line_vat, 2)
        line.line_total = round(line_sub_total + line_vat, 2)
        
        sub_total += line_sub_total
        total_vat += line_vat
    
    # Apply document-level discount
    if document.discount and document.discount > 0:
        discount_amount = sub_total * (document.discount / 100)
        sub_total -= discount_amount
        # Recalculate VAT after discount
        total_vat = sub_total * get_average_vat_rate(lines)
    
    document.sub_total = round(sub_total, 2)
    document.total_vat = round(total_vat, 2)
    document.total_amount = round(sub_total + total_vat, 2)
```

---

## Status Workflows

### Quote Status Flow
```
Draft → Sent → Accepted | Rejected | Expired
```
- **Draft**: Can edit
- **Sent**: Read-only, waiting for response
- **Accepted**: Read-only, can convert to Order
- **Rejected**: Read-only, archived
- **Expired**: Auto-set when ValidUntil passes

### Order Status Flow
```
Draft → Confirmed → InProgress → Delivered
                 ↘ Cancelled
```
- **Draft**: Can edit
- **Confirmed**: Stock reserved, cannot edit lines
- **InProgress**: Deliveries created
- **Delivered**: All lines fully delivered
- **Cancelled**: Stock released

### Invoice Status Flow
```
Draft → Sent → Paid | Overdue | Cancelled
              ↘ PartiallyPaid → Paid
```
- **Draft**: Can edit
- **Sent**: Waiting for payment
- **Paid**: Fully paid (PaidAmount >= TotalAmount)
- **Overdue**: Auto-set when DueDate passes
- **PartiallyPaid**: 0 < PaidAmount < TotalAmount

### Delivery Status Flow
```
Pending → Shipped → Delivered
```

### Payment Status (for Orders)
```
Unpaid → PartiallyPaid → Paid
```

---

## Stock Management

### Stock Reservation (on Order Confirmation)
```python
def reserve_stock(order_id: int) -> None:
    """Reserve stock when order is confirmed"""
    lines = get_order_lines(order_id)
    
    for line in lines:
        if line.product_id:
            stock = get_stock(line.product_id, DEFAULT_WAREHOUSE_ID)
            
            if stock.available_quantity < line.quantity:
                raise InsufficientStockError(
                    f"Insufficient stock for {line.description}"
                )
            
            stock.reserved_quantity += line.quantity
            save(stock)
```

### Stock Release (on Order Cancellation)
```python
def release_stock(order_id: int) -> None:
    """Release reserved stock when order is cancelled"""
    lines = get_order_lines(order_id)
    
    for line in lines:
        if line.product_id:
            stock = get_stock(line.product_id, DEFAULT_WAREHOUSE_ID)
            stock.reserved_quantity -= line.quantity
            save(stock)
```

### Stock Deduction (on Delivery Shipped)
```python
def deduct_stock(delivery_id: int) -> None:
    """Deduct stock when delivery is shipped"""
    lines = get_delivery_lines(delivery_id)
    
    for line in lines:
        if line.product_id:
            record_movement(
                product_id=line.product_id,
                warehouse_id=DEFAULT_WAREHOUSE_ID,
                quantity=-line.quantity,  # Negative = OUT
                movement_type='OUT',
                reference_type='Delivery',
                reference_id=delivery_id
            )
```

### Stock Movement Recording
```python
def record_movement(
    product_id: int,
    warehouse_id: int,
    quantity: Decimal,  # Positive = IN, Negative = OUT
    movement_type: str,  # IN, OUT, TRANSFER, ADJUSTMENT
    reference_type: str,
    reference_id: int,
    notes: str = None
) -> None:
    """Record stock movement and update stock level"""
    movement = StockMovement(
        product_id=product_id,
        warehouse_id=warehouse_id,
        quantity=quantity,
        movement_type=movement_type,
        reference_type=reference_type,
        reference_id=reference_id,
        notes=notes,
        created_by=current_user.id
    )
    save(movement)
    
    # Update stock level
    stock = get_or_create_stock(product_id, warehouse_id)
    stock.quantity += quantity
    stock.last_updated = datetime.now()
    save(stock)
```

---

## Document Conversions

### Quote to Order
```python
def convert_quote_to_order(quote_id: int) -> ClientOrder:
    """Convert accepted quote to order"""
    quote = get_quote(quote_id)
    
    if quote.status_id != STATUS_ACCEPTED:
        raise InvalidStatusError("Only accepted quotes can be converted")
    
    order = ClientOrder(
        reference=generate_order_reference(),
        client_id=quote.client_id,
        cost_plan_id=quote.id,  # Link to quote
        order_date=datetime.now(),
        status_id=STATUS_DRAFT,
        currency_id=quote.currency_id,
        sub_total=quote.sub_total,
        total_vat=quote.total_vat,
        total_amount=quote.total_amount,
        discount=quote.discount,
        notes=quote.notes,
        business_unit_id=quote.business_unit_id,
        society_id=quote.society_id,
        created_by=current_user.id
    )
    save(order)
    
    # Copy lines
    for quote_line in get_quote_lines(quote_id):
        order_line = ClientOrderLine(
            order_id=order.id,
            line_number=quote_line.line_number,
            product_id=quote_line.product_id,
            description=quote_line.description,
            quantity=quote_line.quantity,
            unit_price=quote_line.unit_price,
            discount=quote_line.discount,
            vat_rate_id=quote_line.vat_rate_id,
            vat_amount=quote_line.vat_amount,
            line_total=quote_line.line_total,
            sort_order=quote_line.sort_order
        )
        save(order_line)
    
    return order
```

### Order to Invoice
```python
def create_invoice_from_order(order_id: int) -> ClientInvoice:
    """Create invoice from order"""
    order = get_order(order_id)
    client = get_client(order.client_id)
    
    # Calculate due date from payment terms
    payment_term = get_payment_term(client.payment_term_id)
    due_date = datetime.now() + timedelta(days=payment_term.days)
    
    invoice = ClientInvoice(
        reference=generate_invoice_reference(order.society_id, datetime.now().year),
        client_id=order.client_id,
        order_id=order.id,
        invoice_date=datetime.now(),
        due_date=due_date,
        status_id=STATUS_DRAFT,
        currency_id=order.currency_id,
        billing_address=client.address,
        billing_city=client.city,
        billing_postal_code=client.postal_code,
        billing_country_id=client.country_id,
        sub_total=order.sub_total,
        total_vat=order.total_vat,
        total_amount=order.total_amount,
        discount=order.discount,
        notes=order.notes,
        business_unit_id=order.business_unit_id,
        society_id=order.society_id,
        created_by=current_user.id
    )
    save(invoice)
    
    # Copy lines
    for order_line in get_order_lines(order_id):
        invoice_line = ClientInvoiceLine(
            invoice_id=invoice.id,
            line_number=order_line.line_number,
            product_id=order_line.product_id,
            description=order_line.description,
            quantity=order_line.quantity,
            unit_price=order_line.unit_price,
            discount=order_line.discount,
            vat_rate_id=order_line.vat_rate_id,
            vat_amount=order_line.vat_amount,
            line_total=order_line.line_total,
            sort_order=order_line.sort_order
        )
        save(invoice_line)
    
    return invoice
```

### Partial Delivery Tracking
```python
def update_order_delivered_quantity(delivery_id: int) -> None:
    """Update order line delivered quantities after delivery"""
    delivery = get_delivery(delivery_id)
    delivery_lines = get_delivery_lines(delivery_id)
    
    for d_line in delivery_lines:
        order_line = get_order_line(d_line.order_line_id)
        order_line.delivered_quantity += d_line.quantity
        save(order_line)
    
    # Check if order is fully delivered
    order = get_order(delivery.order_id)
    order_lines = get_order_lines(order.id)
    
    fully_delivered = all(
        line.delivered_quantity >= line.quantity
        for line in order_lines
    )
    
    if fully_delivered:
        order.status_id = STATUS_DELIVERED
        save(order)
```

---

## Validation Rules

### Client Validation
| Field | Rule |
|-------|------|
| CompanyName | Required, max 200 chars |
| Email | Valid format, optionally unique |
| Phone/Mobile | Valid format |
| VatNumber | Country-specific format |
| CreditLimit | >= 0 |
| Discount | 0-100 |

### Product Validation
| Field | Rule |
|-------|------|
| Reference | Required, unique, max 50 chars |
| Name | Required, max 200 chars |
| SalePrice | >= 0 |
| PurchasePrice | >= 0 |
| Weight/Dimensions | >= 0 |

### Order Validation
| Field | Rule |
|-------|------|
| ClientId | Required, must exist |
| OrderDate | Required |
| Lines | At least one required |
| Line.Quantity | > 0 |
| Stock | Check availability on confirmation |
| CreditLimit | Check on confirmation |

### Invoice Validation
| Field | Rule |
|-------|------|
| ClientId | Required |
| InvoiceDate | Required |
| DueDate | >= InvoiceDate |
| Lines | At least one required |

---

## Business Rules Summary

### Clients
- Reference auto-generated `CLI-XXXX`
- Email uniqueness check (optional)
- Cannot delete client with active orders
- Credit limit validation against outstanding invoices
- Discount percentage 0-100

### Client Contacts
- Only one contact can be primary per client
- Setting new primary unsets previous
- Cascade delete when client deleted

### Suppliers
- Reference auto-generated `SUP-XXXX`
- Cannot delete supplier with product links
- VAT number format validation per country

### Products
- Reference/SKU must be unique
- Sale price >= purchase price (warning only)
- Serial-tracked products need instances
- Stock check before adding to orders
- Category hierarchy max 3 levels

### Quotes
- Reference auto-generated `QUO-XXXX`
- ValidUntil defaults to Date + 30 days
- Lines required before sending
- Cannot modify after Accepted/Rejected
- Convert to Order copies all lines

### Orders
- Reference auto-generated `ORD-XXXX`
- Stock reservation on confirmation
- Cannot modify after Delivered
- Partial deliveries allowed
- Payment tracking (Unpaid → PartiallyPaid → Paid)
- Credit limit check on confirmation

### Invoices
- Reference format `INV-YYYY-XXXX` (year-based)
- DueDate = InvoiceDate + PaymentTermDays
- Cannot modify after Paid
- Auto-mark as Overdue when DueDate passes

### Deliveries
- Reference auto-generated `DEL-XXXX`
- Delivery qty <= Order qty - Already delivered
- Stock deduction on Shipped
- Mark order Delivered when fully delivered

### Stock
- Cannot go negative
- All movements logged
- Low stock = Available < MinStockLevel
- Valuation uses Purchase Price (FIFO)

---

## Error Handling

### Exception Types
```python
class BusinessError(Exception):
    """Base business logic exception"""
    pass

class ValidationError(BusinessError):
    """Input validation failed"""
    pass

class InsufficientStockError(BusinessError):
    """Not enough stock available"""
    pass

class CreditLimitExceededError(BusinessError):
    """Client credit limit exceeded"""
    pass

class DuplicateReferenceError(BusinessError):
    """Reference already exists"""
    pass

class EntityNotFoundError(BusinessError):
    """Requested entity not found"""
    pass

class InvalidStatusTransitionError(BusinessError):
    """Invalid status change"""
    pass
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Insufficient stock for product PRD-0001",
    "details": {
      "product_id": 1,
      "requested": 100,
      "available": 50
    }
  }
}
```

---

## Configuration Settings

```python
# backend/app/config.py
class BusinessSettings:
    DEFAULT_CURRENCY = "EUR"
    DEFAULT_LANGUAGE = "fr"
    DEFAULT_WAREHOUSE_ID = 1
    QUOTE_VALIDITY_DAYS = 30
    DEFAULT_PAYMENT_TERM_DAYS = 30
    LOW_STOCK_THRESHOLD = 10
    MAX_DISCOUNT_PERCENT = 50
    
class EmailSettings:
    FROM_ADDRESS = "noreply@ecoled.com"
```
