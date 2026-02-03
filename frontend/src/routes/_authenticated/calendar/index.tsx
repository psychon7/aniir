/**
 * Calendar page - displays tasks, meetings, and events in a calendar view.
 */
import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { PageHeader } from '@/components/ui/layout/PageHeader'
import { Card, CardHeader, CardContent } from '@/components/ui/layout/Card'
import { LoadingSkeletonCard } from '@/components/ui/feedback/LoadingSkeleton'
import { StatusBadge } from '@/components/ui/Badge'
import {
  useCalendarEvents,
  useTasks,
  useUpcomingTasks,
  useTaskSummary,
  useCreateTask,
  useCompleteTask,
} from '@/hooks/useTasks'
import {
  TaskType,
  TaskPriority,
  TaskStatus,
  TASK_TYPE_COLORS,
  TASK_PRIORITY_COLORS,
  TASK_STATUS_COLORS,
} from '@/types/task'
import type { CalendarEvent, Task, TaskCreateDto } from '@/types/task'

export const Route = createFileRoute('/_authenticated/calendar/')({
  component: CalendarPage,
})

function CalendarPage() {
  const { t } = useTranslation()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')

  // Get current month's date range
  const dateRange = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    }
  }, [currentDate])

  // Fetch calendar events
  const { data: events = [], isLoading: eventsLoading } = useCalendarEvents({
    start: dateRange.start,
    end: dateRange.end,
    includeCompleted: false,
  })

  // Fetch upcoming tasks for sidebar (assuming user ID 1 for now)
  const { data: upcomingTasks = [], isLoading: upcomingLoading } = useUpcomingTasks(1, 7, 10)

  // Fetch task summary for stats
  const { data: summary, isLoading: summaryLoading } = useTaskSummary()

  // Navigation helpers
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []

    // Add empty days for padding at start
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }, [currentDate])

  // Get events for a specific day
  const getEventsForDay = (date: Date): CalendarEvent[] => {
    return events.filter((event) => {
      const eventStart = event.start ? new Date(event.start) : null
      if (!eventStart) return false
      return (
        eventStart.getDate() === date.getDate() &&
        eventStart.getMonth() === date.getMonth() &&
        eventStart.getFullYear() === date.getFullYear()
      )
    })
  }

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Format month name
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  if (eventsLoading || upcomingLoading || summaryLoading) {
    return (
      <PageContainer>
        <LoadingSkeletonCard />
        <LoadingSkeletonCard />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('calendar.title', 'Calendar')}
        description={t('calendar.description', 'Manage your tasks, meetings, and events')}
        breadcrumbs={[{ label: t('calendar.title', 'Calendar') }]}
        actions={
          <button className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            {t('calendar.newTask', 'New Task')}
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader
              title={
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={goToPreviousMonth}
                      className="p-1 hover:bg-muted rounded transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-lg font-semibold">{monthName}</span>
                    <button
                      onClick={goToNextMonth}
                      className="p-1 hover:bg-muted rounded transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={goToToday}
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    {t('calendar.today', 'Today')}
                  </button>
                </div>
              }
            />
            <CardContent>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="h-24 bg-muted/30 rounded" />
                  }

                  const dayEvents = getEventsForDay(day)
                  const today = isToday(day)

                  return (
                    <div
                      key={day.toISOString()}
                      className={`h-24 p-1 border rounded cursor-pointer transition-colors hover:bg-muted/50 ${
                        today ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className={`text-sm font-medium ${today ? 'text-primary' : 'text-foreground'}`}>
                        {day.getDate()}
                      </div>
                      <div className="mt-1 space-y-1 overflow-hidden">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className="text-xs px-1 py-0.5 rounded truncate"
                            style={{
                              backgroundColor: `${event.color || TASK_TYPE_COLORS[event.taskType]}20`,
                              color: event.color || TASK_TYPE_COLORS[event.taskType],
                            }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground pl-1">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Summary */}
          {summary && (
            <Card>
              <CardHeader title={t('calendar.summary', 'Summary')} />
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{summary.total}</div>
                    <div className="text-xs text-muted-foreground">{t('calendar.totalTasks', 'Total Tasks')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{summary.overdue}</div>
                    <div className="text-xs text-muted-foreground">{t('calendar.overdue', 'Overdue')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">{summary.byStatus?.in_progress || 0}</div>
                    <div className="text-xs text-muted-foreground">{t('calendar.inProgress', 'In Progress')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{summary.byStatus?.completed || 0}</div>
                    <div className="text-xs text-muted-foreground">{t('calendar.completed', 'Completed')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Tasks */}
          <Card>
            <CardHeader
              title={t('calendar.upcomingTasks', 'Upcoming Tasks')}
              action={
                <button className="text-sm text-primary hover:text-primary/80 transition-colors">
                  {t('common.viewAll', 'View All')}
                </button>
              }
            />
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('calendar.noUpcomingTasks', 'No upcoming tasks')}</p>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <TaskListItem key={task.id} task={task} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Type Legend */}
          <Card>
            <CardHeader title={t('calendar.legend', 'Legend')} />
            <CardContent>
              <div className="space-y-2">
                {Object.entries(TASK_TYPE_COLORS).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                    <span className="text-sm text-foreground capitalize">{type}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}

// Task list item component
function TaskListItem({ task }: { task: Task }) {
  const { t } = useTranslation()
  const completeMutation = useCompleteTask()

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await completeMutation.mutateAsync({ taskId: task.id })
  }

  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  const isOverdue = task.isOverdue

  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      <button
        onClick={handleComplete}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors ${
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
        <p className={`text-sm font-medium ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: `${TASK_TYPE_COLORS[task.taskType as TaskType]}20`,
              color: TASK_TYPE_COLORS[task.taskType as TaskType],
            }}
          >
            {task.taskType}
          </span>
          {dueDate && (
            <span className={`text-xs ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
              {dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          )}
          {task.priority && task.priority !== TaskPriority.MEDIUM && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${TASK_PRIORITY_COLORS[task.priority as TaskPriority]}20`,
                color: TASK_PRIORITY_COLORS[task.priority as TaskPriority],
              }}
            >
              {task.priority}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
