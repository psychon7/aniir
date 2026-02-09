import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  TaskType,
  TaskPriority,
  TaskStatus,
  TASK_TYPE_COLORS,
  TASK_PRIORITY_COLORS,
} from '@/types/task'
import type { Task, CalendarEvent } from '@/types/task'

interface TaskCardProps {
  task: Task | CalendarEvent
  variant?: 'compact' | 'full'
  onClick?: () => void
  className?: string
}

function isFullTask(t: Task | CalendarEvent): t is Task {
  return 'assignedToName' in t
}

export function TaskCard({ task, variant = 'compact', onClick, className }: TaskCardProps) {
  const { t } = useTranslation()
  const color = task.color || TASK_TYPE_COLORS[task.taskType as TaskType] || '#6B7280'
  const isCompleted = task.status === TaskStatus.COMPLETED
  const isCanceled = task.status === TaskStatus.CANCELED

  const dueDate = isFullTask(task) && task.dueDate ? new Date(task.dueDate) : null
  const isOverdue = isFullTask(task) && task.isOverdue

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'w-full text-left text-xs px-1.5 py-0.5 rounded truncate transition-opacity hover:opacity-80',
          (isCompleted || isCanceled) && 'opacity-60 line-through',
          className
        )}
        style={{
          backgroundColor: `${color}18`,
          color: color,
          borderLeft: `2px solid ${color}`,
        }}
      >
        {task.title}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-lg border border-border bg-card',
        'hover:shadow-md hover:border-border/80 transition-all duration-200',
        'cursor-pointer group',
        (isCompleted || isCanceled) && 'opacity-60',
        className
      )}
      style={{ borderLeftWidth: '3px', borderLeftColor: color }}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className={cn(
          'text-sm font-medium text-foreground truncate',
          (isCompleted || isCanceled) && 'line-through'
        )}>
          {task.title}
        </h4>
        {task.priority && (
          <span
            className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5"
            style={{ backgroundColor: TASK_PRIORITY_COLORS[task.priority as TaskPriority] }}
            title={task.priority}
          />
        )}
      </div>

      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {t(`tasks.type${task.taskType.charAt(0).toUpperCase() + task.taskType.slice(1)}`, task.taskType)}
        </span>

        {dueDate && (
          <span className={cn('text-xs', isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground')}>
            {dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>

      {isFullTask(task) && task.assignedToName && (
        <div className="flex items-center gap-1.5 mt-2">
          <div
            className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-medium"
          >
            {task.assignedToName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-muted-foreground truncate">{task.assignedToName}</span>
        </div>
      )}
    </button>
  )
}
