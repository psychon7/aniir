import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { driveApi } from '@/api/drive'
import type { DriveSearchParams, FolderCreateDto, FolderUpdateDto } from '@/types/drive'

// Query keys
export const driveKeys = {
  all: ['drive'] as const,
  // Folder keys
  folders: () => [...driveKeys.all, 'folders'] as const,
  folderTree: () => [...driveKeys.folders(), 'tree'] as const,
  folderList: (parentId?: number | null) => [...driveKeys.folders(), 'list', parentId] as const,
  folderDetail: (id: number) => [...driveKeys.folders(), 'detail', id] as const,
  breadcrumbs: (folderId: number | null) => [...driveKeys.all, 'breadcrumbs', folderId] as const,
  // File keys
  files: () => [...driveKeys.all, 'files'] as const,
  fileList: (params: DriveSearchParams) => [...driveKeys.files(), 'list', params] as const,
  fileDetail: (id: number) => [...driveKeys.files(), 'detail', id] as const,
  // Stats keys
  stats: () => [...driveKeys.all, 'stats'] as const,
}

// ============ Folder Hooks ============

/**
 * Hook to fetch the folder tree structure
 */
export function useFolderTree() {
  return useQuery({
    queryKey: driveKeys.folderTree(),
    queryFn: () => driveApi.getFolderTree(),
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
  })
}

/**
 * Hook to fetch folders in a specific parent
 */
export function useFolders(parentId?: number | null) {
  return useQuery({
    queryKey: driveKeys.folderList(parentId),
    queryFn: () => driveApi.getFolders(parentId),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch a single folder by ID
 */
export function useFolder(id: number) {
  return useQuery({
    queryKey: driveKeys.folderDetail(id),
    queryFn: () => driveApi.getFolderById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch breadcrumbs for a folder
 */
export function useBreadcrumbs(folderId: number | null) {
  return useQuery({
    queryKey: driveKeys.breadcrumbs(folderId),
    queryFn: () => driveApi.getBreadcrumbs(folderId),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to create a new folder
 */
export function useCreateFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: FolderCreateDto) => driveApi.createFolder(data),
    onSuccess: (newFolder) => {
      // Invalidate folder tree and list queries
      queryClient.invalidateQueries({ queryKey: driveKeys.folderTree() })
      queryClient.invalidateQueries({ queryKey: driveKeys.folderList(newFolder.parentId) })
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: driveKeys.stats() })
    },
  })
}

/**
 * Hook to rename a folder
 */
export function useRenameFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: FolderUpdateDto) => driveApi.renameFolder(data),
    onSuccess: (updatedFolder) => {
      // Update folder in cache
      queryClient.setQueryData(driveKeys.folderDetail(updatedFolder.id), updatedFolder)
      // Invalidate folder tree and list queries
      queryClient.invalidateQueries({ queryKey: driveKeys.folderTree() })
      queryClient.invalidateQueries({ queryKey: driveKeys.folderList(updatedFolder.parentId) })
      // Invalidate breadcrumbs
      queryClient.invalidateQueries({ queryKey: driveKeys.breadcrumbs(updatedFolder.id) })
    },
  })
}

/**
 * Hook to delete a folder
 */
export function useDeleteFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => driveApi.deleteFolder(id),
    onSuccess: (_, deletedId) => {
      // Remove folder from cache
      queryClient.removeQueries({ queryKey: driveKeys.folderDetail(deletedId) })
      // Invalidate folder tree and all folder lists
      queryClient.invalidateQueries({ queryKey: driveKeys.folderTree() })
      queryClient.invalidateQueries({ queryKey: driveKeys.folders() })
      // Invalidate files since files in this folder are deleted
      queryClient.invalidateQueries({ queryKey: driveKeys.files() })
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: driveKeys.stats() })
    },
  })
}

// ============ File Hooks ============

/**
 * Hook to fetch paginated list of files
 */
export function useFiles(params: DriveSearchParams) {
  return useQuery({
    queryKey: driveKeys.fileList(params),
    queryFn: () => driveApi.getFiles(params),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch a single file by ID
 */
export function useFile(id: number) {
  return useQuery({
    queryKey: driveKeys.fileDetail(id),
    queryFn: () => driveApi.getFileById(id),
    enabled: !!id,
  })
}

/**
 * Hook to upload a file
 */
export function useUploadFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ folderId, file }: { folderId: number; file: File }) =>
      driveApi.uploadFile(folderId, file),
    onSuccess: (newFile) => {
      // Invalidate file lists for this folder
      queryClient.invalidateQueries({ queryKey: driveKeys.files() })
      // Invalidate folder details (file count changed)
      queryClient.invalidateQueries({ queryKey: driveKeys.folderDetail(newFile.folderId) })
      queryClient.invalidateQueries({ queryKey: driveKeys.folderTree() })
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: driveKeys.stats() })
    },
  })
}

/**
 * Hook to rename a file
 */
export function useRenameFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, newName }: { id: number; newName: string }) =>
      driveApi.renameFile(id, newName),
    onSuccess: (updatedFile) => {
      // Update file in cache
      queryClient.setQueryData(driveKeys.fileDetail(updatedFile.id), updatedFile)
      // Invalidate file lists
      queryClient.invalidateQueries({ queryKey: driveKeys.files() })
    },
  })
}

/**
 * Hook to delete a file
 */
export function useDeleteFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => driveApi.deleteFile(id),
    onSuccess: (_, deletedId) => {
      // Remove file from cache
      queryClient.removeQueries({ queryKey: driveKeys.fileDetail(deletedId) })
      // Invalidate file lists and folder tree (file count changed)
      queryClient.invalidateQueries({ queryKey: driveKeys.files() })
      queryClient.invalidateQueries({ queryKey: driveKeys.folders() })
      queryClient.invalidateQueries({ queryKey: driveKeys.folderTree() })
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: driveKeys.stats() })
    },
  })
}

/**
 * Hook to download a file
 */
export function useDownloadFile() {
  return useMutation({
    mutationFn: async ({ id, fileName }: { id: number; fileName: string }) => {
      const url = await driveApi.downloadFile(id)
      // Create and click a download link
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      // Cleanup blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 100)
    },
  })
}

// ============ Stats Hooks ============

/**
 * Hook to fetch drive statistics
 */
export function useDriveStats() {
  return useQuery({
    queryKey: driveKeys.stats(),
    queryFn: () => driveApi.getStats(),
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
  })
}
