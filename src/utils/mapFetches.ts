import { MAP_CATEGORIES, EnumMapCategory } from '../components/map/mapCategories'
import type { PoiCategory } from '../components/map/mapCategories'

export type OverpassPoi = {
  id: number
  lat: number
  lon: number
  tags: Record<string, string>
}

export type MapboxFeature = {
  id: string
  properties: {
    name: string
    feature_type: string
    poi_category?: string[]
    poi_category_ids?: string[]
    full_address?: string
    place_formatted?: string
    distance?: number
  }
  geometry: { coordinates: [number, number] }
}

const OVERPASS_RADIUS_M = 100

const OVERPASS_QUERY = (lat: number, lng: number) =>
  `[out:json][timeout:10];(node["amenity"~"cafe|restaurant|fast_food|bar|pub|nightclub|bakery"]["name"](around:${OVERPASS_RADIUS_M},${lat},${lng});node["shop"="bakery"]["name"](around:${OVERPASS_RADIUS_M},${lat},${lng});node["tourism"~"hotel|hostel|guest_house|motel|attraction"]["name"](around:${OVERPASS_RADIUS_M},${lat},${lng}););out body;`

export const SEARCHBOX_CATEGORIES = [
  'coffee_shop', 'restaurant', 'fast_food_restaurant',
  'bar', 'pub', 'nightclub',
  'bakery',
  'hotel', 'hostel', 'motel',
  'museum', 'tourist_attraction',
].join(',')

export function getMapboxCategory(ids: string[] = []) {
  const c = ids.join(' ')
  if (c.includes('coffee') || c.includes('cafe')) return MAP_CATEGORIES.find((m) => m.id === EnumMapCategory.Coffee)
  if (c.includes('restaurant') || c.includes('fast_food')) return MAP_CATEGORIES.find((m) => m.id === EnumMapCategory.Food)
  if (c.includes('bar') || c.includes('pub') || c.includes('nightclub')) return MAP_CATEGORIES.find((m) => m.id === EnumMapCategory.Drink)
  if (c.includes('bakery')) return MAP_CATEGORIES.find((m) => m.id === EnumMapCategory.Bakery)
  if (c.includes('hotel') || c.includes('hostel') || c.includes('motel')) return MAP_CATEGORIES.find((m) => m.id === EnumMapCategory.Stay)
  if (c.includes('attraction') || c.includes('museum')) return MAP_CATEGORIES.find((m) => m.id === EnumMapCategory.Gem)
  return null
}

export function mapMapboxCategoryToPoiCategory(ids: string[] = []): PoiCategory | null {
  const cat = getMapboxCategory(ids)
  return cat?.id ?? null
}

export function getOsmCategory(tags: Record<string, string>) {
  const a = tags.amenity, s = tags.shop, t = tags.tourism
  if (a === 'cafe') return MAP_CATEGORIES.find((c) => c.id === EnumMapCategory.Coffee)
  if (a === 'restaurant' || a === 'fast_food') return MAP_CATEGORIES.find((c) => c.id === EnumMapCategory.Food)
  if (a === 'bar' || a === 'pub' || a === 'nightclub') return MAP_CATEGORIES.find((c) => c.id === EnumMapCategory.Drink)
  if (a === 'bakery' || s === 'bakery') return MAP_CATEGORIES.find((c) => c.id === EnumMapCategory.Bakery)
  if (t === 'hotel' || t === 'hostel' || t === 'guest_house' || t === 'motel') return MAP_CATEGORIES.find((c) => c.id === EnumMapCategory.Stay)
  if (t === 'attraction') return MAP_CATEGORIES.find((c) => c.id === EnumMapCategory.Gem)
  return null
}

export async function fetchNearbyOverpass(lat: number, lng: number): Promise<OverpassPoi[]> {
  const res = await fetch(
    `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(OVERPASS_QUERY(lat, lng))}`
  )
  if (!res.ok) throw new Error('Overpass error')
  const data = await res.json()
  return data.elements ?? []
}

export async function fetchNearbyMapbox(
  lat: number,
  lng: number,
  token: string,
  bbox = '',
): Promise<MapboxFeature[]> {
  const res = await fetch(
    `https://api.mapbox.com/search/searchbox/v1/category/${SEARCHBOX_CATEGORIES}?proximity=${lng},${lat}${bbox}&limit=10&access_token=${token}`
  )
  if (!res.ok) throw new Error('Mapbox fetch error')
  const data = await res.json()
  return data.features ?? []
}
