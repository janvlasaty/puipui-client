import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { XIcon, CircleNotchIcon, BookOpenIcon } from '@phosphor-icons/react'
import { CATEGORIES } from './vibeData'
import { ModalCard } from '../ui/ModalCard'

const EMOJI_OPTIONS = ['😭', '🤩', '😍', '🤔', '😌', '🤯', '🔥', '✨', '😊', '😤', '🥲', '👏', '💯', '❤️', '😮', '🎉', '🫶', '🙌', '😱', '🤌']

export interface BookResult {
  key: string
  title: string
  author_name?: string[]
  first_publish_year?: number
}

export interface CreateVibeReviewPopupProps {
  onClose: () => void
  onSubmit: (data: {
    category: string
    title: string
    meta: string
    emoji: string
    note: string
  }) => Promise<void>
}

export const CreateVibeReviewPopup = ({
  onClose,
  onSubmit,
}: CreateVibeReviewPopupProps) => {
  const [category, setCategory] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [meta, setMeta] = useState('')
  const [emoji, setEmoji] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Book search state
  const [bookQuery, setBookQuery] = useState('')
  const [bookResults, setBookResults] = useState<BookResult[]>([])
  const [bookLoading, setBookLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Book search effect
  useEffect(() => {
    if (category !== 'books') return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = bookQuery.trim()
    if (!trimmed) {
      setBookResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setBookLoading(true)
      try {
        const res = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(trimmed)}&limit=8&fields=title,author_name,key,first_publish_year`
        )
        const json = await res.json()
        setBookResults(json.docs ?? [])
      } catch {
        setBookResults([])
      } finally {
        setBookLoading(false)
      }
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [bookQuery, category])

  const handleBookSelect = (book: BookResult) => {
    setTitle(book.title)
    setMeta(book.author_name?.[0] || '')
    setBookQuery('')
    setBookResults([])
  }

  const canSubmit = category && title.trim() && meta.trim() && emoji && note.trim()

  const handleSubmit = async () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    try {
      await onSubmit({
        category: category!,
        title: title.trim(),
        meta: meta.trim(),
        emoji: emoji!,
        note: note.trim(),
      })
    } catch (error) {
      console.error('Error submitting vibe review:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCategory = CATEGORIES.find((c) => c.id === category)

  const getMetaLabel = () => {
    switch (category) {
      case 'books':
        return 'Author'
      case 'movies':
        return 'Director'
      case 'tv':
        return 'TV Origin'
      case 'theatre':
        return 'Playwright/Venue'
      case 'exhibitions':
        return 'Venue'
      case 'games':
        return 'Developer'
      default:
        return 'Meta'
    }
  }

  const getTitleLabel = () => {
    switch (category) {
      case 'books':
        return 'Book title'
      case 'movies':
        return 'Movie title'
      case 'tv':
        return 'TV Show title'
      case 'theatre':
        return 'Play title'
      case 'exhibitions':
        return 'Exhibition name'
      case 'games':
        return 'Game title'
      default:
        return 'Title'
    }
  }

  return (
    <>
      <ModalCard
        icon={
          selectedCategory ? (
            <selectedCategory.Icon size={26} color={selectedCategory.color} weight="fill" className="shrink-0" />
          ) : undefined
        }
        title={selectedCategory ? `Add ${selectedCategory.label}` : 'New Vibe'}
        subtitle="Share your review"
        onClose={onClose}
      >
        <div className="px-5 pt-4 pb-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Category Selection */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategory(cat.id)
                    setTitle('')
                    setMeta('')
                    setBookQuery('')
                    setBookResults([])
                  }}
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

          {/* Book Search Mode */}
          {category === 'books' && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Search for book
              </label>
              <div className="relative">
                <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-background focus-within:ring-1 focus-within:ring-ring">
                  {bookLoading ? (
                    <CircleNotchIcon size={14} className="text-muted-foreground animate-spin shrink-0" />
                  ) : (
                    <BookOpenIcon size={14} className="text-muted-foreground shrink-0" />
                  )}
                  <input
                    type="text"
                    value={bookQuery}
                    onChange={(e) => setBookQuery(e.target.value)}
                    placeholder="Search book by title or author..."
                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                  />
                  {bookQuery && (
                    <button
                      onClick={() => {
                        setBookQuery('')
                        setBookResults([])
                      }}
                    >
                      <XIcon size={13} className="text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
                {bookResults.length > 0 && (
                  <ul className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden max-h-64 overflow-y-auto">
                    {bookResults.map((book) => (
                      <li key={book.key}>
                        <button
                          onClick={() => handleBookSelect(book)}
                          className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors"
                        >
                          <p className="text-sm font-medium">{book.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {book.author_name?.[0] || 'Unknown author'}
                            {book.first_publish_year && ` • ${book.first_publish_year}`}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Title Input (shown after category selection) */}
          {category && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                {getTitleLabel()}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Enter ${getTitleLabel().toLowerCase()}...`}
                className="w-full text-sm bg-muted rounded-lg px-3 py-2 outline-none"
              />
            </div>
          )}

          {/* Meta Input (shown after category selection) */}
          {category && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                {getMetaLabel()}
              </label>
              <input
                type="text"
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
                placeholder={`Enter ${getMetaLabel().toLowerCase()}...`}
                className="w-full text-sm bg-muted rounded-lg px-3 py-2 outline-none"
              />
            </div>
          )}

          {/* Emoji Picker */}
          {category && (
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
          )}

          {/* Review Note */}
          {category && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Your review
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What's your take?..."
                className="w-full text-sm bg-muted rounded-lg px-3 py-2 outline-none resize-none"
                rows={3}
              />
            </div>
          )}

          {/* Submit Button */}
          {category && (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                canSubmit && !isSubmitting
                  ? 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Adding vibe...' : 'Add Vibe'}
            </button>
          )}
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
