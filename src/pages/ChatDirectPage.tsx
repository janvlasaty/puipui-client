import { useState, useEffect } from 'react'
import { ChatConversation } from '../components/ChatConversation'
import { useAuth } from '../hooks/useAuth'
import { getMessagesByRoom, insertMessage, archiveMessage } from '../repositories/messages.repository'
import { getRoomUsersWithProfiles } from '../repositories/rooms.repository'
import { decodeAvatar } from '../lib/utils'

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
      setFriendAvatar(decodeAvatar(otherUser?.profiles?.avatar) || '')
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
      <div className="h-screen bg-background flex flex-col">
        <div className="fixed top-0 left-0 right-0 z-10 px-4 py-4">
          <div className="max-w-2xl mx-auto w-full flex items-center gap-3">
            <div className="w-5 h-5 rounded bg-muted animate-pulse flex-shrink-0" />
            <div className="w-7 h-7 rounded-full bg-muted animate-pulse flex-shrink-0" />
            <div className="h-5 w-32 rounded bg-muted animate-pulse" />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end pt-16">
          <div className="max-w-2xl mx-auto w-full py-6 px-4 space-y-3">
            {([
              { sender: 'other', width: 'w-48' },
              { sender: 'other', width: 'w-36' },
              { sender: 'user',  width: 'w-52' },
              { sender: 'user',  width: 'w-28' },
              { sender: 'other', width: 'w-44' },
              { sender: 'user',  width: 'w-40' },
            ] as const).map((item, i) => (
              <div key={i} className={`flex ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`h-9 rounded-2xl bg-muted animate-pulse ${item.width}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
          <div className="max-w-2xl mx-auto w-full px-4 py-4 flex gap-2">
            <div className="flex-1 h-10 rounded-full bg-muted animate-pulse" />
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  const handleDeleteMessage = async (id: string) => {
    setConversationMessages((prev) => prev.filter((m) => m.id !== id))
    await archiveMessage(id)
  }

  return (
    <ChatConversation
      roomId={roomId}
      friendName={friendName}
      friendAvatar={friendAvatar}
      messages={conversationMessages}
      onBack={onBack}
      onSendMessage={handleSendMessage}
      onDeleteMessage={handleDeleteMessage}
    />
  )
}
