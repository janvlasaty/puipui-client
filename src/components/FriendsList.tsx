import { MessageCircle } from 'lucide-react'

export interface Friend {
  id: string
  name: string
  avatar: string
  lastMessage: string
  timestamp: string
  unread?: number
}

interface FriendsListProps {
  friends: Friend[]
  onSelectFriend: (friend: Friend) => void
}

export const FriendsList: React.FC<FriendsListProps> = ({ friends, onSelectFriend }) => {
  return (
    <div className="min-h-screen bg-background pb-24 flex flex-col">
      <div className="sticky top-0 bg-background border-b border-border px-4 py-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-sm text-muted-foreground">Your conversations</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto">
          {friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle size={48} className="text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">No conversations yet</p>
              <p className="text-sm text-muted-foreground">Start a new conversation with a friend</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => onSelectFriend(friend)}
                  className="w-full px-4 py-4 hover:bg-card/50 transition-colors text-left flex items-center gap-3"
                >
                  <img
                    src={friend.avatar}
                    alt={friend.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-foreground">{friend.name}</h3>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{friend.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{friend.lastMessage}</p>
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
