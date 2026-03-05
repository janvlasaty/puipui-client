import { UserIcon } from '@phosphor-icons/react'
import { ChatBubble } from './ChatBubble'
import { PageHeader } from './PageHeader'
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
  onDeleteMessage?: (id: string) => void
  roomId?: string
}

const draftKey = (roomId: string) => `puipui_draft_${roomId}`

export const ChatConversation: React.FC<ChatConversationProps> = ({
  friendName,
  friendAvatar,
  messages,
  onBack,
  onSendMessage,
  onDeleteMessage,
  roomId,
}) => {
  const [inputMessage, setInputMessage] = React.useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Restore draft on mount
  useEffect(() => {
    if (!roomId) return
    const draft = localStorage.getItem(draftKey(roomId))
    if (draft) {
      setInputMessage(draft)
      if (inputRef.current) inputRef.current.innerText = draft
    }
  }, [roomId])

  const saveDraft = (text: string) => {
    if (!roomId) return
    if (text) {
      localStorage.setItem(draftKey(roomId), text)
    } else {
      localStorage.removeItem(draftKey(roomId))
    }
  }

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim())
      setInputMessage('')
      if (inputRef.current) inputRef.current.innerText = ''
      if (roomId) localStorage.removeItem(draftKey(roomId))
    }
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <PageHeader
        onBack={onBack}
        title={
          <div className="flex items-center gap-2 px-3 py-1 bg-background/70 backdrop-blur-sm rounded-full border border-border/50">
            {friendAvatar ? (
              <img src={friendAvatar} alt={friendName} className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <UserIcon size={12} className="text-muted-foreground" />
              </div>
            )}
            <span className="text-sm font-semibold">{friendName}</span>
          </div>
        }
      />

      <div className="flex-1 overflow-y-scroll overscroll-contain touch-pan-y flex flex-col justify-end pt-16">
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
              onDelete={onDeleteMessage ? () => onDeleteMessage(message.id) : undefined}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-background border-t border-border">
        <div className="max-w-2xl mx-auto w-full px-4 py-4 flex gap-2 items-center">
            <div className="flex-1 relative rounded-[20px] overflow-hidden border border-border bg-background focus-within:ring-2 focus-within:ring-primary">
              <div
                ref={inputRef}
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-multiline="false"
                onInput={(e) => {
                  const text = e.currentTarget.innerText ?? ''
                  setInputMessage(text)
                  saveDraft(text)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                className="w-full px-4 py-2 bg-transparent focus:outline-none leading-normal min-h-[38px]"
              />
              {!inputMessage && (
                <span className="absolute inset-0 flex items-center px-4 text-muted-foreground pointer-events-none select-none">
                  Type a message...
                </span>
              )}
            </div>
            <button
              onClick={handleSendMessage}
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50"
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
