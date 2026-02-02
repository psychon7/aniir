import apiClient from './client'
import type {
  Project,
  ProjectCreateDto,
  ProjectUpdateDto,
  ProjectSearchParams,
  ProjectLookupItem,
  ProjectSummary,
  ProjectDetailResponse,
  mapProjectResponseToProject,
} from '@/types/project'
import type { PagedResponse } from '@/types/api'

/**
 * Transform backend response to frontend format
 */
function transformProject(data: ProjectDetailResponse): Project {
  return {
    id: data.prj_id,
    code: data.prj_code,
    name: data.prj_name,
    displayName: data.display_name || `${data.prj_code} - ${data.prj_name}`,
    clientId: data.cli_id,
    clientName: data.client_name,
    societyId: data.soc_id,
    societyName: data.society_name,
    creatorId: data.usr_creator_id,
    creatorName: data.creator_name,
    paymentTermId: data.pco_id,
    paymentTermName: data.payment_term_name,
    paymentModeId: data.pmo_id,
    paymentModeName: data.payment_mode_name,
    vatRateId: data.vat_id,
    vatRateName: data.vat_rate_name,
    createdAt: data.prj_d_creation,
    updatedAt: data.prj_d_update,
  }
}

/**
 * Projects API methods
 */
export const projectsApi = {
  /**
   * Get paginated list of projects with optional filtering
   */
  async getAll(params: ProjectSearchParams = {}): Promise<PagedResponse<Project>> {
    const queryParams: Record<string, any> = {}
    
    if (params.search) queryParams.search = params.search
    if (params.code) queryParams.code = params.code
    if (params.name) queryParams.name = params.name
    if (params.client_id) queryParams.client_id = params.client_id
    if (params.society_id) queryParams.society_id = params.society_id
    if (params.creator_id) queryParams.creator_id = params.creator_id
    if (params.date_from) queryParams.date_from = params.date_from
    if (params.date_to) queryParams.date_to = params.date_to
    if (params.page) queryParams.page = params.page
    if (params.page_size) queryParams.page_size = params.page_size
    if (params.sort_by) queryParams.sort_by = params.sort_by
    if (params.sort_order) queryParams.sort_order = params.sort_order

    const response = await apiClient.get('/projects', { params: queryParams })
    const data = response.data
    const page = data.page || params.page || 1
    const pageSize = data.page_size || params.page_size || 20
    const totalCount = data.total || 0
    const totalPages = data.total_pages || Math.ceil(totalCount / pageSize)

    return {
      success: true,
      data: (data.items || []).map(transformProject),
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    }
  },

  /**
   * Get a single project by ID
   */
  async getById(id: number): Promise<Project> {
    const response = await apiClient.get(`/projects/${id}`)
    return transformProject(response.data)
  },

  /**
   * Create a new project
   */
  async create(data: ProjectCreateDto): Promise<Project> {
    const response = await apiClient.post('/projects', data)
    return transformProject(response.data)
  },

  /**
   * Update an existing project
   */
  async update(id: number, data: ProjectUpdateDto): Promise<Project> {
    const response = await apiClient.put(`/projects/${id}`, data)
    return transformProject(response.data)
  },

  /**
   * Delete a project
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/projects/${id}`)
  },

  /**
   * Get projects by client ID
   */
  async getByClient(clientId: number, skip = 0, limit = 50): Promise<Project[]> {
    const response = await apiClient.get(`/projects/by-client/${clientId}`, {
      params: { skip, limit },
    })
    return (response.data || []).map(transformProject)
  },

  /**
   * Get projects for dropdown lookup
   */
  async getLookup(
    societyId: number,
    clientId?: number,
    search?: string,
    limit = 50
  ): Promise<ProjectLookupItem[]> {
    const params: Record<string, any> = { soc_id: societyId, limit }
    if (clientId) params.client_id = clientId
    if (search) params.search = search

    const response = await apiClient.get('/projects/lookup', { params })
    return (response.data || []).map((item: any) => ({
      id: item.prj_id || item.id,
      code: item.prj_code || item.code,
      name: item.prj_name || item.name,
      display_name: item.display_name || `${item.prj_code || item.code} - ${item.prj_name || item.name}`,
      client_id: item.cli_id || item.client_id,
    }))
  },

  /**
   * Get project summary statistics
   */
  async getSummary(societyId?: number): Promise<ProjectSummary> {
    const params: Record<string, any> = {}
    if (societyId) params.soc_id = societyId

    const response = await apiClient.get('/projects/summary', { params })
    return {
      total_count: response.data.total_count || 0,
      projects_by_client: response.data.projects_by_client || 0,
      recent_projects: response.data.recent_projects || 0,
    }
  },
}
