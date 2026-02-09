import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { isToday, isSameDay } from './CalendarToolbar'
import { TaskCard } from './TaskCard'
import { TASK_TYPE_COLORS, TaskType } from '@/types/task'
import type { CalendarEvent, Task } from '@/types/task'

const MAX_VISIBLE_EVENTS = 3

interface MonthViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onDateClick: (date: Date) => void
  onEventClick: (eventId: number) => void
}

export function MonthView({ currentDate, events, onDateClick, onEventClick }: MonthViewProps) {
  const { t } = useTranslation()
  const [popoverDate, setPopoverDate] = useState<Date | null>(null)

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    // Pad end to complete the grid row
    while (days.length % 7 !== 0) {
      days.push(null)
    }
    return days
  }, [currentDate])

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    return events.filter((event) => {
      const eventStart = event.start ? new Date(event.start) : null
      if (!eventStart) return false
      return isSameDay(eventStart, date)
    })
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="min-h-[120px] bg-muted/20" />
          }

          const dayEvents = getEventsForDay(day)
          const today = isToday(day)
          const hasMore = dayEvents.length > MAX_VISIBLE_EVENTS
          const showPopover = popoverDate && isSameDay(popoverDate, day)

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[120px] p-1 bg-card cursor-pointer transition-colors hover:bg-muted/30 relative',
                today && 'bg-primary/[0.03]'
              )}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('[data-event]')) return
                onDateClick(day)
              }}
            >
              <div className={cn(
                'text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                today && 'bg-primary text-primary-foreground',
                !today && 'text-foreground'
              )}>
                {day.getDate()}
              </div>

              <div className="space-y-0.5">
                {dayEvents.slice(0, MAX_VISIBLE_EVENTS).map((event) => (
                  <div key={event.id} data-event>
                    <TaskCard
                      task={event}
                      variant="compact"
                      onClick={() => onEventClick(event.id)}
                    />
                  </div>
                ))}
                {hasMore && (
                  <button
                    data-event
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPopoverDate(showPopover ? null : day)
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground pl-1 transition-colors"
                  >
                    +{dayEvents.length - MAX_VISIBLE_EVENTS} {t('common.more', 'more')}
                  </button>
                )}
              </div>

              {/* Popover for overflow events */}
              {showPopover && (
                <div
                  className="absolute z-50 top-full left-0 mt-1 w-56 bg-card rounded-lg shadow-xl border border-border p-2 space-y-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-1 px-1">
                    <span className="text-xs font-medium text-foreground">
                      {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPopoverDate(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {dayEvents.map((event) => (
                    <div key={event.id} data-event>
                      <TaskCard
                        task={event}
                        variant="compact"
                        onClick={() => { setPopoverDate(null); onEventClick(event.id); }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
