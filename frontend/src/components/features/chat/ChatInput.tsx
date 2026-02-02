/**
 * ChatInput component for composing and sending messages with file attachments
 */

import { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react'
import { Send, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FileAttachmentPreview } from './FileAttachmentPreview'
import { uploadAttachment } from '@/api/chat'
import type { PendingAttachment } from '@/types/chat'

// File upload constraints
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 5
const ACCEPTED_FILE_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Archives
  'application/zip',
]

interface ChatInputProps {
  onSendMessage: (content: string, attachments?: number[]) => boolean
  onTyping: () => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  onSendMessage,
  onTyping,
  disabled = false,
  placeholder = 'Type a message...',
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [message])

  // Generate unique ID for pending attachments
  const generateId = () => `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Validate file
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024)
      return { valid: false, error: `File exceeds ${maxSizeMB}MB limit` }
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
      return { valid: false, error: 'File type not supported' }
    }

    return { valid: true }
  }

  // Upload a single file
  const uploadFile = async (attachment: PendingAttachment): Promise<number | null> => {
    try {
      // Update status to uploading
      setPendingAttachments(prev =>
        prev.map(a =>
          a.id === attachment.id ? { ...a, status: 'uploading' as const, progress: 0 } : a
        )
      )

      const result = await uploadAttachment(attachment.file, (progress) => {
        setPendingAttachments(prev =>
          prev.map(a =>
            a.id === attachment.id ? { ...a, progress: progress.percentage } : a
          )
        )
      })

      // Update status to completed
      setPendingAttachments(prev =>
        prev.map(a =>
          a.id === attachment.id
            ? { ...a, status: 'completed' as const, progress: 100, uploadedId: result.id }
            : a
        )
      )

      return result.id
    } catch (error) {
      // Update status to error
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setPendingAttachments(prev =>
        prev.map(a =>
          a.id === attachment.id ? { ...a, status: 'error' as const, error: errorMessage } : a
        )
      )
      return null
    }
  }

  // Handle file selection
  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || disabled) return

      const fileArray = Array.from(files)
      const currentCount = pendingAttachments.length
      const availableSlots = MAX_FILES - currentCount

      if (availableSlots <= 0) {
        console.warn(`Maximum ${MAX_FILES} files allowed`)
        return
      }

      // Take only available slots
      const filesToAdd = fileArray.slice(0, availableSlots)

      // Create pending attachments
      const newAttachments: PendingAttachment[] = filesToAdd.map(file => {
        const validation = validateFile(file)
        return {
          id: generateId(),
          file,
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          progress: 0,
          status: validation.valid ? 'pending' : 'error',
          error: validation.error,
        }
      })

      setPendingAttachments(prev => [...prev, ...newAttachments])

      // Upload valid files
      for (const attachment of newAttachments) {
        if (attachment.status === 'pending') {
          await uploadFile(attachment)
        }
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [disabled, pendingAttachments.length]
  )

  // Handle attachment button click
  const handleAttachClick = useCallback(() => {
    if (disabled) return
    fileInputRef.current?.click()
  }, [disabled])

  // Remove attachment
  const removeAttachment = useCallback((id: string) => {
    setPendingAttachments(prev => prev.filter(a => a.id !== id))
  }, [])

  // Handle message change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value)
      onTyping()
    },
    [onTyping]
  )

  // Handle send
  const handleSend = useCallback(() => {
    if (disabled) return

    // Get uploaded attachment IDs (only completed ones)
    const attachmentIds = pendingAttachments
      .filter(a => a.status === 'completed' && a.uploadedId)
      .map(a => a.uploadedId as number)

    // Check if we have any uploading attachments
    const hasUploading = pendingAttachments.some(a => a.status === 'uploading')
    if (hasUploading) {
      console.warn('Please wait for attachments to finish uploading')
      return
    }

    // Check if we have content to send
    const hasMessage = message.trim().length > 0
    const hasAttachments = attachmentIds.length > 0

    if (!hasMessage && !hasAttachments) {
      return
    }

    const success = onSendMessage(message, hasAttachments ? attachmentIds : undefined)
    if (success) {
      setMessage('')
      setPendingAttachments([])
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }, [message, pendingAttachments, onSendMessage, disabled])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Send on Enter (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  // Check if we can send
  const hasUploading = pendingAttachments.some(a => a.status === 'uploading')
  const completedAttachments = pendingAttachments.filter(a => a.status === 'completed')
  const canSend = !disabled && !hasUploading && (message.trim().length > 0 || completedAttachments.length > 0)
  const canAttach = !disabled && pendingAttachments.length < MAX_FILES

  return (
    <div className="border-t border-border bg-background">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_FILE_TYPES.join(',')}
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        data-testid="file-input"
      />

      {/* Pending attachments preview */}
      <FileAttachmentPreview
        attachments={pendingAttachments}
        onRemove={removeAttachment}
        disabled={disabled}
      />

      {/* Input area */}
      <div className="p-4">
        <div className="flex items-end gap-2">
          {/* Attachment button */}
          <button
            type="button"
            onClick={handleAttachClick}
            className={cn(
              'p-2.5 rounded-lg transition-colors',
              canAttach
                ? 'text-muted-foreground hover:text-foreground hover:bg-muted'
                : 'text-muted-foreground/50 cursor-not-allowed'
            )}
            disabled={!canAttach}
            title={canAttach ? 'Attach file' : `Maximum ${MAX_FILES} files allowed`}
            aria-label="Attach file"
            data-testid="attach-button"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Message textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={cn(
                'w-full px-4 py-2.5 bg-muted border border-transparent rounded-xl text-foreground resize-none',
                'placeholder:text-muted-foreground/60',
                'transition-all duration-200',
                'hover:bg-muted/80',
                'focus:outline-none focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/10',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'max-h-[120px] overflow-y-auto'
              )}
              aria-label="Message input"
              data-testid="chat-input"
            />
          </div>

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              'p-2.5 rounded-xl transition-all duration-200',
              canSend
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
            title={hasUploading ? 'Waiting for uploads...' : 'Send message'}
            aria-label="Send message"
            data-testid="send-button"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Hint text */}
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
          {pendingAttachments.length > 0 && (
            <span className="ml-2">
              • {completedAttachments.length}/{pendingAttachments.length} files ready
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
