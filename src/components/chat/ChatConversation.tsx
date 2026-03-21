import { UserIcon, DotsThreeOutlineIcon, MapPinIcon, ChartBarHorizontalIcon, CoinsIcon, ChatCenteredTextIcon, GhostIcon,LinkIcon, EyeSlashIcon, PlusIcon } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { ChatBubble } from './ChatBubble'
import { PageHeader } from '../PageHeader'
import { CreatePollModal } from './CreatePollModal'
import { CreateExpenseModal, type Participant } from './CreateExpenseModal'
import { ShareLocationModal } from './ShareLocationModal'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Enums } from '../../types/database'

const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i
const isUrl = (text: string) => URL_RE.test(text.trim())

// Slides panels in/out like iOS multitasking. `custom` is 1 (forward) or -1 (backward).
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%' }),
  center: { x: 0 },
  exit:  (dir: number) => ({ x: dir > 0 ? '-100%' : '100%' }),
}
const slideTransition = { type: 'spring' as const, stiffness: 350, damping: 35, mass: 0.8 }

interface Message {
  id: string
  text: string
  type?: Enums<'type_message_type'>
  sender: 'user' | 'other'
  timestamp: string
  showTimestamp: boolean
  showSenderName: boolean
  senderName?: string
  avatar?: string
  isNew?: boolean
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
  onSendMessage: (message: string, type?: Enums<'type_message_type'>) => void
  onDeleteMessage?: (id: string) => void
  roomId?: string
  onLoadMore?: () => void
  isLoadingMore?: boolean
  hasMore?: boolean
  topics?: Topic[]
  selectedTopicId?: string | null
  onTopicSelect?: (topicId: string | null) => void
  onAddTopic?: (label: string) => Promise<void>
  participants?: Participant[]
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
  participants,
}) => {
  const { t } = useTranslation()
  const [inputMessage, setInputMessage] = React.useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<null | 'poll' | 'expense' | 'location'>(null)
  const [addingTopic, setAddingTopic] = useState(false)
  const [newTopicLabel, setNewTopicLabel] = useState('')
  const [topicsBarHidden, setTopicsBarHidden] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  // Tracks the current scroll panel so the listener re-registers when the topic changes
  const [scrollNode, setScrollNode] = useState<HTMLDivElement | null>(null)
  const newTopicInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  // Synchronous pointer to the scroll container (used by useLayoutEffect)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const topicsScrollRef = useRef<HTMLDivElement>(null)
  // 1 = forward (new panel from right), -1 = backward (new panel from left)
  const topicDirectionRef = useRef(1)
  // Saved scroll data before a prepend so we can restore position after
  const prependAnchorRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null)
  const isInitialRef = useRef(true)
  const prevLengthRef = useRef(0)
  // Stable refs for scroll listener (avoids re-registering on every render)
  const onLoadMoreRef = useRef(onLoadMore)
  const isLoadingMoreRef = useRef(isLoadingMore)
  const hasMoreRef = useRef(hasMore)
  const addingTopicRef = useRef(addingTopic)
  onLoadMoreRef.current = onLoadMore
  isLoadingMoreRef.current = isLoadingMore
  hasMoreRef.current = hasMore
  addingTopicRef.current = addingTopic

  // Called when a new topic panel mounts. Null calls (exiting panels) are ignored.
  const scrollCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    scrollContainerRef.current = node
    setScrollNode(node)
    isInitialRef.current = true
    prevLengthRef.current = 0
    prependAnchorRef.current = null
  }, [])

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
  // Re-registers whenever the scroll panel changes (new topic mounted).
  useEffect(() => {
    const c = scrollNode
    if (!c) return
    const onScroll = () => {
      if (
        c.scrollTop < 100 &&
        hasMoreRef.current &&
        !isLoadingMoreRef.current &&
        prependAnchorRef.current === null
      ) {
        prependAnchorRef.current = { scrollHeight: c.scrollHeight, scrollTop: c.scrollTop }
        onLoadMoreRef.current?.()
      }
    }
    c.addEventListener('scroll', onScroll, { passive: true })
    return () => c.removeEventListener('scroll', onScroll)
  }, [scrollNode])

  const scrollTopicsToSelected = (container: HTMLDivElement, duration = 300) => {
    const selected = container.querySelector('[data-selected="true"]') as HTMLElement
    if (!selected) return
    const target = selected.offsetLeft + selected.offsetWidth / 2 - container.offsetWidth / 2
    const start = container.scrollLeft
    const delta = target - start
    if (Math.abs(delta) < 1) return
    const startTime = performance.now()
    const ease = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    const step = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1)
      container.scrollLeft = start + delta * ease(t)
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  // Scroll selected topic to center on topic change
  useEffect(() => {
    const container = topicsScrollRef.current
    if (!container || addingTopicRef.current) return
    scrollTopicsToSelected(container)
  }, [selectedTopicId])

  // Re-center after 5s of scroll inactivity (desktop)
  useEffect(() => {
    const container = topicsScrollRef.current
    if (!container) return
    let timer: ReturnType<typeof setTimeout>
    const onScroll = () => {
      clearTimeout(timer)
      timer = setTimeout(() => { if (!addingTopicRef.current) scrollTopicsToSelected(container, 1200) }, 3000)
    }
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        e.preventDefault()
        container.scrollLeft += e.deltaY
      }
    }
    container.addEventListener('scroll', onScroll, { passive: true })
    container.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      container.removeEventListener('scroll', onScroll)
      container.removeEventListener('wheel', onWheel)
      clearTimeout(timer)
    }
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

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

  // Select topic with direction tracking for the slide animation
  const handleTopicSelect = (topicId: string | null) => {
    const allTopics = [null as string | null, ...(topics ?? []).map(t => t.id)]
    const currentIdx = allTopics.findIndex(id => id === (selectedTopicId ?? null))
    const nextIdx = allTopics.findIndex(id => id === topicId)
    topicDirectionRef.current = nextIdx >= currentIdx ? 1 : -1
    onTopicSelect?.(topicId)
  }

  // Swipe to switch topics
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !topics || topics.length === 0) return

    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd
    const threshold = 50

    if (Math.abs(diff) > threshold) {
      const allTopics = [null as string | null, ...topics.map(t => t.id)]
      const currentIndex = allTopics.findIndex(id => id === (selectedTopicId ?? null))

      if (diff > 0 && currentIndex < allTopics.length - 1) {
        topicDirectionRef.current = 1
        onTopicSelect?.(allTopics[currentIndex + 1])
      } else if (diff < 0 && currentIndex > 0) {
        topicDirectionRef.current = -1
        onTopicSelect?.(allTopics[currentIndex - 1])
      }
    }

    setTouchStart(null)
  }

  return (
    <>
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

      {/* Clips the slide animation. Touch events here so they work during transition. */}
      <div
        className="flex-1 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence custom={topicDirectionRef.current} initial={false}>
          <motion.div
            key={selectedTopicId ?? '__null__'}
            custom={topicDirectionRef.current}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className="absolute inset-0"
          >
            <div
              ref={scrollCallbackRef}
              className="h-full overflow-y-scroll overscroll-contain touch-pan-y flex flex-col justify-end pt-16"
            >
            <div className="max-w-2xl mx-auto w-full pt-20 pb-0 px-4">
              {hasMore && (
                <div className="flex justify-center py-3">
                  {isLoadingMore && (
                    <span className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                  )}
                </div>
              )}
              {messages.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground/40">
                  <GhostIcon size={48} weight="thin" />
                  <span className="text-sm">{t('chat.noMessagesYet')}</span>
                </div>
              )}
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message.text}
                  type={message.type}
                  sender={message.sender}
                  timestamp={message.timestamp}
                  showTimestamp={message.showTimestamp}
                  showSenderName={message.showSenderName}
                  senderName={message.senderName}
                  isNew={message.isNew}
                  onDelete={onDeleteMessage ? () => onDeleteMessage(message.id) : undefined}
                />
              ))}
            </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="bg-background border-t border-border relative">
        {/* Topics bar */}
        {topics !== undefined && (
          <div
            className={`transition-all duration-300 overflow-hidden ${
              topicsBarHidden ? 'max-h-0 opacity-0 py-0' : 'max-h-12 opacity-100 pt-2 pb-0.5'
            }`}
          >
          <div className="max-w-2xl mx-auto w-full px-4 flex items-center gap-2">
            <button
              onClick={() => setTopicsBarHidden(true)}
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Hide topics"
            >
              <EyeSlashIcon size={14} weight="regular" />
            </button>
            <div className="flex-1 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
              <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
              <div ref={topicsScrollRef} className={`[scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${topics.length > 0 ? 'overflow-x-auto' : 'overflow-x-hidden'}`}>
                <div className="flex gap-4 w-max" style={{ paddingLeft: '50%', paddingRight: '50%' }}>
                  <button
                    data-selected={selectedTopicId === null || selectedTopicId === undefined ? 'true' : 'false'}
                    onClick={() => handleTopicSelect(null)}
                    className={`text-xs font-medium uppercase tracking-wide whitespace-nowrap transition-colors ${
                      selectedTopicId === null || selectedTopicId === undefined
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  >
                    CHAT
                  </button>
                  {topics.map((t) => (
                    <button
                      key={t.id}
                      data-selected={selectedTopicId === t.id ? 'true' : 'false'}
                      onClick={() => handleTopicSelect(t.id)}
                      className={`text-xs font-medium uppercase tracking-wide whitespace-nowrap transition-colors ${
                        selectedTopicId === t.id
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                  {addingTopic && (
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
                      placeholder={t('chat.topicPlaceholder')}
                      className="text-xs uppercase tracking-wide border-b border-primary bg-transparent focus:outline-none w-24"
                    />
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setAddingTopic(true)}
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Add topic"
            >
              <PlusIcon size={14} weight="regular" />
            </button>
          </div>
          </div>
        )}

        {/* URL link badge */}
        {isUrl(inputMessage) && (
          <div className="max-w-2xl mx-auto w-full px-4 pt-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <LinkIcon size={12} />
              {t('chat.linkMessage')}
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto w-full px-4 pt-3 pb-4 flex gap-2 items-end">
          <div ref={menuRef} className="flex-1 relative rounded-[20px] ring-1 ring-inset ring-border bg-background focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary">
            {menuOpen && (
              <div className="absolute bottom-full left-2 mb-2 w-48 bg-popover border border-border rounded-2xl shadow-lg overflow-hidden z-20">
                {[
                  ...(topics !== undefined ? [{ icon: <ChatCenteredTextIcon size={16} />, label: topicsBarHidden ? t('chat.showTopics') : t('chat.hideTopics'), onClick: () => setTopicsBarHidden(h => !h) }] : []),
                  { icon: <MapPinIcon size={16} />, label: t('chat.shareLocation'), onClick: () => setActiveModal('location') },
                  { icon: <ChartBarHorizontalIcon size={16} />, label: t('chat.createPoll'), onClick: () => setActiveModal('poll') },
                  { icon: <CoinsIcon size={16} />, label: t('chat.addExpense'), onClick: () => setActiveModal('expense') },
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
            {!inputMessage && (
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition-colors z-10 ${menuOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
              >
                <DotsThreeOutlineIcon size={20} weight="fill" />
              </button>
            )}
            {!inputMessage && (
              <span className="absolute left-11 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none select-none leading-[22px] text-sm">
                {t('chat.typeMessage')}
              </span>
            )}
            <div
              ref={inputRef}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="true"
              aria-label="Type a message"
              onInput={(e) => {
                const raw = e.currentTarget.innerText
                const text = raw === '\n' ? '' : raw.replace(/\n$/, '')
                setInputMessage(text)
                saveDraft(text)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              onPaste={(e) => {
                e.preventDefault()
                const text = e.clipboardData.getData('text/plain')
                const sel = window.getSelection()
                if (!sel?.rangeCount) return
                const range = sel.getRangeAt(0)
                range.deleteContents()
                range.insertNode(document.createTextNode(text))
                range.collapse(false)
                sel.removeAllRanges()
                sel.addRange(range)
                inputRef.current?.dispatchEvent(new Event('input', { bubbles: true }))
              }}
              className={`w-full py-[9px] bg-transparent focus:outline-none leading-[22px] text-sm break-words overflow-y-auto max-h-40 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${inputMessage ? 'px-4' : 'pl-11 pr-4'}`}
            />
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

    <AnimatePresence mode="wait">
      {activeModal === 'poll' && (
        <CreatePollModal
          onClose={() => setActiveModal(null)}
          onSend={(content) => { onSendMessage(content, 'poll'); setActiveModal(null) }}
        />
      )}
      {activeModal === 'expense' && (
        <CreateExpenseModal
          onClose={() => setActiveModal(null)}
          onSend={(content) => { onSendMessage(content, 'expense'); setActiveModal(null) }}
          participants={participants}
        />
      )}
      {activeModal === 'location' && (
        <ShareLocationModal
          onClose={() => setActiveModal(null)}
          onSend={(content) => { onSendMessage(content, 'location'); setActiveModal(null) }}
        />
      )}
    </AnimatePresence>
    </>
  )
}

import * as React from 'react'
