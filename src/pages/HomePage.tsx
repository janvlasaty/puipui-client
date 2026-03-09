import { useEffect, useState } from 'react'
import { useNavigate, useLocation, useParams, useNavigationType } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { DirectListPage } from './DirectListPage'
import { DirectMessagePage } from './DirectMessagePage'
import { MapPage } from './MapPage'
import { VibesPage } from './VibesPage'
import { RoomsPage } from './RoomsPage'
import { BottomNavigation } from '../components/BottomNavigation'
import type { Friend } from '../components/FriendsList'

const LAST_TAB_KEY = 'puipui_last_tab'

type TabType = 'chat' | 'map' | 'vibes' | 'rooms'

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

    if (urlTab === 'chat' || urlTab === 'map' || urlTab === 'vibes' || urlTab === 'rooms') {
      setActiveTab(urlTab as TabType)
      localStorage.setItem(LAST_TAB_KEY, urlTab)
    } else {
      const savedTab = localStorage.getItem(LAST_TAB_KEY) as TabType | null
      const tabToUse = (savedTab === 'chat' || savedTab === 'map' || savedTab === 'vibes' || savedTab === 'rooms')
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
      {activeTab === 'chat' && <DirectListPage onSelectFriend={handleSelectFriend} />}
      {activeTab === 'map' && <MapPage />}
      {activeTab === 'vibes' && <VibesPage />}
      {activeTab === 'rooms' && <RoomsPage />}

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
            <DirectMessagePage roomId={roomId} onBack={handleBackFromDirectChat} />
          </motion.div>
        )}
      </AnimatePresence>

      {(activeTab !== 'chat' || !roomId) && (
        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      )}
    </div>
  )
}
