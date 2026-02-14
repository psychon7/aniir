/**
 * Logistics/Shipment Types
 * Types for shipment operations and tracking
 */

// =============================================================================
// Enums
// =============================================================================

export type ShipmentStatus =
  | 'pending'
  | 'in_transit'
  | 'delivered'
  | 'exception'
  | 'returned'
  | 'cancelled'

// =============================================================================
// Address Types
// =============================================================================

export interface ShipmentAddress {
  address?: string
  city?: string
  country_id?: number
}

// =============================================================================
// Shipment Types
// =============================================================================

/**
 * Shipment entity
 */
export interface Shipment {
  shp_id: number
  shp_reference: string
  shp_del_id: number | null
  shp_car_id: number
  shp_tracking_number: string | null
  shp_sta_id: number
  shp_con_id: number | null
  shp_sod_id: number | null
  shp_is_purchase: boolean | null
  // Origin address
  shp_origin_address: string | null
  shp_origin_city: string | null
  shp_origin_country_id: number | null
  // Destination address
  shp_destination_address: string | null
  shp_destination_city: string | null
  shp_destination_country_id: number | null
  // Package info
  shp_weight: number | null
  shp_packages: number | null
  // Delivery dates
  shp_estimated_delivery: string | null
  shp_actual_delivery: string | null
  // Cost
  shp_cost: number | null
  shp_cur_id: number | null
  // Notes
  shp_notes: string | null
  // Audit
  shp_created_at: string
  shp_updated_at: string | null
}

/**
 * Shipment detail response with related entities
 */
export interface ShipmentDetail extends Shipment {
  carrier_name: string | null
  consignee_name: string | null
  status_name: string | null
  currency_code: string | null
  origin_country_name: string | null
  destination_country_name: string | null
  delivery_form_reference: string | null
  is_delivered: boolean
  is_on_time: boolean | null
  full_origin_address: string
  full_destination_address: string
  lines: ShipmentLine[]
}

/**
 * Shipment list item (lightweight)
 */
export interface ShipmentListItem {
  shp_id: number
  shp_reference: string
  shp_tracking_number: string | null
  shp_sta_id: number
  shp_destination_city: string | null
  shp_estimated_delivery: string | null
  shp_actual_delivery: string | null
  carrier_name: string | null
  consignee_name: string | null
  status_name: string | null
  is_delivered: boolean
}

/**
 * DTO for creating a shipment
 */
export interface ShipmentCreateDto {
  shp_reference?: string
  shp_del_id?: number
  shp_car_id: number
  shp_tracking_number?: string
  shp_sta_id: number
  shp_con_id?: number
  shp_sod_id?: number
  shp_is_purchase?: boolean
  // Origin address
  shp_origin_address?: string
  shp_origin_city?: string
  shp_origin_country_id?: number
  // Destination address
  shp_destination_address?: string
  shp_destination_city?: string
  shp_destination_country_id?: number
  // Alternative address format
  origin_address?: ShipmentAddress
  destination_address?: ShipmentAddress
  // Package info
  shp_weight?: number
  shp_packages?: number
  // Delivery dates
  shp_estimated_delivery?: string
  // Cost
  shp_cost?: number
  shp_cur_id?: number
  // Notes
  shp_notes?: string
}

/**
 * DTO for updating a shipment
 */
export interface ShipmentUpdateDto {
  shp_del_id?: number
  shp_car_id?: number
  shp_tracking_number?: string
  shp_sta_id?: number
  shp_con_id?: number
  shp_sod_id?: number
  shp_is_purchase?: boolean
  // Origin address
  shp_origin_address?: string
  shp_origin_city?: string
  shp_origin_country_id?: number
  // Destination address
  shp_destination_address?: string
  shp_destination_city?: string
  shp_destination_country_id?: number
  // Package info
  shp_weight?: number
  shp_packages?: number
  // Delivery dates
  shp_estimated_delivery?: string
  shp_actual_delivery?: string
  // Cost
  shp_cost?: number
  shp_cur_id?: number
  // Notes
  shp_notes?: string
}

/**
 * Shipment search parameters
 */
export interface ShipmentSearchParams {
  society_id?: number
  reference?: string
  carrier_id?: number
  status_id?: number
  delivery_form_id?: number
  consignee_id?: number
  supplier_order_id?: number
  tracking_number?: string
  origin_city?: string
  destination_city?: string
  origin_country_id?: number
  destination_country_id?: number
  // Date filters
  estimated_delivery_from?: string
  estimated_delivery_to?: string
  actual_delivery_from?: string
  actual_delivery_to?: string
  created_from?: string
  created_to?: string
  // Cost filters
  min_cost?: number
  max_cost?: number
  currency_id?: number
  // Pagination
  page?: number
  page_size?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// =============================================================================
// Tracking Types
// =============================================================================

export interface TrackingEvent {
  timestamp: string
  status: string
  location: string | null
  description: string | null
}

export interface TrackingResponse {
  shp_id: number
  shp_reference: string
  shp_tracking_number: string | null
  carrier_name: string | null
  current_status: string
  events: TrackingEvent[]
}

// =============================================================================
// Bulk Operations
// =============================================================================

export interface BulkStatusUpdateRequest {
  shipment_ids: number[]
  status_id: number
  notes?: string
}

export interface BulkStatusUpdateResponse {
  updated_count: number
  failed_ids: number[]
  errors: string[]
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ShipmentListResponse {
  items: ShipmentListItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface ShipmentAPIResponse {
  success: boolean
  message: string
  data?: Shipment
}

// =============================================================================
// Carrier Types
// =============================================================================

export interface Carrier {
  car_id: number
  car_name: string
  car_code: string | null
  car_tracking_url: string | null
  car_is_active: boolean
  car_address1?: string | null
  car_address2?: string | null
  car_postcode?: string | null
  car_city?: string | null
  car_country?: string | null
}

export interface ShipmentLine {
  lgl_id: number
  lgs_quantity: number | null
  lgs_unit_price: number | null
  lgs_total_price: number | null
  lgs_prd_name: string | null
  lgs_prd_ref: string | null
  lgs_description: string | null
  sol_id: number | null
  sil_id: number | null
  cii_id: number | null
}

export interface CarrierListItem {
  car_id: number
  car_name: string
  car_code: string | null
  car_is_active: boolean
  car_address1?: string | null
  car_address2?: string | null
  car_postcode?: string | null
  car_city?: string | null
  car_country?: string | null
}

// =============================================================================
// Consignee Types (Logistics)
// =============================================================================

export interface LogisticsConsignee {
  con_id: number
  con_company_name?: string | null
  con_firstname?: string | null
  con_lastname?: string | null
  con_address1?: string | null
  con_address2?: string | null
  con_address3?: string | null
  con_postcode?: string | null
  con_city?: string | null
  con_country?: string | null
  con_tel1?: string | null
  con_tel2?: string | null
  con_email?: string | null
}
