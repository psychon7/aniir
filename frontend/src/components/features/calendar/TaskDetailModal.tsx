import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { FormModal } from '@/components/ui/form/FormModal'
import { DeleteConfirmDialog } from '@/components/ui/feedback/ConfirmDialog'
import { useCompleteTask, useDeleteTask } from '@/hooks/useTasks'
import {
  TaskType,
  TaskPriority,
  TaskStatus,
  TASK_TYPE_COLORS,
  TASK_PRIORITY_COLORS,
  TASK_STATUS_COLORS,
} from '@/types/task'
import type { Task } from '@/types/task'

interface TaskDetailModalProps {
  isOpen: boolean
  onClose: () => void
  task: Task | null
  onEdit: (task: Task) => void
}

export function TaskDetailModal({ isOpen, onClose, task, onEdit }: TaskDetailModalProps) {
  const { t } = useTranslation()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const completeMutation = useCompleteTask()
  const deleteMutation = useDeleteTask()

  if (!task) return null

  const color = task.color || TASK_TYPE_COLORS[task.taskType as TaskType] || '#6B7280'
  const statusColor = TASK_STATUS_COLORS[task.status as TaskStatus] || '#9CA3AF'
  const priorityColor = task.priority ? TASK_PRIORITY_COLORS[task.priority as TaskPriority] : null
  const canComplete = task.status === TaskStatus.PENDING || task.status === TaskStatus.IN_PROGRESS

  const handleComplete = async () => {
    await completeMutation.mutateAsync({ taskId: task.id })
    onClose()
  }

  const handleDelete = async () => {
    await deleteMutation.mutateAsync({ taskId: task.id })
    setShowDeleteConfirm(false)
    onClose()
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return null
    const d = new Date(iso)
    if (task.isAllDay) {
      return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    }
    return d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <FormModal
        isOpen={isOpen}
        onClose={onClose}
        title={task.title}
        size="lg"
        footer={
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-sm text-destructive hover:text-destructive/80 transition-colors"
            >
              {t('tasks.deleteTask', 'Delete')}
            </button>
            <div className="flex items-center gap-3">
              {canComplete && (
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={completeMutation.isPending}
                  className="btn-secondary text-sm"
                >
                  {completeMutation.isPending ? '...' : t('tasks.markComplete', 'Mark Complete')}
                </button>
              )}
              <button
                type="button"
                onClick={() => { onClose(); onEdit(task); }}
                className="btn-primary text-sm"
              >
                {t('common.edit', 'Edit')}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Status, Type, Priority badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-medium px-2 py-1 rounded-full"
              style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
            >
              {t(`tasks.status${task.status.charAt(0).toUpperCase() + task.status.replace(/_./g, (m) => m[1].toUpperCase()).slice(1)}`, task.status)}
            </span>
            <span
              className="text-xs font-medium px-2 py-1 rounded-full"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {t(`tasks.type${task.taskType.charAt(0).toUpperCase() + task.taskType.slice(1)}`, task.taskType)}
            </span>
            {priorityColor && (
              <span
                className="text-xs font-medium px-2 py-1 rounded-full"
                style={{ backgroundColor: `${priorityColor}20`, color: priorityColor }}
              >
                {t(`tasks.priority${task.priority!.charAt(0).toUpperCase() + task.priority!.slice(1)}`, task.priority!)}
              </span>
            )}
            {task.isOverdue && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-600">
                {t('calendar.overdue', 'Overdue')}
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                {t('tasks.taskDescription', 'Description')}
              </h4>
              <p className="text-sm text-foreground whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            {task.startDate && (
              <DetailField label={t('calendar.startTime', 'Start')} value={formatDate(task.startDate)} />
            )}
            {task.endDate && (
              <DetailField label={t('calendar.endTime', 'End')} value={formatDate(task.endDate)} />
            )}
            {task.dueDate && (
              <DetailField
                label={t('calendar.dueDate', 'Due Date')}
                value={formatDate(task.dueDate)}
                className={task.isOverdue ? 'text-red-500' : undefined}
              />
            )}
            {task.isAllDay && (
              <DetailField label={t('calendar.allDay', 'All Day')} value={t('common.yes', 'Yes')} />
            )}
          </div>

          {/* Assignment */}
          <div className="grid grid-cols-2 gap-4">
            {task.assignedToName && (
              <DetailField label={t('tasks.assignTo', 'Assigned To')} value={task.assignedToName} />
            )}
            {task.creatorName && (
              <DetailField label={t('tasks.createdBy', 'Created By')} value={task.creatorName} />
            )}
            {task.clientName && (
              <DetailField label={t('tasks.linkToClient', 'Client')} value={task.clientName} />
            )}
            {task.projectName && (
              <DetailField label={t('tasks.linkToProject', 'Project')} value={task.projectName} />
            )}
            {task.location && (
              <DetailField label={t('tasks.location', 'Location')} value={task.location} />
            )}
          </div>

          {/* Notes */}
          {task.notes && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                {t('tasks.notes', 'Notes')}
              </h4>
              <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-3">{task.notes}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{t('common.created', 'Created')}: {new Date(task.createdAt).toLocaleString('en-GB')}</span>
              <span>{t('common.updated', 'Updated')}: {new Date(task.updatedAt).toLocaleString('en-GB')}</span>
            </div>
          </div>
        </div>
      </FormModal>

      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        itemName={t('tasks.task', 'task')}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}

function DetailField({ label, value, className }: { label: string; value: string | null; className?: string }) {
  if (!value) return null
  return (
    <div>
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{label}</h4>
      <p className={cn('text-sm text-foreground', className)}>{value}</p>
    </div>
  )
}
