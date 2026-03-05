import { ChatCircleIcon, MapTrifoldIcon, StarIcon } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface BottomNavigationProps {
  activeTab: 'chat' | 'map' | 'vibes'
  onTabChange: (tab: 'chat' | 'map' | 'vibes') => void
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'chat', label: 'Chat', icon: ChatCircleIcon },
    { id: 'map', label: 'Map', icon: MapTrifoldIcon },
    { id: 'vibes', label: 'Vibes', icon: StarIcon },
  ] as const

  return (
    <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center pointer-events-none">
      <div className="mb-8 pointer-events-auto bg-background/70 backdrop-blur-sm rounded-full shadow-lg border border-border/50 px-1 py-1 flex gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative w-20 py-3 flex flex-col items-center justify-center gap-0.5 rounded-full ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-[#DFAF07] rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={20} weight="fill" className="relative z-10" />
              <span className="relative z-10 text-xs font-semibold">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
