import { useState, useEffect, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { Card } from '@/components/ui/layout/Card'
import apiClient from '@/api/client'

export const Route = createFileRoute('/_authenticated/chat/')({
  component: ChatPage,
})

interface ChatRoom {
  id: number
  name: string
  description?: string
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: number
  participants: number
}

interface ChatMessage {
  id: number
  roomId: number
  senderId: number
  senderName: string
  content: string
  createdAt: string
  isRead: boolean
}

function ChatPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [newMessage, setNewMessage] = useState('')

  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: async () => {
      const response = await apiClient.get('/chat/rooms')
      return response.data?.data || response.data || []
    },
  })

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-messages', selectedRoom?.id],
    queryFn: async () => {
      if (!selectedRoom) return []
      const response = await apiClient.get(`/chat/rooms/${selectedRoom.id}/messages`)
      return response.data?.data || response.data || []
    },
    enabled: !!selectedRoom,
  })

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedRoom) throw new Error('No room selected')
      const response = await apiClient.post(`/chat/rooms/${selectedRoom.id}/messages`, { content })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedRoom?.id] })
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
      setNewMessage('')
    },
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    sendMessageMutation.mutate(newMessage.trim())
  }

  const formatTime = (dateString: string) => {
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
        {/* Rooms List */}
        <Card className="w-80 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">{t('chat.rooms')}</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {roomsLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <p>{t('chat.noRooms')}</p>
              </div>
            ) : (
              <div className="divide-y">
                {rooms.map((room: ChatRoom) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                      selectedRoom?.id === room.id ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{room.name}</p>
                        {room.lastMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {room.lastMessage}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {room.lastMessageAt && (
                          <span className="text-xs text-muted-foreground">
                            {formatTime(room.lastMessageAt)}
                          </span>
                        )}
                        {room.unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                            {room.unreadCount}
                          </span>
                        )}
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
          {selectedRoom ? (
            <>
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">{selectedRoom.name}</h2>
                {selectedRoom.description && (
                  <p className="text-sm text-muted-foreground">{selectedRoom.description}</p>
                )}
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
                    <p>{t('chat.noMessages')}</p>
                  </div>
                ) : (
                  messages.map((message: ChatMessage) => (
                    <div key={message.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                        {message.senderName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium">{message.senderName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('chat.messagePlaceholder')}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={sendMessageMutation.isPending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    className="btn-primary"
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
                <p className="text-lg font-medium">{t('chat.selectRoom')}</p>
                <p className="text-sm">{t('chat.selectRoomDescription')}</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  )
}
