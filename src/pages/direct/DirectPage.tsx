import { useState, useEffect, useRef } from 'react'
import { DirectListPage } from './DirectListPage'
import { DirectMessagePage } from './DirectMessagePage'
import type { Friend } from '../../components/chat/ConversationList'
import { motion, AnimatePresence } from 'framer-motion'

interface DirectPageProps {
  onDirectChatChange: (isInDirectChat: boolean) => void
  directChatRoomId?: string
  onOpenDirectChat?: (friendId: string) => void
  onCloseDirectChat?: () => void
}

const slideTransition = { type: 'spring' as const, stiffness: 300, damping: 32, mass: 0.8 }

export const DirectPage: React.FC<DirectPageProps> = ({
  onDirectChatChange,
  directChatRoomId,
  onOpenDirectChat,
  onCloseDirectChat,
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(directChatRoomId ?? null)
  const onCloseRef = useRef(onCloseDirectChat)
  const pushedHistoryRef = useRef(false)
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
    if (!selectedRoomId) {
      pushedHistoryRef.current = false
      return
    }

    window.history.pushState(null, '')
    pushedHistoryRef.current = true

    const onPopState = () => {
      setSelectedRoomId(null)
      onCloseRef.current?.()
      pushedHistoryRef.current = false
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [selectedRoomId])

  const handleSelectFriend = (friend: Friend) => {
    setSelectedRoomId(friend.id)
    onOpenDirectChat?.(friend.id)
  }

  const handleBackToList = () => {
    setSelectedRoomId(null)
    onCloseDirectChat?.()
  }

  return (
    <div className="relative h-full overflow-hidden">
      <DirectListPage onSelectFriend={handleSelectFriend} />
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
            <DirectMessagePage
              roomId={selectedRoomId}
              onBack={handleBackToList}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
