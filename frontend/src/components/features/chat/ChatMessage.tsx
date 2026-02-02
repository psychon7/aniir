/**
 * ChatMessage component for displaying individual chat messages
 */

import { memo, useState } from 'react'
import { format } from 'date-fns'
import { Trash2, Paperclip, Download, File, Image, FileText, FileSpreadsheet, FileVideo, ExternalLink, Check, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatMessage as ChatMessageType, ChatAttachment, ReadReceipt } from '@/types/chat'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ChatMessageProps {
  message: ChatMessageType
  isOwnMessage: boolean
  canDelete: boolean
  onDelete: (messageId: number) => void
  attachmentDetails?: ChatAttachment[]
  showReadReceipts?: boolean // Show read receipt indicators for own messages
}

// Get icon based on MIME type
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return Image
  }
  if (mimeType.startsWith('video/')) {
    return FileVideo
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

// Attachment preview component
function AttachmentPreview({
  attachment,
  isOwnMessage
}: {
  attachment: ChatAttachment
  isOwnMessage: boolean
}) {
  const FileIcon = getFileIcon(attachment.mimeType)
  const isImage = attachment.mimeType.startsWith('image/')

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg mt-2',
        isOwnMessage ? 'bg-primary-foreground/10' : 'bg-muted'
      )}
    >
      {/* Image thumbnail or file icon */}
      {isImage && attachment.thumbnailUrl ? (
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-12 h-12 rounded overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          <img
            src={attachment.thumbnailUrl}
            alt={attachment.name}
            className="w-full h-full object-cover"
          />
        </a>
      ) : (
        <div className={cn(
          'w-10 h-10 rounded flex items-center justify-center flex-shrink-0',
          isOwnMessage ? 'bg-primary-foreground/20' : 'bg-background'
        )}>
          <FileIcon className="w-5 h-5" />
        </div>
      )}

      {/* File info */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className={cn(
          'text-sm font-medium truncate',
          isOwnMessage ? 'text-primary-foreground' : 'text-foreground'
        )} title={attachment.name}>
          {attachment.name}
        </p>
        <p className={cn(
          'text-xs',
          isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
        )}>
          {formatFileSize(attachment.size)}
        </p>
      </div>

      {/* Download/View button */}
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        download={attachment.name}
        className={cn(
          'p-1.5 rounded-full transition-colors flex-shrink-0',
          isOwnMessage
            ? 'hover:bg-primary-foreground/20 text-primary-foreground'
            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
        )}
        title={isImage ? 'View image' : 'Download file'}
      >
        {isImage ? (
          <ExternalLink className="w-4 h-4" />
        ) : (
          <Download className="w-4 h-4" />
        )}
      </a>
    </div>
  )
}

// Simple attachment indicator (when details not loaded)
function AttachmentIndicator({
  count,
  isOwnMessage
}: {
  count: number
  isOwnMessage: boolean
}) {
  return (
    <div className={cn(
      'flex items-center gap-1 mt-2 text-xs',
      isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
    )}>
      <Paperclip className="w-3 h-3" />
      <span>{count} attachment{count > 1 ? 's' : ''}</span>
    </div>
  )
}

// Read receipt indicator component
interface ReadReceiptIndicatorProps {
  isRead: boolean
  readBy?: ReadReceipt[]
  className?: string
}

function ReadReceiptIndicator({ isRead, readBy, className }: ReadReceiptIndicatorProps) {
  const hasReaders = readBy && readBy.length > 0

  // Format read receipt tooltip content
  const getTooltipContent = () => {
    if (!hasReaders) return 'Sent'

    const readers = readBy!
    if (readers.length === 1) {
      const reader = readers[0]
      const readTime = format(new Date(reader.read_at), 'MMM d, HH:mm')
      return `Read by ${reader.display_name || reader.username || 'User'} at ${readTime}`
    }

    if (readers.length <= 3) {
      return `Read by ${readers.map(r => r.display_name || r.username || 'User').join(', ')}`
    }

    return `Read by ${readers[0].display_name || readers[0].username || 'User'} and ${readers.length - 1} others`
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex items-center ml-1', className)}>
          {isRead || hasReaders ? (
            <CheckCheck
              className={cn(
                'w-3.5 h-3.5',
                hasReaders ? 'text-blue-400' : 'text-primary-foreground/50'
              )}
              aria-label="Read"
            />
          ) : (
            <Check
              className="w-3.5 h-3.5 text-primary-foreground/50"
              aria-label="Sent"
            />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-[200px]">
        <p className="text-xs">{getTooltipContent()}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export const ChatMessage = memo(function ChatMessage({
  message,
  isOwnMessage,
  canDelete,
  onDelete,
  attachmentDetails,
  showReadReceipts = true,
}: ChatMessageProps) {
  const [showActions, setShowActions] = useState(false)
  const isDeleted = !!message.deleted_at

  const formattedTime = format(new Date(message.created_at), 'HH:mm')
  const formattedDate = format(new Date(message.created_at), 'MMM d, yyyy')

  const handleDelete = () => {
    if (canDelete && !isDeleted) {
      onDelete(message.message_id)
    }
  }

  // Determine if we have attachments and their details
  const hasAttachments = message.attachments && message.attachments.length > 0
  const hasAttachmentDetails = attachmentDetails && attachmentDetails.length > 0

  // Determine read status
  const isRead = message.is_read || (message.read_by && message.read_by.length > 0)

  if (isDeleted) {
    return (
      <div
        className={cn(
          'flex mb-3',
          isOwnMessage ? 'justify-end' : 'justify-start'
        )}
      >
        <div className="px-4 py-2 rounded-lg bg-muted/50 italic text-muted-foreground text-sm">
          Message deleted
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex mb-3 group',
        isOwnMessage ? 'justify-end' : 'justify-start'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      data-testid="chat-message"
    >
      <div
        className={cn(
          'max-w-[70%] relative',
          isOwnMessage ? 'order-1' : 'order-2'
        )}
      >
        {/* Message bubble */}
        <div
          className={cn(
            'px-4 py-2 rounded-2xl',
            isOwnMessage
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted text-foreground rounded-bl-md'
          )}
        >
          {/* Sender name for other users' messages */}
          {!isOwnMessage && (
            <div className="text-xs font-medium text-muted-foreground mb-1">
              {message.user.display_name || message.user.username}
            </div>
          )}

          {/* Message content */}
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* Attachments */}
          {hasAttachments && (
            hasAttachmentDetails ? (
              <div className="space-y-1">
                {attachmentDetails.map((attachment) => (
                  <AttachmentPreview
                    key={attachment.id}
                    attachment={attachment}
                    isOwnMessage={isOwnMessage}
                  />
                ))}
              </div>
            ) : (
              <AttachmentIndicator
                count={message.attachments!.length}
                isOwnMessage={isOwnMessage}
              />
            )
          )}

          {/* Timestamp and Read Receipt */}
          <div
            className={cn(
              'flex items-center justify-end gap-0.5 text-xs mt-1',
              isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}
            title={formattedDate}
          >
            <span>{formattedTime}</span>
            {/* Show read receipt for own messages */}
            {isOwnMessage && showReadReceipts && (
              <ReadReceiptIndicator
                isRead={isRead || false}
                readBy={message.read_by}
              />
            )}
          </div>
        </div>

        {/* Actions menu */}
        {canDelete && showActions && (
          <div
            className={cn(
              'absolute top-0 flex items-center gap-1',
              isOwnMessage ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'
            )}
          >
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-full bg-background border border-border shadow-sm hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
              title="Delete message"
              aria-label="Delete message"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

// Typing indicator component
interface TypingIndicatorProps {
  users: Array<{ id: number; username: string; display_name: string }>
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null

  const names = users.map(u => u.display_name || u.username)
  let text: string

  if (names.length === 1) {
    text = `${names[0]} is typing...`
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing...`
  } else {
    text = `${names[0]} and ${names.length - 1} others are typing...`
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{text}</span>
    </div>
  )
}
