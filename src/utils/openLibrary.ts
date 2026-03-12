export interface BookResult {
  key: string
  title: string
  author_name?: string[]
  first_publish_year?: number
  isbn?: string
}

const LATIN_RE = /^[A-Za-z\s\-'.,]+$/

function isLatin(name: string): boolean {
  return LATIN_RE.test(name)
}

/** Convert "Surname, Given" → "Given Surname", leave others unchanged */
function normalizeNameOrder(name: string): string {
  const commaMatch = name.match(/^([^,]+),\s*(.+)$/)
  return commaMatch ? `${commaMatch[2]} ${commaMatch[1]}` : name
}

function isMixedCase(name: string): boolean {
  return name !== name.toUpperCase() && name !== name.toLowerCase()
}

/** Among latin names prefer: mixed-case no-comma > all-caps no-comma > mixed-case comma > rest */
function pickBestLatinName(candidates: string[]): string | undefined {
  const latin = candidates.filter(isLatin)
  if (!latin.length) return undefined

  const pick = (list: string[]) => list.find(Boolean)

  return (
    pick(latin.filter((n) => !n.includes(',') && isMixedCase(n))) ??
    pick(latin.filter((n) => !n.includes(',')).map(normalizeNameOrder)) ??
    pick(latin.filter((n) => isMixedCase(n)).map(normalizeNameOrder)) ??
    normalizeNameOrder(latin[0])
  )
}

async function resolveAuthorName(authorKey: string, searchNames: string[]): Promise<string> {
  const latinFromSearch = pickBestLatinName(searchNames) ?? searchNames[0]
  try {
    // authorKey is a full path like /authors/OL382524A
    const res = await fetch(`https://openlibrary.org${authorKey}.json`)
    if (!res.ok) return latinFromSearch
    const json = await res.json()

    // personal_name is the most reliable canonical form (e.g. "Surname, Given")
    if (json.personal_name && isLatin(json.personal_name as string)) {
      return normalizeNameOrder(json.personal_name as string)
    }

    const candidates: string[] = [
      ...(json.name ? [json.name as string] : []),
      ...(json.alternate_names ?? []),
      ...searchNames,
    ]
    const latinCandidates = candidates.filter(isLatin)
    console.log('[openLibrary] latin candidates for', authorKey, latinCandidates)
    return pickBestLatinName(candidates) ?? latinFromSearch
  } catch {
    return latinFromSearch
  }
}

export async function searchBooks(query: string): Promise<BookResult[]> {
  const res = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=title,author_name,key,first_publish_year,author_key,isbn_10`
  )
  const json = await res.json()
  const docs: (BookResult & { author_key?: string[]; isbn_10?: string[] })[] = json.docs ?? []

  return Promise.all(
    docs.map(async (doc) => {
      const authorKey = doc.author_key?.[0]
      const isbn = doc.isbn_10?.[0]

      let result: BookResult = { ...doc, isbn }

      if (authorKey && doc.author_name?.length) {
        const resolved = await resolveAuthorName(authorKey, doc.author_name)
        result = { ...result, author_name: [resolved, ...(doc.author_name?.slice(1) ?? [])] }
      }

      return result
    })
  )
}
