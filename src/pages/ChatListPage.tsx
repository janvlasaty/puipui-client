import { useAuth } from '../hooks/useAuth'
import { FriendsList, type Friend } from '../components/FriendsList'
import { Button } from '@/components/ui/button'
import { supabase } from '../lib/supabase'

interface ChatListPageProps {
  onSelectFriend: (friend: Friend) => void
}

export const ChatListPage: React.FC<ChatListPageProps> = ({ onSelectFriend }) => {
  const { session: _session } = useAuth()

  const friends: Friend[] = [
    {
      id: '1',
      name: 'Alex Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      lastMessage: 'That sounds awesome! What kind of features?',
      timestamp: '10:32 AM',
      unread: 0,
    },
    {
      id: '2',
      name: 'Sarah Williams',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      lastMessage: 'See you at the meeting tomorrow!',
      timestamp: 'Yesterday',
      unread: 2,
    },
    {
      id: '3',
      name: 'Mike Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
      lastMessage: 'Sounds good! Let me know when you\'re free',
      timestamp: '2 days ago',
      unread: 0,
    },
    {
      id: '4',
      name: 'Emma Davis',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
      lastMessage: 'That project looks amazing! 🎉',
      timestamp: '3 days ago',
      unread: 0,
    },
    {
      id: '5',
      name: 'James Brown',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
      lastMessage: 'Let\'s catch up soon',
      timestamp: 'Last week',
      unread: 0,
    },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <FriendsList friends={friends} onSelectFriend={onSelectFriend} />
      <div className="fixed bottom-6 left-0 right-0 flex justify-center">
        <Button onClick={handleSignOut} variant="destructive" size="sm">
          Sign Out
        </Button>
      </div>
    </div>
  )
}
