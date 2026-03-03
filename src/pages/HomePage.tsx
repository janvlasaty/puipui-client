import { useEffect, useState } from 'react'
import { useNavigate, useLocation, useParams, useNavigationType } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { ChatListPage } from './ChatListPage'
import { ChatDirectPage } from './ChatDirectPage'
import { MapPage } from './MapPage'
import { InterestsPage } from './InterestsPage'
import { BottomNavigation } from '../components/BottomNavigation'
import type { Friend } from '../components/FriendsList'

const LAST_TAB_KEY = 'puipui_last_tab'

type TabType = 'chat' | 'map' | 'interests'

const slideOverVariants = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
}

const slideTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 32,
  mass: 0.8,
}

export const HomePage = () => {
  const { session: _session } = useAuth()
  const { profile: _profile } = useProfile()
  const navigate = useNavigate()
  const location = useLocation()
  const navType = useNavigationType()
  const { roomId } = useParams<{ roomId?: string }>()
  const [activeTab, setActiveTab] = useState<TabType>('chat')

  useEffect(() => {
    const pathSegments = location.pathname.split('/')
    const urlTab = pathSegments[1]

    if (urlTab === 'chat' || urlTab === 'map' || urlTab === 'interests') {
      setActiveTab(urlTab as TabType)
      localStorage.setItem(LAST_TAB_KEY, urlTab)
    } else {
      const savedTab = localStorage.getItem(LAST_TAB_KEY) as TabType | null
      const tabToUse = (savedTab === 'chat' || savedTab === 'map' || savedTab === 'interests')
        ? savedTab
        : 'chat'
      setActiveTab(tabToUse)
      navigate(`/${tabToUse}`, { replace: true })
    }
  }, [location.pathname, navigate])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    localStorage.setItem(LAST_TAB_KEY, tab)
    navigate(`/${tab}`)
  }

  const handleSelectFriend = (friend: Friend) => {
    navigate(`/chat/${friend.id}`)
  }

  const handleBackFromDirectChat = () => {
    navigate('/chat')
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {activeTab === 'chat' && <ChatListPage onSelectFriend={handleSelectFriend} />}
      {activeTab === 'map' && <MapPage />}
      {activeTab === 'interests' && <InterestsPage />}

      <AnimatePresence>
        {activeTab === 'chat' && roomId && (
          <motion.div
            key={roomId}
            className="absolute inset-0 bg-background z-20"
            variants={slideOverVariants}
            initial={navType === 'POP' ? 'animate' : 'initial'}
            animate="animate"
            exit="exit"
            transition={slideTransition}
          >
            <ChatDirectPage roomId={roomId} onBack={handleBackFromDirectChat} />
          </motion.div>
        )}
      </AnimatePresence>

      {(activeTab !== 'chat' || !roomId) && (
        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      )}
    </div>
  )
}
