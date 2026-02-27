import { useEffect, useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
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

export const HomePage = () => {
  const { session: _session } = useAuth()
  const { profile: _profile } = useProfile()
  const navigate = useNavigate()
  const location = useLocation()
  const { roomId } = useParams<{ roomId?: string }>()
  const [activeTab, setActiveTab] = useState<TabType>('chat')

  // Initialize tab from URL or localStorage
  useEffect(() => {
    const pathSegments = location.pathname.split('/')
    const urlTab = pathSegments[1]

    if (urlTab === 'chat' || urlTab === 'map' || urlTab === 'interests') {
      setActiveTab(urlTab as TabType)
      // Remember the tab in localStorage
      localStorage.setItem(LAST_TAB_KEY, urlTab)
    } else {
      // If no valid tab in URL, try to get from localStorage, default to 'chat'
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
    <div className="min-h-screen bg-background">
      {activeTab === 'chat' && roomId ? (
        <ChatDirectPage roomId={roomId} onBack={handleBackFromDirectChat} />
      ) : null}
      {activeTab === 'chat' && !roomId ? (
        <ChatListPage onSelectFriend={handleSelectFriend} />
      ) : null}
      {activeTab === 'map' && <MapPage />}
      {activeTab === 'interests' && <InterestsPage />}
      {activeTab !== 'chat' || !roomId ? (
        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      ) : null}
    </div>
  )
}