import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export type CalendarViewMode = 'month' | 'week' | 'day' | 'kanban'

interface CalendarToolbarProps {
  currentDate: Date
  viewMode: CalendarViewMode
  onViewModeChange: (mode: CalendarViewMode) => void
  onNavigate: (direction: 'prev' | 'next' | 'today') => void
  onNewTask: () => void
}

export function CalendarToolbar({
  currentDate,
  viewMode,
  onViewModeChange,
  onNavigate,
  onNewTask,
}: CalendarToolbarProps) {
  const { t } = useTranslation()

  const getDateLabel = () => {
    switch (viewMode) {
      case 'month':
        return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      case 'week': {
        const start = getWeekStart(currentDate)
        const end = new Date(start)
        end.setDate(end.getDate() + 6)
        const sameMonth = start.getMonth() === end.getMonth()
        if (sameMonth) {
          return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${end.getDate()}, ${end.getFullYear()}`
        }
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${end.getFullYear()}`
      }
      case 'day':
        return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      case 'kanban':
        return t('calendar.kanban', 'Kanban Board')
      default:
        return ''
    }
  }

  const views: { key: CalendarViewMode; label: string }[] = [
    { key: 'month', label: t('calendar.viewMonth', 'Month') },
    { key: 'week', label: t('calendar.viewWeek', 'Week') },
    { key: 'day', label: t('calendar.viewDay', 'Day') },
    { key: 'kanban', label: t('calendar.kanban', 'Kanban') },
  ]

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
      {/* Left: Navigation */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigate('prev')}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            aria-label="Previous"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => onNavigate('next')}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            aria-label="Next"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <h2 className="text-lg font-semibold text-foreground whitespace-nowrap">{getDateLabel()}</h2>
        <button
          onClick={() => onNavigate('today')}
          className="text-xs font-medium text-primary hover:text-primary/80 border border-primary/30 px-2.5 py-1 rounded-md transition-colors"
        >
          {t('calendar.today', 'Today')}
        </button>
      </div>

      {/* Center: View Switcher */}
      <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-border">
        {views.map((v) => (
          <button
            key={v.key}
            onClick={() => onViewModeChange(v.key)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
              viewMode === v.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Right: New Task */}
      <button onClick={onNewTask} className="btn-primary text-sm whitespace-nowrap">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
        {t('calendar.newTask', 'New Task')}
      </button>
    </div>
  )
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getWeekDays(date: Date): Date[] {
  const start = getWeekStart(date)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}
