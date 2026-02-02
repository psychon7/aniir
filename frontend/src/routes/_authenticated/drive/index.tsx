import { useState, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { useToast } from '@/components/ui/feedback/Toast'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { FolderTree } from '@/components/features/drive/FolderTree'
import { FileList } from '@/components/features/drive/FileList'
import { DriveHeader } from '@/components/features/drive/DriveHeader'
import { FolderDialog } from '@/components/features/drive/FolderDialog'
import { FileUploadZone, useFileUpload } from '@/components/features/drive/FileUploadZone'
import { FilePreviewModal } from '@/components/features/drive/FilePreviewModal'
import {
  useFolderTree,
  useFolders,
  useFiles,
  useBreadcrumbs,
  useCreateFolder,
  useRenameFolder,
  useDeleteFolder,
  useUploadFile,
  useDeleteFile,
  useRenameFile,
  useDownloadFile,
  useDriveStats,
} from '@/hooks/useDrive'
import type { DriveFile, DriveFolder, DriveSearchParams } from '@/types/drive'

export const Route = createFileRoute('/_authenticated/drive/')({
  component: DrivePage,
})

function DrivePage() {
  const { t } = useTranslation()
  const { success, error: showError } = useToast()

  // State
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchParams, setSearchParams] = useState<DriveSearchParams>({
    page: 1,
    pageSize: 50,
    sortBy: 'name',
    sortOrder: 'asc',
  })

  // Dialog states
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<DriveFolder | null>(null)
  const [deletingFolder, setDeletingFolder] = useState<DriveFolder | null>(null)
  const [deletingFile, setDeletingFile] = useState<DriveFile | null>(null)
  const [renamingFile, setRenamingFile] = useState<DriveFile | null>(null)
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null)

  // Data fetching
  const { data: folderTree = [], isLoading: isLoadingTree } = useFolderTree()
  const { data: subfolders = [], isLoading: isLoadingFolders } = useFolders(currentFolderId)
  const { data: filesData, isLoading: isLoadingFiles } = useFiles({
    ...searchParams,
    folderId: currentFolderId ?? undefined,
  })
  const { data: breadcrumbs = [], isLoading: isLoadingBreadcrumbs } = useBreadcrumbs(currentFolderId)
  const { data: stats } = useDriveStats()

  // Mutations
  const createFolderMutation = useCreateFolder()
  const renameFolderMutation = useRenameFolder()
  const deleteFolderMutation = useDeleteFolder()
  const uploadFileMutation = useUploadFile()
  const deleteFileMutation = useDeleteFile()
  const renameFileMutation = useRenameFile()
  const downloadFileMutation = useDownloadFile()

  // Handlers
  const handleSelectFolder = useCallback((folderId: number | null) => {
    setCurrentFolderId(folderId)
    setSearchParams((prev) => ({ ...prev, page: 1 }))
  }, [])

  const handleNavigateBreadcrumb = useCallback((folderId: number | null) => {
    setCurrentFolderId(folderId)
    setSearchParams((prev) => ({ ...prev, page: 1 }))
  }, [])

  const handleCreateFolder = useCallback(() => {
    setEditingFolder(null)
    setFolderDialogOpen(true)
  }, [])

  const handleRenameFolder = useCallback((folder: DriveFolder) => {
    setEditingFolder(folder)
    setFolderDialogOpen(true)
  }, [])

  const handleFolderDialogSubmit = useCallback(async (name: string) => {
    try {
      if (editingFolder) {
        await renameFolderMutation.mutateAsync({ id: editingFolder.id, name })
        success(t('drive.folderRenamed'), t('drive.folderRenamedMessage', { name }))
      } else {
        await createFolderMutation.mutateAsync({ name, parentId: currentFolderId })
        success(t('drive.folderCreated'), t('drive.folderCreatedMessage', { name }))
      }
      setFolderDialogOpen(false)
      setEditingFolder(null)
    } catch (err) {
      showError(t('common.error'), err instanceof Error ? err.message : t('common.errorOccurred'))
    }
  }, [editingFolder, currentFolderId, createFolderMutation, renameFolderMutation, success, showError, t])

  const handleDeleteFolder = useCallback(async () => {
    if (!deletingFolder) return
    try {
      await deleteFolderMutation.mutateAsync(deletingFolder.id)
      success(t('drive.folderDeleted'), t('drive.folderDeletedMessage', { name: deletingFolder.name }))
      setDeletingFolder(null)
    } catch (err) {
      showError(t('common.error'), t('drive.failedDeleteFolder'))
    }
  }, [deletingFolder, deleteFolderMutation, success, showError, t])

  // Upload files handler (used by both drag & drop and file picker)
  const handleFilesUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return

    const targetFolderId = currentFolderId ?? 1 // Default to first folder if at root

    try {
      for (const file of files) {
        await uploadFileMutation.mutateAsync({ folderId: targetFolderId, file })
      }
      success(t('drive.filesUploaded'), t('drive.filesUploadedMessage', { count: files.length }))
    } catch (err) {
      showError(t('drive.uploadFailed'), t('drive.failedUploadFiles'))
    }
  }, [currentFolderId, uploadFileMutation, success, showError, t])

  // File upload hook for button click
  const { openFilePicker, FileInput } = useFileUpload({
    onFilesSelected: handleFilesUpload,
  })

  const handleFileClick = useCallback((file: DriveFile) => {
    // Open the file preview modal
    setPreviewFile(file)
  }, [])

  const handleFileDownload = useCallback((file: DriveFile) => {
    downloadFileMutation.mutate({ id: file.id, fileName: file.name })
  }, [downloadFileMutation])

  const handleFileRename = useCallback((file: DriveFile) => {
    setRenamingFile(file)
  }, [])

  const handleRenameFileSubmit = useCallback(async (newName: string) => {
    if (!renamingFile) return
    try {
      await renameFileMutation.mutateAsync({ id: renamingFile.id, newName })
      success(t('drive.fileRenamed'), t('drive.fileRenamedMessage', { name: newName }))
      setRenamingFile(null)
    } catch (err) {
      showError(t('common.error'), err instanceof Error ? err.message : t('drive.failedRenameFile'))
    }
  }, [renamingFile, renameFileMutation, success, showError, t])

  const handleDeleteFile = useCallback(async () => {
    if (!deletingFile) return
    try {
      await deleteFileMutation.mutateAsync(deletingFile.id)
      success(t('drive.fileDeleted'), t('drive.fileDeletedMessage', { name: deletingFile.name }))
      setDeletingFile(null)
    } catch (err) {
      showError(t('common.error'), t('drive.failedDeleteFile'))
    }
  }, [deletingFile, deleteFileMutation, success, showError, t])

  // Format size helper
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const isLoading = isLoadingFolders || isLoadingFiles

  return (
    <PageContainer>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Page header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{t('nav.drive')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('drive.subtitle')}
            </p>
          </div>
          {stats && (
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                {formatSize(stats.usedSpace)} {t('drive.used')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('drive.statsMessage', { files: stats.totalFiles, folders: stats.totalFolders })}
              </p>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex flex-1 gap-4 min-h-0 overflow-hidden">
          {/* Sidebar - Folder tree */}
          <div className="w-64 flex-shrink-0 bg-card border border-border rounded-lg overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">{t('drive.folders')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-refined">
              <FolderTree
                folders={folderTree}
                selectedFolderId={currentFolderId}
                onSelectFolder={handleSelectFolder}
                isLoading={isLoadingTree}
              />
            </div>
          </div>

          {/* Main area - File list */}
          <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden flex flex-col min-w-0">
            {/* Header with breadcrumbs and actions */}
            <DriveHeader
              breadcrumbs={breadcrumbs}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onNavigate={handleNavigateBreadcrumb}
              onCreateFolder={handleCreateFolder}
              onUploadFile={openFilePicker}
              isLoading={isLoadingBreadcrumbs}
            />

            {/* File list with drag & drop zone */}
            <FileUploadZone
              onFilesSelected={handleFilesUpload}
              className="flex-1 overflow-y-auto scrollbar-refined"
              disabled={uploadFileMutation.isPending}
            >
              <FileList
                files={filesData?.data || []}
                folders={subfolders.filter((f) => f.parentId === currentFolderId)}
                isLoading={isLoading}
                viewMode={viewMode}
                onFolderClick={handleSelectFolder}
                onFileClick={handleFileClick}
                onFileDownload={handleFileDownload}
                onFileDelete={(file) => setDeletingFile(file)}
                onFolderDelete={(folder) => setDeletingFolder(folder)}
                onFileRename={handleFileRename}
                onFolderRename={handleRenameFolder}
                onFilePreview={(file) => setPreviewFile(file)}
              />
            </FileUploadZone>
          </div>
        </div>
      </div>

      {/* Hidden file input for upload */}
      <FileInput />

      {/* Create/Rename Folder Dialog */}
      <FolderDialog
        isOpen={folderDialogOpen}
        onClose={() => {
          setFolderDialogOpen(false)
          setEditingFolder(null)
        }}
        onSubmit={handleFolderDialogSubmit}
        folder={editingFolder}
        isLoading={createFolderMutation.isPending || renameFolderMutation.isPending}
      />

      {/* Rename File Dialog - reusing FolderDialog with some adjustments */}
      {renamingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setRenamingFile(null)}
          />
          <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-md mx-4 animate-scale-in">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const name = formData.get('name') as string
                if (name.trim()) {
                  handleRenameFileSubmit(name.trim())
                }
              }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">{t('drive.renameFile')}</h2>
                <button
                  type="button"
                  onClick={() => setRenamingFile(null)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-6 py-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('drive.fileName')}
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={renamingFile.name}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-secondary/30">
                <button
                  type="button"
                  onClick={() => setRenamingFile(null)}
                  className="btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {t('drive.rename')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Folder Confirmation */}
      <DeleteConfirmDialog
        isOpen={!!deletingFolder}
        onClose={() => setDeletingFolder(null)}
        onConfirm={handleDeleteFolder}
        itemName={deletingFolder?.name || t('drive.thisFolder')}
        isLoading={deleteFolderMutation.isPending}
      />

      {/* Delete File Confirmation */}
      <DeleteConfirmDialog
        isOpen={!!deletingFile}
        onClose={() => setDeletingFile(null)}
        onConfirm={handleDeleteFile}
        itemName={deletingFile?.name || t('drive.thisFile')}
        isLoading={deleteFileMutation.isPending}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
        onDownload={(file) => {
          downloadFileMutation.mutate({ id: file.id, fileName: file.name })
        }}
        onRename={(file) => {
          setPreviewFile(null)
          setRenamingFile(file)
        }}
        onDelete={(file) => {
          setPreviewFile(null)
          setDeletingFile(file)
        }}
      />
    </PageContainer>
  )
}
