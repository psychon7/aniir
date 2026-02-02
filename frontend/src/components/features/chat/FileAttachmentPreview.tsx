/**
 * FileAttachmentPreview component for displaying pending file attachments
 */

import { memo } from 'react'
import { X, File, Image, FileText, FileSpreadsheet, FileVideo, FileAudio, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PendingAttachment } from '@/types/chat'

interface FileAttachmentPreviewProps {
  attachments: PendingAttachment[]
  onRemove: (id: string) => void
  disabled?: boolean
}

// Get icon based on MIME type
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return Image
  }
  if (mimeType.startsWith('video/')) {
    return FileVideo
  }
  if (mimeType.startsWith('audio/')) {
    return FileAudio
  }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv') {
    return FileSpreadsheet
  }
  if (mimeType.includes('document') || mimeType.includes('word') || mimeType === 'application/pdf' || mimeType.startsWith('text/')) {
    return FileText
  }
  return File
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const FileAttachmentPreview = memo(function FileAttachmentPreview({
  attachments,
  onRemove,
  disabled = false,
}: FileAttachmentPreviewProps) {
  if (attachments.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 p-3 border-b border-border bg-muted/30">
      {attachments.map((attachment) => {
        const FileIcon = getFileIcon(attachment.mimeType)
        const isUploading = attachment.status === 'uploading'
        const isError = attachment.status === 'error'
        const isCompleted = attachment.status === 'completed'

        return (
          <div
            key={attachment.id}
            className={cn(
              'relative flex items-center gap-2 px-3 py-2 bg-background rounded-lg border',
              'max-w-[200px] group',
              isError ? 'border-destructive/50 bg-destructive/5' : 'border-border',
              isCompleted && 'border-primary/30 bg-primary/5'
            )}
          >
            {/* File icon or image preview */}
            <div className="flex-shrink-0">
              {attachment.mimeType.startsWith('image/') && attachment.file ? (
                <div className="w-8 h-8 rounded overflow-hidden bg-muted">
                  <img
                    src={URL.createObjectURL(attachment.file)}
                    alt={attachment.name}
                    className="w-full h-full object-cover"
                    onLoad={(e) => {
                      // Revoke URL after image loads to free memory
                      URL.revokeObjectURL((e.target as HTMLImageElement).src)
                    }}
                  />
                </div>
              ) : (
                <div className={cn(
                  'w-8 h-8 rounded flex items-center justify-center',
                  isError ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                )}>
                  {isError ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <FileIcon className="w-4 h-4" />
                  )}
                </div>
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-medium truncate" title={attachment.name}>
                {attachment.name}
              </p>
              <p className={cn(
                'text-xs',
                isError ? 'text-destructive' : 'text-muted-foreground'
              )}>
                {isError
                  ? attachment.error || 'Upload failed'
                  : isUploading
                  ? `Uploading... ${attachment.progress}%`
                  : formatFileSize(attachment.size)}
              </p>
            </div>

            {/* Progress indicator or loading spinner */}
            {isUploading && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-muted rounded-b-lg overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${attachment.progress}%` }}
                />
              </div>
            )}

            {/* Spinner for uploading state */}
            {isUploading && (
              <div className="flex-shrink-0">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            )}

            {/* Remove button */}
            {!isUploading && (
              <button
                type="button"
                onClick={() => onRemove(attachment.id)}
                disabled={disabled}
                className={cn(
                  'flex-shrink-0 p-1 rounded-full transition-colors',
                  'opacity-0 group-hover:opacity-100 focus:opacity-100',
                  'hover:bg-muted-foreground/20 focus:bg-muted-foreground/20',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                aria-label={`Remove ${attachment.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
})
