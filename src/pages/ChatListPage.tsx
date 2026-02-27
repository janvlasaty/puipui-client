import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useDataCache } from '../contexts/DataCacheContext'
import { FriendsList, type Friend } from '../components/FriendsList'
import { Button } from '@/components/ui/button'
import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database'
import { getRoomsWithProfiles } from '../repositories/rooms.repository'
import { getLastMessagesByRoomIds } from '../repositories/messages.repository'

interface ChatListPageProps {
  onSelectFriend: (friend: Friend) => void
}

export const ChatListPage: React.FC<ChatListPageProps> = ({ onSelectFriend }) => {
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
        let roomName = room.label || 'Chat Room'

        // For direct rooms, get the other user's name
        if (room.is_direct && room.rooms_users) {
          const otherUser = room.rooms_users.find(
            (ru) => ru.user_id !== session?.user?.id
          )

          if (otherUser?.profiles?.name) {
            roomName = otherUser.profiles.name
          } else {
            roomName = 'Direct Message'
          }
        }

        return {
          id: room.id,
          name: roomName,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${room.id}`,
          lastMessage: messagesMap[room.id]?.content || 'No messages yet',
          timestamp: messagesMap[room.id]?.created_at ? new Date(messagesMap[room.id].created_at).toLocaleDateString() : 'Just now',
          unread: 0,
        }
      })

      setRoomsCache(friendsList)
    } catch (error) {
      console.error('Error fetching rooms:', error)
      setRoomsCache([], error as Error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const friends = roomsCache.data || []
  const loading = roomsCache.loading && !roomsCache.data

  return (
    <div className="flex flex-col min-h-screen">
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <p className="text-muted-foreground">Loading rooms...</p>
        </div>
      ) : friends.length === 0 ? (
        <div className="flex items-center justify-center flex-1">
          <p className="text-muted-foreground">No chat rooms yet</p>
        </div>
      ) : (
        <FriendsList friends={friends} onSelectFriend={onSelectFriend} />
      )}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center">
        <Button onClick={handleSignOut} variant="destructive" size="sm">
          Sign Out
        </Button>
      </div>
    </div>
  )
}
