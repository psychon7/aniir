import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { currenciesApi, type ExchangeRateCreateRequest } from '@/api/currencies'

export const currencyKeys = {
  all: ['currencies-admin'] as const,
  currencies: () => [...currencyKeys.all, 'currencies'] as const,
  exchangeRates: () => [...currencyKeys.all, 'exchangeRates'] as const,
}

export function useCurrencyList() {
  return useQuery({
    queryKey: currencyKeys.currencies(),
    queryFn: () => currenciesApi.listCurrencies(),
    staleTime: 10 * 60 * 1000,
  })
}

export function useExchangeRateList() {
  return useQuery({
    queryKey: currencyKeys.exchangeRates(),
    queryFn: () => currenciesApi.listExchangeRates(),
  })
}

export function useCreateExchangeRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ExchangeRateCreateRequest) => currenciesApi.createExchangeRate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currencyKeys.exchangeRates() })
    },
  })
}

export function useDeleteExchangeRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rateId: number) => currenciesApi.deleteExchangeRate(rateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currencyKeys.exchangeRates() })
    },
  })
}
