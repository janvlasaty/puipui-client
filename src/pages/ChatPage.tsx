import { useState, useEffect } from 'react'
import { ChatListPage } from './ChatListPage'
import { ChatDirectPage } from './ChatDirectPage'
import type { Friend } from '../components/FriendsList'

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
  onCloseDirectChat,
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(directChatRoomId ?? null)

  useEffect(() => {
    setSelectedRoomId(directChatRoomId ?? null)
  }, [directChatRoomId])

  useEffect(() => {
    onDirectChatChange(!!selectedRoomId)
  }, [selectedRoomId, onDirectChatChange])

  const handleSelectFriend = (friend: Friend) => {
    setSelectedRoomId(friend.id)
    onOpenDirectChat?.(friend.id)
  }

  const handleBackToList = () => {
    setSelectedRoomId(null)
    onCloseDirectChat?.()
  }

  if (selectedRoomId) {
    return (
      <ChatDirectPage
        roomId={selectedRoomId}
        onBack={handleBackToList}
      />
    )
  }

  return (
    <ChatListPage onSelectFriend={handleSelectFriend} />
  )
}
