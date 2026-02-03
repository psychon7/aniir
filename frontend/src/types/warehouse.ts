/**
 * Warehouse Management Types
 * Types for warehouse, stock, and stock movement operations
 */

// =============================================================================
// Enums
// =============================================================================

export type MovementType =
  | 'RECEIPT'
  | 'SHIPMENT'
  | 'TRANSFER'
  | 'ADJUSTMENT'
  | 'RETURN_IN'
  | 'RETURN_OUT'
  | 'DAMAGE'
  | 'DESTROY'
  | 'LOAN_OUT'
  | 'LOAN_IN'

export type MovementStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PARTIALLY'

// =============================================================================
// Warehouse Types
// =============================================================================

/**
 * Warehouse entity representing a storage location
 */
export interface Warehouse {
  wh_id: number
  wh_code: string
  wh_name: string
  wh_address: string | null
  wh_city: string | null
  wh_country_id: number | null
  wh_is_default: boolean
  wh_is_active: boolean
  display_name: string
  full_address: string
}

/**
 * Warehouse detail response with camelCase fields
 */
export interface WarehouseDetail {
  id: number
  name: string
  code: string | null
  address: string | null
  address2: string | null
  postalCode: string | null
  city: string | null
  country: string | null
  volume: number | null
  displayName: string
  fullAddress: string
}

/**
 * Warehouse list item (lightweight)
 */
export interface WarehouseListItem {
  wh_id: number
  wh_code: string
  wh_name: string
  wh_city: string | null
  wh_is_default: boolean
  wh_is_active: boolean
  display_name: string
}

/**
 * Warehouse dropdown item for selects
 */
export interface WarehouseDropdownItem {
  wh_id: number
  wh_code: string
  wh_name: string
  wh_is_default: boolean
  label: string
  value: number
}

/**
 * DTO for creating a warehouse
 */
export interface WarehouseCreateDto {
  wh_code: string
  wh_name: string
  wh_address?: string
  wh_city?: string
  wh_country_id?: number
  wh_is_default?: boolean
  wh_is_active?: boolean
}

/**
 * DTO for updating a warehouse
 */
export interface WarehouseUpdateDto {
  wh_code?: string
  wh_name?: string
  wh_address?: string
  wh_city?: string
  wh_country_id?: number
  wh_is_default?: boolean
  wh_is_active?: boolean
}

/**
 * Warehouse search parameters
 */
export interface WarehouseSearchParams {
  search?: string
  is_active?: boolean
  is_default?: boolean
  city?: string
  country_id?: number
  skip?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// =============================================================================
// Stock Types
// =============================================================================

/**
 * Stock entity representing inventory at a location
 */
export interface Stock {
  stk_id: number
  soc_id: number
  prd_id: number
  pit_id: number | null
  whs_id: number | null
  stk_quantity: number
  stk_quantity_reserved: number
  stk_quantity_available: number
  stk_min_quantity: number | null
  stk_max_quantity: number | null
  stk_reorder_quantity: number | null
  stk_location: string | null
  stk_unit_cost: number | null
  stk_total_value: number | null
  stk_d_last_count: string | null
  stk_d_last_movement: string | null
  stk_d_creation: string | null
  stk_d_update: string | null
  stk_is_active: boolean
  stk_notes: string | null
  // Related data
  product_name: string | null
  product_ref: string | null
  warehouse_name: string | null
  warehouse_code: string | null
  // Computed
  is_low_stock: boolean
  is_out_of_stock: boolean
}

/**
 * Stock list item (lightweight)
 */
export interface StockListItem {
  stk_id: number
  prd_id: number
  whs_id: number | null
  stk_quantity: number
  stk_quantity_available: number
  stk_quantity_reserved: number
  stk_is_active: boolean
  product_name: string | null
  product_ref: string | null
  warehouse_name: string | null
}

/**
 * DTO for creating a stock record
 */
export interface StockCreateDto {
  soc_id: number
  prd_id: number
  pit_id?: number
  whs_id?: number
  stk_quantity?: number
  stk_quantity_reserved?: number
  stk_quantity_available?: number
  stk_min_quantity?: number
  stk_max_quantity?: number
  stk_reorder_quantity?: number
  stk_location?: string
  stk_unit_cost?: number
  stk_notes?: string
}

/**
 * DTO for updating a stock record
 */
export interface StockUpdateDto {
  stk_quantity?: number
  stk_quantity_reserved?: number
  stk_min_quantity?: number
  stk_max_quantity?: number
  stk_reorder_quantity?: number
  stk_location?: string
  stk_unit_cost?: number
  stk_notes?: string
  stk_is_active?: boolean
}

/**
 * Stock search parameters
 */
export interface StockSearchParams {
  search?: string
  soc_id?: number
  whs_id?: number
  prd_id?: number
  low_stock_only?: boolean
  out_of_stock_only?: boolean
  is_active?: boolean
  skip?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

/**
 * Stock adjustment request
 */
export interface StockAdjustment {
  stk_id: number
  adjustment_quantity: number
  reason?: string
}

/**
 * Stock level summary
 */
export interface StockLevelSummary {
  total_items: number
  total_quantity: number
  total_value: number
  low_stock_count: number
  out_of_stock_count: number
}

// =============================================================================
// Stock Movement Types
// =============================================================================

/**
 * Stock movement line
 */
export interface StockMovementLine {
  sml_id: number
  sml_stm_id: number
  sml_prd_id: number | null
  sml_pit_id: number | null
  sml_prd_ref: string | null
  sml_prd_name: string | null
  sml_description: string | null
  sml_quantity: number
  sml_quantity_actual: number | null
  sml_uom_id: number | null
  sml_unit_price: number | null
  sml_unit_cost: number | null
  sml_location: string | null
  sml_batch_number: string | null
  sml_serial_number: string | null
  sml_expiry_date: string | null
  sml_is_damaged: boolean
  sml_damage_notes: string | null
  sml_total_price: number | null
  sml_total_cost: number | null
  sml_created_at: string | null
  // Computed
  quantity_variance: number | null
  has_variance: boolean
}

/**
 * DTO for creating a movement line
 */
export interface StockMovementLineCreateDto {
  sml_prd_id?: number
  sml_pit_id?: number
  sml_prd_ref?: string
  sml_prd_name?: string
  sml_description?: string
  sml_quantity: number
  sml_quantity_actual?: number
  sml_uom_id?: number
  sml_unit_price?: number
  sml_unit_cost?: number
  sml_location?: string
  sml_batch_number?: string
  sml_serial_number?: string
  sml_expiry_date?: string
  sml_is_damaged?: boolean
  sml_damage_notes?: string
}

/**
 * DTO for updating a movement line
 */
export interface StockMovementLineUpdateDto {
  sml_quantity?: number
  sml_quantity_actual?: number
  sml_location?: string
  sml_batch_number?: string
  sml_serial_number?: string
  sml_is_damaged?: boolean
  sml_damage_notes?: string
}

/**
 * Stock movement entity
 */
export interface StockMovement {
  stm_id: number
  stm_reference: string
  stm_type: MovementType
  stm_status: MovementStatus
  stm_date: string
  stm_description: string | null
  stm_whs_id: number | null
  stm_whs_destination_id: number | null
  stm_cli_id: number | null
  stm_sup_id: number | null
  stm_external_party: string | null
  stm_is_loan: boolean
  stm_loan_return_date: string | null
  stm_is_return: boolean
  stm_return_reason: string | null
  stm_source_document: string | null
  stm_tracking_number: string | null
  stm_carrier: string | null
  stm_notes: string | null
  stm_soc_id: number | null
  stm_total_quantity: number
  stm_total_quantity_actual: number | null
  stm_total_value: number
  stm_total_lines: number
  stm_is_valid: boolean
  stm_validated_at: string | null
  stm_created_at: string | null
  stm_updated_at: string | null
  // Related data
  warehouse_name: string | null
  destination_warehouse_name: string | null
  client_name: string | null
  // Computed
  is_inbound: boolean
  is_outbound: boolean
  is_transfer: boolean
}

/**
 * Stock movement with lines
 */
export interface StockMovementWithLines extends StockMovement {
  lines: StockMovementLine[]
  line_count: number
}

/**
 * Stock movement list item (lightweight)
 */
export interface StockMovementListItem {
  stm_id: number
  stm_reference: string
  stm_type: MovementType
  stm_status: MovementStatus
  stm_date: string
  stm_total_quantity: number
  stm_total_lines: number
  warehouse_name: string | null
}

/**
 * DTO for creating a stock movement
 */
export interface StockMovementCreateDto {
  stm_type: MovementType
  stm_date: string
  stm_description?: string
  stm_whs_id?: number
  stm_whs_destination_id?: number
  stm_cli_id?: number
  stm_sup_id?: number
  stm_external_party?: string
  stm_is_loan?: boolean
  stm_loan_return_date?: string
  stm_is_return?: boolean
  stm_return_reason?: string
  stm_source_document?: string
  stm_tracking_number?: string
  stm_carrier?: string
  stm_notes?: string
  stm_soc_id?: number
  lines?: StockMovementLineCreateDto[]
}

/**
 * DTO for updating a stock movement
 */
export interface StockMovementUpdateDto {
  stm_status?: MovementStatus
  stm_date?: string
  stm_description?: string
  stm_whs_id?: number
  stm_whs_destination_id?: number
  stm_cli_id?: number
  stm_sup_id?: number
  stm_external_party?: string
  stm_loan_return_date?: string
  stm_loan_returned?: boolean
  stm_loan_return_actual_date?: string
  stm_return_reason?: string
  stm_tracking_number?: string
  stm_carrier?: string
  stm_notes?: string
}

/**
 * Stock movement search parameters
 */
export interface StockMovementSearchParams {
  search?: string
  stm_type?: MovementType
  stm_status?: MovementStatus
  whs_id?: number
  cli_id?: number
  soc_id?: number
  date_from?: string
  date_to?: string
  skip?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Paginated warehouse list response
 */
export interface WarehouseListResponse {
  items: Warehouse[]
  total: number
  skip: number
  limit: number
}

/**
 * Warehouse dropdown response
 */
export interface WarehouseDropdownResponse {
  items: WarehouseDropdownItem[]
  default_warehouse_id: number | null
}

/**
 * Paginated stock list response
 */
export interface StockListResponse {
  items: StockListItem[]
  total: number
  skip: number
  limit: number
}

/**
 * Paginated movement list response
 */
export interface StockMovementListResponse {
  items: StockMovementListItem[]
  total: number
  skip: number
  limit: number
}
