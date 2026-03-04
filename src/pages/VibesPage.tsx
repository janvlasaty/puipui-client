import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PageHeader, HeaderButton } from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'
import { X, Loader2, BookOpen, Plus, Film, Tv, Drama, Landmark, Pencil, Trash2, Check, FilterIcon, Filter } from 'lucide-react'

// ─── Interfaces (book search) ────────────────────────────────────────────────

interface AuthorResult {
  key: string
  name: string
  top_work?: string
}

interface BookResult {
  key: string
  title: string
  first_publish_year?: number
}

interface SelectedAuthor {
  key: string
  name: string
  books: BookResult[]
}

// ─── BookSearch component (hidden, preserved for later) ──────────────────────

const BookSearch = ({
  authorName,
  onAdd,
}: {
  authorName: string
  onAdd: (book: BookResult) => void
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BookResult[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = query.trim()
    if (!trimmed) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://openlibrary.org/search.json?author=${encodeURIComponent(authorName)}&q=${encodeURIComponent(trimmed)}&limit=6&fields=title,key,first_publish_year`
        )
        const json = await res.json()
        setResults(json.docs ?? [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, authorName])

  const handleAdd = (book: BookResult) => {
    onAdd(book)
    setQuery('')
    setResults([])
  }

  return (
    <div className="relative mt-2">
      <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-background focus-within:ring-1 focus-within:ring-ring">
        {loading
          ? <Loader2 size={14} className="text-muted-foreground animate-spin shrink-0" />
          : <BookOpen size={14} className="text-muted-foreground shrink-0" />
        }
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search book..."
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]) }}>
            <X size={13} className="text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
      {results.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden">
          {results.map((book) => (
            <li key={book.key}>
              <button
                onClick={() => handleAdd(book)}
                className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors"
              >
                <p className="text-sm font-medium">{book.title}</p>
                {book.first_publish_year && (
                  <p className="text-xs text-muted-foreground">{book.first_publish_year}</p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Dummy data ───────────────────────────────────────────────────────────────

type Review = { emoji: string; user: string; note: string }
type VibeEntry = { id: number; Icon: React.ElementType; title: string; meta: string; reviews: Review[] }

const RECENT_VIBES = [
  { id: 1, Icon: BookOpen, title: 'The Brothers Karamazov', meta: 'Dostoevsky', reviews: [
    { emoji: '😭', user: 'Eva M.', note: 'Absolutely wrecked me. The Grand Inquisitor chapter hit different.' },
  ]},
  { id: 2, Icon: Film, title: 'Anora', meta: 'Sean Baker', reviews: [
    { emoji: '🤩', user: 'Martin K.', note: 'Pure chaos energy. Yura Borisov is a total revelation.' },
    { emoji: '😍', user: 'Klara B.', note: 'Best film I have seen in years. Absolutely electric.' },
    { emoji: '🤔', user: 'Tomáš R.', note: 'Compelling but the third act lost me a bit.' },
  ]},
  { id: 3, Icon: Tv, title: 'Severance S2', meta: 'Apple TV+', reviews: [
    { emoji: '😌', user: 'Klara B.', note: 'Finally got closure on the innie arc. Oddly peaceful after.' },
    { emoji: '🤯', user: 'Adéla N.', note: 'Every episode ends on a cliffhanger. My nerves are gone.' },
    { emoji: '😭', user: 'Eva M.', note: 'The Helly arc wrecked me completely.' },
    { emoji: '🔥', user: 'Martin K.', note: 'Peak television. Nothing comes close right now.' },
  ]},
  { id: 4, Icon: Drama, title: 'Waiting for Godot', meta: 'Beckett', reviews: [
    { emoji: '🥲', user: 'Tomáš R.', note: 'Laughed and cried at the same time. Minimal staging, devastating.' },
    { emoji: '🤯', user: 'Eva M.', note: 'Did not expect to feel this much about nothing happening.' },
  ]},
  { id: 5, Icon: Landmark, title: 'Miró at NGP', meta: 'National Gallery Prague', reviews: [
    { emoji: '✨', user: 'Adéla N.', note: 'So playful and free. I want to paint like a child again.' },
    { emoji: '😊', user: 'Klara B.', note: 'The colours are just joyful. Needed this.' },
    { emoji: '🤩', user: 'Martin K.', note: 'Incredible retrospective. Worth the queue.' },
  ]},
]

const CATEGORY_COLOR = new Map<React.ElementType, string>([
  [BookOpen, '#EAB308'],
  [Film,     '#8B5CF6'],
  [Tv,       '#3B82F6'],
  [Drama,   '#EF4444'],
  [Landmark,  '#10B981'],
])

const CATEGORIES = [
  { id: 'books',       label: 'Books',       Icon: BookOpen },
  { id: 'movies',      label: 'Movies',      Icon: Film     },
  { id: 'tv',          label: 'TV Shows',    Icon: Tv       },
  { id: 'theatre',     label: 'Theatre',     Icon: Drama   },
  { id: 'exhibitions', label: 'Exhibitions', Icon: Landmark  },
]

const MY_REVIEWS = [
  { id: 1, Icon: BookOpen, title: 'Crime and Punishment', meta: 'Dostoevsky', reviews: [
    { emoji: '🔥', user: 'Me', note: 'Reading this in winter was a mistake. Spiralled for a whole week.' },
  ]},
  { id: 2, Icon: Film, title: 'Oppenheimer', meta: 'Christopher Nolan', reviews: [
    { emoji: '😤', user: 'Me', note: 'Important but left me angry at humanity. The Teller subplot deserved more.' },
    { emoji: '🤯', user: 'Me', note: 'The Trinity test sequence is the most terrifying thing I have seen in cinema.' },
  ]},
]

// ─── Review cycler ────────────────────────────────────────────────────────────

const ReviewCycler = ({ reviews }: { reviews: Review[] }) => {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (reviews.length <= 1) return
    const timer = setInterval(() => setIdx((i) => (i + 1) % reviews.length), 3000)
    return () => clearInterval(timer)
  }, [reviews.length])

  const r = reviews[idx]

  return (
    <div className="overflow-hidden h-4 mt-0.5 relative">
      <AnimatePresence mode="sync" initial={false}>
        <motion.p
          key={idx}
          className="text-xs text-muted-foreground truncate absolute inset-x-0"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
        >
          <span className="mr-1">{r.emoji}</span>
          <span className="font-semibold text-foreground">{r.user}:</span> {r.note}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

// ─── Shared vibe item ─────────────────────────────────────────────────────────

const VibeItem = ({ Icon, title, meta, reviews, onClick }: VibeEntry & { onClick?: () => void }) => (
  <div
    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 cursor-pointer active:opacity-70 transition-opacity"
    onClick={onClick}
  >
    <div className="w-11 h-11 shrink-0 rounded-full bg-muted flex items-center justify-center">
      <Icon size={20} color={CATEGORY_COLOR.get(Icon)} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{title} <span className="text-muted-foreground font-normal">({meta})</span></p>
      <ReviewCycler reviews={reviews} />
    </div>
  </div>
)

// ─── Detail modal ─────────────────────────────────────────────────────────────

const EMOJI_OPTIONS = ['😭', '🤩', '😍', '🤔', '😌', '🤯', '🔥', '✨', '😊', '😤', '🥲', '👏', '💯', '❤️', '😮', '🎉', '🫶', '🙌', '😱', '🤌']

const VibeDetailModal = ({ item, onClose }: { item: VibeEntry; onClose: () => void }) => {
  const [reviews, setReviews] = useState(() =>
    [...item.reviews].sort((a, b) => (a.user === 'Me' ? -1 : b.user === 'Me' ? 1 : 0))
  )
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [emojiPickerIdx, setEmojiPickerIdx] = useState<number | null>(null)

  const startEdit = (idx: number) => {
    setEditingIdx(idx)
    setEditText(reviews[idx].note)
    setEmojiPickerIdx(null)
  }

  const saveEdit = (idx: number) => {
    setReviews((prev) => prev.map((r, i) => (i === idx ? { ...r, note: editText } : r)))
    setEditingIdx(null)
  }

  const deleteReview = (idx: number) => {
    setReviews((prev) => prev.filter((_, i) => i !== idx))
    if (editingIdx === idx) setEditingIdx(null)
    if (emojiPickerIdx === idx) setEmojiPickerIdx(null)
  }

  const changeEmoji = (idx: number, emoji: string) => {
    setReviews((prev) => prev.map((r, i) => (i === idx ? { ...r, emoji } : r)))
    setEmojiPickerIdx(null)
  }

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
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <item.Icon size={18} color={CATEGORY_COLOR.get(item.Icon)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground">({item.meta})</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 hover:opacity-70 transition-opacity"
            >
              <X size={15} />
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
                <div className="flex gap-3 items-start">
                  {r.user === 'Me' ? (
                    <button
                      className="text-xl leading-none mt-0.5 shrink-0 hover:scale-110 transition-transform active:scale-95"
                      onClick={() => setEmojiPickerIdx(emojiPickerIdx === i ? null : i)}
                    >
                      {r.emoji}
                    </button>
                  ) : (
                    <span className="text-xl leading-none mt-0.5 shrink-0">{r.emoji}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{r.user}</p>
                    {editingIdx === i ? (
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full text-sm bg-muted rounded-lg px-2 py-1.5 mt-0.5 outline-none resize-none"
                        rows={2}
                        autoFocus
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-0.5">{r.note}</p>
                    )}
                  </div>
                  {r.user === 'Me' && (
                    <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                      {editingIdx === i ? (
                        <button
                          onClick={() => saveEdit(i)}
                          className="p-1.5 text-primary hover:opacity-70 transition-opacity"
                        >
                          <Check size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => startEdit(i)}
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteReview(i)}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {emojiPickerIdx === i && (
                    <motion.div
                      className="mt-2 grid grid-cols-10 gap-0.5 bg-muted rounded-2xl p-2 overflow-hidden"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18, ease: 'easeInOut' }}
                    >
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => changeEmoji(i, emoji)}
                          className={`text-lg p-1 rounded-lg hover:bg-background transition-colors ${r.emoji === emoji ? 'bg-background' : ''}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const VibesPage = () => {
  const { session: _session } = useAuth()
  const { profile: _profile } = useProfile()

  // Preserved book search state (hidden, not rendered)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AuthorResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<SelectedAuthor[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = query.trim()
    if (!trimmed) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`https://openlibrary.org/search/authors.json?q=${encodeURIComponent(trimmed)}&limit=6`)
        const json = await res.json()
        setResults(json.docs ?? [])
      } catch { setResults([]) } finally { setLoading(false) }
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const addAuthor = (author: AuthorResult) => {
    if (selected.find((a) => a.key === author.key)) return
    setSelected((prev) => [...prev, { ...author, books: [] }])
    setQuery('')
    setResults([])
  }
  const removeAuthor = (key: string) => setSelected((prev) => prev.filter((a) => a.key !== key))
  const addBook = (authorKey: string, book: BookResult) => {
    setSelected((prev) => prev.map((a) =>
      a.key === authorKey && !a.books.find((b) => b.key === book.key)
        ? { ...a, books: [...a.books, book] } : a
    ))
  }
  const removeBook = (authorKey: string, bookKey: string) => {
    setSelected((prev) => prev.map((a) =>
      a.key === authorKey ? { ...a, books: a.books.filter((b) => b.key !== bookKey) } : a
    ))
  }
  const handleSignOut = async () => { await supabase.auth.signOut() }

  const [showAllReviews, setShowAllReviews] = useState(false)
  const [activeVibe, setActiveVibe] = useState<VibeEntry | null>(null)

  const carouselRef = useRef<HTMLDivElement>(null)
  const [carouselWidth, setCarouselWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 375)
  useEffect(() => {
    if (!carouselRef.current) return
    setCarouselWidth(carouselRef.current.clientWidth)
    const obs = new ResizeObserver(([e]) => setCarouselWidth(e.contentRect.width))
    obs.observe(carouselRef.current)
    return () => obs.disconnect()
  }, [])
  const colWidth = (carouselWidth - 32) / 2.1

  // Suppress unused warnings for hidden functionality
  void [addAuthor, removeAuthor, addBook, removeBook, handleSignOut, loading, results, BookSearch]

  return (
    <div className="h-screen bg-background">
      <PageHeader
        left={
          <HeaderButton variant="default">
            <Filter size={20} />
          </HeaderButton>}
        right={
          <HeaderButton variant="primary">
            <Plus size={20} />
          </HeaderButton>
        }
      />

      <div className="h-full overflow-y-scroll overscroll-contain touch-pan-y pt-16">
        <div className="max-w-2xl mx-auto w-full px-4 pb-40 pt-4 space-y-8">

          {/* Recents from friends */}
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Recent from friends
            </h2>
            <div ref={carouselRef} className="overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden -mx-4 pl-4 snap-x snap-mandatory scroll-pl-4 pb-1" style={{ scrollbarWidth: 'none' } as React.CSSProperties}>
              <div className="flex gap-2 pr-4">
                {Array.from(
                  { length: Math.ceil(RECENT_VIBES.length / 2) },
                  (_, i) => RECENT_VIBES.slice(i * 2, i * 2 + 2)
                ).map((col, ci) => (
                  <div key={ci} className="flex flex-col gap-2 shrink-0 snap-start" style={{ width: colWidth }}>
                    {col.map((v) => (
                      <VibeItem key={v.id} {...v} onClick={() => setActiveVibe(v)} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Categories */}
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Browse categories
            </h2>
            <div className="flex gap-4 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className="flex flex-col items-center gap-2 shrink-0"
                >
                  <div className="w-16 h-16 rounded-full bg-card border border-border/50 flex items-center justify-center transition-transform active:scale-95 hover:scale-105">
                    <cat.Icon size={22} color={CATEGORY_COLOR.get(cat.Icon)} strokeWidth={2} />
                  </div>
                  <span className="text-xs font-medium w-16 text-center truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* My last vibes */}
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              My last vibes
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {(showAllReviews ? MY_REVIEWS : MY_REVIEWS.slice(0, 4)).map((v) => <VibeItem key={v.id} {...v} onClick={() => setActiveVibe(v)} />)}
            </div>
            {MY_REVIEWS.length > 4 && (
              <button
                onClick={() => setShowAllReviews((p) => !p)}
                className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
              >
                {showAllReviews ? 'Show less' : `Load more (${MY_REVIEWS.length - 4} more)`}
              </button>
            )}
          </section>

        </div>
      </div>

      <AnimatePresence>
        {activeVibe && (
          <VibeDetailModal item={activeVibe} onClose={() => setActiveVibe(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
