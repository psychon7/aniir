/**
 * Tasks API client for Calendar/Tasks feature.
 */
import api from './client'
import type {
  Task,
  TaskCreateDto,
  TaskUpdateDto,
  TaskPaginatedResponse,
  TaskListParams,
  CalendarEvent,
  CalendarEventParams,
  TaskSummary,
  TaskStatusUpdateDto,
  TaskCompleteDto,
} from '@/types/task'

// =============================================================================
// Task CRUD Operations
// =============================================================================

/**
 * Get paginated list of tasks
 */
export async function getTasks(params: TaskListParams = {}): Promise<TaskPaginatedResponse> {
  const response = await api.get<TaskPaginatedResponse>('/tasks', { params })
  return response.data
}

/**
 * Get a single task by ID
 */
export async function getTask(taskId: number): Promise<Task> {
  const response = await api.get<Task>(`/tasks/${taskId}`)
  return response.data
}

/**
 * Create a new task
 */
export async function createTask(data: TaskCreateDto, creatorId: number = 1): Promise<Task> {
  const response = await api.post<Task>('/tasks', data, {
    params: { creatorId },
  })
  return response.data
}

/**
 * Update an existing task
 */
export async function updateTask(taskId: number, data: TaskUpdateDto): Promise<Task> {
  const response = await api.put<Task>(`/tasks/${taskId}`, data)
  return response.data
}

/**
 * Delete a task (soft delete by default)
 */
export async function deleteTask(taskId: number, hardDelete: boolean = false): Promise<void> {
  await api.delete(`/tasks/${taskId}`, { params: { hardDelete } })
}

// =============================================================================
// Status Update Operations
// =============================================================================

/**
 * Update task status only
 */
export async function updateTaskStatus(taskId: number, data: TaskStatusUpdateDto): Promise<Task> {
  const response = await api.patch<Task>(`/tasks/${taskId}/status`, data)
  return response.data
}

/**
 * Mark a task as completed
 */
export async function completeTask(taskId: number, data?: TaskCompleteDto): Promise<Task> {
  const response = await api.post<Task>(`/tasks/${taskId}/complete`, data || {})
  return response.data
}

// =============================================================================
// Calendar Operations
// =============================================================================

/**
 * Get calendar events for a date range
 */
export async function getCalendarEvents(params: CalendarEventParams): Promise<CalendarEvent[]> {
  const { taskTypes, ...rest } = params

  const queryParams: Record<string, any> = { ...rest }

  // Convert task types array to comma-separated string
  if (taskTypes && taskTypes.length > 0) {
    queryParams.taskTypes = taskTypes.join(',')
  }

  const response = await api.get<CalendarEvent[]>('/tasks/calendar/events', {
    params: queryParams,
  })
  return response.data
}

/**
 * Get upcoming tasks for a user
 */
export async function getUpcomingTasks(
  userId: number,
  days: number = 7,
  limit: number = 10
): Promise<Task[]> {
  const response = await api.get<Task[]>('/tasks/calendar/upcoming', {
    params: { userId, days, limit },
  })
  return response.data
}

/**
 * Get overdue tasks
 */
export async function getOverdueTasks(
  userId?: number,
  societyId?: number
): Promise<Task[]> {
  const response = await api.get<Task[]>('/tasks/calendar/overdue', {
    params: { userId, societyId },
  })
  return response.data
}

/**
 * Get task summary statistics
 */
export async function getTaskSummary(
  userId?: number,
  societyId?: number
): Promise<TaskSummary> {
  const response = await api.get<TaskSummary>('/tasks/stats/summary', {
    params: { userId, societyId },
  })
  return response.data
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get tasks for a specific client
 */
export async function getClientTasks(
  clientId: number,
  params: Omit<TaskListParams, 'clientId'> = {}
): Promise<TaskPaginatedResponse> {
  return getTasks({ ...params, clientId })
}

/**
 * Get tasks for a specific project
 */
export async function getProjectTasks(
  projectId: number,
  params: Omit<TaskListParams, 'projectId'> = {}
): Promise<TaskPaginatedResponse> {
  return getTasks({ ...params, projectId })
}

/**
 * Get tasks assigned to a specific user
 */
export async function getUserTasks(
  userId: number,
  params: Omit<TaskListParams, 'userId'> = {}
): Promise<TaskPaginatedResponse> {
  return getTasks({ ...params, userId })
}
