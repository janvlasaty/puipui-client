import { useState, useEffect, useRef } from 'react'
import { XIcon, CircleNotchIcon, BookOpenIcon } from '@phosphor-icons/react'

export interface AuthorResult {
  key: string
  name: string
  top_work?: string
}

export interface BookResult {
  key: string
  title: string
  first_publish_year?: number
}

export interface SelectedAuthor {
  key: string
  name: string
  books: BookResult[]
}

export const BookSearch = ({
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
          ? <CircleNotchIcon size={14} className="text-muted-foreground animate-spin shrink-0" />
          : <BookOpenIcon size={14} className="text-muted-foreground shrink-0" />
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
            <XIcon size={13} className="text-muted-foreground hover:text-foreground" />
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
