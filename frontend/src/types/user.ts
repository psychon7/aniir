/**
 * TypeScript type definitions for User management.
 */

// =============================================================================
// User Response Interface
// =============================================================================

export interface User {
  id: number
  login: string
  firstName: string | null
  lastName: string | null
  fullName: string
  title: string | null
  email: string | null
  telephone: string | null
  cellphone: string | null
  fax: string | null
  hrCode: string | null
  address1: string | null
  address2: string | null
  postcode: string | null
  city: string | null
  county: string | null
  photoPath: string | null
  roleId: number
  roleName: string | null
  civilityId: number
  civilityDesignation: string | null
  societyId: number
  societyName: string | null
  creatorId: number | null
  creatorName: string | null
  isActive: boolean
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}

// Simplified user for lists
export interface UserListItem {
  id: number
  login: string
  firstName: string | null
  lastName: string | null
  fullName: string
  email: string | null
  roleName: string | null
  societyName: string | null
  isActive: boolean
  isAdmin: boolean
}

// User for lookups/dropdowns
export interface UserLookup {
  id: number
  login: string
  firstName: string | null
  lastName: string | null
  fullName: string
  isActive: boolean
}

// =============================================================================
// Create/Update DTOs
// =============================================================================

export interface UserCreateDto {
  usr_login: string
  usr_pwd: string
  usr_firstname?: string | null
  usr_lastname?: string | null
  usr_title?: string | null
  usr_email?: string | null
  usr_tel?: string | null
  usr_cellphone?: string | null
  usr_fax?: string | null
  usr_code_hr?: string | null
  usr_address1?: string | null
  usr_address2?: string | null
  usr_postcode?: string | null
  usr_city?: string | null
  usr_county?: string | null
  usr_photo_path?: string | null
  rol_id: number
  civ_id: number
  soc_id: number
  usr_is_actived?: boolean
  usr_super_right?: boolean
}

export interface UserUpdateDto {
  usr_login?: string
  usr_pwd?: string
  usr_firstname?: string | null
  usr_lastname?: string | null
  usr_title?: string | null
  usr_email?: string | null
  usr_tel?: string | null
  usr_cellphone?: string | null
  usr_fax?: string | null
  usr_code_hr?: string | null
  usr_address1?: string | null
  usr_address2?: string | null
  usr_postcode?: string | null
  usr_city?: string | null
  usr_county?: string | null
  usr_photo_path?: string | null
  rol_id?: number
  civ_id?: number
  soc_id?: number
  usr_is_actived?: boolean
  usr_super_right?: boolean
}

// =============================================================================
// Paginated Response
// =============================================================================

export interface UserPaginatedResponse {
  items: UserListItem[]
  total: number
  skip: number
  limit: number
}

// =============================================================================
// Lookup Types
// =============================================================================

export interface RoleLookup {
  id: number
  name: string
  isActive: boolean
}

export interface CivilityLookup {
  id: number
  designation: string
  isActive: boolean
}

// =============================================================================
// Query Parameters
// =============================================================================

export interface UserListParams {
  skip?: number
  limit?: number
  search?: string
  role_id?: number
  society_id?: number
  is_active?: boolean
  is_admin?: boolean
}
