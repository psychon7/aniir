import { useQuery } from '@tanstack/react-query'
import { lookupsApi } from '@/api/lookups'
import { brandsApi } from '@/api/brands'

// Query keys
export const lookupKeys = {
  all: ['lookups'] as const,
  countries: () => [...lookupKeys.all, 'countries'] as const,
  currencies: () => [...lookupKeys.all, 'currencies'] as const,
  vatRates: () => [...lookupKeys.all, 'vatRates'] as const,
  paymentModes: () => [...lookupKeys.all, 'paymentModes'] as const,
  paymentTerms: () => [...lookupKeys.all, 'paymentTerms'] as const,
  clientTypes: () => [...lookupKeys.all, 'clientTypes'] as const,
  clientStatuses: () => [...lookupKeys.all, 'clientStatuses'] as const,
  businessUnits: () => [...lookupKeys.all, 'businessUnits'] as const,
  languages: () => [...lookupKeys.all, 'languages'] as const,
  societies: () => [...lookupKeys.all, 'societies'] as const,
  productCategories: () => [...lookupKeys.all, 'productCategories'] as const,
  orderStatuses: () => [...lookupKeys.all, 'orderStatuses'] as const,
  invoiceStatuses: () => [...lookupKeys.all, 'invoiceStatuses'] as const,
  paymentStatuses: () => [...lookupKeys.all, 'paymentStatuses'] as const,
  brands: () => [...lookupKeys.all, 'brands'] as const,
}

// Common options for lookup queries (long stale time since lookups rarely change)
const lookupQueryOptions = {
  staleTime: 10 * 60 * 1000, // 10 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes
}

export function useCountries() {
  return useQuery({
    queryKey: lookupKeys.countries(),
    queryFn: lookupsApi.getCountries,
    ...lookupQueryOptions,
  })
}

export function useCurrencies() {
  return useQuery({
    queryKey: lookupKeys.currencies(),
    queryFn: lookupsApi.getCurrencies,
    ...lookupQueryOptions,
  })
}

export function useVatRates() {
  return useQuery({
    queryKey: lookupKeys.vatRates(),
    queryFn: lookupsApi.getVatRates,
    ...lookupQueryOptions,
  })
}

export function usePaymentModes() {
  return useQuery({
    queryKey: lookupKeys.paymentModes(),
    queryFn: lookupsApi.getPaymentModes,
    ...lookupQueryOptions,
  })
}

export function usePaymentTerms() {
  return useQuery({
    queryKey: lookupKeys.paymentTerms(),
    queryFn: lookupsApi.getPaymentTerms,
    ...lookupQueryOptions,
  })
}

export function useClientTypes() {
  return useQuery({
    queryKey: lookupKeys.clientTypes(),
    queryFn: lookupsApi.getClientTypes,
    ...lookupQueryOptions,
  })
}

export function useClientStatuses() {
  return useQuery({
    queryKey: lookupKeys.clientStatuses(),
    queryFn: lookupsApi.getClientStatuses,
    ...lookupQueryOptions,
  })
}

export function useBusinessUnits() {
  return useQuery({
    queryKey: lookupKeys.businessUnits(),
    queryFn: lookupsApi.getBusinessUnits,
    ...lookupQueryOptions,
  })
}

export function useLanguages() {
  return useQuery({
    queryKey: lookupKeys.languages(),
    queryFn: lookupsApi.getLanguages,
    ...lookupQueryOptions,
  })
}

export function useSocieties() {
  return useQuery({
    queryKey: lookupKeys.societies(),
    queryFn: lookupsApi.getSocieties,
    ...lookupQueryOptions,
  })
}

export function useProductCategories() {
  return useQuery({
    queryKey: lookupKeys.productCategories(),
    queryFn: lookupsApi.getProductCategories,
    ...lookupQueryOptions,
  })
}

export function useOrderStatuses() {
  return useQuery({
    queryKey: lookupKeys.orderStatuses(),
    queryFn: lookupsApi.getOrderStatuses,
    ...lookupQueryOptions,
  })
}

export function useInvoiceStatuses() {
  return useQuery({
    queryKey: lookupKeys.invoiceStatuses(),
    queryFn: lookupsApi.getInvoiceStatuses,
    ...lookupQueryOptions,
  })
}

export function usePaymentStatuses() {
  return useQuery({
    queryKey: lookupKeys.paymentStatuses(),
    queryFn: lookupsApi.getPaymentStatuses,
    ...lookupQueryOptions,
  })
}

export function useBrandsLookup() {
  return useQuery({
    queryKey: lookupKeys.brands(),
    queryFn: brandsApi.getLookup,
    ...lookupQueryOptions,
  })
}

/**
 * Load all lookups at once (useful for initial app load)
 */
export function useAllLookups() {
  return useQuery({
    queryKey: lookupKeys.all,
    queryFn: lookupsApi.getAll,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
