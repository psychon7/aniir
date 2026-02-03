/**
 * TypeScript types for Data Import functionality.
 */

export type ImportEntityType = 'product' | 'client' | 'supplier' | 'brand'

export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partial'

export type ImportMode = 'create_only' | 'update_only' | 'upsert'

export interface ColumnMapping {
  source_column: string
  target_field: string
  transform?: 'uppercase' | 'lowercase' | 'trim'
}

export interface ImportFieldDefinition {
  name: string
  label: string
  required: boolean
  field_type: 'string' | 'number' | 'date' | 'boolean' | 'lookup'
  lookup_type?: string
  description?: string
}

export interface ImportRowError {
  row_number: number
  errors: string[]
  data?: Record<string, unknown>
}

export interface ImportRowResult {
  row_number: number
  entity_id?: number
  action: 'created' | 'updated' | 'skipped'
}

// ==========================================================================
// Request Types
// ==========================================================================

export interface ImportPreviewRequest {
  entity_type: ImportEntityType
  column_mappings: ColumnMapping[]
  preview_rows?: number
}

export interface ImportRequest {
  entity_type: ImportEntityType
  column_mappings: ColumnMapping[]
  import_mode: ImportMode
  soc_id: number
  skip_errors?: boolean
  dry_run?: boolean
}

// ==========================================================================
// Response Types
// ==========================================================================

export interface FileUploadResponse {
  success: boolean
  file_id: string
  filename: string
  row_count: number
  column_headers: string[]
  sample_data: Record<string, string>[]
}

export interface ImportFieldsResponse {
  success: boolean
  entity_type: ImportEntityType
  fields: ImportFieldDefinition[]
}

export interface ImportTemplateResponse {
  success: boolean
  entity_type: ImportEntityType
  template_csv: string
  fields: ImportFieldDefinition[]
}

export interface ImportPreviewResponse {
  success: boolean
  total_rows: number
  preview_data: Record<string, unknown>[]
  validation_errors: ImportRowError[]
  column_headers: string[]
}

export interface ImportResultResponse {
  success: boolean
  status: ImportStatus
  message: string
  total_rows: number
  created_count: number
  updated_count: number
  skipped_count: number
  error_count: number
  errors: ImportRowError[]
  results: ImportRowResult[]
  duration_seconds?: number
}
