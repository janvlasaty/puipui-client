import { useState, useEffect } from 'react'
import { ChatConversation } from '../components/ChatConversation'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface Message {
  id: string
  text: string
  sender: 'user' | 'other'
  timestamp: string
  senderName?: string
  avatar?: string
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

  const fetchMessages = async () => {
    if (!roomId || !session?.user?.id) {
      console.log('Skipping fetch: roomId or session?.user?.id missing', { roomId, userId: session?.user?.id })
      return
    }

    try {
      setLoading(true)
      console.log('=== FETCHING MESSAGES ===')
      console.log('Current user ID:', session?.user?.id)
      
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) throw error

      console.log('Raw messages from DB:', messages)

      // Convert database messages to Message format
      const formattedMessages: Message[] = (messages || []).map((msg: any) => {
        const isSender = msg.user_id === session.user.id
        console.log(`Message "${msg.content}": user_id="${msg.user_id}" vs session.user.id="${session.user.id}" -> isSender=${isSender}`)
        
        return {
          id: msg.id,
          text: msg.content,
          sender: isSender ? 'user' : 'other',
          timestamp: new Date(msg.created_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          senderName: isSender ? undefined : friendName,
          avatar: isSender ? undefined : friendAvatar,
        }
      })

      setConversationMessages(formattedMessages)
    } catch (error) {
      console.error('Error fetching messages:', error)
      setConversationMessages([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [roomId, session?.user?.id])

  const handleSendMessage = async (message: string) => {
    if (!session?.user?.id) return

    try {
      // Insert message to database
      const { data, error } = await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          user_id: session.user.id,
          content: message,
        })
        .select()

      if (error) throw error

      // Refresh messages
      await fetchMessages()
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
