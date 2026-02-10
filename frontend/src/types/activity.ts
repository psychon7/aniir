/**
 * Activity feed types for unified client timeline
 */
export type ActivityEntityType = 'quote' | 'order' | 'delivery' | 'invoice' | 'payment'

export interface ActivityItem {
  id: number
  entityType: ActivityEntityType
  reference?: string
  date: string
  amount?: number
  status?: string
  description?: string
}

export interface ActivityResponse {
  success: boolean
  data: ActivityItem[]
  totalCount: number
  page: number
  pageSize: number
  hasMore: boolean
}
