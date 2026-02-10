import apiClient from './client'

export interface CurrencyItem {
  cur_id: number
  cur_designation: string
  cur_symbol: string
}

export interface ExchangeRateItem {
  mcu_id: number
  cur_id: number
  cur_id2: number
  mcu_rate_in: number
  mcu_rate_out: number
  mcu_rate_date: string
  lng_id: number
}

export interface ExchangeRateCreateRequest {
  cur_id: number
  cur_id2: number
  mcu_rate_in: number
  mcu_rate_out: number
  mcu_rate_date: string
  lng_id: number
}

export const currenciesApi = {
  async listCurrencies(limit = 200): Promise<CurrencyItem[]> {
    const response = await apiClient.get<{
      items: CurrencyItem[]
      total: number
      skip: number
      limit: number
    }>('/currencies', {
      params: { skip: 0, limit },
    })
    return response.data.items || []
  },

  async listExchangeRates(limit = 200): Promise<ExchangeRateItem[]> {
    const response = await apiClient.get<{
      items: ExchangeRateItem[]
      total: number
      skip: number
      limit: number
    }>('/currencies/exchange-rates', {
      params: { skip: 0, limit },
    })
    return response.data.items || []
  },

  async createExchangeRate(payload: ExchangeRateCreateRequest): Promise<ExchangeRateItem> {
    const response = await apiClient.post<ExchangeRateItem>('/currencies/exchange-rates', payload)
    return response.data
  },

  async deleteExchangeRate(rateId: number): Promise<void> {
    await apiClient.delete(`/currencies/exchange-rates/${rateId}`)
  },
}
