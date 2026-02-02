/**
 * Mock data for chat threads
 */
import type { ChatEntityType } from '@/types/chat'
import type { ChatThreadResponse } from '@/api/chat'

let nextThreadId = 6

export function getNextThreadId(): number {
  return nextThreadId++
}

export const mockChatThreads: ChatThreadResponse[] = [
  {
    id: 1,
    name: 'General Discussion',
    entity_type: 'General' as ChatEntityType,
    entity_id: null,
    created_by: 1,
    created_at: '2024-01-15T09:00:00Z',
    last_message_at: '2024-01-20T14:35:00Z',
    unread_count: 3,
    last_message: {
      content: 'Let me know if you need any help with the project.',
      user: {
        id: 2,
        username: 'jsmith',
        display_name: 'John Smith',
      },
      created_at: '2024-01-20T14:35:00Z',
    },
    participants_count: 5,
  },
  {
    id: 2,
    name: null,
    entity_type: 'Invoice' as ChatEntityType,
    entity_id: 1042,
    created_by: 1,
    created_at: '2024-01-18T10:30:00Z',
    last_message_at: '2024-01-20T11:22:00Z',
    unread_count: 0,
    last_message: {
      content: 'Invoice has been approved and sent to the client.',
      user: {
        id: 1,
        username: 'admin',
        display_name: 'Admin User',
      },
      created_at: '2024-01-20T11:22:00Z',
    },
    participants_count: 2,
  },
  {
    id: 3,
    name: 'Order Update',
    entity_type: 'Order' as ChatEntityType,
    entity_id: 2055,
    created_by: 3,
    created_at: '2024-01-19T08:15:00Z',
    last_message_at: '2024-01-20T16:45:00Z',
    unread_count: 5,
    last_message: {
      content: 'The shipment will be ready by tomorrow morning.',
      user: {
        id: 3,
        username: 'mwilson',
        display_name: 'Maria Wilson',
      },
      created_at: '2024-01-20T16:45:00Z',
    },
    participants_count: 3,
  },
  {
    id: 4,
    name: null,
    entity_type: 'Project' as ChatEntityType,
    entity_id: 15,
    created_by: 2,
    created_at: '2024-01-10T14:00:00Z',
    last_message_at: '2024-01-19T09:10:00Z',
    unread_count: 0,
    last_message: {
      content: 'All tasks have been completed. Ready for review.',
      user: {
        id: 2,
        username: 'jsmith',
        display_name: 'John Smith',
      },
      created_at: '2024-01-19T09:10:00Z',
    },
    participants_count: 4,
  },
  {
    id: 5,
    name: 'Urgent: Stock Issue',
    entity_type: 'Lot' as ChatEntityType,
    entity_id: 789,
    created_by: 1,
    created_at: '2024-01-20T07:00:00Z',
    last_message_at: '2024-01-20T17:00:00Z',
    unread_count: 1,
    last_message: {
      content: 'Checking the inventory now. Will update shortly.',
      user: {
        id: 4,
        username: 'rjohnson',
        display_name: 'Robert Johnson',
      },
      created_at: '2024-01-20T17:00:00Z',
    },
    participants_count: 2,
  },
]
