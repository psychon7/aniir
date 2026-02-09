import { useState, useEffect, useRef, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { Card } from '@/components/ui/layout/Card'
import { NewConversationDialog } from '@/components/features/chat/NewConversationDialog'
import apiClient from '@/api/client'
import { useChat, useChatThread } from '@/hooks/useChat'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/_authenticated/chat/')({
  component: ChatPage,
})

interface ChatThread {
  id: number
  title: string | null
  thread_type: 'direct' | 'group'
  is_archived: boolean
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: number
  participants: {
    id: number
    user_id: number
    username: string
    display_name: string
    is_admin: boolean
  }[]
}

interface ChatMessage {
  id: number
  threadId: number
  senderId: number
  senderName: string
  content: string
  createdAt: string
  attachments?: { id: number; filename: string; url: string }[]
}

function ChatPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [threadSearch, setThreadSearch] = useState('')
  const [messageSearch, setMessageSearch] = useState('')

  // Auth store for current user
  const currentUser = useAuthStore((state) => state.user)

  // WebSocket connection via useChat hook (handles token auth automatically)
  const { isConnected } = useChat()

  // Fetch threads with optional search
  const { data: threads = [], isLoading: threadsLoading, refetch: refetchThreads } = useQuery({
    queryKey: ['chat-threads', threadSearch],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (threadSearch.trim()) {
        params.search = threadSearch.trim()
      }
      const response = await apiClient.get('/chat/threads', { params })
      return response.data?.data || response.data || []
    },
  })

  // Fetch messages for selected thread
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-messages', selectedThread?.id],
    queryFn: async () => {
      if (!selectedThread) return []
      const response = await apiClient.get(`/chat/threads/${selectedThread.id}/messages`)
      return response.data?.data || response.data || []
    },
    enabled: !!selectedThread,
    refetchInterval: isConnected ? undefined : 5000, // Poll if WebSocket disconnected
  })

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!newMessage.trim() || !selectedThread) return

      try {
        await apiClient.post(`/chat/threads/${selectedThread.id}/messages`, {
          content: newMessage.trim(),
        })
        queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedThread.id] })
        setNewMessage('')
        refetchThreads()
      } catch (error) {
        console.error('Failed to send message:', error)
      }
    },
    [newMessage, selectedThread, queryClient, refetchThreads]
  )

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedThread) return

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert(t('chat.fileTooLarge'))
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('thread_id', String(selectedThread.id))

      await apiClient.post('/chat/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedThread.id] })
      refetchThreads()
    } catch (error) {
      console.error('Failed to upload file:', error)
      alert(t('chat.uploadFailed'))
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleThreadCreated = (threadId: number) => {
    refetchThreads()
    // Find and select the new thread
    setTimeout(() => {
      apiClient.get(`/chat/threads/${threadId}`).then((response) => {
        const thread = response.data?.data || response.data
        setSelectedThread(thread)
      })
    }, 100)
  }

  const getThreadDisplayName = (thread: ChatThread, currentUserId?: number) => {
    if (thread.title) return thread.title
    if (thread.thread_type === 'direct') {
      const other = thread.participants.find((p) => p.user_id !== currentUserId)
      return other?.display_name || other?.username || t('chat.directMessage')
    }
    return thread.participants.map((p) => p.display_name || p.username).join(', ')
  }

  const formatTime = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return t('common.yesterday')
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <PageContainer>
      <div className="flex h-[calc(100vh-12rem)] gap-4">
        {/* Threads List */}
        <Card className="w-80 flex flex-col">
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('chat.conversations')}</h2>
              <button
                onClick={() => setShowNewConversation(true)}
                className="p-2 hover:bg-accent rounded-md transition-colors"
                title={t('chat.newConversation')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            {/* Thread Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={threadSearch}
                onChange={(e) => setThreadSearch(e.target.value)}
                placeholder={t('chat.searchConversations')}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              />
              {threadSearch && (
                <button
                  onClick={() => setThreadSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threadsLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-14 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="mb-2">{t('chat.noConversations')}</p>
                <button
                  onClick={() => setShowNewConversation(true)}
                  className="text-primary hover:underline text-sm"
                >
                  {t('chat.startFirstConversation')}
                </button>
              </div>
            ) : (
              <div className="divide-y">
                {threads.map((thread: ChatThread) => (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                      selectedThread?.id === thread.id ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shrink-0">
                        {thread.thread_type === 'group' ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        ) : (
                          getThreadDisplayName(thread)[0]?.toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium truncate">{getThreadDisplayName(thread)}</p>
                          {thread.last_message_at && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatTime(thread.last_message_at)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          {thread.last_message_preview && (
                            <p className="text-sm text-muted-foreground truncate">
                              {thread.last_message_preview}
                            </p>
                          )}
                          {thread.unread_count > 0 && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full shrink-0">
                              {thread.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Messages Area */}
        <Card className="flex-1 flex flex-col">
          {selectedThread ? (
            <>
              <div className="p-4 border-b flex items-center justify-between gap-4">
                <div className="shrink-0">
                  <h2 className="text-lg font-semibold">{getThreadDisplayName(selectedThread)}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedThread.participants.length} {t('chat.participants')}
                    {!isConnected && (
                      <span className="ml-2 text-amber-600">({t('chat.reconnecting')})</span>
                    )}
                  </p>
                </div>
                {/* Message Search */}
                <div className="relative flex-1 max-w-xs">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    placeholder={t('chat.searchMessages')}
                    className="w-full pl-9 pr-8 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {messageSearch && (
                    <button
                      onClick={() => setMessageSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      title={t('chat.clearSearch')}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex gap-3">
                        <div className="w-8 h-8 bg-muted rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-24"></div>
                          <div className="h-16 bg-muted rounded w-3/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p>{t('chat.noMessages')}</p>
                      <p className="text-sm">{t('chat.sendFirstMessage')}</p>
                    </div>
                  </div>
                ) : (
                  messages
                    .filter((message: ChatMessage) => {
                      if (!messageSearch.trim()) return true
                      const searchLower = messageSearch.toLowerCase()
                      return (
                        message.content?.toLowerCase().includes(searchLower) ||
                        message.senderName?.toLowerCase().includes(searchLower)
                      )
                    })
                    .map((message: ChatMessage) => (
                    <div key={message.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm shrink-0">
                        {message.senderName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium">{message.senderName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((att) => (
                              <a
                                key={att.id}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm hover:bg-muted/80 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                {att.filename}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-2 hover:bg-accent rounded-md transition-colors disabled:opacity-50"
                    title={t('chat.attachFile')}
                  >
                    {isUploading ? (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    )}
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('chat.messagePlaceholder')}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    {t('chat.send')}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg font-medium">{t('chat.selectConversation')}</p>
                <p className="text-sm mb-4">{t('chat.selectConversationDescription')}</p>
                <button
                  onClick={() => setShowNewConversation(true)}
                  className="text-primary hover:underline"
                >
                  {t('chat.orStartNew')}
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <NewConversationDialog
        isOpen={showNewConversation}
        onClose={() => setShowNewConversation(false)}
        onThreadCreated={handleThreadCreated}
      />
    </PageContainer>
  )
}
