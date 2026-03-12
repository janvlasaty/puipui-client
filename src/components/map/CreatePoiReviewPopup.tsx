import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MAP_CATEGORIES } from './mapCategories'
import { ModalCard } from '../ui/ModalCard'
import type { PoiCategory } from './mapCategories'
import { EMOJI_OPTIONS, type EmojiOption } from '../../utils/emojiOptions'

export interface CreatePoiReviewPopupProps {
  mode: 'existing' | 'new'
  existingPoiData?: {
    name: string
    category: PoiCategory
  }
  latitude: number
  longitude: number
  onClose: () => void
  onSubmit: (data: {
    name: string
    category: PoiCategory
    emoji: EmojiOption
    note: string
    latitude: number
    longitude: number
  }) => Promise<void>
}

export const CreatePoiReviewPopup = ({
  mode,
  existingPoiData,
  latitude,
  longitude,
  onClose,
  onSubmit,
}: CreatePoiReviewPopupProps) => {
  const [name, setName] = useState(existingPoiData?.name || '')
  const [category, setCategory] = useState<PoiCategory | null>(existingPoiData?.category || null)
  const [emoji, setEmoji] = useState<EmojiOption | null>(null)
  const [note, setNote] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit =
    (mode === 'existing' || (name.trim() && category)) &&
    emoji &&
    note.trim()

  const handleSubmit = async () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    try {
      await onSubmit({
        name: mode === 'existing' ? existingPoiData!.name : name.trim(),
        category: mode === 'existing' ? existingPoiData!.category : category!,
        emoji: emoji!,
        note: note.trim(),
        latitude,
        longitude,
      })
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const categoryIcon = mode === 'existing'
    ? MAP_CATEGORIES.find(c => c.id === existingPoiData?.category)
    : category
    ? MAP_CATEGORIES.find(c => c.id === category)
    : null

  return (
    <>
      <ModalCard
        icon={categoryIcon
          ? <categoryIcon.Icon size={26} color={categoryIcon.color} weight="fill" className="shrink-0" />
          : undefined}
        title={mode === 'existing' ? existingPoiData?.name ?? '' : 'New Place'}
        subtitle={mode === 'existing' ? 'Add your review' : 'Create new place'}
        onClose={onClose}
      >
        <div className="px-5 pt-4 pb-6 space-y-3">
          {mode === 'new' && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Place name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter place name..."
                className="w-full text-sm bg-muted rounded-lg px-3 py-2 outline-none"
                autoFocus
              />
            </div>
          )}

          {mode === 'new' && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {MAP_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                      category === cat.id
                        ? 'bg-primary/10 border border-primary'
                        : 'bg-muted hover:bg-muted/70 border border-transparent'
                    }`}
                  >
                    <cat.Icon size={20} color={cat.color} weight="fill" />
                    <span className="text-xs">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Your vibe
            </label>
            {emoji ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEmojiPicker(true)}
                  className="text-3xl hover:scale-110 transition-transform active:scale-95"
                >
                  {emoji}
                </button>
                <span className="text-sm text-muted-foreground">Tap to change</span>
              </div>
            ) : (
              <button
                onClick={() => setShowEmojiPicker(true)}
                className="w-full text-sm bg-muted rounded-lg px-3 py-3 hover:bg-muted/70 transition-colors text-muted-foreground"
              >
                Choose an emoji...
              </button>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Your review
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's the vibe here?..."
              className="w-full text-sm bg-muted rounded-lg px-3 py-2 outline-none resize-none"
              rows={3}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              canSubmit && !isSubmitting
                ? 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </ModalCard>

      <AnimatePresence>
        {showEmojiPicker && (
          <>
            <div className="fixed inset-0 z-[62]" onClick={() => setShowEmojiPicker(false)} />
            <motion.div
              className="fixed z-[63] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid grid-cols-5 gap-1 bg-card border border-border/50 rounded-2xl p-3 shadow-xl"
              style={{ width: 200 }}
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -4 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            >
              {EMOJI_OPTIONS.map((emojiOption) => (
                <button
                  key={emojiOption}
                  onClick={() => {
                    setEmoji(emojiOption)
                    setShowEmojiPicker(false)
                  }}
                  className={`text-xl w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors ${
                    emoji === emojiOption ? 'bg-muted' : ''
                  }`}
                >
                  {emojiOption}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
