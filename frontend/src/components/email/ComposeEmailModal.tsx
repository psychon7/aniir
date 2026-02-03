import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import apiClient from '@/api/client'

interface ComposeEmailModalProps {
  isOpen: boolean
  onClose: () => void
  recipientEmail?: string
  recipientName?: string
  subject?: string
  bodyText?: string
  bodyHtml?: string
  documentType?: 'quote' | 'invoice' | 'order' | 'delivery'
  documentReference?: string
  onSuccess?: () => void
}

interface SendEmailRequest {
  to: string
  subject: string
  body_text: string
  body_html?: string
}

export function ComposeEmailModal({
  isOpen,
  onClose,
  recipientEmail = '',
  recipientName = '',
  subject = '',
  bodyText = '',
  bodyHtml,
  documentType,
  documentReference,
  onSuccess,
}: ComposeEmailModalProps) {
  const { t } = useTranslation()

  const [formData, setFormData] = useState({
    to: recipientEmail,
    subject: subject,
    body_text: bodyText,
  })

  // Update form when props change
  useEffect(() => {
    setFormData({
      to: recipientEmail,
      subject: subject || getDefaultSubject(),
      body_text: bodyText || getDefaultBody(),
    })
  }, [recipientEmail, subject, bodyText, documentType, documentReference])

  const getDefaultSubject = () => {
    if (!documentType || !documentReference) return ''
    const typeMap: Record<string, string> = {
      quote: t('email.quoteSubject', { reference: documentReference }),
      invoice: t('email.invoiceSubject', { reference: documentReference }),
      order: t('email.orderSubject', { reference: documentReference }),
      delivery: t('email.deliverySubject', { reference: documentReference }),
    }
    return typeMap[documentType] || ''
  }

  const getDefaultBody = () => {
    if (!documentType || !documentReference) return ''
    const typeMap: Record<string, string> = {
      quote: t('email.quoteBody', { reference: documentReference, name: recipientName }),
      invoice: t('email.invoiceBody', { reference: documentReference, name: recipientName }),
      order: t('email.orderBody', { reference: documentReference, name: recipientName }),
      delivery: t('email.deliveryBody', { reference: documentReference, name: recipientName }),
    }
    return typeMap[documentType] || ''
  }

  const sendEmailMutation = useMutation({
    mutationFn: async (data: SendEmailRequest) => {
      const response = await apiClient.post('/email/send-test', data)
      return response.data
    },
    onSuccess: (data) => {
      if (data.success) {
        onSuccess?.()
        onClose()
      }
    },
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.to || !formData.subject || !formData.body_text) {
      return
    }
    await sendEmailMutation.mutateAsync({
      ...formData,
      body_html: bodyHtml,
    })
  }

  const isValid = formData.to && formData.subject && formData.body_text

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl mx-4 animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {t('email.compose')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* To Field */}
            <div className="form-group">
              <label className="form-label">{t('email.to')} *</label>
              <input
                type="email"
                name="to"
                value={formData.to}
                onChange={handleInputChange}
                className="form-input"
                placeholder="recipient@example.com"
                required
              />
            </div>

            {/* Subject Field */}
            <div className="form-group">
              <label className="form-label">{t('email.subject')} *</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="form-input"
                placeholder={t('email.subjectPlaceholder')}
                required
              />
            </div>

            {/* Body Field */}
            <div className="form-group">
              <label className="form-label">{t('email.message')} *</label>
              <textarea
                name="body_text"
                value={formData.body_text}
                onChange={handleInputChange}
                className="form-input min-h-[200px]"
                placeholder={t('email.messagePlaceholder')}
                required
              />
            </div>

            {/* Document attachment info */}
            {documentType && documentReference && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-sm text-muted-foreground">
                  {t('email.attachedDocument', { type: t(`common.${documentType}`), reference: documentReference })}
                </span>
              </div>
            )}

            {/* Error message */}
            {sendEmailMutation.error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                {t('email.sendFailed')}
              </div>
            )}

            {/* Success message */}
            {sendEmailMutation.isSuccess && sendEmailMutation.data?.success && (
              <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                {t('email.sendSuccess')}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-secondary/30">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={sendEmailMutation.isPending}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!isValid || sendEmailMutation.isPending}
            >
              {sendEmailMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('email.sending')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {t('email.send')}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ComposeEmailModal
