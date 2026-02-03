/**
 * React Query hooks for Tasks/Calendar feature.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  completeTask,
  getCalendarEvents,
  getUpcomingTasks,
  getOverdueTasks,
  getTaskSummary,
  getClientTasks,
  getProjectTasks,
  getUserTasks,
} from '@/api/tasks'
import type {
  TaskCreateDto,
  TaskUpdateDto,
  TaskListParams,
  CalendarEventParams,
  TaskStatusUpdateDto,
  TaskCompleteDto,
  TaskStatus,
} from '@/types/task'

// =============================================================================
// Query Keys
// =============================================================================

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params?: TaskListParams) => [...taskKeys.lists(), params] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: number) => [...taskKeys.details(), id] as const,
  calendar: () => [...taskKeys.all, 'calendar'] as const,
  calendarEvents: (params?: CalendarEventParams) => [...taskKeys.calendar(), 'events', params] as const,
  upcoming: (userId: number, days?: number) => [...taskKeys.calendar(), 'upcoming', userId, days] as const,
  overdue: (userId?: number, societyId?: number) => [...taskKeys.calendar(), 'overdue', userId, societyId] as const,
  summary: (userId?: number, societyId?: number) => [...taskKeys.all, 'summary', userId, societyId] as const,
  byClient: (clientId: number, params?: TaskListParams) => [...taskKeys.all, 'client', clientId, params] as const,
  byProject: (projectId: number, params?: TaskListParams) => [...taskKeys.all, 'project', projectId, params] as const,
  byUser: (userId: number, params?: TaskListParams) => [...taskKeys.all, 'user', userId, params] as const,
}

// =============================================================================
// Task List Queries
// =============================================================================

/**
 * Get paginated list of tasks
 */
export function useTasks(params: TaskListParams = {}) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => getTasks(params),
  })
}

/**
 * Get a single task by ID
 */
export function useTask(taskId: number) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => getTask(taskId),
    enabled: taskId > 0,
  })
}

/**
 * Get tasks for a specific client
 */
export function useClientTasks(clientId: number, params: Omit<TaskListParams, 'clientId'> = {}) {
  return useQuery({
    queryKey: taskKeys.byClient(clientId, params),
    queryFn: () => getClientTasks(clientId, params),
    enabled: clientId > 0,
  })
}

/**
 * Get tasks for a specific project
 */
export function useProjectTasks(projectId: number, params: Omit<TaskListParams, 'projectId'> = {}) {
  return useQuery({
    queryKey: taskKeys.byProject(projectId, params),
    queryFn: () => getProjectTasks(projectId, params),
    enabled: projectId > 0,
  })
}

/**
 * Get tasks assigned to a specific user
 */
export function useUserTasks(userId: number, params: Omit<TaskListParams, 'userId'> = {}) {
  return useQuery({
    queryKey: taskKeys.byUser(userId, params),
    queryFn: () => getUserTasks(userId, params),
    enabled: userId > 0,
  })
}

// =============================================================================
// Calendar Queries
// =============================================================================

/**
 * Get calendar events for a date range
 */
export function useCalendarEvents(params: CalendarEventParams) {
  return useQuery({
    queryKey: taskKeys.calendarEvents(params),
    queryFn: () => getCalendarEvents(params),
    enabled: Boolean(params.start && params.end),
  })
}

/**
 * Get upcoming tasks for a user
 */
export function useUpcomingTasks(userId: number, days: number = 7, limit: number = 10) {
  return useQuery({
    queryKey: taskKeys.upcoming(userId, days),
    queryFn: () => getUpcomingTasks(userId, days, limit),
    enabled: userId > 0,
  })
}

/**
 * Get overdue tasks
 */
export function useOverdueTasks(userId?: number, societyId?: number) {
  return useQuery({
    queryKey: taskKeys.overdue(userId, societyId),
    queryFn: () => getOverdueTasks(userId, societyId),
  })
}

/**
 * Get task summary statistics
 */
export function useTaskSummary(userId?: number, societyId?: number) {
  return useQuery({
    queryKey: taskKeys.summary(userId, societyId),
    queryFn: () => getTaskSummary(userId, societyId),
  })
}

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data, creatorId }: { data: TaskCreateDto; creatorId?: number }) =>
      createTask(data, creatorId),
    onSuccess: () => {
      // Invalidate all task queries
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

/**
 * Update an existing task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: number; data: TaskUpdateDto }) =>
      updateTask(taskId, data),
    onSuccess: (_, variables) => {
      // Invalidate specific task and all lists
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) })
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: taskKeys.calendar() })
      queryClient.invalidateQueries({ queryKey: taskKeys.summary() })
    },
  })
}

/**
 * Delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, hardDelete }: { taskId: number; hardDelete?: boolean }) =>
      deleteTask(taskId, hardDelete),
    onSuccess: () => {
      // Invalidate all task queries
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

/**
 * Update task status
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: TaskStatus }) =>
      updateTaskStatus(taskId, { status }),
    onSuccess: (_, variables) => {
      // Invalidate specific task and all lists
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) })
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: taskKeys.calendar() })
      queryClient.invalidateQueries({ queryKey: taskKeys.summary() })
    },
  })
}

/**
 * Mark task as completed
 */
export function useCompleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, notes }: { taskId: number; notes?: string }) =>
      completeTask(taskId, notes ? { notes } : undefined),
    onSuccess: (_, variables) => {
      // Invalidate specific task and all lists
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) })
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: taskKeys.calendar() })
      queryClient.invalidateQueries({ queryKey: taskKeys.summary() })
    },
  })
}
