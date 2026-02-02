# Prompt 2 - ERP Features: PDF, Emails, Accounting, Drive, Chat, Landed Cost

## Metadata

| Property | Value |
|----------|-------|
| **Prompt Number** | 2 of 3 |
| **Title** | Production-Ready ERP Features |
| **Estimated Time** | 60-90 minutes (AI generation) |
| **Dependencies** | Prompt 1 must be completed and tested |
| **Status** | 🔴 Not Started |

## ⚠️ CRITICAL: SQL Server Approach

This prompt extends the FastAPI backend that connects to the **EXISTING SQL Server database**.

**Rules:**
1. **Existing tables** - Use exact names (e.g., `TM_INV_ClientInvoice`, `TM_PAY_Payment`)
2. **New tables** - Create with `TM_` prefix for master data, `TR_` for reference data
3. **Column naming** - Follow existing pattern: `[prefix]_[field_name]`
4. **NO Alembic migrations** - Add new tables via SQL scripts in `/SQL/V1.0.0.4/`

## Key Deliverables Checklist

- [ ] Invoice PDF generation (WeasyPrint)
- [ ] PDF storage in S3/MinIO
- [ ] Secure PDF download endpoint
- [ ] Daily automatic invoice emails (Celery Beat)
- [ ] Email service with console and SES providers
- [ ] TM_EML_EmailLog table and tracking
- [ ] Payment allocation system (extend existing TM_PAY_Payment)
- [ ] Invoice status calculation (use existing sta_id in TM_INV_ClientInvoice)
- [ ] Accounts receivable aging report
- [ ] Customer statement PDF generation
- [ ] Drive module (TM_DRV_Folder, TM_DRV_File)
- [ ] Presigned S3 upload for files
- [ ] File attachment to entities
- [ ] Internal chat with Socket.IO (TM_CHT_Thread, TM_CHT_Message)
- [ ] Chat threads per entity
- [ ] Message persistence
- [ ] Landed cost calculation (extend existing TM_LOT_* tables)
- [ ] Landed cost allocation job (Celery)
- [ ] i18n implementation (FR/ZH) - frontend only
- [ ] Language switcher UI
- [ ] All UI pages for new features

## Prerequisites

Before running this prompt, ensure:
- [ ] Prompt 1 is completed and tested
- [ ] Docker Compose is running (Redis, MinIO)
- [ ] SQL Server connection working
- [ ] Backend API is accessible at /docs
- [ ] Frontend is running
- [ ] Authentication is working

## Dependencies

This prompt extends the codebase from Prompt 1. Do NOT restart or recreate the project.

---

## Full Prompt Text

Continue from the existing FastAPI + SQL Server + React monorepo you generated in Prompt 1 (do NOT restart).

**CONTEXT**: You are extending a production ERP system refactor that connects to an **EXISTING SQL Server database**. All existing functionality from Prompt 1 must remain intact. All new tables must follow the existing naming conventions.

Extend the codebase with production-ready implementations for these features:

========================
A) INVOICE PDF GENERATION + STORAGE
========================

**Requirements:**
- Generate professional invoice PDFs from HTML templates using WeasyPrint
- Store PDFs in MinIO (dev) / S3 (prod) via backend upload
- Expose secure download endpoint with auth checks
- Add UI button "Generate PDF" + "Download PDF" on invoice detail page

**Implementation:**

1. **Install dependencies** (add to pyproject.toml):
   ```toml
   weasyprint = "^60.0"
   boto3 = "^1.34.0"
   ```

2. **Create PDF service** (backend/app/services/pdf_service.py):
   ```python
   class PDFService:
       async def render_invoice_pdf(self, invoice_id: UUID) -> bytes
       async def upload_pdf_to_s3(self, file_bytes: bytes, filename: str) -> str
       async def generate_and_store_invoice_pdf(self, invoice_id: UUID) -> str
   ```

3. **Create HTML template** (backend/app/templates/invoice.html):
   - Professional invoice layout with company logo
   - Header with company info and invoice details
   - Line items table with quantities, prices, taxes
   - Totals section (subtotal, tax, total)
   - Footer with payment terms and legal text
   - Use Jinja2 for templating
   - Include CSS for print styling (A4 page size)

4. **Add API endpoints** (backend/app/api/v1/invoices.py):
   ```python
   @router.post("/{invoice_id}/generate-pdf")
   async def generate_invoice_pdf(invoice_id: UUID)
   
   @router.get("/{invoice_id}/download-pdf")
   async def download_invoice_pdf(invoice_id: UUID)
   ```

5. **Extend existing TM_INV_ClientInvoice table** (SQL script + model):
   
   SQL Script (`/SQL/V1.0.0.4/01-add-pdf-columns.sql`):
   ```sql
   -- Add PDF columns to existing invoice table
   ALTER TABLE TM_INV_ClientInvoice ADD inv_pdf_url NVARCHAR(500) NULL;
   ALTER TABLE TM_INV_ClientInvoice ADD inv_pdf_generated_at DATETIME NULL;
   ```
   
   Update model (backend/app/models/invoice.py):
   ```python
   class ClientInvoice(Base):
       __tablename__ = "TM_INV_ClientInvoice"
       # ... existing fields from schema
       inv_pdf_url = Column(String(500), nullable=True)
       inv_pdf_generated_at = Column(DateTime, nullable=True)
   ```

6. **Update frontend** (frontend/src/routes/invoices/$invoiceId.tsx):
   - Add "Generate PDF" button (shows loading state)
   - Add "Download PDF" button (opens in new tab)
   - Show PDF generation status

**Acceptance Criteria:**
- [ ] PDF generates with correct data
- [ ] PDF is stored in S3/MinIO
- [ ] PDF URL is saved to database
- [ ] Download endpoint requires authentication
- [ ] UI buttons work correctly
- [ ] PDF is properly formatted (A4, professional layout)

========================
B) DAILY AUTOMATIC EMAILS FOR INVOICES
========================

**Requirements:**
- Every day at 21:00 Europe/Paris, send all invoices issued today to customers
- Attach PDF or include download link
- CC accountant email (from env var ACCOUNTING_CC_EMAIL)
- Log all emails sent with status

**Implementation:**

1. **Install dependencies**:
   ```toml
   celery-beat = "^2.5.0"
   email-validator = "^2.1.0"
   aiosmtplib = "^3.0.0"
   ```

2. **Create email service** (backend/app/services/email_service.py):
   ```python
   class EmailProvider(ABC):
       @abstractmethod
       async def send_email(self, to: List[str], subject: str, html: str, attachments: List[dict])
   
   class ConsoleEmailProvider(EmailProvider):
       # Prints to console for dev
   
   class SESEmailProvider(EmailProvider):
       # AWS SES for production
   ```

3. **Create email templates** (backend/app/templates/emails/):
   - invoice_notification.html (Jinja2)
   - invoice_notification.txt (plain text fallback)

4. **Create Celery task** (backend/app/tasks/email_tasks.py):
   ```python
   @celery_app.task
   def send_daily_invoices_task():
       # Query invoices created today
       # For each invoice:
       #   - Generate PDF if not exists
       #   - Send email to customer
       #   - CC accountant
       #   - Log to EmailLog
   ```

5. **Create TM_EML_EmailLog table** (SQL script + model):

   SQL Script (`/SQL/V1.0.0.4/02-create-email-log.sql`):
   ```sql
   CREATE TABLE TM_EML_EmailLog (
       eml_id INT IDENTITY(1,1) PRIMARY KEY,
       eml_inv_id INT NULL FOREIGN KEY REFERENCES TM_INV_ClientInvoice(inv_id),
       eml_to_email NVARCHAR(255) NOT NULL,
       eml_cc_emails NVARCHAR(1000) NULL,  -- Comma-separated
       eml_subject NVARCHAR(500) NOT NULL,
       eml_status NVARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, SENT, FAILED
       eml_error_message NVARCHAR(MAX) NULL,
       eml_sent_at DATETIME NULL,
       eml_created_at DATETIME DEFAULT GETDATE()
   );
   CREATE INDEX IX_EmailLog_Status ON TM_EML_EmailLog(eml_status);
   ```
   
   Model (backend/app/models/email_log.py):
   ```python
   class EmailLog(Base):
       __tablename__ = "TM_EML_EmailLog"
       eml_id = Column(Integer, primary_key=True)
       eml_inv_id = Column(Integer, ForeignKey("TM_INV_ClientInvoice.inv_id"))
       eml_to_email = Column(String(255), nullable=False)
       eml_cc_emails = Column(String(1000), nullable=True)
       eml_subject = Column(String(500), nullable=False)
       eml_status = Column(String(20), default="PENDING")
       eml_error_message = Column(Text, nullable=True)
       eml_sent_at = Column(DateTime, nullable=True)
       eml_created_at = Column(DateTime, server_default=func.now())
   ```

6. **Configure Celery Beat schedule** (backend/app/config.py):
   ```python
   CELERY_BEAT_SCHEDULE = {
       "send-daily-invoices": {
           "task": "app.tasks.email_tasks.send_daily_invoices_task",
           "schedule": crontab(hour=21, minute=0, day_of_week="*"),
       }
   }
   ```

7. **Add UI page** (frontend/src/routes/settings/email-logs.tsx):
   - List of sent emails with status
   - Filter by date, status, invoice
   - Retry button for failed emails

**Acceptance Criteria:**
- [ ] Celery Beat schedule configured
- [ ] Task runs at 21:00 Europe/Paris
- [ ] Emails sent to customers with PDF
- [ ] Accountant CC'd on all emails
- [ ] EmailLog records created
- [ ] UI shows email history
- [ ] Failed emails can be retried

========================
C) ACCOUNTING MODULE
========================

**Requirements:**
- Accountant role can enter payments and allocate to invoices
- Compute invoice status (DRAFT, SENT, PARTIAL, PAID, OVERDUE)
- Outstanding receivables dashboard with aging buckets
- Customer statement PDF generation and email

**Implementation:**

1. **Use existing TM_PAY_Payment + create TM_PAY_Allocation** (SQL script + models):

   The payment table likely already exists. Create allocation table:
   
   SQL Script (`/SQL/V1.0.0.4/03-create-payment-allocation.sql`):
   ```sql
   -- Payment allocation for applying payments to invoices
   CREATE TABLE TM_PAY_Allocation (
       pal_id INT IDENTITY(1,1) PRIMARY KEY,
       pal_pay_id INT NOT NULL FOREIGN KEY REFERENCES TM_PAY_Payment(pay_id),
       pal_inv_id INT NOT NULL FOREIGN KEY REFERENCES TM_INV_ClientInvoice(inv_id),
       pal_amount DECIMAL(18,4) NOT NULL,
       pal_created_at DATETIME DEFAULT GETDATE()
   );
   CREATE INDEX IX_PayAlloc_Payment ON TM_PAY_Allocation(pal_pay_id);
   CREATE INDEX IX_PayAlloc_Invoice ON TM_PAY_Allocation(pal_inv_id);
   
   -- Add amount_paid and amount_due columns to invoice if not exists
   IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('TM_INV_ClientInvoice') AND name = 'inv_amount_paid')
   BEGIN
       ALTER TABLE TM_INV_ClientInvoice ADD inv_amount_paid DECIMAL(18,4) DEFAULT 0;
       ALTER TABLE TM_INV_ClientInvoice ADD inv_amount_due DECIMAL(18,4) NULL;
   END
   ```
   
   Models (backend/app/models/payment.py):
   ```python
   class Payment(Base):
       __tablename__ = "TM_PAY_Payment"
       pay_id = Column(Integer, primary_key=True)
       pay_cli_id = Column(Integer, ForeignKey("TM_CLI_Client.cli_id"))
       pay_date = Column(DateTime, nullable=False)
       pay_amount = Column(Numeric(18, 4), nullable=False)
       pay_method = Column(String(50))  # CASH, CHECK, TRANSFER, CARD
       pay_reference = Column(String(200))
       pay_notes = Column(Text)
       pay_created_by = Column(Integer, ForeignKey("TM_USR_User.usr_id"))
       pay_created_at = Column(DateTime, server_default=func.now())

   class PaymentAllocation(Base):
       __tablename__ = "TM_PAY_Allocation"
       pal_id = Column(Integer, primary_key=True)
       pal_pay_id = Column(Integer, ForeignKey("TM_PAY_Payment.pay_id"))
       pal_inv_id = Column(Integer, ForeignKey("TM_INV_ClientInvoice.inv_id"))
       pal_amount = Column(Numeric(18, 4), nullable=False)
       pal_created_at = Column(DateTime, server_default=func.now())
   ```

2. **Create accounting service** (backend/app/services/accounting_service.py):
   ```python
   class AccountingService:
       async def allocate_payment(
           self,
           payment_id: UUID,
           allocations: List[Dict[str, Any]]
       ):
           # Allocate payment to invoices
           # Update invoice.amount_paid, invoice.amount_due
           # Update invoice.status

       async def auto_allocate_payment(self, payment_id: UUID):
           # Auto-allocate to oldest invoices (FIFO)

       async def calculate_invoice_status(self, invoice_id: UUID) -> str:
           # DRAFT: not sent
           # SENT: sent but not paid
           # PARTIAL: partially paid
           # PAID: fully paid
           # OVERDUE: due_date < today and not paid

       async def get_receivables_aging(
           self,
           company_id: Optional[UUID] = None,
           bu_id: Optional[UUID] = None
       ) -> Dict[str, Any]:
           # Return buckets: 0-30, 31-60, 61-90, 90+ days
   ```

3. **Add aging report endpoint** (backend/app/api/v1/accounting.py):
   ```python
   @router.get("/receivables-aging")
   async def get_receivables_aging(
       company_id: Optional[UUID] = None,
       bu_id: Optional[UUID] = None
   )
   ```

4. **Create customer statement service** (backend/app/services/statement_service.py):
   ```python
   class StatementService:
       async def generate_customer_statement_pdf(
           self,
           customer_account_id: UUID,
           from_date: date,
           to_date: date
       ) -> bytes:
           # Generate PDF with invoice list, payments, balance

       async def email_customer_statement(
           self,
           customer_account_id: UUID,
           from_date: date,
           to_date: date
       ):
           # Generate PDF and email to customer
   ```

5. **Add UI pages**:
   - frontend/src/routes/accounting/payments.tsx (list + create payment form with allocation)
   - frontend/src/routes/accounting/receivables.tsx (aging report with charts)
   - frontend/src/routes/accounting/customer-statements.tsx (generate and email)

**Acceptance Criteria:**
- [ ] Payment entry form works
- [ ] Payment allocation to invoices works
- [ ] Invoice status updates correctly
- [ ] Aging report shows correct buckets
- [ ] Customer statement PDF generates
- [ ] Statement can be emailed to customer

========================
D) DRIVE MODULE (DROPBOX-LIKE)
========================

**Requirements:**
- Fully implement folder/file management
- Presigned upload to S3/MinIO
- Move, rename, delete (soft delete)
- Permissions by role + scope
- Attach files to entities (invoice, quote, PO, shipment, product)
- UI for browsing, uploading, managing files

**Implementation:**

1. **Create TM_DRV_Folder and TM_DRV_File tables** (SQL script + models):

   SQL Script (`/SQL/V1.0.0.4/04-create-drive-tables.sql`):
   ```sql
   -- Drive folders
   CREATE TABLE TM_DRV_Folder (
       fol_id INT IDENTITY(1,1) PRIMARY KEY,
       fol_parent_id INT NULL FOREIGN KEY REFERENCES TM_DRV_Folder(fol_id),
       fol_name NVARCHAR(255) NOT NULL,
       fol_path NVARCHAR(1000) NOT NULL,
       fol_is_hidden BIT DEFAULT 0,
       fol_permissions NVARCHAR(MAX) NULL,  -- JSON
       fol_created_by INT FOREIGN KEY REFERENCES TM_USR_User(usr_id),
       fol_created_at DATETIME DEFAULT GETDATE(),
       fol_deleted_at DATETIME NULL
   );
   CREATE INDEX IX_Folder_Parent ON TM_DRV_Folder(fol_parent_id);
   
   -- Drive files
   CREATE TABLE TM_DRV_File (
       fil_id INT IDENTITY(1,1) PRIMARY KEY,
       fil_fol_id INT FOREIGN KEY REFERENCES TM_DRV_Folder(fol_id),
       fil_name NVARCHAR(255) NOT NULL,
       fil_url NVARCHAR(1000) NOT NULL,
       fil_size_bytes BIGINT NOT NULL,
       fil_mime_type NVARCHAR(100) NOT NULL,
       fil_entity_type NVARCHAR(50) NULL,  -- Invoice, Quote, Order, Product
       fil_entity_id INT NULL,
       fil_permissions NVARCHAR(MAX) NULL,  -- JSON
       fil_created_by INT FOREIGN KEY REFERENCES TM_USR_User(usr_id),
       fil_created_at DATETIME DEFAULT GETDATE(),
       fil_deleted_at DATETIME NULL
   );
   CREATE INDEX IX_File_Folder ON TM_DRV_File(fil_fol_id);
   CREATE INDEX IX_File_Entity ON TM_DRV_File(fil_entity_type, fil_entity_id);
   ```
   
   Models (backend/app/models/drive.py):
   ```python
   class DriveFolder(Base):
       __tablename__ = "TM_DRV_Folder"
       fol_id = Column(Integer, primary_key=True)
       fol_parent_id = Column(Integer, ForeignKey("TM_DRV_Folder.fol_id"))
       fol_name = Column(String(255), nullable=False)
       fol_path = Column(String(1000), nullable=False)
       fol_is_hidden = Column(Boolean, default=False)
       fol_permissions = Column(Text)  # JSON string
       fol_created_by = Column(Integer, ForeignKey("TM_USR_User.usr_id"))
       fol_created_at = Column(DateTime, server_default=func.now())
       fol_deleted_at = Column(DateTime, nullable=True)

   class DriveFile(Base):
       __tablename__ = "TM_DRV_File"
       fil_id = Column(Integer, primary_key=True)
       fil_fol_id = Column(Integer, ForeignKey("TM_DRV_Folder.fol_id"))
       fil_name = Column(String(255), nullable=False)
       fil_url = Column(String(1000), nullable=False)
       fil_size_bytes = Column(BigInteger, nullable=False)
       fil_mime_type = Column(String(100), nullable=False)
       fil_entity_type = Column(String(50))
       fil_entity_id = Column(Integer)
       fil_permissions = Column(Text)  # JSON string
       fil_created_by = Column(Integer, ForeignKey("TM_USR_User.usr_id"))
       fil_created_at = Column(DateTime, server_default=func.now())
       fil_deleted_at = Column(DateTime, nullable=True)
   ```

3. **Create drive service** (backend/app/services/drive_service.py):
   ```python
   class DriveService:
       async def create_folder(
           self,
           parent_id: Optional[UUID],
           name: str,
           permissions: dict
       ) -> DriveFolder

       async def upload_file(
           self,
           folder_id: UUID,
           file_name: str,
           file_size: int,
           mime_type: str
       ) -> Dict[str, str]:
           # Returns presigned upload URL

       async def move_file(self, file_id: UUID, new_folder_id: UUID)
       async def rename_file(self, file_id: UUID, new_name: str)
       async def delete_file(self, file_id: UUID)  # Soft delete

       async def attach_file_to_entity(
           self,
           file_id: UUID,
           entity_type: str,
           entity_id: UUID
       )

       async def get_entity_files(
           self,
           entity_type: str,
           entity_id: UUID
       ) -> List[DriveFile]
   ```

4. **Add API endpoints** (backend/app/api/v1/drive.py):
   ```python
   @router.post("/folders")
   @router.get("/folders/{folder_id}")
   @router.post("/files/upload-url")
   @router.post("/files")
   @router.put("/files/{file_id}/move")
   @router.put("/files/{file_id}/rename")
   @router.delete("/files/{file_id}")
   @router.get("/files")
   ```

5. **Add UI pages**:
   - frontend/src/routes/drive/index.tsx (folder tree + file list)
   - File upload component (drag & drop, progress bar)
   - File preview modal (images, PDFs)
   - Attach file button on invoice/quote/PO detail pages

**Acceptance Criteria:**
- [ ] Folder creation works
- [ ] File upload with presigned URL works
- [ ] File move/rename works
- [ ] Soft delete works
- [ ] File attachment to entities works
- [ ] UI shows folder tree
- [ ] Drag & drop upload works

========================
E) INTERNAL CHAT (REALTIME)
========================

**Requirements:**
- Socket.IO for real-time messaging
- Threads per object (invoice, PO, lot, shipment, project) + general channels
- Message persistence
- File attachments (reference DriveFile)
- Basic moderation (delete own message, admin delete any)

**Implementation:**

1. **Install dependencies**:
   ```toml
   python-socketio = "^5.11.0"
   aioredis = "^2.0.1"
   ```

2. **Create TM_CHT_Thread and TM_CHT_Message tables** (SQL script + models):

   SQL Script (`/SQL/V1.0.0.4/05-create-chat-tables.sql`):
   ```sql
   -- Chat threads
   CREATE TABLE TM_CHT_Thread (
       thr_id INT IDENTITY(1,1) PRIMARY KEY,
       thr_entity_type NVARCHAR(50) NULL,  -- Invoice, Order, Project
       thr_entity_id INT NULL,
       thr_name NVARCHAR(255) NOT NULL,
       thr_created_by INT FOREIGN KEY REFERENCES TM_USR_User(usr_id),
       thr_created_at DATETIME DEFAULT GETDATE()
   );
   CREATE INDEX IX_Thread_Entity ON TM_CHT_Thread(thr_entity_type, thr_entity_id);
   
   -- Chat messages
   CREATE TABLE TM_CHT_Message (
       msg_id INT IDENTITY(1,1) PRIMARY KEY,
       msg_thr_id INT NOT NULL FOREIGN KEY REFERENCES TM_CHT_Thread(thr_id),
       msg_usr_id INT NOT NULL FOREIGN KEY REFERENCES TM_USR_User(usr_id),
       msg_content NVARCHAR(MAX) NOT NULL,
       msg_attachments NVARCHAR(MAX) NULL,  -- JSON array of file IDs
       msg_created_at DATETIME DEFAULT GETDATE(),
       msg_deleted_at DATETIME NULL
   );
   CREATE INDEX IX_Message_Thread ON TM_CHT_Message(msg_thr_id);
   ```
   
   Models (backend/app/models/chat.py):
   ```python
   class ChatThread(Base):
       __tablename__ = "TM_CHT_Thread"
       thr_id = Column(Integer, primary_key=True)
       thr_entity_type = Column(String(50))
       thr_entity_id = Column(Integer)
       thr_name = Column(String(255), nullable=False)
       thr_created_by = Column(Integer, ForeignKey("TM_USR_User.usr_id"))
       thr_created_at = Column(DateTime, server_default=func.now())

   class ChatMessage(Base):
       __tablename__ = "TM_CHT_Message"
       msg_id = Column(Integer, primary_key=True)
       msg_thr_id = Column(Integer, ForeignKey("TM_CHT_Thread.thr_id"))
       msg_usr_id = Column(Integer, ForeignKey("TM_USR_User.usr_id"))
       msg_content = Column(Text, nullable=False)
       msg_attachments = Column(Text)  # JSON string
       msg_created_at = Column(DateTime, server_default=func.now())
       msg_deleted_at = Column(DateTime, nullable=True)
   ```

3. **Create Socket.IO server** (backend/app/websocket/chat.py):
   ```python
   sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

   @sio.event
   async def connect(sid, environ, auth):
       # Authenticate user via JWT

   @sio.event
   async def join_thread(sid, data):
       # Join room

   @sio.event
   async def send_message(sid, data):
       # Save to DB, broadcast to room

   @sio.event
   async def delete_message(sid, data):
       # Soft delete, broadcast
   ```

4. **Add API endpoints** (backend/app/api/v1/chat.py):
   ```python
   @router.get("/threads")
   @router.post("/threads")
   @router.get("/threads/{thread_id}/messages")
   @router.post("/threads/{thread_id}/messages")
   @router.delete("/messages/{message_id}")
   ```

5. **Add frontend**:
   - Socket.IO client connection
   - Chat UI component (thread list + message list + input)
   - File attachment button (links to DriveFile)
   - Real-time message updates

**Acceptance Criteria:**
- [ ] Socket.IO connection works
- [ ] Messages persist to database
- [ ] Real-time updates work
- [ ] File attachments work
- [ ] Delete message works
- [ ] UI shows threads and messages

========================
F) LANDED COST ALLOCATION JOB
========================

**Requirements:**
- Calculate landed cost for supply lots
- Allocation strategies: by weight, by volume, by value, mixed
- Celery job to recalculate on demand
- UI to view landed cost per SKU

**Implementation:**

1. **Update SupplyLot model** (backend/app/models/master.py):
   ```python
   class SupplyLot(Base):
       # ... existing fields
       total_freight_cost = Column(Numeric(16, 4), default=0)
       total_customs_cost = Column(Numeric(16, 4), default=0)
       total_insurance_cost = Column(Numeric(16, 4), default=0)
       total_local_cost = Column(Numeric(16, 4), default=0)
   ```

2. **Create SupplyLotItem model** (backend/app/models/master.py):
   ```python
   class SupplyLotItem(Base):
       __tablename__ = "supply_lot_items"
       id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
       lot_id = Column(UUID(as_uuid=True), ForeignKey("supply_lots.id"))
       product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"))
       variant_id = Column(UUID(as_uuid=True), ForeignKey("product_variants.id"), nullable=True)
       quantity = Column(Integer, nullable=False)
       unit_price = Column(Numeric(16, 4), nullable=False)
       total_price = Column(Numeric(16, 4), nullable=False)
       weight_kg = Column(Numeric(10, 2), nullable=True)
       volume_cbm = Column(Numeric(10, 4), nullable=True)
       allocated_freight = Column(Numeric(16, 4), default=0)
       allocated_customs = Column(Numeric(16, 4), default=0)
       allocated_insurance = Column(Numeric(16, 4), default=0)
       allocated_local = Column(Numeric(16, 4), default=0)
       landed_cost_per_unit = Column(Numeric(16, 4), nullable=True)
   ```

3. **Create landed cost service** (backend/app/services/landed_cost_service.py):
   ```python
   class LandedCostService:
       async def calculate_landed_cost(
           self,
           lot_id: UUID,
           strategy: Literal["WEIGHT", "VOLUME", "VALUE", "MIXED"]
       ):
           # Aggregate all FreightCost records for shipment
           # Allocate costs to lot items based on strategy
           # Update SupplyLotItem.allocated_* fields
   ```

4. **Create Celery task** (backend/app/tasks/landed_cost_tasks.py):
   ```python
   @celery_app.task
   def recalculate_landed_cost_task(lot_id: str, strategy: str):
       # Call LandedCostService.calculate_landed_cost
   ```

5. **Add API endpoint** (backend/app/api/v1/logistics.py):
   ```python
   @router.post("/supply-lots/{lot_id}/calculate-landed-cost")
   async def calculate_landed_cost(lot_id: UUID, strategy: str)
   ```

6. **Add UI page**:
   - frontend/src/routes/logistics/supply-lots/$lotId.tsx
   - Show landed cost breakdown per SKU
   - Show cost/kg, cost/CBM
   - Button to recalculate with different strategy

**Acceptance Criteria:**
- [ ] Landed cost calculation works
- [ ] All allocation strategies work
- [ ] Celery task can be triggered
- [ ] UI shows breakdown correctly

========================
G) INTERNATIONALIZATION (FR/ZH)
========================

**Requirements:**
- Language switcher in UI (FR/ZH)
- Translate sourcing/logistics screens to Chinese
- API error messages localized

**Implementation:**

1. **Backend i18n** (backend/app/utils/i18n.py):
   ```python
   class I18n:
       def __init__(self, locale: str = "fr"):
           self.locale = locale
           self.translations = self.load_translations()

       def t(self, key: str, **kwargs) -> str:
           # Return translated string
   ```

2. **Translation files**:
   - backend/app/locales/fr.json
   - backend/app/locales/zh.json

3. **Frontend i18n**:
   - Configure i18next
   - frontend/src/i18n/fr.json
   - frontend/src/i18n/zh.json
   - Language switcher in top bar

4. **Translate all UI strings**

**Acceptance Criteria:**
- [ ] Language switcher works
- [ ] All UI strings translated
- [ ] API errors localized
- [ ] Date/number formatting correct per locale

========================
DELIVERABLES
========================

1. Provide FULL updated file tree
2. Provide FULL code for all new/modified files
3. Update README with new features
4. Ensure code compiles and runs locally
5. Include example .env variables

STOP after implementing these features. Do NOT implement Shopify, Sage X3, SuperPDP yet (that is Prompt 3).


