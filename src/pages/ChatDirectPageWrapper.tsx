import { useState, useEffect } from 'react'
import { ChatDirectPage } from './ChatDirectPage'
import { useAuth } from '../hooks/useAuth'
import { getRoomUsers } from '../repositories/rooms.repository'
import { getProfileByUserId } from '../repositories/profiles.repository'

interface ChatDirectPageWrapperProps {
  roomId: string
  onBack: () => void
}

export const ChatDirectPageWrapper: React.FC<ChatDirectPageWrapperProps> = ({
  roomId,
  onBack,
}) => {
  const { session } = useAuth()
  const [friendName, setFriendName] = useState<string>('')
  const [friendAvatar, setFriendAvatar] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFriendData = async () => {
      if (!session?.user?.id) return

      try {
        setLoading(true)
        
        const { data: roomUsers, error: roomUsersError } = await getRoomUsers(roomId)

        if (roomUsersError) throw roomUsersError

        const otherUserIds = (roomUsers || [])
          .map((ru) => ru.user_id)
          .filter((userId) => userId !== session.user.id)

        if (otherUserIds.length === 0) {
          setFriendName('Unknown')
          setFriendAvatar('')
          return
        }

        const { data: profile, error: profileError } = await getProfileByUserId(otherUserIds[0])

        if (profileError) throw profileError

        if (profile) {
          setFriendName(profile.name || 'Unknown')
          setFriendAvatar(profile.avatar || '')
        }
      } catch (error) {
        console.error('Error loading friend data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFriendData()
  }, [roomId, session?.user?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading chat...</p>
      </div>
    )
  }

  return (
    <ChatDirectPage
      roomId={roomId}
      friendName={friendName}
      friendAvatar={friendAvatar}
      onBack={onBack}
    />
  )
}
