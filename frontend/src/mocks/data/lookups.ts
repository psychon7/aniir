import type { KeyValue } from '@/types/api'

// Countries
export const countries: KeyValue[] = [
  { key: 1, value: 'France', value2: 'FR' },
  { key: 2, value: 'Germany', value2: 'DE' },
  { key: 3, value: 'United Kingdom', value2: 'GB' },
  { key: 4, value: 'Spain', value2: 'ES' },
  { key: 5, value: 'Italy', value2: 'IT' },
  { key: 6, value: 'Belgium', value2: 'BE' },
  { key: 7, value: 'Netherlands', value2: 'NL' },
  { key: 8, value: 'Portugal', value2: 'PT' },
  { key: 9, value: 'China', value2: 'CN' },
  { key: 10, value: 'United States', value2: 'US' },
  { key: 11, value: 'Hong Kong', value2: 'HK' },
  { key: 12, value: 'Switzerland', value2: 'CH' },
]

// Currencies
export const currencies: KeyValue[] = [
  { key: 1, value: 'Euro', value2: 'EUR', dcValue: 1 },
  { key: 2, value: 'US Dollar', value2: 'USD', dcValue: 1.08 },
  { key: 3, value: 'British Pound', value2: 'GBP', dcValue: 0.85 },
  { key: 4, value: 'Chinese Yuan', value2: 'CNY', dcValue: 7.82 },
  { key: 5, value: 'Hong Kong Dollar', value2: 'HKD', dcValue: 8.45 },
  { key: 6, value: 'Swiss Franc', value2: 'CHF', dcValue: 0.94 },
]

// VAT Rates
export const vatRates: KeyValue[] = [
  { key: 1, value: 'Standard 20%', dcValue: 20 },
  { key: 2, value: 'Reduced 10%', dcValue: 10 },
  { key: 3, value: 'Reduced 5.5%', dcValue: 5.5 },
  { key: 4, value: 'Exempt 0%', dcValue: 0 },
  { key: 5, value: 'Intra-EU 0%', dcValue: 0 },
]

// Payment Modes
export const paymentModes: KeyValue[] = [
  { key: 1, value: 'Bank Transfer', value2: 'TRANSFER' },
  { key: 2, value: 'Credit Card', value2: 'CARD' },
  { key: 3, value: 'Check', value2: 'CHECK' },
  { key: 4, value: 'Cash', value2: 'CASH' },
  { key: 5, value: 'PayPal', value2: 'PAYPAL' },
  { key: 6, value: 'Direct Debit', value2: 'DEBIT' },
]

// Payment Terms (days)
export const paymentTerms: KeyValue[] = [
  { key: 1, value: 'Immediate', dcValue: 0 },
  { key: 2, value: '15 days', dcValue: 15 },
  { key: 3, value: '30 days', dcValue: 30 },
  { key: 4, value: '45 days', dcValue: 45 },
  { key: 5, value: '60 days', dcValue: 60 },
  { key: 6, value: '90 days', dcValue: 90 },
]

// Client Types
export const clientTypes: KeyValue[] = [
  { key: 1, value: 'Retail', value2: 'B2C' },
  { key: 2, value: 'Wholesale', value2: 'B2B' },
  { key: 3, value: 'Distributor', value2: 'DIST' },
  { key: 4, value: 'OEM', value2: 'OEM' },
  { key: 5, value: 'Government', value2: 'GOV' },
]

// Client Status
export const clientStatuses: KeyValue[] = [
  { key: 1, value: 'Active', value2: 'active', actived: true },
  { key: 2, value: 'Inactive', value2: 'inactive', actived: false },
  { key: 3, value: 'Prospect', value2: 'prospect', actived: true },
  { key: 4, value: 'Suspended', value2: 'suspended', actived: false },
]

// Business Units
export const businessUnits: KeyValue[] = [
  { key: 1, value: 'LED Division', value2: 'LED' },
  { key: 2, value: 'Domotics', value2: 'DOM' },
  { key: 3, value: 'HVAC', value2: 'HVAC' },
  { key: 4, value: 'Wave Concept', value2: 'WAVE' },
  { key: 5, value: 'Accessories', value2: 'ACC' },
]

// Languages
export const languages: KeyValue[] = [
  { key: 1, value: 'French', value2: 'fr' },
  { key: 2, value: 'English', value2: 'en' },
  { key: 3, value: 'Chinese', value2: 'zh' },
  { key: 4, value: 'Spanish', value2: 'es' },
  { key: 5, value: 'German', value2: 'de' },
]

// Civilities
export const civilities: KeyValue[] = [
  { key: 1, value: 'Mr.' },
  { key: 2, value: 'Mrs.' },
  { key: 3, value: 'Ms.' },
  { key: 4, value: 'Dr.' },
  { key: 5, value: 'Company' },
]

// Societies (Companies/Business Entities)
export const societies: KeyValue[] = [
  { key: 1, value: 'ECOLED EUROPE', value2: 'ECO' },
  { key: 2, value: 'ECOLED HK', value2: 'HK' },
  { key: 3, value: 'ECOLEC', value2: 'LEC' },
]

// Product Categories
export const productCategories: KeyValue[] = [
  { key: 1, value: 'LED Strip Lights', key2: 1 },
  { key: 2, value: 'LED Panels', key2: 1 },
  { key: 3, value: 'LED Profiles', key2: 1 },
  { key: 4, value: 'LED Controllers', key2: 1 },
  { key: 5, value: 'Power Supplies', key2: 1 },
  { key: 6, value: 'Smart Switches', key2: 2 },
  { key: 7, value: 'Thermostats', key2: 3 },
  { key: 8, value: 'Accessories', key2: 5 },
]

// Order Status
export const orderStatuses: KeyValue[] = [
  { key: 1, value: 'Draft', value2: 'draft' },
  { key: 2, value: 'Confirmed', value2: 'confirmed' },
  { key: 3, value: 'Processing', value2: 'processing' },
  { key: 4, value: 'Ready for Delivery', value2: 'ready' },
  { key: 5, value: 'Partially Delivered', value2: 'partial' },
  { key: 6, value: 'Delivered', value2: 'delivered' },
  { key: 7, value: 'Invoiced', value2: 'invoiced' },
  { key: 8, value: 'Cancelled', value2: 'cancelled' },
]

// Invoice Status
export const invoiceStatuses: KeyValue[] = [
  { key: 1, value: 'Draft', value2: 'draft' },
  { key: 2, value: 'Sent', value2: 'sent' },
  { key: 3, value: 'Partially Paid', value2: 'partial' },
  { key: 4, value: 'Paid', value2: 'paid' },
  { key: 5, value: 'Overdue', value2: 'overdue' },
  { key: 6, value: 'Cancelled', value2: 'cancelled' },
]

// Payment Status
export const paymentStatuses: KeyValue[] = [
  { key: 1, value: 'Completed', value2: 'completed' },
  { key: 2, value: 'Pending', value2: 'pending' },
  { key: 3, value: 'Processing', value2: 'processing' },
  { key: 4, value: 'Failed', value2: 'failed' },
  { key: 5, value: 'Refunded', value2: 'refunded' },
  { key: 6, value: 'Cancelled', value2: 'cancelled' },
]

// Units of Measure
export const unitsOfMeasure: KeyValue[] = [
  { key: 1, value: 'Piece', value2: 'PC', value3: 'Individual unit/piece', actived: true },
  { key: 2, value: 'Kilogram', value2: 'KG', value3: 'Weight in kilograms', actived: true },
  { key: 3, value: 'Gram', value2: 'G', value3: 'Weight in grams', actived: true },
  { key: 4, value: 'Liter', value2: 'L', value3: 'Volume in liters', actived: true },
  { key: 5, value: 'Milliliter', value2: 'ML', value3: 'Volume in milliliters', actived: true },
  { key: 6, value: 'Meter', value2: 'M', value3: 'Length in meters', actived: true },
  { key: 7, value: 'Centimeter', value2: 'CM', value3: 'Length in centimeters', actived: true },
  { key: 8, value: 'Millimeter', value2: 'MM', value3: 'Length in millimeters', actived: true },
  { key: 9, value: 'Square Meter', value2: 'M2', value3: 'Area in square meters', actived: true },
  { key: 10, value: 'Cubic Meter', value2: 'M3', value3: 'Volume in cubic meters', actived: true },
  { key: 11, value: 'Box', value2: 'BOX', value3: 'Box/carton packaging', actived: true },
  { key: 12, value: 'Pallet', value2: 'PAL', value3: 'Pallet packaging', actived: true },
  { key: 13, value: 'Set', value2: 'SET', value3: 'Set of items', actived: true },
  { key: 14, value: 'Roll', value2: 'ROLL', value3: 'Roll packaging (e.g., LED strips)', actived: true },
  { key: 15, value: 'Pair', value2: 'PAIR', value3: 'Pair of items', actived: true },
]

// Carriers (Shipping/Transport Carriers)
export const carriers: KeyValue[] = [
  { key: 1, value: 'FedEx', value2: 'FEDEX', actived: true },
  { key: 2, value: 'UPS', value2: 'UPS', actived: true },
  { key: 3, value: 'DHL', value2: 'DHL', actived: true },
  { key: 4, value: 'TNT', value2: 'TNT', actived: true },
  { key: 5, value: 'La Poste', value2: 'LAPOSTE', actived: true },
  { key: 6, value: 'Chronopost', value2: 'CHRONO', actived: true },
  { key: 7, value: 'Colissimo', value2: 'COLISSIMO', actived: true },
  { key: 8, value: 'GLS', value2: 'GLS', actived: true },
  { key: 9, value: 'USPS', value2: 'USPS', actived: true },
  { key: 10, value: 'China Post', value2: 'CHINAPOST', actived: true },
]

// Active Carriers (only active ones)
export const activeCarriers: KeyValue[] = carriers.filter((c) => c.actived)

// Supplier Types
export const supplierTypes: KeyValue[] = [
  { key: 1, value: 'Manufacturer', value2: 'MFG' },
  { key: 2, value: 'Distributor', value2: 'DIST' },
  { key: 3, value: 'Service Provider', value2: 'SVC' },
  { key: 4, value: 'OEM', value2: 'OEM' },
  { key: 5, value: 'Wholesaler', value2: 'WHS' },
]
