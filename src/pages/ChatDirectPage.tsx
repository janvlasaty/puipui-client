import { useState, useEffect } from 'react'
import { ChatConversation } from '../components/ChatConversation'
import { useAuth } from '../hooks/useAuth'
import { getMessagesByRoom, insertMessage } from '../repositories/messages.repository'
import { getRoomUsersWithProfiles } from '../repositories/rooms.repository'

interface Message {
  id: string
  text: string
  sender: 'user' | 'other'
  timestamp: string
  showTimestamp: boolean
  showSenderName: boolean
  senderName?: string
  avatar?: string
  createdAt?: Date
}

interface ChatDirectPageProps {
  roomId: string
  onBack: () => void
}

export const ChatDirectPage: React.FC<ChatDirectPageProps> = ({ roomId, onBack }) => {
  const { session } = useAuth()
  const [conversationMessages, setConversationMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [friendName, setFriendName] = useState('')
  const [friendAvatar, setFriendAvatar] = useState('')

  useEffect(() => {
    const loadFriendData = async () => {
      if (!session?.user?.id) return
      const { data: roomUsers, error } = await getRoomUsersWithProfiles(roomId)
      if (error) return
      const otherUser = (roomUsers || []).find((ru) => ru.user_id !== session.user.id)
      setFriendName(otherUser?.profiles?.name || 'Unknown')
      setFriendAvatar(otherUser?.profiles?.avatar || '')
    }
    loadFriendData()
  }, [roomId, session?.user?.id])

  const fetchMessages = async (showLoading = true) => {
    if (!roomId || !session?.user?.id) return

    try {
      if (showLoading) setLoading(true)

      const { data: messages, error } = await getMessagesByRoom(roomId)

      if (error) throw error

      const formattedMessages: Message[] = (messages || []).map((msg, index, msgs) => {
        const isSender = msg.user_id === session.user.id
        const createdAt = new Date(msg.created_at)

        let showTimestamp = true
        let showSenderName = true

        if (index < msgs.length - 1) {
          const nextMsg = msgs[index + 1]
          const timeDiffMinutes = (new Date(nextMsg.created_at).getTime() - createdAt.getTime()) / (1000 * 60)
          if (isSender === (nextMsg.user_id === session.user.id) && timeDiffMinutes < 15) showTimestamp = false
        }

        if (index > 0) {
          const prevMsg = msgs[index - 1]
          const timeDiffMinutes = (createdAt.getTime() - new Date(prevMsg.created_at).getTime()) / (1000 * 60)
          if (isSender === (prevMsg.user_id === session.user.id) && timeDiffMinutes < 15) showSenderName = false
        }

        return {
          id: msg.id,
          text: msg.content,
          sender: isSender ? 'user' : 'other',
          timestamp: createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          showTimestamp,
          showSenderName,
          senderName: isSender ? undefined : friendName,
          avatar: isSender ? undefined : friendAvatar,
          createdAt,
        }
      })

      setConversationMessages(formattedMessages)
    } catch (error) {
      console.error('Error fetching messages:', error)
      setConversationMessages([])
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [roomId, session?.user?.id])

  const handleSendMessage = async (message: string) => {
    if (!session?.user?.id) return

    try {
      const { error } = await insertMessage(roomId, session.user.id, message)

      if (error) throw error

      // Refresh messages without showing loading skeleton
      await fetchMessages(false)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading messages...</p>
      </div>
    )
  }

  return (
    <ChatConversation
      friendName={friendName}
      friendAvatar={friendAvatar}
      messages={conversationMessages}
      onBack={onBack}
      onSendMessage={handleSendMessage}
    />
  )
}
