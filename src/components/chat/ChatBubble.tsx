import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowBendUpLeftIcon, SmileyIcon, TrashIcon, MapPinIcon, ChartBarHorizontalIcon, XIcon, CoinsIcon } from '@phosphor-icons/react'
import { parseMessageLinks } from '../../utils/messageParser'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../contexts/ThemeContext'
import type { Enums } from '../../types/database'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const MAP_STYLE_LIGHT = import.meta.env.VITE_MAPBOX_STYLE_LIGHT
const MAP_STYLE_DARK = import.meta.env.VITE_MAPBOX_STYLE_DARK

// mapbox://styles/user/id → user/id
function mapboxStylePath(style: string) {
  return style.replace('mapbox://styles/', '')
}

interface ChatBubbleProps {
  message: string
  type?: Enums<'type_message_type'>
  sender: 'user' | 'other'
  timestamp: string
  showTimestamp: boolean
  showSenderName: boolean
  senderName?: string
  isNew?: boolean
  onReply?: () => void
  onReact?: () => void
  onDelete?: () => void
}

const bubbleCorners = (isUser: boolean, first: boolean, last: boolean): string => {
  if (isUser) {
    if (first && last) return 'rounded-br-none'
    if (first)         return 'rounded-br-none'
    if (last)          return 'rounded-tr-sm'
    return 'rounded-tr-sm rounded-br-sm'
  } else {
    if (first && last) return 'rounded-bl-none'
    if (first)         return 'rounded-bl-none'
    if (last)          return 'rounded-tl-sm'
    return 'rounded-tl-sm rounded-bl-sm'
  }
}

const LONG_PRESS_MS = 500

// --- Location bubble ---

function LocationBubble({ content }: { content: string }) {
  const [modalOpen, setModalOpen] = React.useState(false)
  const { t } = useTranslation()
  const { theme } = useTheme()
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  let coords: { lat: number; lng: number } | null = null
  try { coords = JSON.parse(content) } catch { /* ignore */ }
  if (!coords) return <p className="text-sm text-muted-foreground">📍 {t('chat.location')}</p>

  const style = mapboxStylePath(isDark ? MAP_STYLE_DARK : MAP_STYLE_LIGHT)
  const pin = `pin-s+DFAF07(${coords.lng},${coords.lat})`
  const mapUrl = (zoom: number, w: number, h: number) =>
    `https://api.mapbox.com/styles/v1/${style}/static/${pin}/${coords!.lng},${coords!.lat},${zoom}/${w}x${h}@2x?access_token=${MAPBOX_TOKEN}`

  return (
    <>
      <img
        src={mapUrl(14, 200, 100)}
        alt="Location"
        className="w-[200px] h-[100px] object-cover block cursor-pointer"
        onClick={() => setModalOpen(true)}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      />

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              className="bg-background w-full max-w-lg rounded-t-2xl overflow-hidden pb-safe"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 35, mass: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <MapPinIcon size={18} className="text-primary" />
                  <span className="font-semibold text-sm">{t('chat.location')}</span>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted"
                >
                  <XIcon size={14} />
                </button>
              </div>
              <img
                src={mapUrl(15, 600, 300)}
                alt="Location"
                className="w-full h-56 object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
              <div className="px-5 py-4 flex items-center gap-2">
                <MapPinIcon size={14} className="text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground font-mono">
                  {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                </span>
                <a
                  href={`https://maps.google.com/?q=${coords.lat},${coords.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-xs text-primary font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t('chat.openInMaps')}
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// --- Poll bubble ---

interface PollData {
  question: string
  options: string[]
  multiSelect: boolean
}

function PollBubble({ content, messageId: _messageId }: { content: string; messageId?: string }) {
  const [expanded, setExpanded] = React.useState(false)
  const [selected, setSelected] = React.useState<string | null>(null)
  const { t } = useTranslation()
  let poll: PollData | null = null
  try { poll = JSON.parse(content) } catch { /* ignore */ }
  if (!poll) return <p className="text-sm text-muted-foreground">📊 {t('poll.poll')}</p>

  const handleVote = (option: string) => {
    setSelected(option)
    // TODO: persist answer — payload: { poll_answer: option, message: poll.question, id: _messageId }
  }

  return (
    <button
      className="block w-full text-left"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-center gap-2 mb-1">
        <ChartBarHorizontalIcon size={14} className="text-primary flex-shrink-0" />
        <span className="text-sm font-medium leading-snug">{poll.question}</span>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1.5" onClick={(e) => e.stopPropagation()}>
              {poll.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleVote(opt)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
                    selected === opt
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border hover:bg-muted text-foreground'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {selected && (
              <p className="text-xs text-muted-foreground mt-2">
                {t('poll.voted')} <span className="text-primary font-medium">{selected}</span>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!expanded && (
        <p className="text-xs text-primary mt-0.5">{t('poll.optionsCount', { count: poll.options.length })}</p>
      )}
    </button>
  )
}

// --- Expense bubble ---

const CURRENCY_SYMBOL: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', CZK: 'Kč', PLN: 'zł',
  HUF: 'Ft', CHF: 'Fr', SEK: 'kr', NOK: 'kr', DKK: 'kr',
  CAD: 'CA$', AUD: 'A$', JPY: '¥', CNY: '¥', BRL: 'R$',
}

function formatAmount(amount: number, currency: string) {
  const sym = CURRENCY_SYMBOL[currency]
  const formatted = amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)
  // suffix currencies
  if (currency === 'CZK' || currency === 'PLN' || currency === 'HUF') return `${formatted} ${sym}`
  return sym ? `${sym}${formatted}` : `${formatted} ${currency}`
}

function ExpenseBubble({ content }: { content: string }) {
  const { t } = useTranslation()
  let data: { description: string; amount: number; currency: string; direction?: 'lent' | 'borrowed' } | null = null
  try { data = JSON.parse(content) } catch { /* ignore */ }
  if (!data) return <p className="text-sm text-muted-foreground">🧾 {t('expense.expense')}</p>

  const isBorrowed = data.direction === 'borrowed'

  return (
    <div className="flex items-center gap-3 min-w-[160px]">
      <CoinsIcon size={20} className="text-primary flex-shrink-0" />
      <div className="flex flex-col min-w-0">
        <span className="text-xs text-muted-foreground leading-tight truncate">{data.description}</span>
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
            {isBorrowed ? (
              <path d="M7 2v10M7 12l-3-3M7 12l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M7 12V2M7 2L4 5M7 2l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
          <span className="text-xl font-semibold text-foreground leading-tight tabular-nums">
            {formatAmount(data.amount, data.currency)}
          </span>
        </div>
      </div>
    </div>
  )
}

// --- Main ChatBubble ---

export const ChatBubble: React.FC<ChatBubbleProps & { messageId?: string }> = ({
  message,
  type = 'text',
  sender,
  timestamp,
  showTimestamp,
  showSenderName,
  senderName,
  isNew = false,
  onReply,
  onReact,
  onDelete,
  messageId,
}) => {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const pressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const isUserMessage = sender === 'user'
  const corners = bubbleCorners(isUserMessage, showSenderName, showTimestamp)
  const startPress = () => {
    pressTimer.current = setTimeout(() => setMenuOpen(true), LONG_PRESS_MS)
  }

  const cancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  const handleAction = (fn?: () => void) => {
    setMenuOpen(false)
    fn?.()
  }

  return (
    <motion.div
      className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} ${showTimestamp ? 'mb-4' : 'mb-1'}`}
      initial={isNew ? { opacity: 0, y: 12, scale: 0.94 } : false}
      animate={isNew ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 28, mass: 0.7 }}
    >
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onPointerDown={() => setMenuOpen(false)}
        />
      )}

      <div className={`flex gap-2 max-w-xs ${isUserMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`${isUserMessage ? 'items-end' : 'items-start'} flex flex-col`}>
          {!isUserMessage && senderName && showSenderName && (
            <span className="text-xs text-muted-foreground mb-1 px-3">{senderName}</span>
          )}

          <div className="relative">
            {menuOpen && (
              <div className={`absolute bottom-full mb-2 z-50 ${isUserMessage ? 'right-0' : 'left-0'}`}>
                <div className="flex items-center bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
                  <button
                    className="flex flex-col items-center gap-1 px-4 py-2.5 hover:bg-muted transition-colors"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => handleAction(onReply)}
                  >
                    <ArrowBendUpLeftIcon size={16} />
                    <span className="text-[10px] text-muted-foreground">{t('chat.reply')}</span>
                  </button>
                  <button
                    className="flex flex-col items-center gap-1 px-4 py-2.5 hover:bg-muted transition-colors"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => handleAction(onReact)}
                  >
                    <SmileyIcon size={16} />
                    <span className="text-[10px] text-muted-foreground">{t('chat.emotion')}</span>
                  </button>
                  <button
                    className="flex flex-col items-center gap-1 px-4 py-2.5 hover:bg-muted transition-colors text-destructive"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => handleAction(onDelete)}
                  >
                    <TrashIcon size={16} />
                    <span className="text-[10px]">{t('chat.delete')}</span>
                  </button>
                </div>
              </div>
            )}

            <div
              className={`rounded-2xl select-none ${corners} ${
                type === 'location'
                  ? 'overflow-hidden'
                  : type === 'poll' || type === 'expense'
                    ? 'border border-primary bg-background px-4 py-2.5'
                    : isUserMessage
                      ? 'bg-primary text-white px-4 py-2'
                      : 'bg-card border border-border px-4 py-2'
              }`}
              onPointerDown={startPress}
              onPointerUp={cancelPress}
              onPointerLeave={cancelPress}
              onPointerCancel={cancelPress}
              onContextMenu={(e) => e.preventDefault()}
            >
              {type === 'location' ? (
                <LocationBubble content={message} />
              ) : type === 'poll' ? (
                <PollBubble content={message} messageId={messageId} />
              ) : type === 'expense' ? (
                <ExpenseBubble content={message} />
              ) : (
                <p className="text-sm leading-relaxed break-words">{parseMessageLinks(message)}</p>
              )}
            </div>
          </div>

          {showTimestamp && (
            <span className="text-xs text-muted-foreground mt-1 px-3">{timestamp}</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
