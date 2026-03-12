import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowBendUpLeftIcon, SmileyIcon, TrashIcon } from '@phosphor-icons/react'
import { parseMessageLinks } from '../../utils/messageParser'

interface ChatBubbleProps {
  message: string
  sender: 'user' | 'other'
  timestamp: string
  showTimestamp: boolean
  showSenderName: boolean
  senderName?: string
  isNew?: boolean
  onReply?: () => void
  onReact?: () => void
  onDelete?: () => void
}

const bubbleCorners = (isUser: boolean, first: boolean, last: boolean): string => {
  if (isUser) {
    if (first && last) return 'rounded-br-none'
    if (first)         return 'rounded-br-none'
    if (last)          return 'rounded-tr-sm'
    return 'rounded-tr-sm rounded-br-sm'
  } else {
    if (first && last) return 'rounded-bl-none'
    if (first)         return 'rounded-bl-none'
    if (last)          return 'rounded-tl-sm'
    return 'rounded-tl-sm rounded-bl-sm'
  }
}

const LONG_PRESS_MS = 500

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  sender,
  timestamp,
  showTimestamp,
  showSenderName,
  senderName,
  isNew = false,
  onReply,
  onReact,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const pressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const isUserMessage = sender === 'user'
  const corners = bubbleCorners(isUserMessage, showSenderName, showTimestamp)

  const startPress = () => {
    pressTimer.current = setTimeout(() => setMenuOpen(true), LONG_PRESS_MS)
  }

  const cancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  const handleAction = (fn?: () => void) => {
    setMenuOpen(false)
    fn?.()
  }

  return (
    <motion.div
      className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} ${showTimestamp ? 'mb-4' : 'mb-1'}`}
      initial={isNew ? { opacity: 0, y: 12, scale: 0.94 } : false}
      animate={isNew ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 28, mass: 0.7 }}
    >
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onPointerDown={() => setMenuOpen(false)}
        />
      )}

      <div className={`flex gap-2 max-w-xs ${isUserMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`${isUserMessage ? 'items-end' : 'items-start'} flex flex-col`}>
          {!isUserMessage && senderName && showSenderName && (
            <span className="text-xs text-muted-foreground mb-1 px-3">{senderName}</span>
          )}

          <div className="relative">
            {menuOpen && (
              <div className={`absolute bottom-full mb-2 z-50 ${isUserMessage ? 'right-0' : 'left-0'}`}>
                <div className="flex items-center bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
                  <button
                    className="flex flex-col items-center gap-1 px-4 py-2.5 hover:bg-muted transition-colors"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => handleAction(onReply)}
                  >
                    <ArrowBendUpLeftIcon size={16} />
                    <span className="text-[10px] text-muted-foreground">Reply</span>
                  </button>
                  <button
                    className="flex flex-col items-center gap-1 px-4 py-2.5 hover:bg-muted transition-colors"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => handleAction(onReact)}
                  >
                    <SmileyIcon size={16} />
                    <span className="text-[10px] text-muted-foreground">Emotion</span>
                  </button>
                  <button
                    className="flex flex-col items-center gap-1 px-4 py-2.5 hover:bg-muted transition-colors text-destructive"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => handleAction(onDelete)}
                  >
                    <TrashIcon size={16} />
                    <span className="text-[10px]">Delete</span>
                  </button>
                </div>
              </div>
            )}

            <div
              className={`rounded-2xl px-4 py-2 select-none ${corners} ${
                isUserMessage
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border'
              }`}
              onPointerDown={startPress}
              onPointerUp={cancelPress}
              onPointerLeave={cancelPress}
              onPointerCancel={cancelPress}
              onContextMenu={(e) => e.preventDefault()}
            >
              <p className="text-sm leading-relaxed break-words">{parseMessageLinks(message)}</p>
            </div>
          </div>

          {showTimestamp && (
            <span className="text-xs text-muted-foreground mt-1 px-3">{timestamp}</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
