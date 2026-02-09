import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { getWeekDays, isToday, isSameDay } from './CalendarToolbar'
import { TaskCard } from './TaskCard'
import { TASK_TYPE_COLORS, TaskType } from '@/types/task'
import type { CalendarEvent } from '@/types/task'

const HOUR_START = 7
const HOUR_END = 21
const HOUR_HEIGHT = 60 // px per hour

interface WeekViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onSlotClick: (date: Date, time: string) => void
  onEventClick: (eventId: number) => void
}

export function WeekView({ currentDate, events, onSlotClick, onEventClick }: WeekViewProps) {
  const { t } = useTranslation()
  const weekDays = getWeekDays(currentDate)
  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i)

  const allDayEvents = useMemo(() => {
    return events.filter((e) => e.allDay)
  }, [events])

  const timedEvents = useMemo(() => {
    return events.filter((e) => !e.allDay && e.start)
  }, [events])

  const getEventsForDayAllDay = (day: Date) =>
    allDayEvents.filter((e) => e.start && isSameDay(new Date(e.start), day))

  const getTimedEventsForDay = (day: Date) =>
    timedEvents.filter((e) => e.start && isSameDay(new Date(e.start), day))

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
    const height = durationHours * HOUR_HEIGHT

    return { top, height: Math.max(24, height) }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Header row */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-muted/30 border-b border-border">
        <div className="p-2 text-xs text-muted-foreground" />
        {weekDays.map((day) => {
          const today = isToday(day)
          return (
            <div key={day.toISOString()} className="p-2 text-center border-l border-border">
              <div className="text-xs text-muted-foreground">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={cn(
                'text-sm font-medium mt-0.5 w-7 h-7 flex items-center justify-center mx-auto rounded-full',
                today && 'bg-primary text-primary-foreground'
              )}>
                {day.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* All-day bar */}
      {allDayEvents.length > 0 && (
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-muted/10">
          <div className="p-2 text-xs text-muted-foreground flex items-center justify-end pr-3">
            {t('calendar.allDay', 'All Day')}
          </div>
          {weekDays.map((day) => {
            const dayAllDay = getEventsForDayAllDay(day)
            return (
              <div key={day.toISOString()} className="p-1 border-l border-border min-h-[32px]">
                {dayAllDay.map((event) => (
                  <div key={event.id} className="mb-0.5">
                    <TaskCard task={event} variant="compact" onClick={() => onEventClick(event.id)} />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Time grid */}
      <div className="overflow-y-auto max-h-[600px] scrollbar-refined">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
          {/* Time labels */}
          <div>
            {hours.map((hour) => (
              <div key={hour} className="border-b border-border pr-2 text-right" style={{ height: HOUR_HEIGHT }}>
                <span className="text-xs text-muted-foreground -translate-y-2 inline-block">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dayTimedEvents = getTimedEventsForDay(day)
            return (
              <div key={day.toISOString()} className="relative border-l border-border">
                {/* Hour slots */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="border-b border-border/50 cursor-pointer hover:bg-muted/20 transition-colors"
                    style={{ height: HOUR_HEIGHT }}
                    onClick={() => onSlotClick(day, `${hour.toString().padStart(2, '0')}:00`)}
                  />
                ))}

                {/* Positioned events */}
                <div className="absolute inset-0 pointer-events-none">
                  {dayTimedEvents.map((event) => {
                    const { top, height } = getEventPosition(event)
                    const color = event.color || TASK_TYPE_COLORS[event.taskType as TaskType] || '#6B7280'
                    return (
                      <div
                        key={event.id}
                        className="absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 overflow-hidden cursor-pointer pointer-events-auto hover:opacity-90 transition-opacity"
                        style={{
                          top,
                          height,
                          backgroundColor: `${color}20`,
                          borderLeft: `2px solid ${color}`,
                        }}
                        onClick={() => onEventClick(event.id)}
                      >
                        <div className="text-xs font-medium truncate" style={{ color }}>{event.title}</div>
                        {height > 32 && event.start && (
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(event.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
