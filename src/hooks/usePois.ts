import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Database } from '../types/database'

export type POI = Database['public']['Tables']['pois']['Row']

export interface MapBounds {
  minLng: number
  maxLng: number
  minLat: number
  maxLat: number
}

export const usePois = () => {
  const [pois, setPois] = useState<POI[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPois = async (bounds?: MapBounds) => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('pois')
        .select('*')

      // Apply bounds filter if provided
      if (bounds) {
        query = query
          .gte('latitude', bounds.minLat)
          .lte('latitude', bounds.maxLat)
          .gte('longitude', bounds.minLng)
          .lte('longitude', bounds.maxLng)
      }

      const { data, error: supabaseError } = await query

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
