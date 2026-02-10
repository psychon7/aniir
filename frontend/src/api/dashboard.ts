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

export const dashboardApi = {
  async getKpis(): Promise<DashboardKpisResponse> {
    const response = await apiClient.get<DashboardKpisResponse>('/accounting/dashboard/kpis')
    return response.data
  },
}
