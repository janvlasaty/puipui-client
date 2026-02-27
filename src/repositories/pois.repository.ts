import { supabase } from '../lib/supabase'

export interface MapBounds {
  minLng: number
  maxLng: number
  minLat: number
  maxLat: number
}

export const getAllPois = () =>
  supabase.from('pois').select('*')

export const getPoisInBounds = (bounds: MapBounds) =>
  supabase
    .from('pois')
    .select('*')
    .gte('latitude', bounds.minLat)
    .lte('latitude', bounds.maxLat)
    .gte('longitude', bounds.minLng)
    .lte('longitude', bounds.maxLng)
