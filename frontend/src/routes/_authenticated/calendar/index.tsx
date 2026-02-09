/**
 * Calendar page - displays tasks, meetings, and events in multiple views.
 * Supports Month, Week, Day, and Kanban views with full task CRUD.
 */
import { useState, useMemo, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardHeader, CardContent } from '@/components/ui/layout/Card'
import { LoadingSkeletonCard } from '@/components/ui/feedback/LoadingSkeleton'
import {
  useCalendarEvents,
  useUpcomingTasks,
  useTaskSummary,
  useTask,
  useCompleteTask,
} from '@/hooks/useTasks'
import { useAuthStore } from '@/stores/authStore'
import {
  TaskType,
  TaskPriority,
  TaskStatus,
  TASK_TYPE_COLORS,
  TASK_PRIORITY_COLORS,
} from '@/types/task'
import type { Task } from '@/types/task'

import { CalendarToolbar, getWeekStart } from '@/components/features/calendar/CalendarToolbar'
import type { CalendarViewMode } from '@/components/features/calendar/CalendarToolbar'
import { MonthView } from '@/components/features/calendar/MonthView'
import { WeekView } from '@/components/features/calendar/WeekView'
import { DayView } from '@/components/features/calendar/DayView'
import { KanbanBoard } from '@/components/features/calendar/KanbanBoard'
import { TaskFormModal } from '@/components/features/calendar/TaskFormModal'
import { TaskDetailModal } from '@/components/features/calendar/TaskDetailModal'

export const Route = createFileRoute('/_authenticated/calendar/')({
  component: CalendarPage,
})

function CalendarPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)

  // View state
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Modal state
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [defaultDate, setDefaultDate] = useState<Date | null>(null)
  const [defaultTime, setDefaultTime] = useState<string | null>(null)

  // Fetch selected task for detail modal
  const { data: selectedTask } = useTask(selectedTaskId || 0)

  // Date range for calendar events
  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    if (viewMode === 'month') {
      const start = new Date(year, month, 1)
      const end = new Date(year, month + 1, 0, 23, 59, 59)
      return { start: start.toISOString(), end: end.toISOString() }
    }

    if (viewMode === 'week') {
      const weekStart = getWeekStart(currentDate)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weekEnd.setHours(23, 59, 59)
      return { start: weekStart.toISOString(), end: weekEnd.toISOString() }
    }

    // Day view
    const start = new Date(currentDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(currentDate)
    end.setHours(23, 59, 59)
    return { start: start.toISOString(), end: end.toISOString() }
  }, [currentDate, viewMode])

  // Fetch data
  const { data: events = [], isLoading: eventsLoading } = useCalendarEvents({
    start: dateRange.start,
    end: dateRange.end,
    includeCompleted: false,
  })

  const { data: upcomingTasks = [] } = useUpcomingTasks(user?.id || 1, 7, 10)
  const { data: summary } = useTaskSummary(undefined, user?.societyId)

  // Navigation
  const handleNavigate = useCallback((direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date())
      return
    }

    setCurrentDate((prev) => {
      const d = new Date(prev)
      const delta = direction === 'prev' ? -1 : 1

      switch (viewMode) {
        case 'month':
          d.setMonth(d.getMonth() + delta)
          break
        case 'week':
          d.setDate(d.getDate() + 7 * delta)
          break
        case 'day':
          d.setDate(d.getDate() + delta)
          break
        default:
          break
      }
      return d
    })
  }, [viewMode])

  // Task interactions
  const openNewTask = useCallback((date?: Date | null, time?: string | null) => {
    setEditingTask(null)
    setDefaultDate(date || null)
    setDefaultTime(time || null)
    setFormModalOpen(true)
  }, [])

  const openTaskDetail = useCallback((taskId: number) => {
    setSelectedTaskId(taskId)
    setDetailModalOpen(true)
  }, [])

  const openEditTask = useCallback((task: Task) => {
    setEditingTask(task)
    setDefaultDate(null)
    setDefaultTime(null)
    setFormModalOpen(true)
  }, [])

  const handleKanbanTaskClick = useCallback((task: Task) => {
    setSelectedTaskId(task.id)
    setDetailModalOpen(true)
  }, [])

  const showSidebar = viewMode !== 'kanban'

  return (
    <PageContainer>
      <PageHeader
        title={t('calendar.title', 'Calendar')}
        description={t('calendar.description', 'Manage your tasks, meetings, and events')}
        breadcrumbs={[{ label: t('calendar.title', 'Calendar') }]}
      />

      <CalendarToolbar
        currentDate={currentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNavigate={handleNavigate}
        onNewTask={() => openNewTask()}
      />

      <div className={showSidebar ? 'grid grid-cols-1 lg:grid-cols-4 gap-6' : ''}>
        {/* Main content */}
        <div className={showSidebar ? 'lg:col-span-3' : ''}>
          <Card>
            <CardContent className="p-3">
              {eventsLoading && viewMode !== 'kanban' ? (
                <LoadingSkeletonCard />
              ) : (
                <>
                  {viewMode === 'month' && (
                    <MonthView
                      currentDate={currentDate}
                      events={events}
                      onDateClick={(date) => openNewTask(date)}
                      onEventClick={openTaskDetail}
                    />
                  )}
                  {viewMode === 'week' && (
                    <WeekView
                      currentDate={currentDate}
                      events={events}
                      onSlotClick={(date, time) => openNewTask(date, time)}
                      onEventClick={openTaskDetail}
                    />
                  )}
                  {viewMode === 'day' && (
                    <DayView
                      currentDate={currentDate}
                      events={events}
                      onSlotClick={(date, time) => openNewTask(date, time)}
                      onEventClick={openTaskDetail}
                    />
                  )}
                  {viewMode === 'kanban' && (
                    <KanbanBoard
                      onTaskClick={handleKanbanTaskClick}
                      societyId={user?.societyId}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="space-y-6">
            {/* Task Summary */}
            {summary && (
              <Card>
                <CardHeader title={t('calendar.summary', 'Summary')} />
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <SummaryItem value={summary.total} label={t('calendar.totalTasks', 'Total Tasks')} />
                    <SummaryItem value={summary.overdue} label={t('calendar.overdue', 'Overdue')} className="text-red-500" />
                    <SummaryItem value={summary.byStatus?.in_progress || 0} label={t('calendar.inProgress', 'In Progress')} className="text-blue-500" />
                    <SummaryItem value={summary.byStatus?.completed || 0} label={t('calendar.completed', 'Completed')} className="text-green-500" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Tasks */}
            <Card>
              <CardHeader title={t('calendar.upcomingTasks', 'Upcoming Tasks')} />
              <CardContent>
                {upcomingTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('calendar.noUpcomingTasks', 'No upcoming tasks')}</p>
                ) : (
                  <div className="space-y-2">
                    {upcomingTasks.map((task) => (
                      <UpcomingTaskItem
                        key={task.id}
                        task={task}
                        onClick={() => openTaskDetail(task.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardHeader title={t('calendar.legend', 'Legend')} />
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(TASK_TYPE_COLORS).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                      <span className="text-sm text-foreground capitalize">
                        {t(`tasks.type${type.charAt(0).toUpperCase() + type.slice(1)}`, type)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modals */}
      <TaskFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        task={editingTask}
        defaultDate={defaultDate}
        defaultTime={defaultTime}
      />

      <TaskDetailModal
        isOpen={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setSelectedTaskId(null); }}
        task={selectedTask || null}
        onEdit={(task) => { setDetailModalOpen(false); openEditTask(task); }}
      />
    </PageContainer>
  )
}

function SummaryItem({ value, label, className }: { value: number; label: string; className?: string }) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${className || 'text-foreground'}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function UpcomingTaskItem({ task, onClick }: { task: Task; onClick: () => void }) {
  const { t } = useTranslation()
  const completeMutation = useCompleteTask()
  const color = TASK_TYPE_COLORS[task.taskType as TaskType] || '#6B7280'
  const dueDate = task.dueDate ? new Date(task.dueDate) : null

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-start gap-2.5 py-2 border-b border-border last:border-0 text-left hover:bg-muted/30 rounded px-1 transition-colors"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          if (!task.isCompleted) completeMutation.mutate({ taskId: task.id })
        }}
        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors ${
          task.isCompleted
            ? 'bg-green-500 border-green-500'
            : 'border-muted-foreground hover:border-primary'
        }`}
        disabled={completeMutation.isPending}
      >
        {task.isCompleted && (
          <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className="text-xs px-1 py-0.5 rounded"
            style={{ backgroundColor: `${color}18`, color }}
          >
            {task.taskType}
          </span>
          {dueDate && (
            <span className={`text-xs ${task.isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
              {dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
