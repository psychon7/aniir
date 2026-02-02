# TODO: Prompt 2 - ERP Features Task Breakdown

## Overview

| Property | Value |
|----------|-------|
| **Total Tasks** | ~80 tasks |
| **Estimated Time** | 4-5 hours (6 parallel agents) |
| **Dependencies** | Prompt 1 must be complete |
| **Database** | SQL Server (existing + new tables) |

## ⚠️ CRITICAL RULES

1. **Use existing tables** where they exist (TM_INV_ClientInvoice, TM_PAY_Payment)
2. **Create new tables** with proper naming (TM_EML_EmailLog, TM_DRV_Folder)
3. **SQL scripts** go in `/SQL/V1.0.0.4/` folder
4. **NO Alembic** - Use SQL scripts for schema changes

---

## Agent Assignment

| Agent | Focus Area | Tasks | Time |
|-------|------------|-------|------|
| **Agent 1** | PDF Generation + Storage | P2-001 to P2-012 | 1.5h |
| **Agent 2** | Email Service + Celery | P2-013 to P2-024 | 1.5h |
| **Agent 3** | Accounting Module | P2-025 to P2-038 | 2h |
| **Agent 4** | Drive Module | P2-039 to P2-052 | 2h |
| **Agent 5** | Chat Module + WebSocket | P2-053 to P2-066 | 2h |
| **Agent 6** | Landed Cost + i18n | P2-067 to P2-080 | 1.5h |

---

## Group A: PDF Generation + Storage (Agent 1)

### SQL Scripts
| ID | Task | Effort |
|----|------|--------|
| P2-001 | Create `/SQL/V1.0.0.4/01-add-pdf-columns.sql` (add inv_pdf_url, inv_pdf_generated_at to TM_INV_ClientInvoice) | Small |

### Backend
| ID | Task | Effort |
|----|------|--------|
| P2-002 | Add `weasyprint`, `boto3` to `pyproject.toml` | Small |
| P2-003 | Create `backend/app/services/storage_service.py` (S3/MinIO client) | Medium |
| P2-004 | Create `backend/app/services/pdf_service.py` (PDFService class) | Medium |
| P2-005 | Create `backend/app/templates/invoice.html` (Jinja2 template) | Medium |
| P2-006 | Create `backend/app/templates/invoice.css` (print styles) | Small |
| P2-007 | Add `POST /api/v1/invoices/{id}/generate-pdf` endpoint | Small |
| P2-008 | Add `GET /api/v1/invoices/{id}/download-pdf` endpoint | Small |
| P2-009 | Update ClientInvoice model with pdf_url, pdf_generated_at | Small |

### Frontend
| ID | Task | Effort |
|----|------|--------|
| P2-010 | Add "Generate PDF" button to invoice detail page | Small |
| P2-011 | Add "Download PDF" button with loading state | Small |
| P2-012 | Add PDF status indicator | Small |

**Acceptance Criteria:**
- [ ] PDF generates with company logo, line items, totals
- [ ] PDF stored in MinIO/S3
- [ ] Download requires authentication
- [ ] UI buttons work correctly

---

## Group B: Email Service + Daily Invoices (Agent 2)

### SQL Scripts
| ID | Task | Effort |
|----|------|--------|
| P2-013 | Create `/SQL/V1.0.0.4/02-create-email-log.sql` (TM_EML_EmailLog table) | Small |

### Backend
| ID | Task | Effort |
|----|------|--------|
| P2-014 | Add `aiosmtplib`, `email-validator` to `pyproject.toml` | Small |
| P2-015 | Create `backend/app/models/email_log.py` (EmailLog model) | Small |
| P2-016 | Create `backend/app/services/email_service.py` (EmailProvider interface) | Medium |
| P2-017 | Implement ConsoleEmailProvider (dev) | Small |
| P2-018 | Implement SESEmailProvider (prod) | Medium |
| P2-019 | Create `backend/app/templates/emails/invoice_notification.html` | Small |
| P2-020 | Create `backend/app/templates/emails/invoice_notification.txt` | Small |
| P2-021 | Create `backend/app/tasks/email_tasks.py` (send_daily_invoices_task) | Medium |
| P2-022 | Configure Celery Beat schedule (21:00 Europe/Paris) | Small |
| P2-023 | Add `GET /api/v1/settings/email-logs` endpoint | Small |
| P2-024 | Add `POST /api/v1/settings/email-logs/{id}/retry` endpoint | Small |

### Frontend
| ID | Task | Effort |
|----|------|--------|
| P2-025 | Create `/settings/email-logs` page | Medium |

**Acceptance Criteria:**
- [ ] Celery Beat runs at 21:00 Europe/Paris
- [ ] Emails sent with PDF attachment
- [ ] EmailLog records created
- [ ] Retry button works

---

## Group C: Accounting Module (Agent 3)

### SQL Scripts
| ID | Task | Effort |
|----|------|--------|
| P2-026 | Create `/SQL/V1.0.0.4/03-create-payment-allocation.sql` (TM_PAY_Allocation, add columns to invoice) | Small |

### Backend
| ID | Task | Effort |
|----|------|--------|
| P2-027 | Create `backend/app/models/payment.py` (Payment, PaymentAllocation) | Small |
| P2-028 | Create `backend/app/services/accounting_service.py` | Large |
| P2-029 | Implement allocate_payment() | Medium |
| P2-030 | Implement auto_allocate_payment() (FIFO) | Medium |
| P2-031 | Implement calculate_invoice_status() | Small |
| P2-032 | Implement get_receivables_aging() | Medium |
| P2-033 | Create `backend/app/services/statement_service.py` | Medium |
| P2-034 | Create `backend/app/templates/customer_statement.html` | Medium |
| P2-035 | Add `GET /api/v1/accounting/receivables-aging` endpoint | Small |
| P2-036 | Add `POST /api/v1/accounting/payments` endpoint | Small |
| P2-037 | Add `POST /api/v1/accounting/payments/{id}/allocate` endpoint | Small |
| P2-038 | Add `POST /api/v1/accounting/statements/generate` endpoint | Small |

### Frontend
| ID | Task | Effort |
|----|------|--------|
| P2-039 | Create `/accounting/payments` page (list + form) | Large |
| P2-040 | Create payment allocation modal | Medium |
| P2-041 | Create `/accounting/receivables` page (aging report) | Medium |
| P2-042 | Create aging chart component | Medium |
| P2-043 | Create `/accounting/statements` page | Medium |

**Acceptance Criteria:**
- [ ] Payment entry works
- [ ] Allocation to invoices works
- [ ] Invoice status updates (DRAFT/SENT/PARTIAL/PAID/OVERDUE)
- [ ] Aging report shows correct buckets (0-30, 31-60, 61-90, 90+)

---

## Group D: Drive Module (Agent 4)

### SQL Scripts
| ID | Task | Effort |
|----|------|--------|
| P2-044 | Create `/SQL/V1.0.0.4/04-create-drive-tables.sql` (TM_DRV_Folder, TM_DRV_File) | Medium |

### Backend
| ID | Task | Effort |
|----|------|--------|
| P2-045 | Create `backend/app/models/drive.py` (DriveFolder, DriveFile) | Small |
| P2-046 | Create `backend/app/services/drive_service.py` | Large |
| P2-047 | Implement create_folder() | Small |
| P2-048 | Implement upload_file() (presigned URL) | Medium |
| P2-049 | Implement move_file(), rename_file(), delete_file() | Medium |
| P2-050 | Implement attach_file_to_entity(), get_entity_files() | Small |
| P2-051 | Add `POST /api/v1/drive/folders` endpoint | Small |
| P2-052 | Add `GET /api/v1/drive/folders/{id}` endpoint | Small |
| P2-053 | Add `POST /api/v1/drive/files/upload-url` endpoint | Small |
| P2-054 | Add `POST /api/v1/drive/files` endpoint (after upload) | Small |
| P2-055 | Add `PUT /api/v1/drive/files/{id}/move` endpoint | Small |
| P2-056 | Add `PUT /api/v1/drive/files/{id}/rename` endpoint | Small |
| P2-057 | Add `DELETE /api/v1/drive/files/{id}` endpoint | Small |
| P2-058 | Add `GET /api/v1/drive/files?entity_type=&entity_id=` endpoint | Small |

### Frontend
| ID | Task | Effort |
|----|------|--------|
| P2-059 | Create `/drive` page (folder tree + file list) | Large |
| P2-060 | Create file upload component (drag & drop) | Medium |
| P2-061 | Create upload progress indicator | Small |
| P2-062 | Create file preview modal | Medium |
| P2-063 | Add "Attach File" button to invoice/quote/order detail pages | Small |

**Acceptance Criteria:**
- [ ] Folder CRUD works
- [ ] Presigned upload works
- [ ] File attachment to entities works
- [ ] UI shows folder tree

---

## Group E: Chat Module (Agent 5)

### SQL Scripts
| ID | Task | Effort |
|----|------|--------|
| P2-064 | Create `/SQL/V1.0.0.4/05-create-chat-tables.sql` (TM_CHT_Thread, TM_CHT_Message) | Small |

### Backend
| ID | Task | Effort |
|----|------|--------|
| P2-065 | Add `python-socketio`, `aioredis` to `pyproject.toml` | Small |
| P2-066 | Create `backend/app/models/chat.py` (ChatThread, ChatMessage) | Small |
| P2-067 | Create `backend/app/websocket/chat.py` (Socket.IO server) | Large |
| P2-068 | Implement on_connect (JWT auth) | Medium |
| P2-069 | Implement on_join_thread | Small |
| P2-070 | Implement on_send_message | Medium |
| P2-071 | Implement on_delete_message | Small |
| P2-072 | Add `GET /api/v1/chat/threads` endpoint | Small |
| P2-073 | Add `POST /api/v1/chat/threads` endpoint | Small |
| P2-074 | Add `GET /api/v1/chat/threads/{id}/messages` endpoint | Small |
| P2-075 | Add `DELETE /api/v1/chat/messages/{id}` endpoint | Small |

### Frontend
| ID | Task | Effort |
|----|------|--------|
| P2-076 | Install Socket.IO client | Small |
| P2-077 | Create Socket.IO connection hook | Medium |
| P2-078 | Create chat UI component (thread list) | Medium |
| P2-079 | Create message list component | Medium |
| P2-080 | Create message input with file attachment | Medium |

**Acceptance Criteria:**
- [ ] Socket.IO connection works
- [ ] Real-time messages work
- [ ] Messages persist to database
- [ ] File attachments work

---

## Group F: Landed Cost + i18n (Agent 6)

### Backend - Landed Cost
| ID | Task | Effort |
|----|------|--------|
| P2-081 | Create `backend/app/services/landed_cost_service.py` | Large |
| P2-082 | Implement calculate_landed_cost(lot_id, strategy) | Large |
| P2-083 | Create `backend/app/tasks/landed_cost_tasks.py` | Small |
| P2-084 | Add `POST /api/v1/logistics/supply-lots/{id}/calculate-landed-cost` endpoint | Small |

### Frontend - Landed Cost
| ID | Task | Effort |
|----|------|--------|
| P2-085 | Update supply lot detail page with landed cost breakdown | Medium |
| P2-086 | Add strategy selector (WEIGHT/VOLUME/VALUE/MIXED) | Small |

### Backend - i18n
| ID | Task | Effort |
|----|------|--------|
| P2-087 | Create `backend/app/utils/i18n.py` | Small |
| P2-088 | Create `backend/app/locales/fr.json` | Medium |
| P2-089 | Create `backend/app/locales/zh.json` | Medium |

### Frontend - i18n
| ID | Task | Effort |
|----|------|--------|
| P2-090 | Update i18next config | Small |
| P2-091 | Create `frontend/src/i18n/fr.json` (complete) | Large |
| P2-092 | Create `frontend/src/i18n/zh.json` (complete) | Large |
| P2-093 | Add language switcher to header | Small |

**Acceptance Criteria:**
- [ ] Landed cost calculation works
- [ ] All allocation strategies work
- [ ] Language switcher works
- [ ] All UI strings translated

---

## SQL Scripts Summary

| Script | Tables Created/Modified |
|--------|------------------------|
| `01-add-pdf-columns.sql` | ALTER TM_INV_ClientInvoice |
| `02-create-email-log.sql` | CREATE TM_EML_EmailLog |
| `03-create-payment-allocation.sql` | CREATE TM_PAY_Allocation, ALTER TM_INV_ClientInvoice |
| `04-create-drive-tables.sql` | CREATE TM_DRV_Folder, TM_DRV_File |
| `05-create-chat-tables.sql` | CREATE TM_CHT_Thread, TM_CHT_Message |

---

## Environment Variables Required

```bash
# S3/MinIO Storage
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=<password>
S3_BUCKET=erp-files

# Email (AWS SES)
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_REGION=eu-west-1
EMAIL_FROM=noreply@yourdomain.com
ACCOUNTING_CC_EMAIL=accounting@yourdomain.com

# Celery
CELERY_BROKER_URL=redis://:password@redis:6379/1
CELERY_RESULT_BACKEND=redis://:password@redis:6379/2
```

---

**Last Updated**: 2026-01-31
