import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { isToday, isSameDay } from './CalendarToolbar'
import { TaskCard } from './TaskCard'
import { TASK_TYPE_COLORS, TaskType } from '@/types/task'
import type { CalendarEvent } from '@/types/task'

const HOUR_START = 6
const HOUR_END = 22
const HOUR_HEIGHT = 64

interface DayViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onSlotClick: (date: Date, time: string) => void
  onEventClick: (eventId: number) => void
}

export function DayView({ currentDate, events, onSlotClick, onEventClick }: DayViewProps) {
  const { t } = useTranslation()
  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i)
  const today = isToday(currentDate)

  const allDayEvents = useMemo(() =>
    events.filter((e) => e.allDay && e.start && isSameDay(new Date(e.start), currentDate)),
    [events, currentDate]
  )

  const timedEvents = useMemo(() =>
    events.filter((e) => !e.allDay && e.start && isSameDay(new Date(e.start), currentDate)),
    [events, currentDate]
  )

  const getEventPosition = (event: CalendarEvent) => {
    if (!event.start) return { top: 0, height: HOUR_HEIGHT }
    const start = new Date(event.start)
    const startHour = start.getHours() + start.getMinutes() / 60
    const top = Math.max(0, (startHour - HOUR_START) * HOUR_HEIGHT)

    let durationHours = 1
    if (event.end) {
      const end = new Date(event.end)
      durationHours = Math.max(0.5, (end.getTime() - start.getTime()) / (1000 * 60 * 60))
    }
    return { top, height: Math.max(28, durationHours * HOUR_HEIGHT) }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 bg-muted/30 border-b border-border">
        <div className={cn(
          'text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full',
          today && 'bg-primary text-primary-foreground'
        )}>
          {currentDate.getDate()}
        </div>
        <div>
          <div className="text-sm font-medium text-foreground">
            {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
          </div>
          <div className="text-xs text-muted-foreground">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="p-2 border-b border-border bg-muted/10">
          <div className="text-xs text-muted-foreground mb-1 px-1">{t('calendar.allDay', 'All Day')}</div>
          <div className="space-y-1">
            {allDayEvents.map((event) => (
              <TaskCard key={event.id} task={event} variant="full" onClick={() => onEventClick(event.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="overflow-y-auto max-h-[600px] scrollbar-refined">
        <div className="grid grid-cols-[70px_1fr] relative">
          {/* Time labels */}
          <div>
            {hours.map((hour) => (
              <div key={hour} className="border-b border-border/50 pr-3 text-right" style={{ height: HOUR_HEIGHT }}>
                <span className="text-xs text-muted-foreground -translate-y-2 inline-block">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Event area */}
          <div className="relative border-l border-border">
            {/* Hour slots */}
            {hours.map((hour) => (
              <div
                key={hour}
                className="border-b border-border/50 cursor-pointer hover:bg-muted/20 transition-colors"
                style={{ height: HOUR_HEIGHT }}
                onClick={() => onSlotClick(currentDate, `${hour.toString().padStart(2, '0')}:00`)}
              />
            ))}

            {/* Positioned events */}
            <div className="absolute inset-0 pointer-events-none px-1">
              {timedEvents.map((event) => {
                const { top, height } = getEventPosition(event)
                const color = event.color || TASK_TYPE_COLORS[event.taskType as TaskType] || '#6B7280'
                return (
                  <div
                    key={event.id}
                    className="absolute left-2 right-2 rounded-lg px-3 py-1.5 overflow-hidden cursor-pointer pointer-events-auto hover:opacity-90 transition-opacity"
                    style={{
                      top,
                      height,
                      backgroundColor: `${color}15`,
                      borderLeft: `3px solid ${color}`,
                    }}
                    onClick={() => onEventClick(event.id)}
                  >
                    <div className="text-sm font-medium truncate" style={{ color }}>{event.title}</div>
                    {height > 40 && event.start && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(event.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        {event.end && ` - ${new Date(event.end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
                      </div>
                    )}
                    {height > 56 && event.clientName && (
                      <div className="text-xs text-muted-foreground mt-0.5">{event.clientName}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
