import { supabase } from '../lib/supabase'

export interface OmdbSearchResult {
  imdbID: string
  Title: string
  Year: string
  Type: 'movie' | 'series' | 'episode'
  Poster?: string
}

export interface OmdbDetails {
  imdbID: string
  Title: string
  Year: string
  Director?: string
  Writer?: string
  Network?: string
  Type: string
}

async function omdbInvoke<T>(params: URLSearchParams): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(`omdb-proxy?${params}`, {
    method: 'GET',
  })
  if (error) throw error
  return data as T
}

export async function searchMoviesTv(
  query: string,
  type: 'movie' | 'series',
): Promise<OmdbSearchResult[]> {
  const params = new URLSearchParams({ s: query, type })
  const json = await omdbInvoke<{ Response: string; Search?: OmdbSearchResult[] }>(params)
  if (json.Response === 'False') return []
  return json.Search ?? []
}

export async function fetchOmdbDetails(imdbID: string): Promise<OmdbDetails | null> {
  const params = new URLSearchParams({ i: imdbID })
  const json = await omdbInvoke<OmdbDetails & { Response: string }>(params)
  if ((json as any).Response === 'False') return null
  return json
}
