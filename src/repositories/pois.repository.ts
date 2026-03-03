import { supabase } from '../lib/supabase'

export interface MapBounds {
  minLng: number
  maxLng: number
  minLat: number
  maxLat: number
}

export const POIS_REQUEST_LIMIT = 1000 // Limit to prevent overload

export const getAllPois = () =>
  supabase
    .from('pois')
    .select('*')
    .order("created_at", { ascending: false })
    .limit(POIS_REQUEST_LIMIT)

export const getPoisInBounds = (bounds: MapBounds) =>
  supabase
    .from('pois')
    .select('*')
    .gte('latitude', bounds.minLat)
    .lte('latitude', bounds.maxLat)
    .gte('longitude', bounds.minLng)
    .lte('longitude', bounds.maxLng)
    .order("created_at", { ascending: false })
    .limit(POIS_REQUEST_LIMIT)