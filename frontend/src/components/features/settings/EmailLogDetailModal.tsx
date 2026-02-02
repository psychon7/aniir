import { FormModal } from '@/components/ui/form/FormModal'
import { StatusBadge, Badge } from '@/components/ui/Badge'
import { LoadingSkeleton } from '@/components/ui/feedback/LoadingSkeleton'
import { useEmailLog, useResendEmail } from '@/hooks/useEmailLogs'
import { format } from 'date-fns'

interface EmailLogDetailModalProps {
  emailLogId: number | null
  isOpen: boolean
  onClose: () => void
  onResend: (emailLogId: number) => void
}

export function EmailLogDetailModal({
  emailLogId,
  isOpen,
  onClose,
  onResend,
}: EmailLogDetailModalProps) {
  const { data: emailLog, isLoading } = useEmailLog(emailLogId || 0)
  const resendMutation = useResendEmail()

  const canResend = emailLog && (emailLog.status === 'failed' || emailLog.status === 'bounced')

  const footer = (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        {emailLog?.createdBy && <span>Created by {emailLog.createdBy}</span>}
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">
          Close
        </button>
        {canResend && (
          <button
            type="button"
            onClick={() => onResend(emailLog.id)}
            disabled={resendMutation.isPending}
            className="btn-primary"
          >
            <ResendIcon className="w-4 h-4" />
            Resend Email
          </button>
        )}
      </div>
    </div>
  )

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Email Details"
      description={emailLog?.subject}
      size="lg"
      footer={footer}
    >
      {isLoading || !emailLog ? (
        <div className="space-y-4">
          <LoadingSkeleton className="h-8 w-full" />
          <LoadingSkeleton className="h-32 w-full" />
          <LoadingSkeleton className="h-8 w-1/2" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status & Meta Info */}
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={emailLog.status} />
            {emailLog.hasAttachments && (
              <Badge variant="outline">
                <AttachmentIcon className="w-3 h-3 mr-1" />
                {emailLog.attachmentCount || 1} attachment{(emailLog.attachmentCount || 1) > 1 ? 's' : ''}
              </Badge>
            )}
            {emailLog.relatedEntityType && (
              <Badge variant="info">
                {emailLog.relatedEntityType}
                {emailLog.relatedEntityReference && `: ${emailLog.relatedEntityReference}`}
              </Badge>
            )}
            {emailLog.retryCount > 0 && (
              <Badge variant="warning">{emailLog.retryCount} retries</Badge>
            )}
          </div>

          {/* Error message if failed */}
          {emailLog.statusMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg">
              <p className="text-sm text-rose-700 dark:text-rose-400">
                <strong>Error:</strong> {emailLog.statusMessage}
              </p>
            </div>
          )}

          {/* Email Headers */}
          <div className="card p-4 space-y-3">
            <DetailRow label="From" value={emailLog.fromAddress} />
            <DetailRow label="To" value={emailLog.toAddresses.join(', ')} />
            {emailLog.ccAddresses && emailLog.ccAddresses.length > 0 && (
              <DetailRow label="CC" value={emailLog.ccAddresses.join(', ')} />
            )}
            {emailLog.bccAddresses && emailLog.bccAddresses.length > 0 && (
              <DetailRow label="BCC" value={emailLog.bccAddresses.join(', ')} />
            )}
            <DetailRow label="Subject" value={emailLog.subject} />
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Created</p>
              <p className="font-medium">
                {format(new Date(emailLog.createdAt), 'MMM d, yyyy HH:mm:ss')}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sent</p>
              <p className="font-medium">
                {emailLog.sentAt
                  ? format(new Date(emailLog.sentAt), 'MMM d, yyyy HH:mm:ss')
                  : '-'}
              </p>
            </div>
          </div>

          {/* Attachments */}
          {emailLog.attachments && emailLog.attachments.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Attachments</h3>
              <div className="space-y-2">
                {emailLog.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileIcon className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{attachment.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.size)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email Body Preview */}
          {(emailLog.bodyHtml || emailLog.bodyText) && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Email Content</h3>
              <div className="card p-4 max-h-64 overflow-y-auto scrollbar-refined">
                {emailLog.bodyHtml ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: emailLog.bodyHtml }}
                  />
                ) : (
                  <pre className="text-sm whitespace-pre-wrap font-mono text-muted-foreground">
                    {emailLog.bodyText}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </FormModal>
  )
}

// Helper component for detail rows
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <span className="text-sm text-muted-foreground w-20 flex-shrink-0">{label}:</span>
      <span className="text-sm text-foreground break-all">{value}</span>
    </div>
  )
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Icon components
function AttachmentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
      />
    </svg>
  )
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  )
}

function ResendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  )
}
