import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type PoiCategory = Database['public']['Enums']['type_poi_category']

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

export const findPoiByLocationAndName = async (
  latitude: number,
  longitude: number,
  name: string,
  category: PoiCategory
) => {
  // Check if a POI exists at the same location (within ~10m) with the same name and category
  const threshold = 0.0001 // roughly 10-20 meters
  return supabase
    .from('pois')
    .select('*')
    .gte('latitude', latitude - threshold)
    .lte('latitude', latitude + threshold)
    .gte('longitude', longitude - threshold)
    .lte('longitude', longitude + threshold)
    .eq('label', name)
    .eq('category', category)
    .limit(1)
    .single()
}

export const createPoi = async (
  name: string,
  category: PoiCategory,
  latitude: number,
  longitude: number
) => {
  return supabase
    .from('pois')
    .insert({
      label: name,
      category,
      latitude,
      longitude,
    })
    .select()
    .single()
}

export const createPoiReview = async (
  poiId: string,
  userId: string,
  emoji: string,
  note: string
) => {
  return supabase
    .from('pois_reviews')
    .insert({
      poi_id: poiId,
      user_id: userId,
      emoji,
      note,
    })
    .select()
    .single()
}

export const findOrCreatePoi = async (
  name: string,
  category: PoiCategory,
  latitude: number,
  longitude: number
) => {
  // First try to find existing POI
  const { data: existingPoi } = await findPoiByLocationAndName(
    latitude,
    longitude,
    name,
    category
  )

  if (existingPoi) {
    return { data: existingPoi, error: null }
  }

  // If not found, create new POI
  return createPoi(name, category, latitude, longitude)
}