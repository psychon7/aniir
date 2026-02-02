import { delay } from '../delay'
import { mockFolders, mockFiles, buildFolderTree, getNextFolderId, getNextFileId } from '../data/drive'
import type {
  DriveFolder,
  DriveFile,
  DriveFolderTree,
  DriveStats,
  DriveSearchParams,
  FolderCreateDto,
  FolderUpdateDto,
  BreadcrumbItem,
} from '@/types/drive'
import type { ApiResponse, PagedResponse } from '@/types/api'

// In-memory data store (mutated by CRUD operations)
let folders = [...mockFolders]
let files = [...mockFiles]

/**
 * Get folder tree structure
 */
export async function getFolderTree(): Promise<ApiResponse<DriveFolderTree[]>> {
  await delay(300)
  return {
    success: true,
    data: buildFolderTree(folders),
  }
}

/**
 * Get all folders (flat list)
 */
export async function getFolders(parentId?: number | null): Promise<ApiResponse<DriveFolder[]>> {
  await delay(250)

  let result = [...folders]
  if (parentId !== undefined) {
    result = result.filter((f) => f.parentId === parentId)
  }

  result.sort((a, b) => a.name.localeCompare(b.name))

  return {
    success: true,
    data: result,
  }
}

/**
 * Get a single folder by ID
 */
export async function getFolderById(id: number): Promise<ApiResponse<DriveFolder>> {
  await delay(200)

  const folder = folders.find((f) => f.id === id)
  if (!folder) {
    throw new Error(`Folder with ID ${id} not found`)
  }

  return {
    success: true,
    data: folder,
  }
}

/**
 * Get breadcrumb path for a folder
 */
export async function getBreadcrumbs(folderId: number | null): Promise<ApiResponse<BreadcrumbItem[]>> {
  await delay(150)

  const breadcrumbs: BreadcrumbItem[] = [{ id: null, name: 'Drive', path: '/' }]

  if (folderId === null) {
    return { success: true, data: breadcrumbs }
  }

  const buildPath = (id: number): void => {
    const folder = folders.find((f) => f.id === id)
    if (folder) {
      if (folder.parentId !== null) {
        buildPath(folder.parentId)
      }
      breadcrumbs.push({
        id: folder.id,
        name: folder.name,
        path: folder.path,
      })
    }
  }

  buildPath(folderId)

  return {
    success: true,
    data: breadcrumbs,
  }
}

/**
 * Create a new folder
 */
export async function createFolder(dto: FolderCreateDto): Promise<ApiResponse<DriveFolder>> {
  await delay(400)

  // Check if folder name already exists in parent
  const exists = folders.some(
    (f) => f.parentId === dto.parentId && f.name.toLowerCase() === dto.name.toLowerCase()
  )
  if (exists) {
    throw new Error('A folder with this name already exists')
  }

  // Build path
  let path = '/' + dto.name
  if (dto.parentId !== null) {
    const parent = folders.find((f) => f.id === dto.parentId)
    if (parent) {
      path = parent.path + '/' + dto.name
    }
  }

  const newFolder: DriveFolder = {
    id: getNextFolderId(),
    name: dto.name,
    parentId: dto.parentId,
    path,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 1,
    createdByName: 'Current User',
    fileCount: 0,
    subfolderCount: 0,
    size: 0,
  }

  folders.push(newFolder)

  // Update parent's subfolder count
  if (dto.parentId !== null) {
    const parentIndex = folders.findIndex((f) => f.id === dto.parentId)
    if (parentIndex !== -1) {
      folders[parentIndex] = {
        ...folders[parentIndex],
        subfolderCount: folders[parentIndex].subfolderCount + 1,
        updatedAt: new Date().toISOString(),
      }
    }
  }

  return {
    success: true,
    data: newFolder,
    message: 'Folder created successfully',
  }
}

/**
 * Rename a folder
 */
export async function renameFolder(dto: FolderUpdateDto): Promise<ApiResponse<DriveFolder>> {
  await delay(300)

  const index = folders.findIndex((f) => f.id === dto.id)
  if (index === -1) {
    throw new Error(`Folder with ID ${dto.id} not found`)
  }

  const folder = folders[index]

  // Check if new name already exists in same parent
  const exists = folders.some(
    (f) => f.id !== dto.id && f.parentId === folder.parentId && f.name.toLowerCase() === dto.name.toLowerCase()
  )
  if (exists) {
    throw new Error('A folder with this name already exists')
  }

  // Update path for this folder and all children
  const oldPath = folder.path
  const pathParts = oldPath.split('/')
  pathParts[pathParts.length - 1] = dto.name
  const newPath = pathParts.join('/')

  const updatePaths = (oldPrefix: string, newPrefix: string) => {
    folders = folders.map((f) => {
      if (f.path.startsWith(oldPrefix + '/') || f.path === oldPrefix) {
        return {
          ...f,
          path: f.path.replace(oldPrefix, newPrefix),
          updatedAt: new Date().toISOString(),
        }
      }
      return f
    })

    files = files.map((f) => {
      if (f.folderPath.startsWith(oldPrefix + '/') || f.folderPath === oldPrefix) {
        return {
          ...f,
          folderPath: f.folderPath.replace(oldPrefix, newPrefix),
          updatedAt: new Date().toISOString(),
        }
      }
      return f
    })
  }

  updatePaths(oldPath, newPath)

  const updated: DriveFolder = {
    ...folders[index],
    name: dto.name,
    path: newPath,
    updatedAt: new Date().toISOString(),
  }

  folders[index] = updated

  return {
    success: true,
    data: updated,
    message: 'Folder renamed successfully',
  }
}

/**
 * Delete a folder (and all contents)
 */
export async function deleteFolder(id: number): Promise<ApiResponse<void>> {
  await delay(400)

  const folder = folders.find((f) => f.id === id)
  if (!folder) {
    throw new Error(`Folder with ID ${id} not found`)
  }

  // Get all descendant folders
  const getDescendantIds = (parentId: number): number[] => {
    const children = folders.filter((f) => f.parentId === parentId)
    let ids = children.map((c) => c.id)
    children.forEach((child) => {
      ids = ids.concat(getDescendantIds(child.id))
    })
    return ids
  }

  const folderIdsToDelete = [id, ...getDescendantIds(id)]

  // Delete files in these folders
  files = files.filter((f) => !folderIdsToDelete.includes(f.folderId))

  // Delete folders
  folders = folders.filter((f) => !folderIdsToDelete.includes(f.id))

  // Update parent's subfolder count
  if (folder.parentId !== null) {
    const parentIndex = folders.findIndex((f) => f.id === folder.parentId)
    if (parentIndex !== -1) {
      folders[parentIndex] = {
        ...folders[parentIndex],
        subfolderCount: Math.max(0, folders[parentIndex].subfolderCount - 1),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  return {
    success: true,
    data: undefined,
    message: 'Folder deleted successfully',
  }
}

/**
 * Get files with pagination and filtering
 */
export async function getFiles(params: DriveSearchParams): Promise<PagedResponse<DriveFile>> {
  await delay(350)

  let filtered = [...files]

  // Filter by folder
  if (params.folderId !== undefined) {
    filtered = filtered.filter((f) => f.folderId === params.folderId)
  }

  // Apply search filter
  if (params.search) {
    const search = params.search.toLowerCase()
    filtered = filtered.filter(
      (f) =>
        f.name.toLowerCase().includes(search) ||
        f.description?.toLowerCase().includes(search) ||
        f.tags?.some((t) => t.toLowerCase().includes(search))
    )
  }

  // Apply file type filter
  if (params.fileTypes && params.fileTypes.length > 0) {
    filtered = filtered.filter((f) => params.fileTypes!.includes(f.extension))
  }

  // Apply sorting
  const sortBy = params.sortBy || 'name'
  const sortOrder = params.sortOrder || 'asc'
  filtered.sort((a, b) => {
    let aVal: string | number = a[sortBy as keyof DriveFile] as string | number
    let bVal: string | number = b[sortBy as keyof DriveFile] as string | number

    if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      aVal = new Date(aVal as string).getTime()
      bVal = new Date(bVal as string).getTime()
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    }
    return 0
  })

  // Apply pagination
  const page = params.page || 1
  const pageSize = params.pageSize || 20
  const totalCount = filtered.length
  const totalPages = Math.ceil(totalCount / pageSize)
  const startIndex = (page - 1) * pageSize
  const data = filtered.slice(startIndex, startIndex + pageSize)

  return {
    success: true,
    data,
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}

/**
 * Get a single file by ID
 */
export async function getFileById(id: number): Promise<ApiResponse<DriveFile>> {
  await delay(200)

  const file = files.find((f) => f.id === id)
  if (!file) {
    throw new Error(`File with ID ${id} not found`)
  }

  return {
    success: true,
    data: file,
  }
}

/**
 * Upload a file (mock - creates file entry)
 */
export async function uploadFile(
  folderId: number,
  fileName: string,
  fileSize: number,
  mimeType: string
): Promise<ApiResponse<DriveFile>> {
  await delay(800)

  const folder = folders.find((f) => f.id === folderId)
  if (!folder) {
    throw new Error(`Folder with ID ${folderId} not found`)
  }

  const extension = fileName.split('.').pop()?.toLowerCase() || ''

  const newFile: DriveFile = {
    id: getNextFileId(),
    name: fileName,
    folderId,
    folderPath: folder.path,
    extension,
    mimeType,
    size: fileSize,
    url: `/files/${folder.path.replace(/^\//, '')}/${fileName}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 1,
    createdByName: 'Current User',
  }

  files.push(newFile)

  // Update folder stats
  const folderIndex = folders.findIndex((f) => f.id === folderId)
  if (folderIndex !== -1) {
    folders[folderIndex] = {
      ...folders[folderIndex],
      fileCount: folders[folderIndex].fileCount + 1,
      size: folders[folderIndex].size + fileSize,
      updatedAt: new Date().toISOString(),
    }
  }

  return {
    success: true,
    data: newFile,
    message: 'File uploaded successfully',
  }
}

/**
 * Delete a file
 */
export async function deleteFile(id: number): Promise<ApiResponse<void>> {
  await delay(300)

  const fileIndex = files.findIndex((f) => f.id === id)
  if (fileIndex === -1) {
    throw new Error(`File with ID ${id} not found`)
  }

  const file = files[fileIndex]

  // Update folder stats
  const folderIndex = folders.findIndex((f) => f.id === file.folderId)
  if (folderIndex !== -1) {
    folders[folderIndex] = {
      ...folders[folderIndex],
      fileCount: Math.max(0, folders[folderIndex].fileCount - 1),
      size: Math.max(0, folders[folderIndex].size - file.size),
      updatedAt: new Date().toISOString(),
    }
  }

  files.splice(fileIndex, 1)

  return {
    success: true,
    data: undefined,
    message: 'File deleted successfully',
  }
}

/**
 * Rename a file
 */
export async function renameFile(id: number, newName: string): Promise<ApiResponse<DriveFile>> {
  await delay(300)

  const index = files.findIndex((f) => f.id === id)
  if (index === -1) {
    throw new Error(`File with ID ${id} not found`)
  }

  const file = files[index]

  // Check if name already exists in same folder
  const exists = files.some(
    (f) => f.id !== id && f.folderId === file.folderId && f.name.toLowerCase() === newName.toLowerCase()
  )
  if (exists) {
    throw new Error('A file with this name already exists')
  }

  const extension = newName.split('.').pop()?.toLowerCase() || ''

  const updated: DriveFile = {
    ...file,
    name: newName,
    extension,
    url: `/files/${file.folderPath.replace(/^\//, '')}/${newName}`,
    updatedAt: new Date().toISOString(),
  }

  files[index] = updated

  return {
    success: true,
    data: updated,
    message: 'File renamed successfully',
  }
}

/**
 * Get drive statistics
 */
export async function getDriveStats(): Promise<ApiResponse<DriveStats>> {
  await delay(200)

  const totalSize = files.reduce((sum, f) => sum + f.size, 0)

  return {
    success: true,
    data: {
      totalFiles: files.length,
      totalFolders: folders.length,
      totalSize,
      usedSpace: totalSize,
      availableSpace: 10737418240 - totalSize, // 10 GB limit
    },
  }
}

/**
 * Reset mock data to initial state
 */
export function resetMockDrive(): void {
  folders = [...mockFolders]
  files = [...mockFiles]
}
