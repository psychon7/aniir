import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { TaskCard } from './TaskCard'
import { TASK_STATUS_COLORS, TaskStatus } from '@/types/task'
import type { Task } from '@/types/task'

interface KanbanColumnProps {
  status: TaskStatus
  label: string
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

export function KanbanColumn({ status, label, tasks, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const color = TASK_STATUS_COLORS[status]

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] flex-1">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5 ml-auto">
          {tasks.length}
        </span>
      </div>

      {/* Droppable zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-lg p-2 space-y-2 min-h-[200px] transition-colors duration-200',
          'bg-muted/20 border border-dashed border-border',
          isOver && 'bg-primary/5 border-primary/30'
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  )
}

function SortableTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'touch-manipulation',
        isDragging && 'opacity-50 z-50'
      )}
    >
      <TaskCard task={task} variant="full" onClick={onClick} />
    </div>
  )
}
