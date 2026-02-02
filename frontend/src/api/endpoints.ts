/**
 * API Endpoints Configuration
 * Centralized endpoint definitions for all API calls
 */

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },

  // Clients
  CLIENTS: {
    BASE: '/clients',
    BY_ID: (id: number) => `/clients/${id}`,
    SEARCH: '/clients/search',
    EXPORT: '/clients/export',
  },

  // Suppliers
  SUPPLIERS: {
    BASE: '/suppliers',
    BY_ID: (id: number) => `/suppliers/${id}`,
    SEARCH: '/suppliers/search',
  },

  // Products
  PRODUCTS: {
    BASE: '/products',
    BY_ID: (id: number) => `/products/${id}`,
    SEARCH: '/products/search',
    BY_CATEGORY: (categoryId: number) => `/products/category/${categoryId}`,
  },

  // Quotes
  QUOTES: {
    BASE: '/quotes',
    BY_ID: (id: number) => `/quotes/${id}`,
    LINES: (quoteId: number) => `/quotes/${quoteId}/lines`,
    CONVERT_TO_ORDER: (quoteId: number) => `/quotes/${quoteId}/convert-to-order`,
  },

  // Orders
  ORDERS: {
    BASE: '/orders',
    BY_ID: (id: number) => `/orders/${id}`,
    LINES: (orderId: number) => `/orders/${orderId}/lines`,
  },

  // Invoices
  INVOICES: {
    BASE: '/invoices',
    BY_ID: (id: number) => `/invoices/${id}`,
    LINES: (invoiceId: number) => `/invoices/${invoiceId}/lines`,
    GENERATE_PDF: (invoiceId: number) => `/invoices/${invoiceId}/pdf`,
  },

  // Reference Data (Lookup Tables)
  REFERENCE: {
    BUSINESS_UNITS: '/reference/business-units',
    COUNTRIES: '/reference/countries',
    CURRENCIES: '/reference/currencies',
    VAT_RATES: '/reference/vat-rates',
    PAYMENT_MODES: '/reference/payment-modes',
    PAYMENT_TERMS: '/reference/payment-terms',
    STATUSES: '/reference/statuses',
    CLIENT_TYPES: '/reference/client-types',
    CATEGORIES: '/reference/categories',
    BRANDS: '/reference/brands',
    UNITS_OF_MEASURE: '/reference/units-of-measure',
    SOCIETIES: '/reference/societies',
  },

  // Dashboard
  DASHBOARD: {
    STATS: '/dashboard/stats',
    RECENT_ACTIVITY: '/dashboard/recent-activity',
    SALES_CHART: '/dashboard/sales-chart',
  },
} as const;
