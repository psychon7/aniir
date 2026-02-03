/**
 * API client for Data Import operations.
 */
import apiClient from './client'
import type {
  ImportEntityType,
  ImportMode,
  ColumnMapping,
  FileUploadResponse,
  ImportFieldsResponse,
  ImportTemplateResponse,
  ImportPreviewResponse,
  ImportResultResponse,
} from '@/types/import'

const BASE_PATH = '/import'

/**
 * Get available fields for an entity type.
 */
export async function getImportFields(entityType: ImportEntityType): Promise<ImportFieldsResponse> {
  const response = await apiClient.get(`${BASE_PATH}/fields/${entityType}`)
  return response.data
}

/**
 * Get CSV template for an entity type.
 */
export async function getImportTemplate(entityType: ImportEntityType): Promise<ImportTemplateResponse> {
  const response = await apiClient.get(`${BASE_PATH}/template/${entityType}`)
  return response.data
}

/**
 * Download CSV template file.
 */
export async function downloadTemplate(entityType: ImportEntityType): Promise<Blob> {
  const response = await apiClient.get(`${BASE_PATH}/template/${entityType}/download`, {
    responseType: 'blob',
  })
  return response.data
}

/**
 * Upload a CSV file for import.
 */
export async function uploadImportFile(file: File): Promise<FileUploadResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post(`${BASE_PATH}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

/**
 * Preview import with validation.
 */
export async function previewImport(
  fileId: string,
  entityType: ImportEntityType,
  columnMappings: ColumnMapping[],
  previewRows: number = 10
): Promise<ImportPreviewResponse> {
  const response = await apiClient.post(
    `${BASE_PATH}/preview/${fileId}?entity_type=${entityType}&preview_rows=${previewRows}`,
    columnMappings
  )
  return response.data
}

/**
 * Execute bulk import.
 */
export async function executeImport(
  fileId: string,
  entityType: ImportEntityType,
  columnMappings: ColumnMapping[],
  importMode: ImportMode,
  socId: number,
  skipErrors: boolean = false,
  dryRun: boolean = false
): Promise<ImportResultResponse> {
  const response = await apiClient.post(`${BASE_PATH}/execute/${fileId}`, {
    entity_type: entityType,
    column_mappings: columnMappings,
    import_mode: importMode,
    soc_id: socId,
    skip_errors: skipErrors,
    dry_run: dryRun,
  })
  return response.data
}

/**
 * Quick import with auto-mapping.
 */
export async function quickImport(
  file: File,
  entityType: ImportEntityType,
  socId: number,
  importMode: ImportMode = 'create_only',
  skipErrors: boolean = false,
  dryRun: boolean = false
): Promise<ImportResultResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const params = new URLSearchParams({
    entity_type: entityType,
    soc_id: String(socId),
    import_mode: importMode,
    skip_errors: String(skipErrors),
    dry_run: String(dryRun),
  })

  const response = await apiClient.post(`${BASE_PATH}/quick?${params}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}
