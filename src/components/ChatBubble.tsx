interface ChatBubbleProps {
  message: string
  sender: 'user' | 'other'
  timestamp: string
  senderName?: string
  avatar?: string
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  sender,
  timestamp,
  senderName,
  avatar,
}) => {
  const isUserMessage = sender === 'user'

  return (
    <div className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex gap-2 max-w-xs ${isUserMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isUserMessage && avatar && (
          <img
            src={avatar}
            alt={senderName}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
        )}

        <div className={`${isUserMessage ? 'items-end' : 'items-start'} flex flex-col`}>
          {!isUserMessage && senderName && (
            <span className="text-xs text-muted-foreground mb-1 px-3">{senderName}</span>
          )}
          <div
            className={`rounded-2xl px-4 py-2 ${
              isUserMessage
                ? 'bg-primary text-white rounded-br-none'
                : 'bg-card border border-border rounded-bl-none'
            }`}
          >
            <p className="text-sm leading-relaxed break-words">{message}</p>
          </div>
          <span className="text-xs text-muted-foreground mt-1 px-3">{timestamp}</span>
        </div>
      </div>
    </div>
  )
}
