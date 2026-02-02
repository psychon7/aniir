import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { DriveFile } from '@/types/drive'
import { driveApi } from '@/api/drive'

interface FilePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  file: DriveFile | null
  onDownload?: (file: DriveFile) => void
  onDelete?: (file: DriveFile) => void
  onRename?: (file: DriveFile) => void
}

// File categories for different preview types
type FileCategory = 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'code' | 'unsupported'

// Get the file category based on extension
function getFileCategory(extension: string): FileCategory {
  const ext = extension.toLowerCase()

  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
    return 'image'
  }

  // Videos
  if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext)) {
    return 'video'
  }

  // Audio
  if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(ext)) {
    return 'audio'
  }

  // PDF
  if (ext === 'pdf') {
    return 'pdf'
  }

  // Text files
  if (['txt', 'md', 'rtf', 'log'].includes(ext)) {
    return 'text'
  }

  // Code files
  if (['js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css', 'scss', 'less', 'xml', 'yaml', 'yml', 'py', 'rb', 'php', 'java', 'c', 'cpp', 'h', 'go', 'rs', 'sql', 'sh', 'bash'].includes(ext)) {
    return 'code'
  }

  return 'unsupported'
}

// Get language for code highlighting
function getCodeLanguage(extension: string): string {
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    json: 'json',
    html: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    py: 'python',
    rb: 'ruby',
    php: 'php',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    go: 'go',
    rs: 'rust',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    md: 'markdown',
  }
  return languageMap[extension.toLowerCase()] || 'plaintext'
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Format date
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// File type icons
function getFileIcon(category: FileCategory) {
  const iconClass = 'w-6 h-6'

  switch (category) {
    case 'image':
      return (
        <svg className={cn(iconClass, 'text-purple-500')} fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      )
    case 'video':
      return (
        <svg className={cn(iconClass, 'text-pink-500')} fill="currentColor" viewBox="0 0 24 24">
          <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
        </svg>
      )
    case 'audio':
      return (
        <svg className={cn(iconClass, 'text-green-500')} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      )
    case 'pdf':
      return (
        <svg className={cn(iconClass, 'text-red-500')} fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4z" />
        </svg>
      )
    case 'text':
    case 'code':
      return (
        <svg className={cn(iconClass, 'text-blue-500')} fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 12h8v2H8v-2zm0 4h8v2H8v-2z" />
        </svg>
      )
    default:
      return (
        <svg className={cn(iconClass, 'text-gray-400')} fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
        </svg>
      )
  }
}

// Image Preview Component
function ImagePreview({ url, alt }: { url: string; alt: string }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  return (
    <div className="flex items-center justify-center h-full bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden">
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {error ? (
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <svg className="w-16 h-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p>Failed to load image</p>
        </div>
      ) : (
        <img
          src={url}
          alt={alt}
          className={cn(
            'max-w-full max-h-full object-contain transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false)
            setError(true)
          }}
        />
      )}
    </div>
  )
}

// Video Preview Component
function VideoPreview({ url }: { url: string }) {
  return (
    <div className="flex items-center justify-center h-full bg-black rounded-lg overflow-hidden">
      <video
        src={url}
        controls
        className="max-w-full max-h-full"
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  )
}

// Audio Preview Component
function AudioPreview({ url, fileName }: { url: string; fileName: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
        <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>
      <p className="text-lg font-medium text-foreground mb-4 text-center">{fileName}</p>
      <audio src={url} controls className="w-full max-w-md">
        Your browser does not support the audio tag.
      </audio>
    </div>
  )
}

// PDF Preview Component
function PDFPreview({ url }: { url: string }) {
  return (
    <div className="h-full w-full bg-secondary/30 rounded-lg overflow-hidden">
      <iframe
        src={`${url}#toolbar=1&navpanes=0`}
        className="w-full h-full border-0"
        title="PDF Preview"
      />
    </div>
  )
}

// Text/Code Preview Component
function TextPreview({ url, language }: { url: string; language: string }) {
  const [content, setContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(url)
        if (!response.ok) throw new Error('Failed to fetch')
        const text = await response.text()
        setContent(text)
      } catch {
        setError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchContent()
  }, [url])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <svg className="w-16 h-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p>Failed to load file content</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full bg-secondary/30 rounded-lg overflow-hidden">
      <pre className="h-full overflow-auto p-4 text-sm font-mono text-foreground scrollbar-refined">
        <code className={`language-${language}`}>{content}</code>
      </pre>
    </div>
  )
}

// Unsupported Preview Component
function UnsupportedPreview({ file, onDownload }: { file: DriveFile; onDownload?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="w-24 h-24 bg-secondary rounded-2xl flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
        </svg>
      </div>
      <p className="text-lg font-medium text-foreground mb-2 text-center">{file.name}</p>
      <p className="text-sm text-muted-foreground mb-6 text-center">
        Preview not available for .{file.extension} files
      </p>
      {onDownload && (
        <button
          onClick={onDownload}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download to view
        </button>
      )}
    </div>
  )
}

export function FilePreviewModal({
  isOpen,
  onClose,
  file,
  onDownload,
  onDelete,
  onRename,
}: FilePreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  // Fetch preview URL when file changes
  useEffect(() => {
    if (!file || !isOpen) {
      setPreviewUrl(null)
      return
    }

    const fetchUrl = async () => {
      try {
        setIsLoadingUrl(true)
        // Use the file's URL directly if available, otherwise fetch download URL
        if (file.url) {
          setPreviewUrl(file.url)
        } else {
          const url = await driveApi.downloadFile(file.id)
          setPreviewUrl(url)
        }
      } catch {
        console.error('Failed to get preview URL')
        setPreviewUrl(null)
      } finally {
        setIsLoadingUrl(false)
      }
    }

    fetchUrl()
  }, [file, isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  if (!isOpen || !file) return null

  const category = getFileCategory(file.extension)

  const renderPreview = () => {
    if (isLoadingUrl) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )
    }

    if (!previewUrl) {
      return <UnsupportedPreview file={file} onDownload={onDownload ? () => onDownload(file) : undefined} />
    }

    switch (category) {
      case 'image':
        return <ImagePreview url={previewUrl} alt={file.name} />
      case 'video':
        return <VideoPreview url={previewUrl} />
      case 'audio':
        return <AudioPreview url={previewUrl} fileName={file.name} />
      case 'pdf':
        return <PDFPreview url={previewUrl} />
      case 'text':
      case 'code':
        return <TextPreview url={previewUrl} language={getCodeLanguage(file.extension)} />
      default:
        return <UnsupportedPreview file={file} onDownload={onDownload ? () => onDownload(file) : undefined} />
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      data-testid="file-preview-modal"
    >
      {/* Main container */}
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            {getFileIcon(category)}
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground truncate">{file.name}</h2>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)} • {file.extension.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Info toggle */}
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                showInfo ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
              aria-label="Toggle file info"
              title="File info"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Download */}
            {onDownload && (
              <button
                onClick={() => onDownload(file)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Download"
                title="Download"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            )}

            {/* Rename */}
            {onRename && (
              <button
                onClick={() => onRename(file)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Rename"
                title="Rename"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}

            {/* Delete */}
            {onDelete && (
              <button
                onClick={() => onDelete(file)}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                aria-label="Delete"
                title="Delete"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ml-2"
              aria-label="Close"
              data-testid="close-preview"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Preview */}
          <div className={cn('flex-1 p-4 overflow-hidden', showInfo && 'pr-0')}>
            <div className="h-full relative">
              {renderPreview()}
            </div>
          </div>

          {/* Info sidebar */}
          {showInfo && (
            <div className="w-72 border-l border-border bg-card/50 p-4 overflow-y-auto scrollbar-refined">
              <h3 className="text-sm font-semibold text-foreground mb-4">File Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Name</p>
                  <p className="text-sm text-foreground break-words">{file.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Type</p>
                  <p className="text-sm text-foreground">{file.mimeType || file.extension.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Size</p>
                  <p className="text-sm text-foreground">{formatFileSize(file.size)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Location</p>
                  <p className="text-sm text-foreground">{file.folderPath || '/'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm text-foreground">{formatDate(file.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Modified</p>
                  <p className="text-sm text-foreground">{formatDate(file.updatedAt)}</p>
                </div>
                {file.createdByName && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Uploaded by</p>
                    <p className="text-sm text-foreground">{file.createdByName}</p>
                  </div>
                )}
                {file.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm text-foreground">{file.description}</p>
                  </div>
                )}
                {file.tags && file.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {file.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
