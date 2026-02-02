import type { EmailLog, EmailLogDetail } from '@/types/emailLog'

/**
 * Mock email logs data for development
 */
export const mockEmailLogs: EmailLog[] = [
  {
    id: 1,
    subject: 'Invoice #INV-2024-001 - ECOLED',
    fromAddress: 'noreply@ecoled.com',
    toAddresses: ['client@acme-corp.com'],
    ccAddresses: ['accounting@ecoled.com'],
    status: 'delivered',
    relatedEntityType: 'invoice',
    relatedEntityId: 1001,
    relatedEntityReference: 'INV-2024-001',
    bodyPreview: 'Dear Customer, Please find attached your invoice #INV-2024-001 for the amount of...',
    hasAttachments: true,
    attachmentCount: 1,
    sentAt: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-15T10:30:00Z',
    createdBy: 'System',
    retryCount: 0,
  },
  {
    id: 2,
    subject: 'Quote #QT-2024-015 - LED Lighting Solution',
    fromAddress: 'sales@ecoled.com',
    toAddresses: ['purchasing@buildmart.com', 'john.doe@buildmart.com'],
    status: 'sent',
    relatedEntityType: 'quote',
    relatedEntityId: 15,
    relatedEntityReference: 'QT-2024-015',
    bodyPreview: 'Thank you for your interest in our LED lighting solutions. Please find attached...',
    hasAttachments: true,
    attachmentCount: 2,
    sentAt: '2024-01-14T14:22:00Z',
    createdAt: '2024-01-14T14:22:00Z',
    createdBy: 'Marie Dupont',
    retryCount: 0,
  },
  {
    id: 3,
    subject: 'Order Confirmation #ORD-2024-089',
    fromAddress: 'orders@ecoled.com',
    toAddresses: ['orders@lightworld.fr'],
    status: 'delivered',
    relatedEntityType: 'order',
    relatedEntityId: 89,
    relatedEntityReference: 'ORD-2024-089',
    bodyPreview: 'Your order #ORD-2024-089 has been confirmed and is being processed...',
    hasAttachments: false,
    sentAt: '2024-01-14T09:15:00Z',
    createdAt: '2024-01-14T09:15:00Z',
    createdBy: 'System',
    retryCount: 0,
  },
  {
    id: 4,
    subject: 'Payment Received - Thank You',
    fromAddress: 'accounting@ecoled.com',
    toAddresses: ['finance@techsupply.de'],
    status: 'delivered',
    relatedEntityType: 'payment',
    relatedEntityId: 45,
    relatedEntityReference: 'PAY-2024-045',
    bodyPreview: 'We have received your payment of EUR 5,420.00. Thank you for your business...',
    hasAttachments: true,
    attachmentCount: 1,
    sentAt: '2024-01-13T16:45:00Z',
    createdAt: '2024-01-13T16:45:00Z',
    createdBy: 'System',
    retryCount: 0,
  },
  {
    id: 5,
    subject: 'Invoice #INV-2024-002 - Payment Reminder',
    fromAddress: 'accounting@ecoled.com',
    toAddresses: ['accounts@slowpayer.com'],
    status: 'failed',
    statusMessage: 'Mailbox not found: accounts@slowpayer.com',
    relatedEntityType: 'invoice',
    relatedEntityId: 1002,
    relatedEntityReference: 'INV-2024-002',
    bodyPreview: 'This is a friendly reminder that invoice #INV-2024-002 is now overdue...',
    hasAttachments: true,
    attachmentCount: 1,
    createdAt: '2024-01-13T11:00:00Z',
    createdBy: 'System',
    retryCount: 3,
    lastRetryAt: '2024-01-13T14:00:00Z',
  },
  {
    id: 6,
    subject: 'Shipment Dispatched - Tracking #TRK789456',
    fromAddress: 'logistics@ecoled.com',
    toAddresses: ['receiving@metroplex.uk'],
    ccAddresses: ['sales@ecoled.com'],
    status: 'delivered',
    relatedEntityType: 'shipment',
    relatedEntityId: 234,
    relatedEntityReference: 'SHP-2024-234',
    bodyPreview: 'Your order has been shipped! Track your delivery using tracking number TRK789456...',
    hasAttachments: false,
    sentAt: '2024-01-12T08:30:00Z',
    createdAt: '2024-01-12T08:30:00Z',
    createdBy: 'System',
    retryCount: 0,
  },
  {
    id: 7,
    subject: 'Welcome to ECOLED - Account Created',
    fromAddress: 'noreply@ecoled.com',
    toAddresses: ['newclient@startup.io'],
    status: 'bounced',
    statusMessage: 'Address rejected: User unknown',
    relatedEntityType: 'client',
    relatedEntityId: 567,
    relatedEntityReference: 'CLI-567',
    bodyPreview: 'Welcome to ECOLED! Your account has been created successfully...',
    hasAttachments: false,
    createdAt: '2024-01-12T15:20:00Z',
    createdBy: 'Admin',
    retryCount: 1,
    lastRetryAt: '2024-01-12T16:20:00Z',
  },
  {
    id: 8,
    subject: 'Monthly Invoice Summary - December 2023',
    fromAddress: 'reports@ecoled.com',
    toAddresses: ['cfo@ecoled.com', 'accounting@ecoled.com'],
    status: 'delivered',
    relatedEntityType: 'system',
    bodyPreview: 'Please find attached the monthly invoice summary report for December 2023...',
    hasAttachments: true,
    attachmentCount: 1,
    sentAt: '2024-01-01T06:00:00Z',
    createdAt: '2024-01-01T06:00:00Z',
    createdBy: 'Scheduled Task',
    retryCount: 0,
  },
  {
    id: 9,
    subject: 'Quote #QT-2024-016 - Industrial Lighting Project',
    fromAddress: 'sales@ecoled.com',
    toAddresses: ['procurement@industryco.com'],
    status: 'queued',
    relatedEntityType: 'quote',
    relatedEntityId: 16,
    relatedEntityReference: 'QT-2024-016',
    bodyPreview: 'Thank you for your RFQ. Please find our quotation for the industrial lighting...',
    hasAttachments: true,
    attachmentCount: 3,
    createdAt: '2024-01-15T11:45:00Z',
    createdBy: 'Jean Martin',
    retryCount: 0,
  },
  {
    id: 10,
    subject: 'Supplier Order Confirmation',
    fromAddress: 'purchasing@ecoled.com',
    toAddresses: ['orders@ledsupplier.cn'],
    status: 'pending',
    relatedEntityType: 'supplier',
    relatedEntityId: 23,
    relatedEntityReference: 'PO-2024-023',
    bodyPreview: 'Please confirm receipt of our purchase order PO-2024-023 for LED components...',
    hasAttachments: true,
    attachmentCount: 1,
    createdAt: '2024-01-15T12:00:00Z',
    createdBy: 'Pierre Blanc',
    retryCount: 0,
  },
  {
    id: 11,
    subject: 'Invoice #INV-2024-003 - ECOLED',
    fromAddress: 'noreply@ecoled.com',
    toAddresses: ['billing@globaltech.es'],
    status: 'delivered',
    relatedEntityType: 'invoice',
    relatedEntityId: 1003,
    relatedEntityReference: 'INV-2024-003',
    bodyPreview: 'Dear Customer, Please find attached your invoice #INV-2024-003...',
    hasAttachments: true,
    attachmentCount: 1,
    sentAt: '2024-01-11T09:00:00Z',
    createdAt: '2024-01-11T09:00:00Z',
    createdBy: 'System',
    retryCount: 0,
  },
  {
    id: 12,
    subject: 'Daily Backup Report - Success',
    fromAddress: 'system@ecoled.com',
    toAddresses: ['it@ecoled.com'],
    status: 'delivered',
    relatedEntityType: 'system',
    bodyPreview: 'Daily backup completed successfully. Database: ERP_ECOLED, Size: 2.5GB...',
    hasAttachments: false,
    sentAt: '2024-01-15T02:00:00Z',
    createdAt: '2024-01-15T02:00:00Z',
    createdBy: 'Scheduled Task',
    retryCount: 0,
  },
]

/**
 * Mock email log details with full content
 */
export const mockEmailLogDetails: Record<number, EmailLogDetail> = {
  1: {
    ...mockEmailLogs[0],
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Invoice #INV-2024-001</h2>
        <p>Dear Customer,</p>
        <p>Please find attached your invoice #INV-2024-001 for the amount of <strong>EUR 3,450.00</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd;">Invoice Number</td>
            <td style="padding: 10px; border: 1px solid #ddd;">INV-2024-001</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Invoice Date</td>
            <td style="padding: 10px; border: 1px solid #ddd;">January 15, 2024</td>
          </tr>
          <tr style="background: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd;">Due Date</td>
            <td style="padding: 10px; border: 1px solid #ddd;">February 14, 2024</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Amount</td>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>EUR 3,450.00</strong></td>
          </tr>
        </table>
        <p>Payment is due within 30 days. Please use the reference number INV-2024-001 when making payment.</p>
        <p>Thank you for your business!</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">ECOLED - Innovative LED Solutions<br>123 Innovation Street, 75001 Paris, France</p>
      </div>
    `,
    bodyText: `Invoice #INV-2024-001

Dear Customer,

Please find attached your invoice #INV-2024-001 for the amount of EUR 3,450.00.

Invoice Number: INV-2024-001
Invoice Date: January 15, 2024
Due Date: February 14, 2024
Amount: EUR 3,450.00

Payment is due within 30 days. Please use the reference number INV-2024-001 when making payment.

Thank you for your business!

---
ECOLED - Innovative LED Solutions
123 Innovation Street, 75001 Paris, France`,
    attachments: [
      {
        id: 1,
        filename: 'INV-2024-001.pdf',
        contentType: 'application/pdf',
        size: 125000,
        downloadUrl: '/api/v1/email-logs/1/attachments/1',
      },
    ],
    headers: {
      'Message-ID': '<INV-2024-001@ecoled.com>',
      'X-Mailer': 'ECOLED ERP v1.0',
      'X-Priority': '3',
    },
  },
  5: {
    ...mockEmailLogs[4],
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c00;">Payment Reminder - Invoice #INV-2024-002</h2>
        <p>Dear Customer,</p>
        <p>This is a friendly reminder that invoice #INV-2024-002 is now <strong>overdue</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background: #fff3f3;">
            <td style="padding: 10px; border: 1px solid #ddd;">Invoice Number</td>
            <td style="padding: 10px; border: 1px solid #ddd;">INV-2024-002</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Original Due Date</td>
            <td style="padding: 10px; border: 1px solid #ddd; color: #c00;">January 5, 2024</td>
          </tr>
          <tr style="background: #fff3f3;">
            <td style="padding: 10px; border: 1px solid #ddd;">Amount Due</td>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>EUR 2,150.00</strong></td>
          </tr>
        </table>
        <p>Please arrange payment at your earliest convenience to avoid any late fees.</p>
        <p>If you have already made the payment, please disregard this reminder.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">ECOLED - Innovative LED Solutions</p>
      </div>
    `,
    bodyText: `Payment Reminder - Invoice #INV-2024-002

Dear Customer,

This is a friendly reminder that invoice #INV-2024-002 is now overdue.

Invoice Number: INV-2024-002
Original Due Date: January 5, 2024
Amount Due: EUR 2,150.00

Please arrange payment at your earliest convenience to avoid any late fees.

If you have already made the payment, please disregard this reminder.

---
ECOLED - Innovative LED Solutions`,
    attachments: [
      {
        id: 2,
        filename: 'INV-2024-002.pdf',
        contentType: 'application/pdf',
        size: 118000,
        downloadUrl: '/api/v1/email-logs/5/attachments/2',
      },
    ],
    headers: {
      'Message-ID': '<INV-2024-002-reminder@ecoled.com>',
      'X-Mailer': 'ECOLED ERP v1.0',
      'X-Priority': '2',
    },
  },
}

/**
 * Get email log detail by ID (adds default detail fields if not in mockEmailLogDetails)
 */
export function getEmailLogDetailById(id: number): EmailLogDetail | undefined {
  if (mockEmailLogDetails[id]) {
    return mockEmailLogDetails[id]
  }

  const log = mockEmailLogs.find((l) => l.id === id)
  if (!log) return undefined

  return {
    ...log,
    bodyHtml: `<p>${log.bodyPreview}</p>`,
    bodyText: log.bodyPreview || '',
    attachments: log.hasAttachments
      ? [
          {
            id: 100 + id,
            filename: `document-${id}.pdf`,
            contentType: 'application/pdf',
            size: 50000 + Math.random() * 100000,
            downloadUrl: `/api/v1/email-logs/${id}/attachments/${100 + id}`,
          },
        ]
      : [],
    headers: {
      'Message-ID': `<email-${id}@ecoled.com>`,
      'X-Mailer': 'ECOLED ERP v1.0',
    },
  }
}
