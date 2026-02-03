/**
 * React Query hooks for User management.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getUsers,
  getUser,
  getUserByLogin,
  getCurrentUser,
  createUser,
  updateUser,
  deleteUser,
  getUsersLookup,
  getRolesLookup,
  getCivilitiesLookup,
} from '@/api/users'
import type { UserCreateDto, UserUpdateDto, UserListParams } from '@/types/user'

// =============================================================================
// Query Keys
// =============================================================================

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params?: UserListParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
  byLogin: (login: string) => [...userKeys.all, 'login', login] as const,
  current: () => [...userKeys.all, 'current'] as const,
  // Lookups
  lookups: () => [...userKeys.all, 'lookups'] as const,
  usersLookup: (activeOnly?: boolean) => [...userKeys.lookups(), 'users', activeOnly] as const,
  rolesLookup: (activeOnly?: boolean) => [...userKeys.lookups(), 'roles', activeOnly] as const,
  civilitiesLookup: (activeOnly?: boolean) =>
    [...userKeys.lookups(), 'civilities', activeOnly] as const,
}

// =============================================================================
// User Queries
// =============================================================================

/**
 * Get paginated list of users
 */
export function useUsers(params: UserListParams = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => getUsers(params),
  })
}

/**
 * Get a single user by ID
 */
export function useUser(userId: number) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => getUser(userId),
    enabled: userId > 0,
  })
}

/**
 * Get a user by login
 */
export function useUserByLogin(login: string) {
  return useQuery({
    queryKey: userKeys.byLogin(login),
    queryFn: () => getUserByLogin(login),
    enabled: Boolean(login),
  })
}

/**
 * Get current authenticated user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: () => getCurrentUser(),
  })
}

// =============================================================================
// Lookup Queries
// =============================================================================

/**
 * Get users for dropdowns
 */
export function useUsersLookup(activeOnly: boolean = true) {
  return useQuery({
    queryKey: userKeys.usersLookup(activeOnly),
    queryFn: () => getUsersLookup(activeOnly),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Get roles for dropdowns
 */
export function useRolesLookup(activeOnly: boolean = true) {
  return useQuery({
    queryKey: userKeys.rolesLookup(activeOnly),
    queryFn: () => getRolesLookup(activeOnly),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Get civilities for dropdowns
 */
export function useCivilitiesLookup(activeOnly: boolean = true) {
  return useQuery({
    queryKey: userKeys.civilitiesLookup(activeOnly),
    queryFn: () => getCivilitiesLookup(activeOnly),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UserCreateDto) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.usersLookup() })
    },
  })
}

/**
 * Update an existing user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: UserUpdateDto }) =>
      updateUser(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.usersLookup() })
    },
  })
}

/**
 * Delete a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: number) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}
