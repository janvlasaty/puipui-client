import { useState, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { PageHeader, HeaderButton } from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { PlusIcon, FunnelIcon } from '@phosphor-icons/react'
import { CATEGORY_COLOR, CATEGORIES, RECENT_VIBES, MY_REVIEWS } from '../components/vibes/vibeData'
import { VibeItem } from '../components/vibes/VibeItem'
import { CategoryFilterPopup } from '../components/CategoryFilterPopup'
import { BookSearch, type AuthorResult, type BookResult, type SelectedAuthor } from '../components/vibes/BookSearch'
import { useOverlay } from '../contexts/OverlayContext'

const ALL_CATEGORY_IDS = CATEGORIES.map((c) => c.id)

export const VibesPage = () => {
  const { session: _session } = useAuth()
  const { profile: _profile } = useProfile()
  const { t } = useTranslation()

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

  const { openVibeDetail, openVibeReview } = useOverlay()
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const filterBtnRef = useRef<HTMLDivElement>(null)
  const [activeCategories, setActiveCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('vibes-filter')
      if (stored) return JSON.parse(stored)
    } catch {}
    return ALL_CATEGORY_IDS
  })

  useEffect(() => {
    localStorage.setItem('vibes-filter', JSON.stringify(activeCategories))
  }, [activeCategories])

  const toggleCategory = (id: string) => {
    setActiveCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const enabledIcons = new Set<React.ElementType>(
    CATEGORIES.filter((c) => activeCategories.includes(c.id)).map((c) => c.Icon)
  )
  const filteredRecent = RECENT_VIBES.filter((v) => enabledIcons.has(v.Icon))
  const filteredMy = MY_REVIEWS.filter((v) => enabledIcons.has(v.Icon))
  const isFiltered = activeCategories.length < ALL_CATEGORY_IDS.length

  const carouselRef = useRef<HTMLDivElement>(null)
  const [carouselWidth, setCarouselWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 375)
  useEffect(() => {
    if (!carouselRef.current) return
    setCarouselWidth(carouselRef.current.clientWidth)
    const obs = new ResizeObserver(([e]) => setCarouselWidth(e.contentRect.width))
    obs.observe(carouselRef.current)
    return () => obs.disconnect()
  }, [])
  const colWidth = carouselWidth < 600
    ? (carouselWidth - 32) / 1.2   // ~80% on narrow screens, peek of second column
    : (carouselWidth - 32) / 2.1   // two columns on wider screens

  // Suppress unused warnings for hidden functionality
  void [addAuthor, removeAuthor, addBook, removeBook, handleSignOut, loading, results, BookSearch, CATEGORY_COLOR]

  return (
    <div className="h-screen bg-background">
      <PageHeader
        left={
          <div className="relative" ref={filterBtnRef}>
            <HeaderButton variant="default" onClick={() => setShowFilter((p) => !p)}>
              <FunnelIcon size={20} />
            </HeaderButton>
            {isFiltered && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-primary pointer-events-none" />
            )}
          </div>
        }
        right={
          <HeaderButton variant="primary" onClick={openVibeReview}>
            <PlusIcon size={20} />
          </HeaderButton>
        }
      />

      <div className="h-full overflow-y-scroll overscroll-contain touch-pan-y pt-16">
        <div className="max-w-2xl mx-auto w-full px-4 pb-40 pt-4 space-y-8">

          {/* Recents from friends */}
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              {t('vibes.recentFriendsVibes')}
            </h2>
            <div ref={carouselRef} className="overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden -mx-4 pl-4 snap-x snap-mandatory scroll-pl-4 pb-1" style={{ scrollbarWidth: 'none' } as React.CSSProperties}>
              <div className="flex gap-2 pr-4">
                {filteredRecent.length > 0 ? Array.from(
                  { length: Math.ceil(filteredRecent.length / 2) },
                  (_, i) => filteredRecent.slice(i * 2, i * 2 + 2)
                ).map((col, ci) => (
                  <div key={ci} className="flex flex-col gap-2 shrink-0 snap-start" style={{ width: colWidth }}>
                    {col.map((v) => (
                      <VibeItem key={v.id} {...v} onClick={() => openVibeDetail(v)} />
                    ))}
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground py-2 pl-0">{t('vibes.noVibesMatch')}</p>
                )}
              </div>
            </div>
          </section>

          {/* My last vibes */}
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              {t('vibes.meVibing')}
            </h2>
            <div className="overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden -mx-4 pl-4 snap-x snap-mandatory scroll-pl-4" style={{ scrollbarWidth: 'none' } as React.CSSProperties}>
              <div className="flex gap-2 pr-4">
                {(showAllReviews ? filteredMy : filteredMy.slice(0, 4)).length > 0 ? Array.from(
                  { length: Math.ceil((showAllReviews ? filteredMy : filteredMy.slice(0, 4)).length / 2) },
                  (_, i) => (showAllReviews ? filteredMy : filteredMy.slice(0, 4)).slice(i * 2, i * 2 + 2)
                ).map((col, ci) => (
                  <div key={ci} className="flex flex-col gap-2 shrink-0 snap-start" style={{ width: colWidth }}>
                    {col.map((v) => (
                      <VibeItem key={v.id} {...v} onClick={() => openVibeDetail(v)} />
                    ))}
                  </div>
                )) : null}
              </div>
            </div>
            {filteredMy.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">{t('vibes.noVibesMatch')}</p>
            )}
            {filteredMy.length > 4 && (
              <button
                onClick={() => setShowAllReviews((p) => !p)}
                className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
              >
                {showAllReviews ? t('vibes.showLess') : t('vibes.loadMore', { count: filteredMy.length - 4 })}
              </button>
            )}
          </section>

          {/* Categories */}
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              {t('vibes.browseCategories')}
            </h2>
            <div className="flex gap-4 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden -mx-4 px-4" style={{ scrollbarWidth: 'none' } as React.CSSProperties}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className="flex flex-col items-center gap-2 shrink-0"
                >
                  <div className="w-16 h-16 rounded-full bg-card border border-border/50 flex items-center justify-center transition-transform active:scale-95 hover:scale-105">
                    <cat.Icon size={22} color={CATEGORY_COLOR.get(cat.Icon)} weight="fill" />
                  </div>
                  <span className="text-xs font-medium w-16 text-center truncate">{t(`vibeCategory.${cat.id}`)}</span>
                </button>
              ))}
            </div>
          </section>

        </div>
      </div>

      <AnimatePresence>
        {showFilter && (
          <CategoryFilterPopup
            categories={CATEGORIES.map(c => ({ ...c, label: t(`vibeCategory.${c.id}`) }))}
            activeIds={activeCategories}
            onToggle={toggleCategory}
            onSelectAll={() => setActiveCategories(ALL_CATEGORY_IDS)}
            onClose={() => setShowFilter(false)}
            anchorRect={filterBtnRef.current?.getBoundingClientRect()}
          />
        )}
      </AnimatePresence>

    </div>
  )
}
