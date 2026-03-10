import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { XIcon } from '@phosphor-icons/react'
import { MAP_CATEGORIES } from './mapCategories'
import type { PoiCategory } from './mapCategories'

const EMOJI_OPTIONS = ['😭', '🤩', '😍', '🤔', '😌', '🤯', '🔥', '✨', '😊', '😤', '🥲', '👏', '💯', '❤️', '😮', '🎉', '🫶', '🙌', '😱', '🤌']

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
    emoji: string
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
  const [emoji, setEmoji] = useState<string | null>(null)
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
      onClose()
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
          {/* Header */}
          <div className="flex items-center gap-3 p-5 pb-4">
            {categoryIcon && (
              <categoryIcon.Icon size={26} color={categoryIcon.color} weight="fill" className="shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {mode === 'existing' ? existingPoiData?.name : 'New Place'}
              </p>
              <p className="text-xs text-muted-foreground">
                {mode === 'existing' ? 'Add your review' : 'Create new place'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 hover:opacity-70 transition-opacity"
            >
              <XIcon size={15} />
            </button>
          </div>

          {/* Dashed separator */}
          <div className="mx-5 flex items-center gap-2">
            <div className="h-px flex-1 border-t border-dashed border-border" />
            <div className="-mx-7 w-4 h-4 rounded-full bg-background shrink-0" />
            <div className="h-px flex-1 border-t border-dashed border-border" />
            <div className="-mx-7 w-4 h-4 rounded-full bg-background shrink-0" />
          </div>

          {/* Form */}
          <div className="px-5 pt-4 pb-6 space-y-3">
            {/* Name input (only for new mode) */}
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

            {/* Category selection (only for new mode) */}
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

            {/* Emoji selection */}
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

            {/* Review text */}
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

            {/* Submit button */}
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
        </motion.div>
      </div>

      {/* Emoji picker popover */}
      <AnimatePresence>
        {showEmojiPicker && (
          <>
            <div
              className="fixed inset-0 z-[45]"
              onClick={() => setShowEmojiPicker(false)}
            />
            <motion.div
              className="fixed z-[46] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid grid-cols-5 gap-1 bg-card border border-border/50 rounded-2xl p-3 shadow-xl"
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
