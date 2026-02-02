import apiClient from './client'
import * as mockHandlers from '@/mocks/handlers'
import { isMockEnabled } from '@/mocks/delay'
import type {
  DriveFolder,
  DriveFile,
  DriveFolderTree,
  DriveStats,
  DriveSearchParams,
  FolderCreateDto,
  FolderUpdateDto,
  BreadcrumbItem,
  FileUploadRequest,
  FileUploadUrlResponse,
  FileConfirmUploadRequest,
  FileDownloadResponse,
  UploadProgress,
} from '@/types/drive'
import type { ApiResponse, PagedResponse } from '@/types/api'

/**
 * Drive API methods
 * Automatically switches between mock and real API based on VITE_USE_MOCK_API env variable
 */
export const driveApi = {
  // ============ Folder Operations ============

  /**
   * Get folder tree structure for sidebar navigation
   */
  async getFolderTree(): Promise<DriveFolderTree[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getFolderTree()
      return response.data
    }

    const response = await apiClient.get<ApiResponse<DriveFolderTree[]>>('/drive/folders/tree')
    return response.data.data
  },

  /**
   * Get folders in a specific parent (or root if parentId is null)
   */
  async getFolders(parentId?: number | null): Promise<DriveFolder[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getFolders(parentId)
      return response.data
    }

    const params = parentId !== undefined ? { parentId } : {}
    const response = await apiClient.get<ApiResponse<DriveFolder[]>>('/drive/folders', { params })
    return response.data.data
  },

  /**
   * Get a single folder by ID
   */
  async getFolderById(id: number): Promise<DriveFolder> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getFolderById(id)
      return response.data
    }

    const response = await apiClient.get<ApiResponse<DriveFolder>>(`/drive/folders/${id}`)
    return response.data.data
  },

  /**
   * Get breadcrumb trail for a folder
   */
  async getBreadcrumbs(folderId: number | null): Promise<BreadcrumbItem[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getBreadcrumbs(folderId)
      return response.data
    }

    const params = folderId !== null ? { folderId } : {}
    const response = await apiClient.get<ApiResponse<BreadcrumbItem[]>>('/drive/breadcrumbs', { params })
    return response.data.data
  },

  /**
   * Create a new folder
   */
  async createFolder(data: FolderCreateDto): Promise<DriveFolder> {
    if (isMockEnabled()) {
      const response = await mockHandlers.createFolder(data)
      return response.data
    }

    const response = await apiClient.post<ApiResponse<DriveFolder>>('/drive/folders', data)
    return response.data.data
  },

  /**
   * Rename a folder
   */
  async renameFolder(data: FolderUpdateDto): Promise<DriveFolder> {
    if (isMockEnabled()) {
      const response = await mockHandlers.renameFolder(data)
      return response.data
    }

    const response = await apiClient.put<ApiResponse<DriveFolder>>(`/drive/folders/${data.id}`, data)
    return response.data.data
  },

  /**
   * Delete a folder (and all contents)
   */
  async deleteFolder(id: number): Promise<void> {
    if (isMockEnabled()) {
      await mockHandlers.deleteFolder(id)
      return
    }

    await apiClient.delete(`/drive/folders/${id}`)
  },

  // ============ File Operations ============

  /**
   * Get files with pagination and filtering
   */
  async getFiles(params: DriveSearchParams): Promise<PagedResponse<DriveFile>> {
    if (isMockEnabled()) {
      return mockHandlers.getFiles(params)
    }

    const response = await apiClient.get<PagedResponse<DriveFile>>('/drive/files', { params })
    return response.data
  },

  /**
   * Get a single file by ID
   */
  async getFileById(id: number): Promise<DriveFile> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getFileById(id)
      return response.data
    }

    const response = await apiClient.get<ApiResponse<DriveFile>>(`/drive/files/${id}`)
    return response.data.data
  },

  /**
   * Get presigned URL for direct file upload
   */
  async getUploadUrl(request: FileUploadRequest): Promise<FileUploadUrlResponse> {
    if (isMockEnabled()) {
      // Mock presigned URL response
      return {
        upload_url: '#mock-upload-url',
        storage_key: `mock/files/${Date.now()}`,
        file_id: Date.now(),
        file_name: request.file_name,
        method: 'PUT',
        expires_in: 3600,
        headers: { 'Content-Type': request.mime_type },
      }
    }

    const response = await apiClient.post<FileUploadUrlResponse>('/drive/files/upload-url', request)
    return response.data
  },

  /**
   * Upload file directly to S3/MinIO using presigned URL
   */
  async uploadToPresignedUrl(
    url: string,
    file: File,
    contentType: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<void> {
    if (isMockEnabled()) {
      // Simulate upload progress for mocks
      if (onProgress) {
        const steps = [25, 50, 75, 100]
        for (const pct of steps) {
          await new Promise((r) => setTimeout(r, 100))
          onProgress({
            loaded: (file.size * pct) / 100,
            total: file.size,
            percentage: pct,
          })
        }
      }
      return
    }

    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          })
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed due to network error'))
      })

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was aborted'))
      })

      xhr.open('PUT', url)
      xhr.setRequestHeader('Content-Type', contentType)
      xhr.send(file)
    })
  },

  /**
   * Confirm file upload completed
   */
  async confirmUpload(fileId: number, contentHash?: string): Promise<DriveFile> {
    if (isMockEnabled()) {
      // Return mock file
      const response = await mockHandlers.getFileById(fileId)
      return response.data
    }

    const body: FileConfirmUploadRequest = contentHash ? { content_hash: contentHash } : {}
    const response = await apiClient.post<DriveFile>(`/drive/files/${fileId}/confirm`, body)
    return response.data
  },

  /**
   * Upload a file using presigned URL (complete flow)
   * This is the main method to use for file uploads
   */
  async uploadFile(
    folderId: number | null,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<DriveFile> {
    if (isMockEnabled()) {
      const response = await mockHandlers.uploadFile(folderId ?? 0, file.name, file.size, file.type)
      return response.data
    }

    // Step 1: Get presigned URL
    const uploadInfo = await this.getUploadUrl({
      folder_id: folderId,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || 'application/octet-stream',
    })

    // Step 2: Upload directly to S3/MinIO
    await this.uploadToPresignedUrl(
      uploadInfo.upload_url,
      file,
      uploadInfo.headers['Content-Type'] || file.type,
      onProgress
    )

    // Step 3: Confirm upload
    const driveFile = await this.confirmUpload(uploadInfo.file_id)
    return driveFile
  },

  /**
   * Rename a file
   */
  async renameFile(id: number, newName: string): Promise<DriveFile> {
    if (isMockEnabled()) {
      const response = await mockHandlers.renameFile(id, newName)
      return response.data
    }

    const response = await apiClient.put<ApiResponse<DriveFile>>(`/drive/files/${id}`, { name: newName })
    return response.data.data
  },

  /**
   * Delete a file
   */
  async deleteFile(id: number): Promise<void> {
    if (isMockEnabled()) {
      await mockHandlers.deleteFile(id)
      return
    }

    await apiClient.delete(`/drive/files/${id}`)
  },

  /**
   * Get download URL info for a file
   */
  async getDownloadUrl(id: number): Promise<FileDownloadResponse> {
    if (isMockEnabled()) {
      return {
        download_url: '#mock-download',
        file_name: 'mock-file.pdf',
        mime_type: 'application/pdf',
        size: 1024,
        expires_in: 3600,
      }
    }

    const response = await apiClient.get<FileDownloadResponse>(`/drive/files/${id}/download`)
    return response.data
  },

  /**
   * Download a file (returns presigned download URL)
   * Can be used directly in an anchor tag or window.open
   */
  async downloadFile(id: number): Promise<string> {
    if (isMockEnabled()) {
      return '#mock-download'
    }

    const downloadInfo = await this.getDownloadUrl(id)
    return downloadInfo.download_url
  },

  // ============ Stats ============

  /**
   * Get drive statistics
   */
  async getStats(): Promise<DriveStats> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getDriveStats()
      return response.data
    }

    const response = await apiClient.get<ApiResponse<DriveStats>>('/drive/stats')
    return response.data.data
  },
}
