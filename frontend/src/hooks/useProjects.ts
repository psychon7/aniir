import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '@/api/projects'
import type { ProjectCreateDto, ProjectUpdateDto, ProjectSearchParams } from '@/types/project'

// Query keys factory
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (params: ProjectSearchParams) => [...projectKeys.lists(), params] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: number) => [...projectKeys.details(), id] as const,
  byClient: (clientId: number) => [...projectKeys.all, 'by-client', clientId] as const,
  lookup: (societyId: number, clientId?: number, search?: string) =>
    [...projectKeys.all, 'lookup', { societyId, clientId, search }] as const,
  summary: (societyId?: number) => [...projectKeys.all, 'summary', societyId] as const,
}

/**
 * Hook to fetch paginated list of projects
 */
export function useProjects(params: ProjectSearchParams = {}) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => projectsApi.getAll(params),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch a single project by ID
 */
export function useProject(id: number) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectsApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch projects by client ID
 */
export function useProjectsByClient(clientId: number) {
  return useQuery({
    queryKey: projectKeys.byClient(clientId),
    queryFn: () => projectsApi.getByClient(clientId),
    enabled: !!clientId,
  })
}

/**
 * Hook to fetch projects for dropdown lookup
 */
export function useProjectLookup(societyId: number, clientId?: number, search?: string) {
  return useQuery({
    queryKey: projectKeys.lookup(societyId, clientId, search),
    queryFn: () => projectsApi.getLookup(societyId, clientId, search),
    enabled: !!societyId,
    staleTime: 60 * 1000,
  })
}

/**
 * Hook to fetch project summary statistics
 */
export function useProjectSummary(societyId?: number) {
  return useQuery({
    queryKey: projectKeys.summary(societyId),
    queryFn: () => projectsApi.getSummary(societyId),
    staleTime: 60 * 1000,
  })
}

/**
 * Hook to create a new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProjectCreateDto) => projectsApi.create(data),
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.summary() })
      if (newProject.clientId) {
        queryClient.invalidateQueries({ queryKey: projectKeys.byClient(newProject.clientId) })
      }
    },
  })
}

/**
 * Hook to update an existing project
 */
export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProjectUpdateDto }) =>
      projectsApi.update(id, data),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject)
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

/**
 * Hook to delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => projectsApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: projectKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.summary() })
    },
  })
}
