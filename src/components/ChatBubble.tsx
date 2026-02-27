interface ChatBubbleProps {
  message: string
  sender: 'user' | 'other'
  timestamp: string
  showTimestamp: boolean
  showSenderName: boolean
  senderName?: string
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  sender,
  timestamp,
  showTimestamp,
  showSenderName,
  senderName,
}) => {
  const isUserMessage = sender === 'user'

  return (
    <div className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} ${showTimestamp ? 'mb-4' : 'mb-1'}`}>
      <div className={`flex gap-2 max-w-xs ${isUserMessage ? 'flex-row-reverse' : 'flex-row'}`}>

        <div className={`${isUserMessage ? 'items-end' : 'items-start'} flex flex-col`}>
          {!isUserMessage && senderName && showSenderName && (
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
          {showTimestamp && (
            <span className="text-xs text-muted-foreground mt-1 px-3">{timestamp}</span>
          )}
        </div>
      </div>
    </div>
  )
}
