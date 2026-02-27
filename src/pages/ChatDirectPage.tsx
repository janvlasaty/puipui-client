import { useState, useEffect } from 'react'
import { ChatConversation } from '../components/ChatConversation'
import { useAuth } from '../hooks/useAuth'
import { getMessagesByRoom, insertMessage } from '../repositories/messages.repository'

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
  friendName: string
  friendAvatar: string
  onBack: () => void
}

export const ChatDirectPage: React.FC<ChatDirectPageProps> = ({
  roomId,
  friendName,
  friendAvatar,
  onBack,
}) => {
  const { session } = useAuth()
  const [conversationMessages, setConversationMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMessages = async (showLoading = true) => {
    if (!roomId || !session?.user?.id) {
      console.log('Skipping fetch: roomId or session?.user?.id missing', { roomId, userId: session?.user?.id })
      return
    }

    try {
      if (showLoading) setLoading(true)
      console.log('=== FETCHING MESSAGES ===')
      console.log('Current user ID:', session?.user?.id)
      
      const { data: messages, error } = await getMessagesByRoom(roomId)

      if (error) throw error

      console.log('Raw messages from DB:', messages)

      // Convert database messages to Message format
      const formattedMessages: Message[] = (messages || []).map((msg: any, index: number, msgs: any[]) => {
        const isSender = msg.user_id === session.user.id
        const createdAt = new Date(msg.created_at)
        console.log(`Message "${msg.content}": user_id="${msg.user_id}" vs session.user.id="${session.user.id}" -> isSender=${isSender}`)
        
        // Check if we should show timestamp and sender name
        // Show timestamp if it's the last message OR if the next message is from a different sender OR if > 15 minutes passed
        let showTimestamp = true
        let showSenderName = true
        
        if (index < msgs.length - 1) {
          const nextMsg = msgs[index + 1]
          const nextSender = nextMsg.user_id === session.user.id
          const nextCreatedAt = new Date(nextMsg.created_at)
          const timeDiffMinutes = (nextCreatedAt.getTime() - createdAt.getTime()) / (1000 * 60)
          
          // Hide timestamp if: same sender AND less than 15 minutes apart
          if (isSender === nextSender && timeDiffMinutes < 15) {
            showTimestamp = false
          }
        }
        
        // Show sender name only if it's the first message in a group
        // (previous message is from different sender or > 15 minutes ago or it's the first message)
        if (index > 0) {
          const prevMsg = msgs[index - 1]
          const prevSender = prevMsg.user_id === session.user.id
          const prevCreatedAt = new Date(prevMsg.created_at)
          const timeDiffMinutes = (createdAt.getTime() - prevCreatedAt.getTime()) / (1000 * 60)
          
          // Hide sender name if: same sender AND less than 15 minutes apart
          if (isSender === prevSender && timeDiffMinutes < 15) {
            showSenderName = false
          }
        }
        
        return {
          id: msg.id,
          text: msg.content,
          sender: isSender ? 'user' : 'other',
          timestamp: createdAt.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
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
