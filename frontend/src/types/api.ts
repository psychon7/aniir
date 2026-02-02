export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  statusCode?: number
}

export interface PagedResponse<T> {
  success: boolean
  data: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface KeyValue {
  key: number
  value: string
  value2?: string
  value3?: string
  dcValue?: number
  actived?: boolean
  key2?: number
  key3?: number
  key4?: number
}

/**
 * Unit of Measure interface for strongly-typed usage
 * Maps to TR_UOM_UnitOfMeasure table
 */
export interface UnitOfMeasure {
  id: number
  code: string
  designation: string
  description?: string
  isActive: boolean
}

/**
 * Carrier interface for shipping/transport carriers
 * Maps to TR_CAR_Carrier table
 */
export interface Carrier {
  id: number
  name: string
  code?: string
  phone?: string
  email?: string
  website?: string
  trackingUrl?: string
  isActive: boolean
  socId: number
}
