import * as React from 'react'
import { ChatCircleIcon, GearIcon, UserIcon } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageHeader, HeaderButton } from '../PageHeader'

export interface Friend {
  id: string
  name: string
  avatar: string
  lastMessage: React.ReactNode
  timestamp: string
  unread?: number
}

interface ConversationListProps {
  friends: Friend[]
  onSelectFriend: (friend: Friend) => void
}

export const ConversationList: React.FC<ConversationListProps> = ({ friends, onSelectFriend }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="h-screen bg-background">
      <PageHeader
        right={
          <HeaderButton onClick={() => navigate('/settings')}>
            <GearIcon size={20} />
          </HeaderButton>
        }
      />

      <div className="h-full overflow-y-scroll overscroll-contain touch-pan-y pt-16 pb-24">
        <div className="max-w-2xl mx-auto w-full">
          {friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ChatCircleIcon size={48} className="text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">{t('chat.noConversations')}</p>
              <p className="text-sm text-muted-foreground">{t('chat.startConversation')}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => onSelectFriend(friend)}
                  className="w-full px-4 py-4 hover:bg-card/50 transition-colors text-left flex items-center gap-3"
                >
                  {friend.avatar ? (
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <UserIcon size={22} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-foreground">{friend.name}</h3>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{friend.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-0 overflow-hidden">{friend.lastMessage}</div>
                  </div>
                  {friend.unread && friend.unread > 0 && (
                    <div className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center flex-shrink-0">
                      {friend.unread}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
