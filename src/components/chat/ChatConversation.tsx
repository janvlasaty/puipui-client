import { UserIcon, DotsThreeOutlineIcon, MapPinIcon, ChartBarHorizontalIcon, ReceiptIcon, ChatCenteredTextIcon, LinkIcon, EyeSlash, Eye, Plus } from '@phosphor-icons/react'
import { ChatBubble } from './ChatBubble'
import { PageHeader } from '../PageHeader'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i
const isUrl = (text: string) => URL_RE.test(text.trim())

interface Message {
  id: string
  text: string
  sender: 'user' | 'other'
  timestamp: string
  showTimestamp: boolean
  showSenderName: boolean
  senderName?: string
  avatar?: string
}

interface Topic {
  id: string
  label: string
}

interface ChatConversationProps {
  friendName: string
  friendAvatar: string
  messages: Message[]
  onBack: () => void
  onSendMessage: (message: string, type?: 'text' | 'link') => void
  onDeleteMessage?: (id: string) => void
  roomId?: string
  onLoadMore?: () => void
  isLoadingMore?: boolean
  hasMore?: boolean
  topics?: Topic[]
  selectedTopicId?: string | null
  onTopicSelect?: (topicId: string | null) => void
  onAddTopic?: (label: string) => Promise<void>
}

const draftKey = (roomId: string) => `puipui_draft_${roomId}`

export const ChatConversation: React.FC<ChatConversationProps> = ({
  friendName,
  friendAvatar,
  messages,
  onBack,
  onSendMessage,
  onDeleteMessage,
  roomId,
  onLoadMore,
  isLoadingMore = false,
  hasMore = false,
  topics,
  selectedTopicId,
  onTopicSelect,
  onAddTopic,
}) => {
  const [inputMessage, setInputMessage] = React.useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [addingTopic, setAddingTopic] = useState(false)
  const [newTopicLabel, setNewTopicLabel] = useState('')
  const [topicsBarHidden, setTopicsBarHidden] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const newTopicInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  // Saved scroll data before a prepend so we can restore position after
  const prependAnchorRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null)
  const isInitialRef = useRef(true)
  const prevLengthRef = useRef(0)
  // Stable refs for scroll listener (avoids re-registering on every render)
  const onLoadMoreRef = useRef(onLoadMore)
  const isLoadingMoreRef = useRef(isLoadingMore)
  const hasMoreRef = useRef(hasMore)
  onLoadMoreRef.current = onLoadMore
  isLoadingMoreRef.current = isLoadingMore
  hasMoreRef.current = hasMore

  // Manage scroll on message changes:
  //  - Initial load  → jump to bottom instantly
  //  - Prepend (load more) → restore position so the viewport stays on the same message
  //  - Append (new message sent) → jump to bottom
  useLayoutEffect(() => {
    const c = scrollContainerRef.current
    if (!c) return

    if (isInitialRef.current) {
      if (messages.length > 0) {
        c.scrollTop = c.scrollHeight
        isInitialRef.current = false
      }
      prevLengthRef.current = messages.length
      return
    }

    if (prependAnchorRef.current !== null) {
      // Older messages were prepended — restore scroll so viewport doesn't jump
      const { scrollHeight: oldH, scrollTop: oldTop } = prependAnchorRef.current
      c.scrollTop = oldTop + (c.scrollHeight - oldH)
      prependAnchorRef.current = null
    } else if (messages.length > prevLengthRef.current) {
      // New message appended — scroll to bottom
      c.scrollTop = c.scrollHeight
    }

    prevLengthRef.current = messages.length
  }, [messages])

  // Scroll listener: trigger load-more when user scrolls near the top.
  // Registered once; uses refs to read latest prop values without re-registering.
  useEffect(() => {
    const c = scrollContainerRef.current
    if (!c) return
    const onScroll = () => {
      if (
        c.scrollTop < 100 &&
        hasMoreRef.current &&
        !isLoadingMoreRef.current &&
        prependAnchorRef.current === null // don't double-trigger while one is in flight
      ) {
        prependAnchorRef.current = { scrollHeight: c.scrollHeight, scrollTop: c.scrollTop }
        onLoadMoreRef.current?.()
      }
    }
    c.addEventListener('scroll', onScroll, { passive: true })
    return () => c.removeEventListener('scroll', onScroll)
  }, []) // empty — intentional, reads latest values via refs

  // Restore draft on mount
  useEffect(() => {
    if (!roomId) return
    const draft = localStorage.getItem(draftKey(roomId))
    if (draft) {
      setInputMessage(draft)
      if (inputRef.current) inputRef.current.innerText = draft
    }
  }, [roomId])

  const saveDraft = (text: string) => {
    if (!roomId) return
    if (text) {
      localStorage.setItem(draftKey(roomId), text)
    } else {
      localStorage.removeItem(draftKey(roomId))
    }
  }

  const handleSendMessage = () => {
    const text = inputMessage.trim()
    if (text) {
      onSendMessage(text, isUrl(text) ? 'link' : 'text')
      setInputMessage('')
      if (inputRef.current) inputRef.current.innerText = ''
      if (roomId) localStorage.removeItem(draftKey(roomId))
    }
  }

  // Swipe to switch topics
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !topics || topics.length === 0) return

    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd
    const threshold = 50 // minimum swipe distance

    if (Math.abs(diff) > threshold) {
      const allTopics = [null, ...topics.map(t => t.id)]
      const currentIndex = allTopics.findIndex(id => id === selectedTopicId)

      if (diff > 0 && currentIndex < allTopics.length - 1) {
        // Swipe left - next topic
        onTopicSelect?.(allTopics[currentIndex + 1])
      } else if (diff < 0 && currentIndex > 0) {
        // Swipe right - previous topic
        onTopicSelect?.(allTopics[currentIndex - 1])
      }
    }

    setTouchStart(null)
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <PageHeader
        onBack={onBack}
        title={
          <div className="flex items-center gap-2 px-3 py-2.5 bg-background/70 backdrop-blur-sm rounded-full border border-border/50">
            {friendAvatar ? (
              <img src={friendAvatar} alt={friendName} className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <UserIcon size={12} className="text-muted-foreground" />
              </div>
            )}
            <span className="text-sm font-semibold">{friendName}</span>
          </div>
        }
      />

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-scroll overscroll-contain touch-pan-y flex flex-col justify-end pt-16"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="max-w-2xl mx-auto w-full pt-20 pb-4 px-4">
          {/* Load-more spinner */}
          {hasMore && (
            <div className="flex justify-center py-3">
              {isLoadingMore && (
                <span className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              )}
            </div>
          )}

          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message.text}
              sender={message.sender}
              timestamp={message.timestamp}
              showTimestamp={message.showTimestamp}
              showSenderName={message.showSenderName}
              senderName={message.senderName}
              onDelete={onDeleteMessage ? () => onDeleteMessage(message.id) : undefined}
            />
          ))}
        </div>
      </div>

      <div className="bg-background border-t border-border relative">
        {/* Topics bar */}
        {topics !== undefined && (
          <div
            className={`flex items-stretch border-b border-border transition-all duration-300 overflow-hidden ${
              topicsBarHidden ? 'max-h-0 opacity-0 border-b-0' : 'max-h-16 opacity-100'
            }`}
          >
            <button
              onClick={() => setTopicsBarHidden(true)}
              className="flex-shrink-0 px-3 text-muted-foreground hover:bg-muted transition-colors flex items-center"
              aria-label="Hide topics"
            >
              <EyeSlash size={16} weight="regular" />
            </button>
            <div className="flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex justify-center">
              <div className="flex gap-1 px-3 py-2 w-max">
                <button
                  onClick={() => onTopicSelect?.(null)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedTopicId === null || selectedTopicId === undefined
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  CHAT
                </button>
                {topics.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onTopicSelect?.(t.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                      selectedTopicId === t.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
                {addingTopic && (
                  <div className="flex gap-1 items-center">
                    <input
                      ref={newTopicInputRef}
                      autoFocus
                      value={newTopicLabel}
                      onChange={(e) => setNewTopicLabel(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          const label = newTopicLabel.trim()
                          if (label) {
                            await onAddTopic?.(label)
                          }
                          setAddingTopic(false)
                          setNewTopicLabel('')
                        } else if (e.key === 'Escape') {
                          setAddingTopic(false)
                          setNewTopicLabel('')
                        }
                      }}
                      onBlur={() => {
                        setAddingTopic(false)
                        setNewTopicLabel('')
                      }}
                      placeholder="Topic name…"
                      className="px-3 py-1 rounded-full text-xs border border-primary bg-transparent focus:outline-none w-28"
                    />
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setAddingTopic(true)}
              className="flex-shrink-0 px-3 text-muted-foreground hover:bg-muted transition-colors flex items-center"
              aria-label="Add topic"
            >
              <Plus size={16} weight="regular" />
            </button>
          </div>
        )}

        {/* Show topics button when hidden */}
        {topics !== undefined && topicsBarHidden && (
          <div className="flex justify-center border-b border-border">
            <button
              onClick={() => setTopicsBarHidden(false)}
              className="px-3 py-2 text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5 text-xs"
            >
              <Eye size={14} weight="regular" />
              <span>Show topics</span>
            </button>
          </div>
        )}

        {/* Action menu popup */}
        {menuOpen && (
          <div className="absolute bottom-full left-4 mb-2 w-48 bg-popover border border-border rounded-2xl shadow-lg overflow-hidden z-20">
            {[
              { icon: <ChatCenteredTextIcon size={16} />, label: 'Show topics', onClick: () => {} },
              { icon: <MapPinIcon size={16} />, label: 'Share location', onClick: () => {} },
              { icon: <ChartBarHorizontalIcon size={16} />, label: 'Create poll', onClick: () => {} },
              { icon: <ReceiptIcon size={16} />, label: 'Add expense', onClick: () => {} },
            ].map(({ icon, label, onClick }, i, arr) => (
              <button
                key={label}
                onClick={() => { onClick(); setMenuOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors text-left${i < arr.length - 1 ? ' border-b border-border/50' : ''}`}
              >
                <span className="text-muted-foreground">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* URL link badge */}
        {isUrl(inputMessage) && (
          <div className="max-w-2xl mx-auto w-full px-4 pt-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <LinkIcon size={12} />
              Link message
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto w-full px-4 py-4 flex gap-2 items-center">
          <div className="flex-1 relative rounded-[20px] overflow-hidden border border-border bg-background focus-within:ring-2 focus-within:ring-primary">
            {!inputMessage && (
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition-colors z-10 ${menuOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
              >
                <DotsThreeOutlineIcon size={20} weight="fill" />
              </button>
            )}
            <div
              ref={inputRef}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="false"
              onInput={(e) => {
                const text = e.currentTarget.innerText ?? ''
                setInputMessage(text)
                saveDraft(text)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              className={`w-full py-2 bg-transparent focus:outline-none leading-normal min-h-[38px] ${
                inputMessage ? 'px-4' : 'pl-11 pr-4'
              }`}
            />
            {!inputMessage && (
              <span className="absolute left-11 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none select-none">
                Type a message...
              </span>
            )}
          </div>

          <button
            onClick={handleSendMessage}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            disabled={!inputMessage.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

import * as React from 'react'
