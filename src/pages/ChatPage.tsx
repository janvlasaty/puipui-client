import { useState, useEffect, useRef } from 'react'
import { ChatListPage } from './ChatListPage'
import { ChatDirectPage } from './ChatDirectPage'
import type { Friend } from '../components/FriendsList'
import { motion, AnimatePresence } from 'framer-motion'

interface ChatPageProps {
  onDirectChatChange: (isInDirectChat: boolean) => void
  directChatRoomId?: string
  onOpenDirectChat?: (friendId: string) => void
  onCloseDirectChat?: () => void
}

const slideTransition = { type: 'spring' as const, stiffness: 300, damping: 32, mass: 0.8 }

export const ChatPage: React.FC<ChatPageProps> = ({
  onDirectChatChange,
  directChatRoomId,
  onOpenDirectChat,
  onCloseDirectChat,
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(directChatRoomId ?? null)
  const onCloseRef = useRef(onCloseDirectChat)
  useEffect(() => { onCloseRef.current = onCloseDirectChat }, [onCloseDirectChat])

  useEffect(() => {
    setSelectedRoomId(directChatRoomId ?? null)
  }, [directChatRoomId])

  useEffect(() => {
    onDirectChatChange(!!selectedRoomId)
  }, [selectedRoomId, onDirectChatChange])

  // Push a history entry when the chat opens so that the iOS swipe-from-left
  // edge gesture triggers popstate (which we handle) instead of browser navigation.
  useEffect(() => {
    if (!selectedRoomId) return

    window.history.pushState(null, '')

    const onPopState = () => {
      setSelectedRoomId(null)
      onCloseRef.current?.()
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [selectedRoomId])

  const handleSelectFriend = (friend: Friend) => {
    setSelectedRoomId(friend.id)
    onOpenDirectChat?.(friend.id)
  }

  // Route the back button through history.back() so it goes through the same
  // popstate path as the iOS swipe gesture — no special-casing needed.
  const handleBackToList = () => {
    window.history.back()
  }

  return (
    <div className="relative h-full overflow-hidden">
      <ChatListPage onSelectFriend={handleSelectFriend} />
      <AnimatePresence initial={false}>
        {selectedRoomId && (
          <motion.div
            key={selectedRoomId}
            className="absolute inset-0"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={slideTransition}
          >
            <ChatDirectPage
              roomId={selectedRoomId}
              onBack={handleBackToList}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
