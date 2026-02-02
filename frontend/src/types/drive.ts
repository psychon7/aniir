// Drive/File Management Types

export interface DriveFolder {
  id: number
  name: string
  parentId: number | null
  path: string
  createdAt: string
  updatedAt: string
  createdBy: number
  createdByName?: string
  fileCount: number
  subfolderCount: number
  size: number // total size in bytes
}

export interface DriveFile {
  id: number
  name: string
  folderId: number
  folderPath: string
  extension: string
  mimeType: string
  size: number // in bytes
  url: string
  thumbnailUrl?: string
  createdAt: string
  updatedAt: string
  createdBy: number
  createdByName?: string
  description?: string
  tags?: string[]
}

export interface DriveFolderTree {
  id: number
  name: string
  parentId: number | null
  path: string
  children: DriveFolderTree[]
  expanded?: boolean
}

export interface DriveStats {
  totalFiles: number
  totalFolders: number
  totalSize: number
  usedSpace: number
  availableSpace: number
}

export interface DriveSearchParams {
  folderId?: number
  search?: string
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  fileTypes?: string[] // filter by extension
}

export interface FolderCreateDto {
  name: string
  parentId: number | null
}

export interface FolderUpdateDto {
  id: number
  name: string
}

export interface FolderMoveDto {
  id: number
  newParentId: number | null
}

export interface FileUploadDto {
  file: File
  folderId: number
  description?: string
  tags?: string[]
}

export interface FileMoveDto {
  id: number
  newFolderId: number
}

export interface FileUpdateDto {
  id: number
  name: string
  description?: string
  tags?: string[]
}

export interface BreadcrumbItem {
  id: number | null
  name: string
  path: string
}

// Presigned URL Upload Types
export interface FileUploadRequest {
  folder_id: number | null
  file_name: string
  file_size: number
  mime_type: string
}

export interface FileUploadUrlResponse {
  upload_url: string
  storage_key: string
  file_id: number
  file_name: string
  method: string
  expires_in: number
  headers: Record<string, string>
}

export interface FileConfirmUploadRequest {
  content_hash?: string
}

export interface FileDownloadResponse {
  download_url: string
  file_name: string
  mime_type: string
  size: number
  expires_in: number
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}
