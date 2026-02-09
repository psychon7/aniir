import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormModal, FormModalFooter } from '@/components/ui/form/FormModal'
import { FormInput } from '@/components/ui/form/FormInput'
import { FormSelect } from '@/components/ui/form/FormSelect'
import { FormTextarea } from '@/components/ui/form/FormTextarea'
import { FormCheckbox } from '@/components/ui/form/FormCheckbox'
import { useCreateTask, useUpdateTask } from '@/hooks/useTasks'
import { useUsersLookup } from '@/hooks/useUsers'
import { useAuthStore } from '@/stores/authStore'
import { TaskType, TaskPriority } from '@/types/task'
import type { Task, TaskCreateDto, TaskUpdateDto } from '@/types/task'

interface TaskFormData {
  title: string
  description: string
  taskType: string
  priority: string
  isAllDay: boolean
  startDate: string
  endDate: string
  dueDate: string
  assignedToId: string
  clientId: string
  projectId: string
  location: string
  notes: string
}

interface TaskFormModalProps {
  isOpen: boolean
  onClose: () => void
  task?: Task | null
  defaultDate?: Date | null
  defaultTime?: string | null
}

function toDatetimeLocal(iso: string | null | undefined, allDay: boolean): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  if (allDay) {
    return d.toISOString().slice(0, 10)
  }
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function TaskFormModal({ isOpen, onClose, task, defaultDate, defaultTime }: TaskFormModalProps) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const createMutation = useCreateTask()
  const updateMutation = useUpdateTask()
  const { data: users = [] } = useUsersLookup()

  const isEditing = !!task

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<TaskFormData>({
    defaultValues: {
      title: '',
      description: '',
      taskType: TaskType.TASK,
      priority: TaskPriority.MEDIUM,
      isAllDay: false,
      startDate: '',
      endDate: '',
      dueDate: '',
      assignedToId: '',
      clientId: '',
      projectId: '',
      location: '',
      notes: '',
    },
  })

  const isAllDay = watch('isAllDay')

  useEffect(() => {
    if (!isOpen) return

    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        taskType: task.taskType,
        priority: task.priority || TaskPriority.MEDIUM,
        isAllDay: task.isAllDay,
        startDate: toDatetimeLocal(task.startDate, task.isAllDay),
        endDate: toDatetimeLocal(task.endDate, task.isAllDay),
        dueDate: toDatetimeLocal(task.dueDate, task.isAllDay),
        assignedToId: task.assignedToId?.toString() || '',
        clientId: task.clientId?.toString() || '',
        projectId: task.projectId?.toString() || '',
        location: task.location || '',
        notes: task.notes || '',
      })
    } else {
      let startVal = ''
      if (defaultDate) {
        if (defaultTime) {
          const pad = (n: number) => n.toString().padStart(2, '0')
          startVal = `${defaultDate.getFullYear()}-${pad(defaultDate.getMonth() + 1)}-${pad(defaultDate.getDate())}T${defaultTime}`
        } else {
          startVal = defaultDate.toISOString().slice(0, 10)
        }
      }
      reset({
        title: '',
        description: '',
        taskType: TaskType.TASK,
        priority: TaskPriority.MEDIUM,
        isAllDay: !defaultTime,
        startDate: startVal,
        endDate: '',
        dueDate: '',
        assignedToId: user?.id?.toString() || '',
        clientId: '',
        projectId: '',
        location: '',
        notes: '',
      })
    }
  }, [isOpen, task, defaultDate, defaultTime, reset, user])

  const onSubmit = async (data: TaskFormData) => {
    const toISO = (val: string) => val ? new Date(val).toISOString() : null

    if (isEditing && task) {
      const dto: TaskUpdateDto = {
        title: data.title,
        description: data.description || null,
        taskType: data.taskType as TaskType,
        priority: data.priority as TaskPriority,
        isAllDay: data.isAllDay,
        startDate: toISO(data.startDate),
        endDate: toISO(data.endDate),
        dueDate: toISO(data.dueDate),
        assignedToId: data.assignedToId ? Number(data.assignedToId) : null,
        clientId: data.clientId ? Number(data.clientId) : null,
        projectId: data.projectId ? Number(data.projectId) : null,
        location: data.location || null,
        notes: data.notes || null,
      }
      await updateMutation.mutateAsync({ taskId: task.id, data: dto })
    } else {
      const dto: TaskCreateDto = {
        title: data.title,
        description: data.description || null,
        taskType: data.taskType as TaskType,
        priority: data.priority as TaskPriority,
        isAllDay: data.isAllDay,
        startDate: toISO(data.startDate),
        endDate: toISO(data.endDate),
        dueDate: toISO(data.dueDate),
        assignedToId: data.assignedToId ? Number(data.assignedToId) : null,
        clientId: data.clientId ? Number(data.clientId) : null,
        projectId: data.projectId ? Number(data.projectId) : null,
        location: data.location || null,
        notes: data.notes || null,
        societyId: user?.societyId || 1,
      }
      await createMutation.mutateAsync({ data: dto, creatorId: user?.id })
    }
    onClose()
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const dateInputType = isAllDay ? 'date' : 'datetime-local'

  const typeOptions = Object.values(TaskType).map((v) => ({
    value: v,
    label: t(`tasks.type${v.charAt(0).toUpperCase() + v.slice(1)}`, v),
  }))

  const priorityOptions = Object.values(TaskPriority).map((v) => ({
    value: v,
    label: t(`tasks.priority${v.charAt(0).toUpperCase() + v.slice(1)}`, v),
  }))

  const userOptions = (users as Array<{ id: number; firstName: string; lastName: string }>).map((u) => ({
    value: u.id,
    label: `${u.firstName} ${u.lastName}`,
  }))

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('tasks.editTask', 'Edit Task') : t('tasks.newTask', 'New Task')}
      size="lg"
      footer={
        <FormModalFooter
          onCancel={onClose}
          form="task-form"
          submitText={isEditing ? t('common.save', 'Save') : t('common.create', 'Create')}
          cancelText={t('common.cancel', 'Cancel')}
          isSubmitting={isPending}
        />
      }
    >
      <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Task Info */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">{t('tasks.taskDetails', 'Task Details')}</h3>
          <div className="space-y-4">
            <div>
              <FormInput
                label={t('tasks.taskTitle', 'Title')}
                placeholder={t('tasks.taskTitle', 'Enter task title...')}
                required
                error={!!errors.title}
                {...register('title', { required: true })}
              />
              {errors.title && (
                <p className="text-xs text-destructive mt-1">{t('common.required', 'This field is required')}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label={t('tasks.taskType', 'Type')}
                options={typeOptions}
                {...register('taskType')}
              />
              <FormSelect
                label={t('tasks.taskPriority', 'Priority')}
                options={priorityOptions}
                {...register('priority')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t('tasks.taskDescription', 'Description')}
              </label>
              <FormTextarea
                placeholder={t('tasks.taskDescription', 'Add a description...')}
                rows={3}
                {...register('description')}
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">{t('calendar.schedule', 'Schedule')}</h3>
          <div className="space-y-4">
            <FormCheckbox
              id="isAllDay"
              label={t('calendar.allDay', 'All Day')}
              {...register('isAllDay')}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label={t('calendar.startTime', 'Start')}
                type={dateInputType}
                {...register('startDate')}
              />
              <FormInput
                label={t('calendar.endTime', 'End')}
                type={dateInputType}
                {...register('endDate')}
              />
            </div>

            <FormInput
              label={t('calendar.dueDate', 'Due Date')}
              type={dateInputType}
              {...register('dueDate')}
            />
          </div>
        </div>

        {/* Assignment */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">{t('tasks.assignment', 'Assignment')}</h3>
          <div className="space-y-4">
            <FormSelect
              label={t('tasks.assignTo', 'Assign To')}
              options={userOptions}
              placeholder={t('tasks.assignTo', 'Select a user...')}
              {...register('assignedToId')}
            />

            <FormInput
              label={t('tasks.location', 'Location')}
              placeholder={t('tasks.location', 'Enter location...')}
              {...register('location')}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">{t('tasks.notes', 'Notes')}</h3>
          <FormTextarea
            placeholder={t('tasks.notes', 'Add notes...')}
            rows={3}
            {...register('notes')}
          />
        </div>
      </form>
    </FormModal>
  )
}
