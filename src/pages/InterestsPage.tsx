import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { Button } from '@/components/ui/button'
import { supabase } from '../lib/supabase'
import { X, Search, Loader2, BookOpen } from 'lucide-react'

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

// Book search scoped to a single author
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

export const InterestsPage = () => {
  const { session: _session } = useAuth()
  const { profile } = useProfile()

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
        const res = await fetch(
          `https://openlibrary.org/search/authors.json?q=${encodeURIComponent(trimmed)}&limit=6`
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
  }, [query])

  const addAuthor = (author: AuthorResult) => {
    if (selected.find((a) => a.key === author.key)) return
    setSelected((prev) => [...prev, { ...author, books: [] }])
    setQuery('')
    setResults([])
  }

  const removeAuthor = (key: string) => {
    setSelected((prev) => prev.filter((a) => a.key !== key))
  }

  const addBook = (authorKey: string, book: BookResult) => {
    setSelected((prev) =>
      prev.map((a) =>
        a.key === authorKey && !a.books.find((b) => b.key === book.key)
          ? { ...a, books: [...a.books, book] }
          : a
      )
    )
  }

  const removeBook = (authorKey: string, bookKey: string) => {
    setSelected((prev) =>
      prev.map((a) =>
        a.key === authorKey ? { ...a, books: a.books.filter((b) => b.key !== bookKey) } : a
      )
    )
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 bg-background border-b border-border px-4 py-4 z-10">
        <div className="max-w-2xl mx-auto w-full flex items-center">
          <h1 className="text-lg font-semibold">Interests</h1>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground">Welcome, {profile?.name} {profile?.surname}!</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <h2 className="text-sm font-semibold">Favourite Authors</h2>

            {/* Selected authors with nested book search */}
            {selected.map((author) => (
              <div key={author.key} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{author.name}</span>
                  <button onClick={() => removeAuthor(author.key)} className="hover:text-destructive">
                    <X size={14} />
                  </button>
                </div>

                {/* Selected books */}
                {author.books.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {author.books.map((book) => (
                      <span
                        key={book.key}
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted text-xs"
                      >
                        {book.title}
                        <button onClick={() => removeBook(author.key, book.key)} className="hover:text-destructive">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <BookSearch authorName={author.name} onAdd={(book) => addBook(author.key, book)} />
              </div>
            ))}

            {/* Author search input */}
            <div className="relative">
              <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-background focus-within:ring-1 focus-within:ring-ring">
                {loading
                  ? <Loader2 size={16} className="text-muted-foreground animate-spin shrink-0" />
                  : <Search size={16} className="text-muted-foreground shrink-0" />
                }
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search author..."
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                />
                {query && (
                  <button onClick={() => { setQuery(''); setResults([]) }}>
                    <X size={14} className="text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              {results.length > 0 && (
                <ul className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                  {results.map((author) => (
                    <li key={author.key}>
                      <button
                        onClick={() => addAuthor(author)}
                        className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors"
                      >
                        <p className="text-sm font-medium">{author.name}</p>
                        {author.top_work && (
                          <p className="text-xs text-muted-foreground truncate">{author.top_work}</p>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={handleSignOut} variant="destructive">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
