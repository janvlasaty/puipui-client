import { useState, useEffect } from 'react'
import { ChatListPage } from './ChatListPage'
import { ChatDirectPage } from './ChatDirectPage'
import type { Friend } from '../components/FriendsList'

interface ChatPageProps {
  onDirectChatChange: (isInDirectChat: boolean) => void
}

export const ChatPage: React.FC<ChatPageProps> = ({ onDirectChatChange }) => {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)

  useEffect(() => {
    onDirectChatChange(!!selectedFriend)
  }, [selectedFriend, onDirectChatChange])

  const handleSelectFriend = (friend: Friend) => {
    setSelectedFriend(friend)
  }

  const handleBackToList = () => {
    setSelectedFriend(null)
  }

  if (selectedFriend) {
    return (
      <ChatDirectPage
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
