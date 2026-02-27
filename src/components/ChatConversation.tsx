import { ChevronLeft, User } from 'lucide-react'
import { ChatBubble } from './ChatBubble'
import { useEffect, useRef } from 'react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'other'
  timestamp: string
  showTimestamp: boolean
  showSenderName: boolean
  senderName?: string
  avatar?: string
}

interface ChatConversationProps {
  friendName: string
  friendAvatar: string
  messages: Message[]
  onBack: () => void
  onSendMessage: (message: string) => void
}

export const ChatConversation: React.FC<ChatConversationProps> = ({
  friendName,
  friendAvatar,
  messages,
  onBack,
  onSendMessage,
}) => {
  const [inputMessage, setInputMessage] = React.useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage)
      setInputMessage('')
    }
  }

  return (
    <div className="min-h-screen bg-background pb-16 flex flex-col">
      <div className="sticky top-0 bg-background border-b border-border px-4 py-4">
        <div className="container mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-card rounded-lg transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1 flex items-center gap-3">
            {friendAvatar ? (
              <img
                src={friendAvatar}
                alt={friendName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User size={20} className="text-muted-foreground" />
              </div>
            )}
            <div>
              <h2 className="font-bold">{friendName}</h2>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col justify-end">
        <div className="container mx-auto py-6 px-4">
          <div className="max-w-2xl mx-auto">
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message.text}
                sender={message.sender}
                timestamp={message.timestamp}
                showTimestamp={message.showTimestamp}
                showSenderName={message.showSenderName}
                senderName={message.senderName}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-2xl mx-auto flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleSendMessage}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              disabled={!inputMessage.trim()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import * as React from 'react'
