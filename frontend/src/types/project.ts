/**
 * Project entity representing a business project/opportunity
 */
export interface Project {
  id: number
  code: string
  name: string
  clientId: number
  clientName?: string
  paymentTermId: number
  paymentTermName?: string
  paymentModeId: number
  paymentModeName?: string
  vatRateId: number
  vatRateName?: string
  societyId: number
  societyName?: string
  creatorId: number
  creatorName?: string
  createdAt: string
  updatedAt?: string
  displayName: string
}

/**
 * Project response from API (matches Pydantic schema)
 */
export interface ProjectResponse {
  prj_id: number
  prj_code: string
  prj_name: string
  cli_id: number
  pco_id: number
  pmo_id: number
  vat_id: number
  soc_id: number
  usr_creator_id: number
  prj_d_creation: string
  prj_d_update?: string
  display_name: string
}

/**
 * Detailed project response with related entity names
 */
export interface ProjectDetailResponse extends ProjectResponse {
  client_name?: string
  society_name?: string
  creator_name?: string
  payment_term_name?: string
  payment_mode_name?: string
  vat_rate_name?: string
}

/**
 * DTO for creating a new project
 */
export interface ProjectCreateDto {
  prj_code: string
  prj_name: string
  cli_id: number
  pco_id: number
  pmo_id: number
  vat_id: number
  soc_id: number
  usr_creator_id?: number
}

/**
 * DTO for updating an existing project
 */
export interface ProjectUpdateDto {
  prj_code?: string
  prj_name?: string
  cli_id?: number
  pco_id?: number
  pmo_id?: number
  vat_id?: number
  soc_id?: number
}

/**
 * Search/filter parameters for project list
 */
export interface ProjectSearchParams {
  search?: string
  code?: string
  name?: string
  client_id?: number
  society_id?: number
  creator_id?: number
  date_from?: string
  date_to?: string
  page?: number
  page_size?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

/**
 * Paginated project list response
 */
export interface ProjectListResponse {
  items: ProjectResponse[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

/**
 * Project lookup item for dropdowns
 */
export interface ProjectLookupItem {
  id: number
  code: string
  name: string
  client_id: number
  display_name: string
}

/**
 * Project summary statistics
 */
export interface ProjectSummary {
  total_count: number
  projects_by_client: number
  recent_projects: number
}

/**
 * Convert API response to frontend Project interface
 */
export function mapProjectResponseToProject(response: ProjectDetailResponse): Project {
  return {
    id: response.prj_id,
    code: response.prj_code,
    name: response.prj_name,
    clientId: response.cli_id,
    clientName: response.client_name,
    paymentTermId: response.pco_id,
    paymentTermName: response.payment_term_name,
    paymentModeId: response.pmo_id,
    paymentModeName: response.payment_mode_name,
    vatRateId: response.vat_id,
    vatRateName: response.vat_rate_name,
    societyId: response.soc_id,
    societyName: response.society_name,
    creatorId: response.usr_creator_id,
    creatorName: response.creator_name,
    createdAt: response.prj_d_creation,
    updatedAt: response.prj_d_update,
    displayName: response.display_name
  }
}
