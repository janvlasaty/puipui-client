import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { ChatPage } from './ChatPage'
import { MapPage } from './MapPage'
import { InterestsPage } from './InterestsPage'
import { BottomNavigation } from '../components/BottomNavigation'

export const HomePage = () => {
  const { session } = useAuth()
  const { profile } = useProfile()
  const [activeTab, setActiveTab] = useState<'chat' | 'map' | 'interests'>('map')
  const [isInDirectChat, setIsInDirectChat] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {activeTab === 'chat' && <ChatPage onDirectChatChange={setIsInDirectChat} />}
      {activeTab === 'map' && <MapPage />}
      {activeTab === 'interests' && <InterestsPage />}
      {!isInDirectChat && <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />}
    </div>
  )
}