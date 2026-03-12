import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { XIcon, CircleNotchIcon, BookOpenIcon, FilmStripIcon, ArrowLeftIcon } from '@phosphor-icons/react'
import { CATEGORIES } from './vibeData'
import { ModalCard } from '../ui/ModalCard'
import { searchBooks, type BookResult } from '../../utils/openLibrary'
import { searchMoviesTv, fetchOmdbDetails, type OmdbSearchResult } from '../../utils/omdb'
import { EMOJI_OPTIONS, type EmojiOption } from '../../utils/emojiOptions'


export interface CreateVibeReviewPopupProps {
  onClose: () => void
  onSubmit: (data: {
    category: string
    title: string
    meta: string
    emoji: EmojiOption
    note: string
  }) => Promise<void>
}

type Step = 'category' | 'item' | 'vibe'

export const CreateVibeReviewPopup = ({
  onClose,
  onSubmit,
}: CreateVibeReviewPopupProps) => {
  const [step, setStep] = useState<Step>('category')
  const [category, setCategory] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [meta, setMeta] = useState('')
  const [emoji, setEmoji] = useState<EmojiOption | null>(null)
  const [note, setNote] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [bookQuery, setBookQuery] = useState('')
  const [bookResults, setBookResults] = useState<BookResult[]>([])
  const [bookLoading, setBookLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [mediaQuery, setMediaQuery] = useState('')
  const [mediaResults, setMediaResults] = useState<OmdbSearchResult[]>([])
  const [mediaLoading, setMediaLoading] = useState(false)
  const mediaDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (category !== 'books') return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = bookQuery.trim()
    if (!trimmed) { setBookResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setBookLoading(true)
      try {
        setBookResults(await searchBooks(trimmed))
      } catch {
        setBookResults([])
      } finally {
        setBookLoading(false)
      }
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [bookQuery, category])

  useEffect(() => {
    if (category !== 'movies' && category !== 'tv') return
    if (mediaDebounceRef.current) clearTimeout(mediaDebounceRef.current)
    const trimmed = mediaQuery.trim()
    if (!trimmed) { setMediaResults([]); return }
    mediaDebounceRef.current = setTimeout(async () => {
      setMediaLoading(true)
      try {
        const type = category === 'movies' ? 'movie' : 'series'
        setMediaResults(await searchMoviesTv(trimmed, type))
      } catch {
        setMediaResults([])
      } finally {
        setMediaLoading(false)
      }
    }, 400)
    return () => { if (mediaDebounceRef.current) clearTimeout(mediaDebounceRef.current) }
  }, [mediaQuery, category])

  const handleBookSelect = (book: BookResult) => {
    setTitle(book.title)
    setMeta(book.author_name?.[0] || '')
    setBookQuery('')
    setBookResults([])
  }

  const handleMediaSelect = async (item: OmdbSearchResult) => {
    setTitle(item.Title)
    setMediaQuery('')
    setMediaResults([])
    try {
      const details = await fetchOmdbDetails(item.imdbID)
      if (details) {
        setMeta(category === 'movies' ? (details.Director || '') : (details.Network || ''))
      }
    } catch {
      // leave meta blank for manual entry
    }
  }

  const handleCategorySelect = (catId: string) => {
    if (category !== catId) {
      setTitle('')
      setMeta('')
      setBookQuery('')
      setBookResults([])
      setMediaQuery('')
      setMediaResults([])
    }
    setCategory(catId)
    setStep('item')
  }

  const canProceedToVibe = title.trim() && meta.trim()

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
      case 'books': return 'Author'
      case 'movies': return 'Director'
      case 'tv': return 'TV Origin'
      case 'theatre': return 'Playwright/Venue'
      case 'exhibitions': return 'Venue'
      case 'games': return 'Developer'
      default: return 'Meta'
    }
  }

  const getTitleLabel = () => {
    switch (category) {
      case 'books': return 'Book title'
      case 'movies': return 'Movie title'
      case 'tv': return 'TV Show title'
      case 'theatre': return 'Play title'
      case 'exhibitions': return 'Exhibition name'
      case 'games': return 'Game title'
      default: return 'Title'
    }
  }

  const CategoryChip = () =>
    selectedCategory ? (
      <div className="flex items-center gap-1.5 bg-muted rounded-full px-2.5 py-1">
        <selectedCategory.Icon size={13} color={selectedCategory.color} weight="fill" />
        <span className="text-xs font-medium">{selectedCategory.label}</span>
      </div>
    ) : null

  const BackButton = ({ to }: { to: Step }) => (
    <button onClick={() => setStep(to)} className="text-muted-foreground hover:text-foreground transition-colors">
      <ArrowLeftIcon size={16} />
    </button>
  )

  return (
    <>
      <ModalCard
        title="Share your vibe"
        subtitle="Let your friends know your thoughts..."
        onClose={onClose}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {step === 'category' && (
            <motion.div
              key="category"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
              className="px-5 pt-4 pb-6"
            >
              <p className="text-xs font-semibold text-muted-foreground mb-3">Choose a category</p>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted hover:bg-muted/70 border border-transparent transition-colors"
                  >
                    <cat.Icon size={24} color={cat.color} weight="fill" />
                    <span className="text-xs font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'item' && (
            <motion.div
              key="item"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
              className="px-5 pt-3 pb-6 space-y-3"
            >
              <div className="flex items-center gap-2">
                <BackButton to="category" />
                <CategoryChip />
              </div>

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
                        placeholder="Search by title or author..."
                        className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                      />
                      {bookQuery && (
                        <button onClick={() => { setBookQuery(''); setBookResults([]) }}>
                          <XIcon size={13} className="text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                    </div>
                    {bookResults.length > 0 && (
                      <ul className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden max-h-48 overflow-y-auto">
                        {bookResults.map((book) => (
                          <li key={book.isbn ?? book.key}>
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

              {(category === 'movies' || category === 'tv') && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    {category === 'movies' ? 'Search for movie' : 'Search for TV show'}
                  </label>
                  <div className="relative">
                    <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-background focus-within:ring-1 focus-within:ring-ring">
                      {mediaLoading ? (
                        <CircleNotchIcon size={14} className="text-muted-foreground animate-spin shrink-0" />
                      ) : (
                        <FilmStripIcon size={14} className="text-muted-foreground shrink-0" />
                      )}
                      <input
                        type="text"
                        value={mediaQuery}
                        onChange={(e) => setMediaQuery(e.target.value)}
                        placeholder={category === 'movies' ? 'Search by title...' : 'Search by show name...'}
                        className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                      />
                      {mediaQuery && (
                        <button onClick={() => { setMediaQuery(''); setMediaResults([]) }}>
                          <XIcon size={13} className="text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                    </div>
                    {mediaResults.length > 0 && (
                      <ul className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden max-h-48 overflow-y-auto">
                        {mediaResults.map((item) => (
                          <li key={item.imdbID}>
                            <button
                              onClick={() => handleMediaSelect(item)}
                              className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors"
                            >
                              <p className="text-sm font-medium">{item.Title}</p>
                              <p className="text-xs text-muted-foreground">{item.Year}</p>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

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

              <button
                onClick={() => setStep('vibe')}
                disabled={!canProceedToVibe}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                  canProceedToVibe
                    ? 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </motion.div>
          )}

          {step === 'vibe' && (
            <motion.div
              key="vibe"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.18 }}
              className="px-5 pt-3 pb-6 space-y-3"
            >
              <div className="flex items-center gap-2">
                <BackButton to="item" />
                <CategoryChip />
                <span className="text-xs text-muted-foreground truncate">{title}</span>
              </div>

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
                  placeholder="What's your take?..."
                  className="w-full text-sm bg-muted rounded-lg px-3 py-2 outline-none resize-none"
                  rows={4}
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
                {isSubmitting ? 'Adding vibe...' : 'Add Vibe'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
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
