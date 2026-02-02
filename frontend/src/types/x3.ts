/**
 * Sage X3 Integration Types
 * Types for X3 customer/product mappings and export operations
 */

// ==========================================================================
// Customer Mapping Types
// ==========================================================================

export interface X3CustomerMapping {
  id: number
  client_id: number
  x3_customer_code: string
  sales_site: string
  is_active: boolean
  created_at: string
  updated_at: string | null
  last_exported_at: string | null
  // Extended fields from ERP (when joined)
  client_name?: string
  client_code?: string
}

export interface X3CustomerMappingCreateDto {
  client_id: number
  x3_customer_code: string
  sales_site?: string
  is_active?: boolean
}

export interface X3CustomerMappingUpdateDto {
  x3_customer_code?: string
  sales_site?: string
  is_active?: boolean
}

// ==========================================================================
// Product Mapping Types
// ==========================================================================

export interface X3ProductMapping {
  id: number
  product_id: number
  x3_product_code: string
  tax_code: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
  // Extended fields from ERP (when joined)
  product_name?: string
  product_sku?: string
}

export interface X3ProductMappingCreateDto {
  product_id: number
  x3_product_code: string
  tax_code?: string
  is_active?: boolean
}

export interface X3ProductMappingUpdateDto {
  x3_product_code?: string
  tax_code?: string
  is_active?: boolean
}

// ==========================================================================
// Bulk Operations
// ==========================================================================

export interface X3BulkMappingData {
  client_id?: number
  x3_customer_code?: string
  sales_site?: string
  product_id?: number
  x3_product_code?: string
  tax_code?: string
  is_active?: boolean
}

export interface X3BulkMappingResponse {
  success: boolean
  created: number
  failed: number
  errors: Array<{
    index: number
    error: string
    message: string
    client_id?: number
    product_id?: number
  }>
}

// ==========================================================================
// Mapping Statistics
// ==========================================================================

export interface X3MappingStats {
  customer_mappings: {
    total: number
    active: number
    inactive: number
    exported: number
  }
  product_mappings: {
    total: number
    active: number
    inactive: number
    with_tax_code: number
  }
}

// ==========================================================================
// Export Types
// ==========================================================================

export interface X3InvoiceExportRequest {
  date_from: string
  date_to: string
  society_id?: number
  bu_id?: number
  status_ids?: number[]
  include_lines?: boolean
}

export interface X3InvoiceExportResponse {
  success: boolean
  export_id: number
  status: 'COMPLETED' | 'FAILED' | 'PARTIAL'
  date_from: string
  date_to: string
  total_invoices: number
  total_lines: number
  exported_invoices: number
  failed_invoices: number
  skipped_invoices: number
  file_name: string | null
  file_path: string | null
  warnings: string[]
  errors: string[]
}

export interface X3ValidationResponse {
  success: boolean
  is_valid: boolean
  invoice_count: number
  valid_invoices: number
  invalid_invoices: number
  missing_customer_mappings: Array<{
    client_id: number
    client_name: string
  }>
  missing_product_mappings: Array<{
    product_id: number
    product_name: string
  }>
  can_export: boolean
}

export interface X3ExportLog {
  id: number
  export_type: 'INVOICES' | 'PAYMENTS'
  status: 'COMPLETED' | 'FAILED' | 'PARTIAL' | 'IN_PROGRESS'
  date_from: string
  date_to: string
  total_records: number
  exported_records: number
  failed_records: number
  file_name: string | null
  file_path: string | null
  file_size: number | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

// ==========================================================================
// Search Parameters
// ==========================================================================

export interface X3CustomerMappingSearchParams {
  search?: string
  is_active?: boolean
  page?: number
  page_size?: number
}

export interface X3ProductMappingSearchParams {
  search?: string
  is_active?: boolean
  page?: number
  page_size?: number
}

export interface X3ExportLogSearchParams {
  export_type?: 'INVOICES' | 'PAYMENTS'
  status?: 'COMPLETED' | 'FAILED' | 'PARTIAL'
  date_from?: string
  date_to?: string
  page?: number
  page_size?: number
}

// ==========================================================================
// API Response Types
// ==========================================================================

export interface X3MappingListResponse<T> {
  success: boolean
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface X3ExportLogListResponse {
  success: boolean
  items: X3ExportLog[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// ==========================================================================
// Unmapped Items
// ==========================================================================

export interface UnmappedCustomer {
  id: number
  name: string
  code: string
}

export interface UnmappedProduct {
  id: number
  name: string
  sku: string
}
