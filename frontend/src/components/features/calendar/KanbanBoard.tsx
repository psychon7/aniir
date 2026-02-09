import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useQueryClient } from '@tanstack/react-query'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
import { useTasks, useUpdateTaskStatus, taskKeys } from '@/hooks/useTasks'
import { TaskStatus } from '@/types/task'
import type { Task, TaskPaginatedResponse } from '@/types/task'

interface KanbanBoardProps {
  onTaskClick: (task: Task) => void
  societyId?: number
  userId?: number
}

const COLUMNS: { status: TaskStatus; labelKey: string }[] = [
  { status: TaskStatus.PENDING, labelKey: 'tasks.statusPending' },
  { status: TaskStatus.IN_PROGRESS, labelKey: 'tasks.statusInProgress' },
  { status: TaskStatus.COMPLETED, labelKey: 'tasks.statusCompleted' },
  { status: TaskStatus.CANCELED, labelKey: 'tasks.statusCanceled' },
]

export function KanbanBoard({ onTaskClick, societyId, userId }: KanbanBoardProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const updateStatusMutation = useUpdateTaskStatus()

  const params = {
    pageSize: 200,
    activeOnly: true,
    ...(societyId ? { societyId } : {}),
    ...(userId ? { userId } : {}),
  }

  const { data, isLoading } = useTasks(params)
  const tasks = data?.data || []

  const grouped = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      [TaskStatus.PENDING]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.COMPLETED]: [],
      [TaskStatus.CANCELED]: [],
    }
    for (const task of tasks) {
      const s = task.status as TaskStatus
      if (groups[s]) {
        groups[s].push(task)
      }
    }
    return groups
  }, [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = active.id as number
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    // Determine the target status from the droppable zone
    let targetStatus: TaskStatus | null = null

    // Check if dropped on a column directly
    if (Object.values(TaskStatus).includes(over.id as TaskStatus)) {
      targetStatus = over.id as TaskStatus
    } else {
      // Dropped on a task — find which column it belongs to
      const overTask = tasks.find((t) => t.id === over.id)
      if (overTask) {
        targetStatus = overTask.status as TaskStatus
      }
    }

    if (!targetStatus || targetStatus === task.status) return

    // Optimistic update
    const queryKey = taskKeys.list(params)
    const previousData = queryClient.getQueryData<TaskPaginatedResponse>(queryKey)

    queryClient.setQueryData<TaskPaginatedResponse>(queryKey, (old) => {
      if (!old) return old
      return {
        ...old,
        data: old.data.map((t) =>
          t.id === taskId ? { ...t, status: targetStatus! } : t
        ),
      }
    })

    updateStatusMutation.mutate(
      { taskId, status: targetStatus },
      {
        onError: () => {
          // Rollback on error
          if (previousData) {
            queryClient.setQueryData(queryKey, previousData)
          }
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(({ status }) => (
          <div key={status} className="min-w-[280px] flex-1">
            <div className="h-8 bg-muted/50 rounded mb-3 animate-pulse" />
            <div className="space-y-2">
              <div className="h-24 bg-muted/30 rounded-lg animate-pulse" />
              <div className="h-24 bg-muted/30 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-refined">
        {COLUMNS.map(({ status, labelKey }) => (
          <KanbanColumn
            key={status}
            status={status}
            label={t(labelKey, status)}
            tasks={grouped[status]}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 shadow-2xl">
            <TaskCard task={activeTask} variant="full" />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
