import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { XIcon, PencilIcon, TrashIcon, CheckIcon } from '@phosphor-icons/react'
import { CATEGORY_COLOR } from './vibeData'
import type { VibeEntry } from './types'

const EMOJI_OPTIONS = ['😭', '🤩', '😍', '🤔', '😌', '🤯', '🔥', '✨', '😊', '😤', '🥲', '👏', '💯', '❤️', '😮', '🎉', '🫶', '🙌', '😱', '🤌']

export const VibeDetailModal = ({ item, onClose }: { item: VibeEntry; onClose: () => void }) => {
  const [reviews, setReviews] = useState(() =>
    [...item.reviews].sort((a, b) => (a.user === 'Me' ? -1 : b.user === 'Me' ? 1 : 0))
  )
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [emojiPickerIdx, setEmojiPickerIdx] = useState<number | null>(null)
  const [popoverRect, setPopoverRect] = useState<DOMRect | null>(null)
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null)

  const startEdit = (idx: number) => {
    setEditingIdx(idx)
    setEditText(reviews[idx].note)
    setEmojiPickerIdx(null)
    setPopoverRect(null)
  }

  const saveEdit = (idx: number) => {
    setReviews((prev) => prev.map((r, i) => (i === idx ? { ...r, note: editText } : r)))
    setEditingIdx(null)
  }

  const deleteReview = (idx: number) => {
    setReviews((prev) => prev.filter((_, i) => i !== idx))
    if (editingIdx === idx) setEditingIdx(null)
    if (emojiPickerIdx === idx) { setEmojiPickerIdx(null); setPopoverRect(null) }
    setConfirmDeleteIdx(null)
  }

  const changeEmoji = (idx: number, emoji: string) => {
    setReviews((prev) => prev.map((r, i) => (i === idx ? { ...r, emoji } : r)))
    setEmojiPickerIdx(null)
    setPopoverRect(null)
  }

  const toggleEmojiPicker = (idx: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (emojiPickerIdx === idx) {
      setEmojiPickerIdx(null)
      setPopoverRect(null)
    } else {
      setEmojiPickerIdx(idx)
      setPopoverRect(e.currentTarget.getBoundingClientRect())
    }
  }

  const popoverWidth = 200
  const popoverLeft = popoverRect
    ? Math.min(popoverRect.right - popoverWidth, window.innerWidth - popoverWidth - 8)
    : 0
  const popoverTop = popoverRect
    ? popoverRect.bottom + 6
    : 0

  return (
    <>
      <motion.div
        className="fixed inset-0 z-30 bg-black/40"
        style={{ backdropFilter: 'blur(10px) grayscale(1)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-40 flex items-center justify-center p-6 pointer-events-none">
        <motion.div
          className="bg-card rounded-3xl w-full max-w-sm shadow-2xl pointer-events-auto overflow-hidden"
          initial={{ opacity: 0, scale: 0.86, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.86, y: 12 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        >
          <div className="flex items-center gap-3 p-5 pb-4">
            <item.Icon size={26} color={CATEGORY_COLOR.get(item.Icon)} weight="fill" className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.meta}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 hover:opacity-70 transition-opacity"
            >
              <XIcon size={15} />
            </button>
          </div>

          <div className="mx-5 flex items-center gap-2">
            <div className="h-px flex-1 border-t border-dashed border-border" />
            <div className="-mx-7 w-4 h-4 rounded-full bg-background shrink-0" />
            <div className="h-px flex-1 border-t border-dashed border-border" />
            <div className="-mx-7 w-4 h-4 rounded-full bg-background shrink-0" />
          </div>

          <div className="px-5 pt-4 pb-6 space-y-3 max-h-[50vh] overflow-y-auto">
            {reviews.map((r, i) => (
              <div key={i}>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-muted-foreground">{r.user}</p>
                    {r.user === 'Me' && (
                      <>
                        {editingIdx === i ? (
                          <button onClick={() => saveEdit(i)} className="p-1 text-primary hover:opacity-70 transition-opacity">
                            <CheckIcon size={14} />
                          </button>
                        ) : (
                          <button onClick={() => startEdit(i)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                            <PencilIcon size={14} />
                          </button>
                        )}
                                        <button onClick={() => setConfirmDeleteIdx(i)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                          <TrashIcon size={14} />
                        </button>
                      </>
                    )}
                  </div>
                  {r.user === 'Me' ? (
                    <button
                      className="text-xl leading-none shrink-0 hover:scale-110 transition-transform active:scale-95"
                      onClick={(e) => toggleEmojiPicker(i, e)}
                    >
                      {r.emoji}
                    </button>
                  ) : (
                    <span className="text-xl leading-none shrink-0">{r.emoji}</span>
                  )}
                </div>
                {editingIdx === i ? (
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full text-sm bg-muted rounded-lg px-2 py-1.5 mt-1 outline-none resize-none"
                    rows={2}
                    autoFocus
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-0.5">{r.note}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Delete confirmation — iOS-style action sheet */}
      <AnimatePresence>
        {confirmDeleteIdx !== null && (
          <>
            <motion.div
              className="fixed inset-0 z-[47] bg-black/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDeleteIdx(null)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-[48] p-4 pb-8"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            >
              <div className="bg-card rounded-2xl overflow-hidden mb-3">
                <div className="px-4 py-3 border-b border-border/50 text-center">
                  <p className="text-xs text-muted-foreground">Remove your review?</p>
                </div>
                <button
                  onClick={() => deleteReview(confirmDeleteIdx)}
                  className="w-full py-3.5 text-sm font-semibold text-destructive hover:bg-muted transition-colors"
                >
                  Delete
                </button>
              </div>
              <button
                onClick={() => setConfirmDeleteIdx(null)}
                className="w-full bg-card rounded-2xl py-3.5 text-sm font-semibold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Emoji popover — fixed, escapes overflow-hidden */}
      <AnimatePresence>
        {emojiPickerIdx !== null && popoverRect && (
          <>
            <div className="fixed inset-0 z-[45]" onClick={() => { setEmojiPickerIdx(null); setPopoverRect(null) }} />
            <motion.div
              className="fixed z-[46] grid grid-cols-5 gap-1 bg-card border border-border/50 rounded-2xl p-3 shadow-xl"
              style={{ top: popoverTop, left: popoverLeft, width: popoverWidth }}
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -4 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            >
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => changeEmoji(emojiPickerIdx, emoji)}
                  className={`text-xl w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors ${reviews[emojiPickerIdx]?.emoji === emoji ? 'bg-muted' : ''}`}
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
