import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { DriveFile, DriveFolder } from '@/types/drive'

interface FileListProps {
  files: DriveFile[]
  folders: DriveFolder[]
  isLoading?: boolean
  viewMode: 'grid' | 'list'
  onFolderClick: (folderId: number) => void
  onFileClick: (file: DriveFile) => void
  onFileDownload: (file: DriveFile) => void
  onFileDelete: (file: DriveFile) => void
  onFolderDelete: (folder: DriveFolder) => void
  onFileRename: (file: DriveFile) => void
  onFolderRename: (folder: DriveFolder) => void
  onFilePreview?: (file: DriveFile) => void
}

// File type icons based on extension
function getFileIcon(extension: string) {
  const iconClass = 'w-10 h-10'

  switch (extension.toLowerCase()) {
    case 'pdf':
      return (
        <svg className={cn(iconClass, 'text-red-500')} fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM9.5 11h.5v6h-.5a2.5 2.5 0 010-5v-.5h.5v.5zm4.5 0h.5v6h-.5a2.5 2.5 0 010-5v-.5h.5v.5z" />
        </svg>
      )
    case 'doc':
    case 'docx':
      return (
        <svg className={cn(iconClass, 'text-blue-600')} fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 12h8v2H8v-2zm0 4h8v2H8v-2z" />
        </svg>
      )
    case 'xls':
    case 'xlsx':
      return (
        <svg className={cn(iconClass, 'text-green-600')} fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 13h3v2H8v-2zm5 0h3v2h-3v-2zm-5 3h3v2H8v-2zm5 0h3v2h-3v-2z" />
        </svg>
      )
    case 'ppt':
    case 'pptx':
      return (
        <svg className={cn(iconClass, 'text-orange-500')} fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11zM9 12h4a2 2 0 010 4H9v-4z" />
        </svg>
      )
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'svg':
      return (
        <svg className={cn(iconClass, 'text-purple-500')} fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      )
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return (
        <svg className={cn(iconClass, 'text-yellow-600')} fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zm-3 7h2v2h-2v2h2v2h-2v2h-2v-2h2v-2H8v-2h2v-2H8v-2h2v2z" />
        </svg>
      )
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
      return (
        <svg className={cn(iconClass, 'text-pink-500')} fill="currentColor" viewBox="0 0 24 24">
          <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
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
  })
}

interface ItemMenuProps {
  onRename: () => void
  onDelete: () => void
  onDownload?: () => void
  onPreview?: () => void
}

function ItemMenu({ onRename, onDelete, onDownload, onPreview }: ItemMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1.5 rounded-md hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
        data-testid="file-menu-button"
      >
        <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
            }}
          />
          <div className="absolute right-0 top-8 z-20 w-40 bg-popover border border-border rounded-lg shadow-lg py-1" data-testid="file-menu-dropdown">
            {onPreview && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onPreview()
                  setIsOpen(false)
                }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center gap-2"
                data-testid="preview-menu-item"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </button>
            )}
            {onDownload && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDownload()
                  setIsOpen(false)
                }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center gap-2"
                data-testid="download-menu-item"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRename()
                setIsOpen(false)
              }}
              className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center gap-2"
              data-testid="rename-menu-item"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Rename
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
                setIsOpen(false)
              }}
              className="w-full px-3 py-2 text-sm text-left text-destructive hover:bg-destructive/10 flex items-center gap-2"
              data-testid="delete-menu-item"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function FileList({
  files,
  folders,
  isLoading,
  viewMode,
  onFolderClick,
  onFileClick,
  onFileDownload,
  onFileDelete,
  onFolderDelete,
  onFileRename,
  onFolderRename,
  onFilePreview,
}: FileListProps) {
  if (isLoading) {
    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="p-4 rounded-lg border border-border">
              <div className="w-10 h-10 bg-muted rounded animate-pulse mx-auto mb-3" />
              <div className="h-4 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
            </div>
          ))}
        </div>
      )
    }
    return (
      <div className="divide-y divide-border">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 bg-muted rounded animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-muted rounded animate-pulse mb-2 w-1/3" />
              <div className="h-3 bg-muted rounded animate-pulse w-1/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const isEmpty = files.length === 0 && folders.length === 0

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <svg
          className="w-16 h-16 text-muted-foreground/50 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <h3 className="text-lg font-medium text-foreground mb-1">This folder is empty</h3>
        <p className="text-sm text-muted-foreground">Upload files or create a folder to get started</p>
      </div>
    )
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
        {/* Folders first */}
        {folders.map((folder) => (
          <div
            key={`folder-${folder.id}`}
            data-testid="file-item"
            className="group relative p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 cursor-pointer transition-all"
            onDoubleClick={() => onFolderClick(folder.id)}
          >
            <div className="absolute top-2 right-2">
              <ItemMenu
                onRename={() => onFolderRename(folder)}
                onDelete={() => onFolderDelete(folder)}
              />
            </div>
            <div className="flex flex-col items-center text-center">
              <svg
                className="w-12 h-12 text-amber-500 mb-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
              </svg>
              <p className="text-sm font-medium text-foreground truncate w-full">{folder.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {folder.fileCount} files
              </p>
            </div>
          </div>
        ))}

        {/* Then files */}
        {files.map((file) => (
          <div
            key={`file-${file.id}`}
            data-testid="file-item"
            className="group relative p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 cursor-pointer transition-all"
            onClick={() => onFileClick(file)}
          >
            <div className="absolute top-2 right-2">
              <ItemMenu
                onRename={() => onFileRename(file)}
                onDelete={() => onFileDelete(file)}
                onDownload={() => onFileDownload(file)}
                onPreview={onFilePreview ? () => onFilePreview(file) : undefined}
              />
            </div>
            <div className="flex flex-col items-center text-center">
              {getFileIcon(file.extension)}
              <p className="text-sm font-medium text-foreground truncate w-full mt-2">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // List view
  return (
    <div className="divide-y divide-border">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase bg-secondary/50">
        <div className="flex-1">Name</div>
        <div className="w-24 text-right">Size</div>
        <div className="w-32 text-right">Modified</div>
        <div className="w-10" />
      </div>

      {/* Folders */}
      {folders.map((folder) => (
        <div
          key={`folder-${folder.id}`}
          data-testid="file-item"
          className="group flex items-center gap-4 px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors"
          onDoubleClick={() => onFolderClick(folder.id)}
        >
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <svg
              className="w-8 h-8 text-amber-500 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
            </svg>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{folder.name}</p>
              <p className="text-xs text-muted-foreground">{folder.fileCount} files</p>
            </div>
          </div>
          <div className="w-24 text-right text-sm text-muted-foreground">
            {formatFileSize(folder.size)}
          </div>
          <div className="w-32 text-right text-sm text-muted-foreground">
            {formatDate(folder.updatedAt)}
          </div>
          <div className="w-10">
            <ItemMenu
              onRename={() => onFolderRename(folder)}
              onDelete={() => onFolderDelete(folder)}
            />
          </div>
        </div>
      ))}

      {/* Files */}
      {files.map((file) => (
        <div
          key={`file-${file.id}`}
          data-testid="file-item"
          className="group flex items-center gap-4 px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors"
          onClick={() => onFileClick(file)}
        >
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
              {getFileIcon(file.extension)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{file.extension.toUpperCase()}</p>
            </div>
          </div>
          <div className="w-24 text-right text-sm text-muted-foreground">
            {formatFileSize(file.size)}
          </div>
          <div className="w-32 text-right text-sm text-muted-foreground">
            {formatDate(file.updatedAt)}
          </div>
          <div className="w-10">
            <ItemMenu
              onRename={() => onFileRename(file)}
              onDelete={() => onFileDelete(file)}
              onDownload={() => onFileDownload(file)}
              onPreview={onFilePreview ? () => onFilePreview(file) : undefined}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
