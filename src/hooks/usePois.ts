import { useState } from 'react'
import { Database } from '../types/database'
import { getPoisInBounds, getAllPois, type MapBounds } from '../repositories/pois.repository'

export type POI = Database['public']['Tables']['pois']['Row']
export type { MapBounds }

export const usePois = () => {
  const [pois, setPois] = useState<POI[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPois = async (bounds?: MapBounds) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: supabaseError } = await (bounds ? getPoisInBounds(bounds) : getAllPois())

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      setPois(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch POIs'
      setError(message)
      setPois([])
    } finally {
      setLoading(false)
    }
  }

  return { pois, loading, error, fetchPois }
}
