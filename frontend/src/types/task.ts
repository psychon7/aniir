/**
 * TypeScript type definitions for Tasks/Calendar feature.
 */

// =============================================================================
// Enums
// =============================================================================

export enum TaskType {
  TASK = 'task',
  MEETING = 'meeting',
  CALL = 'call',
  REMINDER = 'reminder',
  DEADLINE = 'deadline',
  EVENT = 'event',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
}

// =============================================================================
// Task Response Interface (from API)
// =============================================================================

export interface Task {
  id: number
  reference: string | null
  title: string
  description: string | null
  taskType: TaskType
  priority: TaskPriority | null
  status: TaskStatus
  startDate: string | null
  endDate: string | null
  dueDate: string | null
  isAllDay: boolean
  assignedToId: number | null
  createdById: number
  clientId: number | null
  supplierId: number | null
  projectId: number | null
  quoteId: number | null
  orderId: number | null
  invoiceId: number | null
  societyId: number
  createdAt: string
  updatedAt: string
  completedAt: string | null
  isActive: boolean
  notes: string | null
  location: string | null
  color: string | null

  // Resolved names
  assignedToName: string | null
  creatorName: string | null
  clientName: string | null
  supplierName: string | null
  projectName: string | null

  // Computed fields
  isOverdue: boolean
  isCompleted: boolean
}

// =============================================================================
// Create/Update DTOs (to API)
// =============================================================================

export interface TaskCreateDto {
  title: string
  description?: string | null
  taskType?: TaskType
  priority?: TaskPriority
  startDate?: string | null
  endDate?: string | null
  dueDate?: string | null
  isAllDay?: boolean
  assignedToId?: number | null
  clientId?: number | null
  supplierId?: number | null
  projectId?: number | null
  quoteId?: number | null
  orderId?: number | null
  invoiceId?: number | null
  societyId: number
  notes?: string | null
  location?: string | null
  color?: string | null
}

export interface TaskUpdateDto {
  title?: string
  description?: string | null
  taskType?: TaskType
  priority?: TaskPriority
  status?: TaskStatus
  startDate?: string | null
  endDate?: string | null
  dueDate?: string | null
  isAllDay?: boolean
  assignedToId?: number | null
  clientId?: number | null
  supplierId?: number | null
  projectId?: number | null
  quoteId?: number | null
  orderId?: number | null
  invoiceId?: number | null
  notes?: string | null
  location?: string | null
  color?: string | null
  isActive?: boolean
}

// =============================================================================
// Paginated Response
// =============================================================================

export interface TaskPaginatedResponse {
  data: Task[]
  total: number
  page: number
  pageSize: number
  pages: number
}

// =============================================================================
// Calendar Event Interface (simplified for calendar views)
// =============================================================================

export interface CalendarEvent {
  id: number
  title: string
  start: string | null
  end: string | null
  allDay: boolean
  color: string | null
  taskType: TaskType
  priority: TaskPriority | null
  status: TaskStatus
  clientName: string | null
  projectName: string | null
}

// =============================================================================
// Task Summary (for dashboard)
// =============================================================================

export interface TaskSummary {
  total: number
  byStatus: Record<TaskStatus, number>
  byType: Record<TaskType, number>
  byPriority: Record<TaskPriority, number>
  overdue: number
}

// =============================================================================
// Query Parameters
// =============================================================================

export interface TaskListParams {
  page?: number
  pageSize?: number
  userId?: number
  societyId?: number
  status?: TaskStatus
  taskType?: TaskType
  priority?: TaskPriority
  clientId?: number
  projectId?: number
  activeOnly?: boolean
  search?: string
  orderBy?: string
  orderDir?: 'asc' | 'desc'
}

export interface CalendarEventParams {
  start: string
  end: string
  userId?: number
  societyId?: number
  taskTypes?: TaskType[]
  includeCompleted?: boolean
}

// =============================================================================
// Status/Complete Request
// =============================================================================

export interface TaskStatusUpdateDto {
  status: TaskStatus
}

export interface TaskCompleteDto {
  notes?: string
}

// =============================================================================
// Helper Types
// =============================================================================

export type TaskTypeLabel = {
  [key in TaskType]: string
}

export type TaskPriorityLabel = {
  [key in TaskPriority]: string
}

export type TaskStatusLabel = {
  [key in TaskStatus]: string
}

// Default colors for task types (matches backend)
export const TASK_TYPE_COLORS: Record<TaskType, string> = {
  [TaskType.TASK]: '#6B7280',     // Gray
  [TaskType.MEETING]: '#3B82F6',  // Blue
  [TaskType.CALL]: '#10B981',     // Green
  [TaskType.REMINDER]: '#F59E0B', // Amber
  [TaskType.DEADLINE]: '#EF4444', // Red
  [TaskType.EVENT]: '#8B5CF6',    // Purple
}

// Priority colors
export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: '#9CA3AF',    // Gray-400
  [TaskPriority.MEDIUM]: '#3B82F6', // Blue
  [TaskPriority.HIGH]: '#F59E0B',   // Amber
  [TaskPriority.URGENT]: '#DC2626', // Red-600
}

// Status colors
export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: '#9CA3AF',    // Gray-400
  [TaskStatus.IN_PROGRESS]: '#3B82F6', // Blue
  [TaskStatus.COMPLETED]: '#10B981',  // Green
  [TaskStatus.CANCELED]: '#6B7280',   // Gray
}
