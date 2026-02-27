import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { FriendsList, type Friend } from '../components/FriendsList'
import { Button } from '@/components/ui/button'
import { supabase } from '../lib/supabase'

interface ChatListPageProps {
  onSelectFriend: (friend: Friend) => void
}

export const ChatListPage: React.FC<ChatListPageProps> = ({ onSelectFriend }) => {
  const { session } = useAuth()
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) return
    fetchRooms()
  }, [session?.user?.id])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      // Get rooms for current user
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms_users')
        .select('room_id')
        .eq('user_id', session?.user?.id)

      if (roomsError) throw roomsError

      if (!roomsData || roomsData.length === 0) {
        setFriends([])
        return
      }

      const roomIds = roomsData.map((r) => r.room_id)

      // Get room details with members
      const { data: rooms, error: roomsDetailsError } = await supabase
        .from('rooms')
        .select(
          `
          *,
          rooms_users (user_id)
        `
        )
        .in('id', roomIds)

      if (roomsDetailsError) throw roomsDetailsError

      console.log('Fetched rooms data:', rooms)

      // Convert rooms to Friend format for display
      const friendsList: Friend[] = (rooms || []).map((room: any) => {
        console.log('Processing room:', room)
        let roomName = room.label || 'Chat Room'

        // For direct rooms, always use the user IDs
        if (room.is_direct && room.rooms_users) {
          console.log('Direct room members:', room.rooms_users)
          const userIds = (room.rooms_users || [])
            .map((u: any) => u.user_id)
            .filter((id: string) => id !== session?.user?.id)
          console.log('Filtered user IDs:', userIds)
          roomName = userIds.join(', ') || 'Direct Message'
        }

        return {
          id: room.id,
          name: roomName,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${room.id}`,
          lastMessage: 'No messages yet',
          timestamp: 'Just now',
          unread: 0,
        }
      })

      setFriends(friendsList)
    } catch (error) {
      console.error('Error fetching rooms:', error)
      setFriends([])
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

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
