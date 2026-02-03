/**
 * Users API client for User management.
 */
import api from './client'
import type {
  User,
  UserListItem,
  UserLookup,
  UserCreateDto,
  UserUpdateDto,
  UserPaginatedResponse,
  UserListParams,
  RoleLookup,
  CivilityLookup,
} from '@/types/user'

// =============================================================================
// User CRUD Operations
// =============================================================================

/**
 * Get paginated list of users
 */
export async function getUsers(params: UserListParams = {}): Promise<UserPaginatedResponse> {
  const response = await api.get<UserPaginatedResponse>('/users', { params })
  return response.data
}

/**
 * Get a single user by ID
 */
export async function getUser(userId: number): Promise<User> {
  const response = await api.get<User>(`/users/${userId}`)
  return response.data
}

/**
 * Get a user by login
 */
export async function getUserByLogin(login: string): Promise<User> {
  const response = await api.get<User>(`/users/by-login/${login}`)
  return response.data
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User> {
  const response = await api.get<User>('/users/me')
  return response.data
}

/**
 * Create a new user
 */
export async function createUser(data: UserCreateDto): Promise<User> {
  const response = await api.post<User>('/users', data)
  return response.data
}

/**
 * Update an existing user
 */
export async function updateUser(userId: number, data: UserUpdateDto): Promise<User> {
  const response = await api.put<User>(`/users/${userId}`, data)
  return response.data
}

/**
 * Delete a user (soft delete)
 */
export async function deleteUser(userId: number): Promise<void> {
  await api.delete(`/users/${userId}`)
}

// =============================================================================
// Lookup Endpoints
// =============================================================================

/**
 * Get users for dropdowns
 */
export async function getUsersLookup(activeOnly: boolean = true): Promise<UserLookup[]> {
  const response = await api.get<UserLookup[]>('/users/lookup', {
    params: { active_only: activeOnly },
  })
  return response.data
}

/**
 * Get roles for dropdowns
 */
export async function getRolesLookup(activeOnly: boolean = true): Promise<RoleLookup[]> {
  const response = await api.get<RoleLookup[]>('/users/roles/lookup', {
    params: { active_only: activeOnly },
  })
  return response.data
}

/**
 * Get civilities for dropdowns
 */
export async function getCivilitiesLookup(activeOnly: boolean = true): Promise<CivilityLookup[]> {
  const response = await api.get<CivilityLookup[]>('/users/civilities/lookup', {
    params: { active_only: activeOnly },
  })
  return response.data
}
