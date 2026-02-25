import { useState } from 'react'
import { supabase } from '../lib/supabase'

export interface POI {
  id: string
  name: string
  description?: string
  category?: string
  latitude: number
  longitude: number
  created_at?: string
  [key: string]: any
}

export const usePois = () => {
  const [pois, setPois] = useState<POI[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPois = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: supabaseError } = await supabase
        .from('poi')
        .select('*')

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
