import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { DriveFolderTree } from '@/types/drive'

interface FolderTreeProps {
  folders: DriveFolderTree[]
  selectedFolderId: number | null
  onSelectFolder: (folderId: number | null) => void
  isLoading?: boolean
}

interface FolderNodeProps {
  folder: DriveFolderTree
  level: number
  selectedFolderId: number | null
  expandedFolders: Set<number>
  onSelectFolder: (folderId: number | null) => void
  onToggleExpand: (folderId: number) => void
}

function FolderNode({
  folder,
  level,
  selectedFolderId,
  expandedFolders,
  onSelectFolder,
  onToggleExpand,
}: FolderNodeProps) {
  const isExpanded = expandedFolders.has(folder.id)
  const isSelected = selectedFolderId === folder.id
  const hasChildren = folder.children.length > 0

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleExpand(folder.id)
  }

  const handleSelect = () => {
    onSelectFolder(folder.id)
  }

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
          isSelected
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-accent text-foreground'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleSelect}
      >
        {/* Expand/collapse button */}
        <button
          onClick={handleToggle}
          className={cn(
            'p-0.5 rounded hover:bg-background/50 transition-colors',
            !hasChildren && 'opacity-0 pointer-events-none'
          )}
        >
          <svg
            className={cn(
              'w-3.5 h-3.5 text-muted-foreground transition-transform',
              isExpanded && 'rotate-90'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Folder icon */}
        <svg
          className={cn(
            'w-4 h-4 flex-shrink-0',
            isSelected ? 'text-primary' : 'text-amber-500'
          )}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          {isExpanded ? (
            <path d="M19.906 9c.382 0 .749.057 1.094.162V9a3 3 0 00-3-3h-3.879a.75.75 0 01-.53-.22L11.47 3.66A2.25 2.25 0 009.879 3H6a3 3 0 00-3 3v12a3 3 0 003 3h8.5a5.5 5.5 0 01-.5-2.293V12.5a3.5 3.5 0 013.5-3.5h2.406z" />
          ) : (
            <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
          )}
        </svg>

        {/* Folder name */}
        <span className="text-sm truncate flex-1">{folder.name}</span>

        {/* Children count badge */}
        {hasChildren && (
          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {folder.children.length}
          </span>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {folder.children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              expandedFolders={expandedFolders}
              onSelectFolder={onSelectFolder}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  isLoading,
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set())

  const handleToggleExpand = useCallback((folderId: number) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }, [])

  const handleSelectRoot = () => {
    onSelectFolder(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-4 h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse flex-1" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="py-2">
      {/* Root (Drive) */}
      <div
        className={cn(
          'group flex items-center gap-2 px-2 py-1.5 mx-2 rounded-md cursor-pointer transition-colors',
          selectedFolderId === null
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-accent text-foreground'
        )}
        onClick={handleSelectRoot}
      >
        <svg
          className={cn(
            'w-4 h-4 flex-shrink-0',
            selectedFolderId === null ? 'text-primary' : 'text-muted-foreground'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
          />
        </svg>
        <span className="text-sm font-medium">All Files</span>
      </div>

      {/* Folder tree */}
      <div className="mt-2 px-2">
        {folders.map((folder) => (
          <FolderNode
            key={folder.id}
            folder={folder}
            level={0}
            selectedFolderId={selectedFolderId}
            expandedFolders={expandedFolders}
            onSelectFolder={onSelectFolder}
            onToggleExpand={handleToggleExpand}
          />
        ))}
      </div>

      {/* Empty state */}
      {folders.length === 0 && (
        <div className="px-4 py-8 text-center">
          <svg
            className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3"
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
          <p className="text-sm text-muted-foreground">No folders yet</p>
        </div>
      )}
    </div>
  )
}
