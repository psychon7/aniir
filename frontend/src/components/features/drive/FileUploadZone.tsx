import { useState, useCallback, useRef, type DragEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void
  children: ReactNode
  className?: string
  disabled?: boolean
  accept?: string
  maxSizeBytes?: number
  maxFiles?: number
}

interface UploadError {
  file: string
  reason: string
}

// File type validation
const DEFAULT_ACCEPTED_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/gzip',
  // Videos
  'video/mp4',
  'video/avi',
  'video/quicktime',
  'video/x-ms-wmv',
]

// 50MB default max file size
const DEFAULT_MAX_SIZE = 50 * 1024 * 1024

// 10 files max by default
const DEFAULT_MAX_FILES = 10

export function FileUploadZone({
  onFilesSelected,
  children,
  className,
  disabled = false,
  accept,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  maxFiles = DEFAULT_MAX_FILES,
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [errors, setErrors] = useState<UploadError[]>([])
  const dragCounter = useRef(0)

  // Validate files
  const validateFiles = useCallback(
    (files: File[]): { valid: File[]; errors: UploadError[] } => {
      const valid: File[] = []
      const validationErrors: UploadError[] = []

      // Check max files limit
      if (files.length > maxFiles) {
        validationErrors.push({
          file: 'Multiple files',
          reason: `Maximum ${maxFiles} files can be uploaded at once`,
        })
        // Only take first maxFiles files
        files = files.slice(0, maxFiles)
      }

      for (const file of files) {
        // Check file size
        if (file.size > maxSizeBytes) {
          const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024))
          validationErrors.push({
            file: file.name,
            reason: `File exceeds maximum size of ${maxSizeMB}MB`,
          })
          continue
        }

        // Check file type
        const acceptedTypes = accept ? accept.split(',').map((t) => t.trim()) : DEFAULT_ACCEPTED_TYPES
        const isValidType =
          acceptedTypes.includes(file.type) ||
          acceptedTypes.some((type) => {
            // Handle wildcards like image/*
            if (type.endsWith('/*')) {
              const category = type.replace('/*', '')
              return file.type.startsWith(category)
            }
            // Handle extension checks like .pdf
            if (type.startsWith('.')) {
              return file.name.toLowerCase().endsWith(type.toLowerCase())
            }
            return false
          })

        if (!isValidType && accept) {
          validationErrors.push({
            file: file.name,
            reason: 'File type not allowed',
          })
          continue
        }

        valid.push(file)
      }

      return { valid, errors: validationErrors }
    },
    [accept, maxSizeBytes, maxFiles]
  )

  // Handle drag events
  const handleDragEnter = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()

      if (disabled) return

      dragCounter.current++
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragOver(true)
      }
    },
    [disabled]
  )

  const handleDragLeave = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()

      if (disabled) return

      dragCounter.current--
      if (dragCounter.current === 0) {
        setIsDragOver(false)
      }
    },
    [disabled]
  )

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()

      if (disabled) return

      e.dataTransfer.dropEffect = 'copy'
    },
    [disabled]
  )

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()

      if (disabled) return

      setIsDragOver(false)
      dragCounter.current = 0

      const droppedFiles = Array.from(e.dataTransfer.files)
      if (droppedFiles.length === 0) return

      const { valid, errors: validationErrors } = validateFiles(droppedFiles)

      if (validationErrors.length > 0) {
        setErrors(validationErrors)
        // Clear errors after 5 seconds
        setTimeout(() => setErrors([]), 5000)
      }

      if (valid.length > 0) {
        onFilesSelected(valid)
      }
    },
    [disabled, validateFiles, onFilesSelected]
  )

  // Dismiss error
  const dismissErrors = useCallback(() => {
    setErrors([])
  }, [])

  return (
    <div
      className={cn('relative', className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      data-testid="file-upload-zone"
    >
      {/* Main content */}
      {children}

      {/* Drag overlay */}
      {isDragOver && !disabled && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary rounded-lg transition-all"
          data-testid="drop-overlay"
        >
          <div className="flex flex-col items-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">Drop files here</p>
            <p className="text-sm text-muted-foreground">
              Release to upload your files
            </p>
          </div>
        </div>
      )}

      {/* Error toast */}
      {errors.length > 0 && (
        <div
          className="absolute top-4 right-4 z-50 max-w-sm"
          data-testid="upload-errors"
        >
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-destructive"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-destructive mb-2">
                  Upload errors
                </p>
                <ul className="text-sm text-destructive/80 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="truncate">
                      <span className="font-medium">{error.file}:</span> {error.reason}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={dismissErrors}
                className="flex-shrink-0 text-destructive/60 hover:text-destructive transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Export a hook for easier integration with file input
export function useFileUpload(options: {
  onFilesSelected: (files: File[]) => void
  maxSizeBytes?: number
  maxFiles?: number
  accept?: string
}) {
  const { onFilesSelected, maxSizeBytes = DEFAULT_MAX_SIZE, maxFiles = DEFAULT_MAX_FILES, accept } = options
  const inputRef = useRef<HTMLInputElement>(null)

  const openFilePicker = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      const fileArray = Array.from(files)

      // Validate file count
      if (fileArray.length > maxFiles) {
        console.warn(`Selected ${fileArray.length} files, but max is ${maxFiles}`)
      }

      // Validate file sizes
      const validFiles = fileArray.filter((file) => {
        if (file.size > maxSizeBytes) {
          console.warn(`File ${file.name} exceeds max size`)
          return false
        }
        return true
      }).slice(0, maxFiles)

      if (validFiles.length > 0) {
        onFilesSelected(validFiles)
      }

      // Reset input
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    },
    [onFilesSelected, maxSizeBytes, maxFiles]
  )

  const FileInput = useCallback(
    () => (
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={handleChange}
        data-testid="file-input"
      />
    ),
    [accept, handleChange]
  )

  return { openFilePicker, FileInput, inputRef }
}
