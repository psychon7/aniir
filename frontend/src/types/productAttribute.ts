/**
 * TypeScript type definitions for Product Attributes.
 */

// =============================================================================
// Enums
// =============================================================================

export enum AttributeDataType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  SELECT = 'select',
}

// =============================================================================
// Product Attribute (Definition)
// =============================================================================

export interface ProductAttribute {
  id: number
  code: string
  name: string
  description: string | null
  dataType: AttributeDataType
  options: string[] | null
  unit: string | null
  isRequired: boolean
  isFilterable: boolean
  isVisible: boolean
  sortOrder: number
  societyId: number
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export interface ProductAttributeCreateDto {
  code: string
  name: string
  description?: string | null
  dataType?: AttributeDataType
  options?: string[] | null
  unit?: string | null
  isRequired?: boolean
  isFilterable?: boolean
  isVisible?: boolean
  sortOrder?: number
  societyId: number
}

export interface ProductAttributeUpdateDto {
  code?: string
  name?: string
  description?: string | null
  dataType?: AttributeDataType
  options?: string[] | null
  unit?: string | null
  isRequired?: boolean
  isFilterable?: boolean
  isVisible?: boolean
  sortOrder?: number
  isActive?: boolean
}

export interface ProductAttributePaginatedResponse {
  data: ProductAttribute[]
  total: number
  page: number
  pageSize: number
  pages: number
}

// =============================================================================
// Product Attribute Value
// =============================================================================

export interface ProductAttributeValue {
  id: number
  productId: number
  attributeId: number
  value: string | number | boolean | null
  displayValue: string
  createdAt: string
  updatedAt: string
  // Attribute details
  attributeCode: string | null
  attributeName: string | null
  attributeDataType: AttributeDataType | null
  attributeUnit: string | null
}

export interface ProductAttributeValueCreateDto {
  attributeId: number
  value: string | number | boolean | null
}

export interface ProductAttributeValueUpdateDto {
  value: string | number | boolean | null
}

export interface ProductAttributeValuesResponse {
  productId: number
  productName: string | null
  attributes: ProductAttributeValue[]
}

export interface ProductAttributeValuesBatchUpdateDto {
  values: ProductAttributeValueCreateDto[]
}

// =============================================================================
// Query Parameters
// =============================================================================

export interface ProductAttributeListParams {
  page?: number
  pageSize?: number
  societyId?: number
  activeOnly?: boolean
  filterableOnly?: boolean
  search?: string
}

// =============================================================================
// Data Type Info
// =============================================================================

export interface AttributeDataTypeInfo {
  value: AttributeDataType
  label: string
  description: string
}

// Labels for data types
export const ATTRIBUTE_DATA_TYPE_LABELS: Record<AttributeDataType, string> = {
  [AttributeDataType.TEXT]: 'Text',
  [AttributeDataType.NUMBER]: 'Number',
  [AttributeDataType.BOOLEAN]: 'Boolean',
  [AttributeDataType.DATE]: 'Date',
  [AttributeDataType.SELECT]: 'Select',
}

export const ATTRIBUTE_DATA_TYPE_DESCRIPTIONS: Record<AttributeDataType, string> = {
  [AttributeDataType.TEXT]: 'Free text input',
  [AttributeDataType.NUMBER]: 'Numeric value with optional unit',
  [AttributeDataType.BOOLEAN]: 'Yes/No toggle',
  [AttributeDataType.DATE]: 'Date picker',
  [AttributeDataType.SELECT]: 'Dropdown from predefined options',
}
