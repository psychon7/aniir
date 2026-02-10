import apiClient from './client'

export interface QuoteStatusBreakdownItem {
  statusId: number
  count: number
}

export interface DashboardKpisResponse {
  generatedAt: string
  activeClients: number
  quotesInProgress: number
  quotesRecentInProgress: number
  backorderLines: number
  pendingDeliveries: number
  pendingInvoicing: number
  unpaidInvoices: number
  unpaidProformas: number
  unshippedContainers: number
  arrivingContainers: number
  quoteStatusBreakdown: QuoteStatusBreakdownItem[]
}

export interface DashboardBackorderLine {
  orderId: number
  orderReference: string
  clientName: string
  expectedDeliveryDate?: string | null
  lineId: number
  productReference: string
  productName: string
  description: string
  orderedQuantity: number
  deliveredQuantity: number
  remainingQuantity: number
}

export interface DashboardBackordersResponse {
  generatedAt: string
  count: number
  items: DashboardBackorderLine[]
}

export const dashboardApi = {
  async getKpis(): Promise<DashboardKpisResponse> {
    const response = await apiClient.get<DashboardKpisResponse>('/accounting/dashboard/kpis')
    return response.data
  },

  async getBackorders(limit = 10): Promise<DashboardBackordersResponse> {
    const response = await apiClient.get<DashboardBackordersResponse>('/accounting/dashboard/backorders', {
      params: { limit },
    })
    return response.data
  },
}
