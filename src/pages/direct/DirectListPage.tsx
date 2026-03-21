import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { useDataCache } from '../../contexts/DataCacheContext'
import { ConversationList, type Friend } from '../../components/chat/ConversationList'
import { ConversationListSkeleton } from '../../components/chat/ConversationListSkeleton'
import type { Tables } from '../../types/database'
import { getRoomsWithProfiles } from '../../repositories/rooms.repository'
import { getLastMessagesByRoomIds } from '../../repositories/messages.repository'
import { decodeAvatar } from '../../lib/utils'
import { formatMessagePreview } from '../../utils/messageParser'

interface DirectListPageProps {
  onSelectFriend: (friend: Friend) => void
}

export const DirectListPage: React.FC<DirectListPageProps> = ({ onSelectFriend }) => {
  const { t } = useTranslation()
  const { session } = useAuth()
  const { roomsCache, setRoomsCache, setRoomsLoading, isCacheStale } = useDataCache()

  useEffect(() => {
    if (!session?.user?.id) return
    
    // Show cached data immediately if available
    // But fetch fresh data in background if cache is stale
    if (roomsCache.data && !isCacheStale(roomsCache.lastFetched)) {
      return // Use cached data
    }

    fetchRooms()
  }, [session?.user?.id])

  const fetchRooms = async () => {
    if (!session?.user?.id) return

    try {
      setRoomsLoading(true)
      
      const { data: rooms, error: roomsError } = await getRoomsWithProfiles()

      if (roomsError) throw roomsError

      const roomIds = (rooms || []).map((room) => room.id)

      const { data: messages, error: messagesError } = await getLastMessagesByRoomIds(roomIds)

      if (messagesError) throw messagesError

      // Create a map of roomId to its last message
      const messagesMap: Record<string, Tables<'messages'>> = {};
      (messages || []).forEach((msg) => {
        if (!messagesMap[msg.room_id]) {
          messagesMap[msg.room_id] = msg
        }
      })

      // Convert rooms to Friend format for display
      const friendsList: Friend[] = (rooms || []).map((room) => {
        let roomName = room.label || t('chat.chatRoom')

        // For direct rooms, get the other user's name
        if (room.is_direct && room.rooms_users) {
          const otherUser = room.rooms_users.find(
            (ru) => ru.user_id !== session?.user?.id
          )

          if (otherUser?.profiles?.name) {
            roomName = otherUser.profiles.name
          } else {
            roomName = t('chat.directMessage')
          }
        }

        return {
          id: room.id,
          name: roomName,
          avatar: decodeAvatar((room.is_direct && room.rooms_users?.find(ru => ru.user_id !== session?.user?.id)?.profiles?.avatar) || null) || '',
          lastMessage: messagesMap[room.id]
            ? formatMessagePreview(messagesMap[room.id].content, messagesMap[room.id].type)
            : t('chat.noMessagesPreview'),
          timestamp: messagesMap[room.id]?.created_at ? new Date(messagesMap[room.id].created_at).toLocaleDateString() : t('chat.justNow'),
          unread: 0,
        }
      })

      setRoomsCache(friendsList)
    } catch (error) {
      console.error('Error fetching rooms:', error)
      setRoomsCache([], error as Error)
    }
  }

  const friends = roomsCache.data || []
  const loading = !roomsCache.lastFetched

  if (loading) {
    return <ConversationListSkeleton />
  }

  return <ConversationList friends={friends} onSelectFriend={onSelectFriend} />
}
