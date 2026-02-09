import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import apiClient from '@/api/client'
import { debounce } from '@/lib/utils'

// API response matches backend UserLookup schema
interface UserLookupResponse {
  usr_id: number
  usr_login: string
  usr_firstname: string | null
  usr_lastname: string | null
  usr_is_actived: boolean
  display_name: string
}

// Normalized user for internal use
interface User {
  id: number
  username: string
  displayName: string
  firstName: string
  lastName: string
}

interface NewConversationDialogProps {
  isOpen: boolean
  onClose: () => void
  onThreadCreated: (threadId: number) => void
}

// Transform API response to normalized User
function normalizeUser(apiUser: UserLookupResponse): User {
  return {
    id: apiUser.usr_id,
    username: apiUser.usr_login,
    displayName: apiUser.display_name,
    firstName: apiUser.usr_firstname || '',
    lastName: apiUser.usr_lastname || '',
  }
}

export function NewConversationDialog({
  isOpen,
  onClose,
  onThreadCreated,
}: NewConversationDialogProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [error, setError] = useState('')

  const isGroup = selectedUsers.length > 1

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('')
      setUsers([])
      setSelectedUsers([])
      setGroupName('')
      setError('')
    }
  }, [isOpen])

  // Load initial users when dialog opens
  const loadInitialUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.get('/users/lookup', {
        params: { limit: 20 },
      })
      const data: UserLookupResponse[] = response.data?.data || response.data || []
      const normalized = data.map(normalizeUser)
      const filtered = normalized.filter(
        (u) => !selectedUsers.some((s) => s.id === u.id)
      )
      setUsers(filtered)
    } catch (err) {
      console.error('Failed to load users:', err)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedUsers])

  // Debounced user search
  const searchUsers = useCallback(
    debounce(async (query: string) => {
      setIsLoading(true)
      try {
        const response = await apiClient.get('/users/lookup', {
          params: { q: query || undefined, limit: 20 },
        })
        const data: UserLookupResponse[] = response.data?.data || response.data || []
        // Normalize and filter out already selected users
        const normalized = data.map(normalizeUser)
        const filtered = normalized.filter(
          (u) => !selectedUsers.some((s) => s.id === u.id)
        )
        setUsers(filtered)
      } catch (err) {
        console.error('Failed to search users:', err)
        setUsers([])
      } finally {
        setIsLoading(false)
      }
    }, 300),
    [selectedUsers]
  )

  // Load users when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadInitialUsers()
    }
  }, [isOpen, loadInitialUsers])

  // Search when query changes
  useEffect(() => {
    if (search.trim()) {
      searchUsers(search)
    } else if (isOpen) {
      loadInitialUsers()
    }
  }, [search, searchUsers, isOpen, loadInitialUsers])

  const handleSelectUser = (user: User) => {
    setSelectedUsers((prev) => [...prev, user])
    setSearch('')
    setUsers([])
  }

  const handleRemoveUser = (userId: number) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  const handleCreate = async () => {
    if (selectedUsers.length === 0) {
      setError(t('chat.selectAtLeastOneUser'))
      return
    }

    if (isGroup && !groupName.trim()) {
      setError(t('chat.groupNameRequired'))
      return
    }

    setIsCreating(true)
    setError('')

    try {
      if (selectedUsers.length === 1) {
        // Create direct message
        const response = await apiClient.post('/chat/threads/direct', {
          user_id: selectedUsers[0].id,
        })
        const thread = response.data?.data || response.data
        onThreadCreated(thread.id)
      } else {
        // Create group thread
        const response = await apiClient.post('/chat/threads', {
          title: groupName.trim(),
          thread_type: 'group',
          participant_ids: selectedUsers.map((u) => u.id),
        })
        const thread = response.data?.data || response.data
        onThreadCreated(thread.id)
      }
      onClose()
    } catch (err: unknown) {
      console.error('Failed to create thread:', err)
      const apiError = err as { response?: { data?: { detail?: string } } }
      setError(apiError.response?.data?.detail || t('chat.createThreadError'))
    } finally {
      setIsCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative bg-background rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('chat.newConversation')}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-md transition-colors"
            aria-label={t('common.close')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Selected users */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <span
                  key={user.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                >
                  {user.displayName || user.username}
                  <button
                    onClick={() => handleRemoveUser(user.id)}
                    className="p-0.5 hover:bg-primary/20 rounded-full"
                    aria-label={t('common.remove')}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Group name (only for groups) */}
          {isGroup && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('chat.groupName')}
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder={t('chat.groupNamePlaceholder')}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              />
            </div>
          )}

          {/* User search */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {selectedUsers.length === 0
                ? t('chat.searchUsers')
                : t('chat.addMoreUsers')}
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('chat.searchPlaceholder')}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            />
          </div>

          {/* Search results */}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length > 0 ? (
            <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full p-3 text-left hover:bg-accent transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {(user.displayName?.[0] || user.username[0]).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{user.displayName || user.username}</p>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : search.trim() && !isLoading ? (
            <p className="text-center text-muted-foreground py-4">
              {t('chat.noUsersFound')}
            </p>
          ) : null}

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-accent transition-colors"
            disabled={isCreating}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleCreate}
            disabled={selectedUsers.length === 0 || isCreating}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('common.creating')}
              </span>
            ) : isGroup ? (
              t('chat.createGroup')
            ) : (
              t('chat.startChat')
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
