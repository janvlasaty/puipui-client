import { MessageCircle, Map, Star } from 'lucide-react'

interface BottomNavigationProps {
  activeTab: 'chat' | 'map' | 'interests'
  onTabChange: (tab: 'chat' | 'map' | 'interests') => void
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'interests', label: 'Interests', icon: Star },
  ] as const

  return (
    <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center pointer-events-none">
      <div className="mb-8 pointer-events-auto bg-card rounded-full shadow-lg border border-border/50 backdrop-blur-sm px-1 py-1 flex gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-20 py-3 flex flex-col items-center justify-center gap-0.5 rounded-full transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-[#DFAF07] text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={20} className="fill-current" strokeWidth={1.5} />
              <span className="text-xs font-semibold">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
