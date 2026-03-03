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
    <div className="h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="max-w-2xl mx-auto w-full flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          {friendAvatar ? (
            <img src={friendAvatar} alt={friendName} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-muted-foreground" />
            </div>
          )}
          <h1 className="text-lg font-semibold">{friendName}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-scroll overscroll-contain touch-pan-y flex flex-col justify-end">
        <div className="max-w-2xl mx-auto w-full pt-6 pb-4 px-4">
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

      <div className="bg-background border-t border-border">
        <div className="max-w-2xl mx-auto w-full px-4 py-4 flex gap-2">
            <textarea
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              placeholder="Type a message..."
              inputMode="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
              spellCheck={false}
              className="flex-1 px-4 py-2 rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none overflow-hidden leading-normal"
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
  )
}

import * as React from 'react'
