/**
 * ChatThreadList - Main component for displaying list of chat threads
 * Supports filtering, search, and thread selection
 */
import { useState, useMemo, useCallback } from 'react'
import {
  MessageSquare,
  Search,
  Plus,
  Filter,
  RefreshCw,
  Loader2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatThreads, useCreateThread, getThreadDisplayName } from '@/hooks/useChatThreads'
import { ChatThreadListItem } from './ChatThreadListItem'
import { EmptyState } from '@/components/ui/feedback/EmptyState'
import { LoadingSkeleton } from '@/components/ui/feedback/LoadingSkeleton'
import type { ChatEntityType } from '@/types/chat'
import type { ChatThreadResponse } from '@/api/chat'

interface ChatThreadListProps {
  selectedThreadId?: number | null
  onSelectThread?: (threadId: number) => void
  onCreateThread?: () => void
  entityTypeFilter?: ChatEntityType
  className?: string
  showHeader?: boolean
  showSearch?: boolean
  showFilters?: boolean
  showCreateButton?: boolean
}

// Entity type filter options
const ENTITY_TYPE_OPTIONS: { value: ChatEntityType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Threads' },
  { value: 'General', label: 'General' },
  { value: 'Invoice', label: 'Invoices' },
  { value: 'Order', label: 'Orders' },
  { value: 'Project', label: 'Projects' },
  { value: 'PO', label: 'Purchase Orders' },
  { value: 'Lot', label: 'Lots' },
  { value: 'Shipment', label: 'Shipments' },
]

export function ChatThreadList({
  selectedThreadId,
  onSelectThread,
  onCreateThread,
  entityTypeFilter,
  className,
  showHeader = true,
  showSearch = true,
  showFilters = true,
  showCreateButton = true,
}: ChatThreadListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<ChatEntityType | 'all'>(
    entityTypeFilter || 'all'
  )
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  const { data: threads, isLoading, error, refetch, isFetching } = useChatThreads()
  const createThread = useCreateThread()

  // Filter and search threads
  const filteredThreads = useMemo(() => {
    if (!threads) return []

    let result = [...threads]

    // Apply entity type filter
    if (filterType !== 'all') {
      result = result.filter((thread) => thread.entity_type === filterType)
    }

    // Apply prop-based entity type filter
    if (entityTypeFilter) {
      result = result.filter((thread) => thread.entity_type === entityTypeFilter)
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((thread) => {
        const displayName = getThreadDisplayName(thread).toLowerCase()
        const lastMessage = thread.last_message?.content?.toLowerCase() || ''
        const userName = (
          thread.last_message?.user?.display_name ||
          thread.last_message?.user?.username ||
          ''
        ).toLowerCase()

        return (
          displayName.includes(query) ||
          lastMessage.includes(query) ||
          userName.includes(query) ||
          (thread.entity_id?.toString() || '').includes(query)
        )
      })
    }

    // Sort by last message time (most recent first)
    result.sort((a, b) => {
      const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
      const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
      return timeB - timeA
    })

    return result
  }, [threads, filterType, entityTypeFilter, searchQuery])

  // Handle thread selection
  const handleSelectThread = useCallback(
    (thread: ChatThreadResponse) => {
      onSelectThread?.(thread.id)
    },
    [onSelectThread]
  )

  // Handle create thread
  const handleCreateThread = useCallback(() => {
    if (onCreateThread) {
      onCreateThread()
    } else {
      // Default behavior: create a general thread
      createThread.mutate(
        { name: 'New Conversation' },
        {
          onSuccess: (newThread) => {
            onSelectThread?.(newThread.id)
          },
        }
      )
    }
  }, [onCreateThread, createThread, onSelectThread])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  // Total unread count
  const totalUnread = useMemo(() => {
    return threads?.reduce((sum, t) => sum + (t.unread_count || 0), 0) || 0
  }, [threads])

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn('flex flex-col h-full bg-background', className)} data-testid="chat-thread-list">
        {showHeader && (
          <div className="px-4 py-3 border-b border-border">
            <LoadingSkeleton className="h-6 w-32" />
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3">
              <LoadingSkeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <LoadingSkeleton className="h-4 w-3/4" />
                <LoadingSkeleton className="h-3 w-full" />
                <LoadingSkeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn('flex flex-col h-full bg-background', className)} data-testid="chat-thread-list">
        <EmptyState
          icon={
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-destructive" />
            </div>
          }
          message="Failed to load threads"
          description="There was an error loading your conversations"
          action={
            <button onClick={() => refetch()} className="btn-secondary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again
            </button>
          }
        />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full bg-background', className)} data-testid="chat-thread-list">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-foreground">Messages</h2>
            {totalUnread > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-primary-foreground bg-primary rounded-full">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Refresh button */}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              title="Refresh"
            >
              {isFetching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </button>

            {/* Create button */}
            {showCreateButton && (
              <button
                onClick={handleCreateThread}
                disabled={createThread.isPending}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                title="New conversation"
                data-testid="create-thread-button"
              >
                {createThread.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search and filters */}
      {(showSearch || showFilters) && (
        <div className="px-4 py-2 border-b border-border space-y-2">
          {/* Search */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-muted/50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                data-testid="thread-search-input"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Filter */}
          {showFilters && !entityTypeFilter && (
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors',
                  filterType !== 'all'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted'
                )}
                data-testid="thread-filter-button"
              >
                <Filter className="w-4 h-4" />
                {ENTITY_TYPE_OPTIONS.find((o) => o.value === filterType)?.label || 'Filter'}
              </button>

              {showFilterDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowFilterDropdown(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 z-20 w-48 py-1 bg-popover border border-border rounded-lg shadow-lg">
                    {ENTITY_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilterType(option.value)
                          setShowFilterDropdown(false)
                        }}
                        className={cn(
                          'w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors',
                          filterType === option.value && 'bg-primary/10 text-primary'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto p-2" data-testid="thread-list-container">
        {filteredThreads.length === 0 ? (
          <EmptyState
            icon={
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground/50" />
              </div>
            }
            message={searchQuery ? 'No results found' : 'No conversations yet'}
            description={
              searchQuery
                ? 'Try adjusting your search query'
                : 'Start a new conversation to get going'
            }
            action={
              !searchQuery &&
              showCreateButton && (
                <button
                  onClick={handleCreateThread}
                  className="btn-primary"
                  disabled={createThread.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New conversation
                </button>
              )
            }
          />
        ) : (
          <div className="space-y-1">
            {filteredThreads.map((thread) => (
              <ChatThreadListItem
                key={thread.id}
                thread={thread}
                isSelected={selectedThreadId === thread.id}
                onClick={() => handleSelectThread(thread)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Export for index
export { ChatThreadListItem } from './ChatThreadListItem'
