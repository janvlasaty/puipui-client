import { useState, useEffect } from 'react'
import { ChatListPage } from './ChatListPage'
import { ChatDirectPage } from './ChatDirectPage'
import type { Friend } from '../components/FriendsList'
import { getProfileById } from '../repositories/profiles.repository'

interface ChatPageProps {
  onDirectChatChange: (isInDirectChat: boolean) => void
  directChatRoomId?: string
  onOpenDirectChat?: (friendId: string) => void
  onCloseDirectChat?: () => void
}

export const ChatPage: React.FC<ChatPageProps> = ({ 
  onDirectChatChange, 
  directChatRoomId,
  onOpenDirectChat,
  onCloseDirectChat
}) => {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [loadingDirectChat, setLoadingDirectChat] = useState(false)

  // Initialize from URL roomId - load friend info
  useEffect(() => {
    if (!directChatRoomId) {
      setSelectedFriend(null)
      return
    }

    const loadFriendData = async () => {
      try {
        setLoadingDirectChat(true)
        const { data: friendData, error } = await getProfileById(directChatRoomId)

        if (error) throw error

        if (friendData) {
          const friend: Friend = {
            id: friendData.id,
            name: friendData.name || 'Unknown',
            avatar: friendData.avatar || '',
            lastMessage: '',
            timestamp: '',
          }
          setSelectedFriend(friend)
        }
      } catch (error) {
        console.error('Error loading friend data:', error)
      } finally {
        setLoadingDirectChat(false)
      }
    }

    loadFriendData()
  }, [directChatRoomId])

  useEffect(() => {
    onDirectChatChange(!!selectedFriend)
  }, [selectedFriend, onDirectChatChange])

  const handleSelectFriend = (friend: Friend) => {
    setSelectedFriend(friend)
    onOpenDirectChat?.(friend.id)
  }

  const handleBackToList = () => {
    setSelectedFriend(null)
    onCloseDirectChat?.()
  }

  if (loadingDirectChat) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading chat...</p>
      </div>
    )
  }

  if (selectedFriend) {
    return (
      <ChatDirectPage
        roomId={selectedFriend.id}
        friendName={selectedFriend.name}
        friendAvatar={selectedFriend.avatar}
        onBack={handleBackToList}
      />
    )
  }

  return (
    <ChatListPage onSelectFriend={handleSelectFriend} />
  )
}
