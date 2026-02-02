/**
 * ChatThreadListItem - Individual thread item in the thread list
 */
import { memo } from 'react'
import { MessageSquare, FileText, Package, Truck, FolderKanban, ShoppingCart, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatThreadResponse } from '@/api/chat'
import type { ChatEntityType } from '@/types/chat'
import { formatThreadTime, getThreadDisplayName } from '@/hooks/useChatThreads'

interface ChatThreadListItemProps {
  thread: ChatThreadResponse
  isSelected?: boolean
  onClick?: () => void
}

// Icon mapping for entity types
const entityIcons: Record<ChatEntityType, React.ElementType> = {
  Invoice: FileText,
  Order: ShoppingCart,
  Project: FolderKanban,
  PO: Package,
  Lot: Hash,
  Shipment: Truck,
  General: MessageSquare,
}

// Color mapping for entity types
const entityColors: Record<ChatEntityType, string> = {
  Invoice: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  Order: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  Project: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
  PO: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  Lot: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400',
  Shipment: 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
  General: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400',
}

export const ChatThreadListItem = memo(function ChatThreadListItem({
  thread,
  isSelected = false,
  onClick,
}: ChatThreadListItemProps) {
  const entityType = thread.entity_type || 'General'
  const Icon = entityIcons[entityType] || MessageSquare
  const iconColorClass = entityColors[entityType] || entityColors.General

  const displayName = getThreadDisplayName(thread)
  const timeString = formatThreadTime(thread.last_message_at)
  const hasUnread = thread.unread_count > 0

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left',
        'hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50',
        isSelected && 'bg-primary/10 hover:bg-primary/15',
        hasUnread && !isSelected && 'bg-primary/5'
      )}
      data-testid={`thread-item-${thread.id}`}
    >
      {/* Entity icon */}
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', iconColorClass)}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <h4
            className={cn(
              'text-sm truncate',
              hasUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground'
            )}
          >
            {displayName}
          </h4>
          {timeString && (
            <span
              className={cn(
                'text-xs flex-shrink-0',
                hasUnread ? 'text-primary font-medium' : 'text-muted-foreground'
              )}
            >
              {timeString}
            </span>
          )}
        </div>

        {/* Last message preview */}
        {thread.last_message && (
          <p
            className={cn(
              'text-sm truncate mt-0.5',
              hasUnread ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            <span className="text-muted-foreground">
              {thread.last_message.user.display_name || thread.last_message.user.username}:
            </span>{' '}
            {thread.last_message.content}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-1">
          {/* Entity type badge */}
          {thread.entity_type && (
            <span className="text-xs text-muted-foreground">
              {thread.entity_type}
              {thread.entity_id && ` #${thread.entity_id}`}
            </span>
          )}

          {/* Participants count */}
          {thread.participants_count > 0 && (
            <span className="text-xs text-muted-foreground">
              {thread.participants_count} participant{thread.participants_count !== 1 ? 's' : ''}
            </span>
          )}

          {/* Unread badge */}
          {hasUnread && (
            <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-primary-foreground bg-primary rounded-full">
              {thread.unread_count > 99 ? '99+' : thread.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  )
})
