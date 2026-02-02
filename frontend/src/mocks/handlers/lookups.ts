import { delay } from '../delay'
import {
  countries,
  currencies,
  vatRates,
  paymentModes,
  paymentTerms,
  clientTypes,
  clientStatuses,
  businessUnits,
  languages,
  societies,
  productCategories,
  orderStatuses,
  invoiceStatuses,
  paymentStatuses,
  unitsOfMeasure,
  carriers,
  activeCarriers,
  supplierTypes,
} from '../data/lookups'
import type { KeyValue, ApiResponse } from '@/types/api'

/**
 * Generic lookup fetcher
 */
async function getLookup(data: KeyValue[]): Promise<ApiResponse<KeyValue[]>> {
  await delay(150)
  return {
    success: true,
    data,
  }
}

// Lookup API methods
export const getCountries = () => getLookup(countries)
export const getCurrencies = () => getLookup(currencies)
export const getVatRates = () => getLookup(vatRates)
export const getPaymentModes = () => getLookup(paymentModes)
export const getPaymentTerms = () => getLookup(paymentTerms)
export const getClientTypes = () => getLookup(clientTypes)
export const getClientStatuses = () => getLookup(clientStatuses)
export const getBusinessUnits = () => getLookup(businessUnits)
export const getLanguages = () => getLookup(languages)
export const getSocieties = () => getLookup(societies)
export const getProductCategories = () => getLookup(productCategories)
export const getOrderStatuses = () => getLookup(orderStatuses)
export const getInvoiceStatuses = () => getLookup(invoiceStatuses)
export const getPaymentStatuses = () => getLookup(paymentStatuses)
export const getUnitsOfMeasure = () => getLookup(unitsOfMeasure)
export const getCarriers = () => getLookup(carriers)
export const getActiveCarriers = () => getLookup(activeCarriers)
export const getSupplierTypes = () => getLookup(supplierTypes)

/**
 * Get all lookups at once (for initial app load)
 */
export async function getAllLookups(): Promise<
  ApiResponse<{
    countries: KeyValue[]
    currencies: KeyValue[]
    vatRates: KeyValue[]
    paymentModes: KeyValue[]
    paymentTerms: KeyValue[]
    clientTypes: KeyValue[]
    clientStatuses: KeyValue[]
    businessUnits: KeyValue[]
    languages: KeyValue[]
    societies: KeyValue[]
    productCategories: KeyValue[]
    orderStatuses: KeyValue[]
    invoiceStatuses: KeyValue[]
    unitsOfMeasure: KeyValue[]
  }>
> {
  await delay(200)

  return {
    success: true,
    data: {
      countries,
      currencies,
      vatRates,
      paymentModes,
      paymentTerms,
      clientTypes,
      clientStatuses,
      businessUnits,
      languages,
      societies,
      productCategories,
      orderStatuses,
      invoiceStatuses,
      unitsOfMeasure,
    },
  }
}
