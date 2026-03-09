import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import mapboxgl from 'mapbox-gl'
import type { Map as MapboxMap, LngLatLike } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useDataCache } from '../contexts/DataCacheContext'
import { getPoisInBounds, POIS_REQUEST_LIMIT } from '../repositories/pois.repository'
import { useToast } from '../contexts/ToastContext'
import { useTheme } from '../contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { PageHeader, HeaderButton } from '../components/PageHeader'
import { PlusIcon, FunnelIcon, NavigationArrowIcon, HashIcon, XIcon, MapPinIcon } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { CategoryFilterPopup } from '../components/CategoryFilterPopup'
import { EnumMapCategory, MAP_CATEGORIES, makeCategoryMarkerSvg } from '../components/map/mapCategories'
import { PoiPopup } from '../components/map/PoiPopup'

const ALL_CATEGORY_IDS = MAP_CATEGORIES.map((c) => c.id)

type OverpassPoi = {
  id: number
  lat: number
  lon: number
  tags: Record<string, string>
}

const OVERPASS_RADIUS_M = 100
const OVERPASS_QUERY = (lat: number, lng: number) =>
  `[out:json][timeout:10];(node["amenity"~"cafe|restaurant|fast_food|bar|pub|nightclub|bakery"]["name"](around:${OVERPASS_RADIUS_M},${lat},${lng});node["shop"="bakery"]["name"](around:${OVERPASS_RADIUS_M},${lat},${lng});node["tourism"~"hotel|hostel|guest_house|motel|attraction"]["name"](around:${OVERPASS_RADIUS_M},${lat},${lng}););out body;`

// POI from Mapbox Search Box v1 category endpoint
type MapboxFeature = {
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

const SEARCHBOX_CATEGORIES = [
  'coffee_shop', 'restaurant', 'fast_food_restaurant',
  'bar', 'pub', 'nightclub',
  'bakery',
  'hotel', 'hostel', 'motel',
  'museum', 'tourist_attraction',
].join(',')

function getMapboxCategory(ids: string[] = []) {
  const c = ids.join(' ')
  if (c.includes('coffee') || c.includes('cafe')) return MAP_CATEGORIES.find((m) => m.id === EnumMapCategory.Coffee)
  if (c.includes('restaurant') || c.includes('fast_food')) return MAP_CATEGORIES.find((m) => m.id === EnumMapCategory.Food)
  if (c.includes('bar') || c.includes('pub') || c.includes('nightclub')) return MAP_CATEGORIES.find((m) => m.id === EnumMapCategory.Drink)
  if (c.includes('bakery')) return MAP_CATEGORIES.find((m) => m.id === EnumMapCategory.Bakery)
  if (c.includes('hotel') || c.includes('hostel') || c.includes('motel')) return MAP_CATEGORIES.find((m) => m.id === EnumMapCategory.Stay)
  if (c.includes('attraction') || c.includes('museum')) return MAP_CATEGORIES.find((m) => m.id === EnumMapCategory.Gem)
  return null
}

// Unused for now - reserved for future OSM integration
// function _getOsmCategory(tags: Record<string, string>) {
//   const a = tags.amenity, s = tags.shop, t = tags.tourism
//   if (a === 'cafe') return MAP_CATEGORIES.find((c) => c.id === EnumMapCategory.Coffee)
//   if (a === 'restaurant' || a === 'fast_food') return MAP_CATEGORIES.find((c) => c.id === EnumMapCategory.Food)
//   if (a === 'bar' || a === 'pub' || a === 'nightclub') return MAP_CATEGORIES.find((c) => c.id === EnumMapCategory.Drink)
//   if (a === 'bakery' || s === 'bakery') return MAP_CATEGORIES.find((c) => c.id === EnumMapCategory.Bakery)
//   if (t === 'hotel' || t === 'hostel' || t === 'guest_house' || t === 'motel') return MAP_CATEGORIES.find((c) => c.id === EnumMapCategory.Stay)
//   if (t === 'attraction') return MAP_CATEGORIES.find((c) => c.id === EnumMapCategory.Gem)
//   return null
// }

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const MAP_STYLE_LIGHT = import.meta.env.VITE_MAPBOX_STYLE_LIGHT
const MAP_STYLE_DARK = import.meta.env.VITE_MAPBOX_STYLE_DARK

function computeIsDark(theme: string) {
  return (
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  )
}

export const MapPage = () => {
  const { poisCache, setPoisCache, setPoisLoading, isCacheStale } = useDataCache()
  const { showToast } = useToast()
  const { theme } = useTheme()

  // isDark reacts to both the theme setting and system preference changes
  const [isDark, setIsDark] = useState(() => computeIsDark(theme))

  useEffect(() => {
    setIsDark(computeIsDark(theme))
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setIsDark(computeIsDark('system'))
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  // State with localStorage persistence
  const [mapState, setMapState] = useState(() => {
    try {
      const stored = localStorage.getItem('mapState')
      return stored ? JSON.parse(stored) : { center: [14.43, 50.1], zoom: 13 }
    } catch {
      return { center: [14.43, 50.1], zoom: 13 }
    }
  })

  // Local state
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null)
  const [isCreatingPoi, setIsCreatingPoi] = useState(false)
  const [_nearbyOverpassPois, setNearbyOverpassPois] = useState<OverpassPoi[]>([])
  const [_isLoadingOverpass, setIsLoadingOverpass] = useState(false)
  const [nearbyMapboxPois, setNearbyMapboxPois] = useState<MapboxFeature[]>([])
  const [isLoadingMapbox, setIsLoadingMapbox] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const filterBtnRef = useRef<HTMLDivElement>(null)
  const [activeCategories, setActiveCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('map-filter')
      if (stored) return JSON.parse(stored)
    } catch {}
    return ALL_CATEGORY_IDS
  })
  const isFiltered = ALL_CATEGORY_IDS.some((id) => !activeCategories.includes(id))
  const toggleCategory = (id: string) =>
    setActiveCategories((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  // Refs
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const map = useRef<MapboxMap | null>(null)
  const fetchDebouncer = useRef<NodeJS.Timeout | null>(null)
  const mapReady = useRef(false)

  // Stable refs to avoid stale closures inside addLayersAndHandlers
  const isDarkRef = useRef(isDark)
  isDarkRef.current = isDark
  const fetchPoiDataRef = useRef<() => void>(() => {})
  const poisCacheRef = useRef(poisCache)
  poisCacheRef.current = poisCache
  const isCacheStaleRef = useRef(isCacheStale)
  isCacheStaleRef.current = isCacheStale
  const poisRef = useRef<typeof poisCache.data>([])
  const pois = poisCache.data || []
  poisRef.current = pois
  const activeCategoriesRef = useRef<string[]>([])
  activeCategoriesRef.current = activeCategories
  const isCreatingPoiRef = useRef(false)
  isCreatingPoiRef.current = isCreatingPoi
  const fetchNearbyOverpassRef = useRef<(lat: number, lng: number) => void>(() => {})
  const fetchNearbyMapboxRef = useRef<(lat: number, lng: number) => void>(() => {})
  const mapboxLoadedOnceRef = useRef(false)

  // Persist map state to localStorage
  useEffect(() => {
    localStorage.setItem('mapState', JSON.stringify(mapState))
  }, [mapState])

  useEffect(() => {
    localStorage.setItem('map-filter', JSON.stringify(activeCategories))
  }, [activeCategories])

  useEffect(() => {
    if (isCreatingPoi && map.current) {
      const center = map.current.getCenter()
      fetchNearbyMapboxRef.current(center.lat, center.lng)
    } else {
      setNearbyMapboxPois([])
      setIsLoadingMapbox(false)
      mapboxLoadedOnceRef.current = false
    }
  }, [isCreatingPoi])

  // Fetch POIs based on map bounds
  const fetchPoiData = useCallback(() => {
    if (!map.current) return
    const mapBounds = map.current.getBounds()
    if (!mapBounds) return

    setPoisLoading(true)
    const latPad = (mapBounds.getNorth() - mapBounds.getSouth()) / 2
    const lngPad = (mapBounds.getEast() - mapBounds.getWest()) / 2
    const bounds = {
      minLng: mapBounds.getWest() - lngPad,
      maxLng: mapBounds.getEast() + lngPad,
      minLat: mapBounds.getSouth() - latPad,
      maxLat: mapBounds.getNorth() + latPad,
    }

    getPoisInBounds(bounds).then(({ data, error }) => {
      if (error) {
        console.error('Error fetching POIs:', error)
        setPoisCache([], error)
      } else {
        setPoisCache(data || [])
        if (data?.length === POIS_REQUEST_LIMIT) {
          showToast('Zoom in to see more places... 🫢')
        }
      }
    })
  }, [setPoisCache, setPoisLoading])

  fetchPoiDataRef.current = fetchPoiData

  const fetchNearbyOverpass = useCallback(async (lat: number, lng: number) => {
    setIsLoadingOverpass(true)
    try {
      const res = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(OVERPASS_QUERY(lat, lng))}`
      )
      if (!res.ok) throw new Error('Overpass error')
      const data = await res.json()
      setNearbyOverpassPois(data.elements ?? [])
    } catch (e) {
      console.error('Overpass fetch error:', e)
      setNearbyOverpassPois([])
    } finally {
      setIsLoadingOverpass(false)
    }
  }, [])

  fetchNearbyOverpassRef.current = fetchNearbyOverpass

  const fetchNearbyMapbox = useCallback(async (lat: number, lng: number) => {
    setIsLoadingMapbox(true)
    try {
      const bounds = map.current?.getBounds()
      const bbox = bounds
        ? `&bbox=${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`
        : ''
      const res = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/category/${SEARCHBOX_CATEGORIES}?proximity=${lng},${lat}${bbox}&limit=10&access_token=${MAPBOX_TOKEN}`
      )
      if (!res.ok) throw new Error('Mapbox fetch error')
      const data = await res.json()
      setNearbyMapboxPois(data.features ?? [])
    } catch (e) {
      console.error('Mapbox fetch error:', e)
      setNearbyMapboxPois([])
    } finally {
      mapboxLoadedOnceRef.current = true
      setIsLoadingMapbox(false)
    }
  }, [])

  fetchNearbyMapboxRef.current = fetchNearbyMapbox

  // Add POI image, source, layers, and event handlers to the map.
  // Called on initial load and again after a style change (setStyle wipes everything).
  const addLayersAndHandlers = useCallback(() => {
    const m = map.current
    if (!m) return

    const dark = isDarkRef.current

    const imageLoads = MAP_CATEGORIES.map((cat) =>
      new Promise<void>((resolve) => {
        const img = new Image(56, 72)
        img.onload = () => {
          if (map.current) map.current.addImage(`poi-marker-${cat.id}`, img, { pixelRatio: 2 })
          resolve()
        }
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(makeCategoryMarkerSvg(cat))
      })
    )

    Promise.all(imageLoads).then(() => {
      if (!map.current) return

      // Dimmed (filtered-out) POIs — grey dots, no clustering, rendered below active layer
      map.current.addSource('pois-dim', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.current.addLayer({
        id: 'pois-dim-layer',
        type: 'circle',
        source: 'pois-dim',
        paint: {
          'circle-radius': 3,
          'circle-color': '#9CA3AF',
          'circle-opacity': 0.5,
        },
      })

      map.current.addSource('pois', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 35,
      })

      // Cluster circles
      map.current.addLayer({
        id: 'pois-clusters',
        type: 'circle',
        source: 'pois',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#fbbf24',
          'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 50, 30],
          'circle-stroke-width': 2,
          'circle-stroke-color': dark ? '#111827' : '#ffffff',
        },
      })

      // Cluster count labels
      map.current.addLayer({
        id: 'pois-cluster-count',
        type: 'symbol',
        source: 'pois',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 16,
          'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
        },
        paint: { 'text-color': dark ? '#111827' : '#ffffff' },
      })

      // Individual points as pin markers
      map.current.addLayer({
        id: 'pois-layer',
        type: 'symbol',
        source: 'pois',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'icon-image': [
            'match', ['get', 'category'],
            ...MAP_CATEGORIES.flatMap((cat) => [cat.id, `poi-marker-${cat.id}`]),
            `poi-marker-${MAP_CATEGORIES[0].id}`,
          ],
          'icon-size': 1,
          'icon-anchor': 'bottom',
          'icon-allow-overlap': true,
        },
      })

      map.current.on('click', 'pois-clusters', (e) => {
        const feature = e.features?.[0]
        if (!feature) return
        const clusterId = feature.properties?.cluster_id
        const source = map.current!.getSource('pois') as mapboxgl.GeoJSONSource
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom == null) return
          map.current!.easeTo({
            center: (feature.geometry as GeoJSON.Point).coordinates as [number, number],
            zoom,
          })
        })
      })

      map.current.on('click', 'pois-layer', (e) => {
        const feature = e.features?.[0]
        if (feature) setSelectedPoiId(feature.properties?.id ?? null)
      })

      map.current.on('mouseenter', 'pois-clusters', () => {
        map.current!.getCanvas().style.cursor = 'pointer'
      })
      map.current.on('mouseleave', 'pois-clusters', () => {
        map.current!.getCanvas().style.cursor = ''
      })
      map.current.on('mouseenter', 'pois-layer', () => {
        map.current!.getCanvas().style.cursor = 'pointer'
      })
      map.current.on('mouseleave', 'pois-layer', () => {
        map.current!.getCanvas().style.cursor = ''
      })

      // Repopulate with already-loaded POIs (important after a style change)
      if (poisRef.current?.length) {
        const active = new Set(activeCategoriesRef.current)
        const activePois = poisRef.current.filter((p) => active.has(p.category))
        const dimPois = poisRef.current.filter((p) => !active.has(p.category))

        const source = map.current.getSource('pois') as mapboxgl.GeoJSONSource
        source.setData({
          type: 'FeatureCollection',
          features: activePois.map((poi) => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [poi.longitude, poi.latitude] },
            properties: { id: poi.id, label: poi.label, category: poi.category },
          })),
        })

        const dimSource = map.current.getSource('pois-dim') as mapboxgl.GeoJSONSource
        dimSource.setData({
          type: 'FeatureCollection',
          features: dimPois.map((poi) => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [poi.longitude, poi.latitude] },
            properties: { id: poi.id },
          })),
        })
      }

      // Fetch fresh data if cache is missing or stale
      const cache = poisCacheRef.current
      if (!cache.data || isCacheStaleRef.current(cache.lastFetched)) {
        fetchPoiDataRef.current()
      }
    })
  }, [])

  // Initialize map (once)
  useEffect(() => {
    if (!mapContainer.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: computeIsDark(theme) ? MAP_STYLE_DARK : MAP_STYLE_LIGHT,
      center: mapState.center as LngLatLike,
      zoom: mapState.zoom,
      maxZoom: 18,
      minZoom: 6,
      minPitch: 0,
      maxPitch: 0,
      dragRotate: false,
      attributionControl: false,
    })

    map.current.on('load', () => {
      mapReady.current = true
      addLayersAndHandlers()
    })

    map.current.on('movestart', () => {
      if (fetchDebouncer.current) clearTimeout(fetchDebouncer.current)
      fetchDebouncer.current = setInterval(() => {
        fetchPoiDataRef.current()
      }, 500)
    })

    map.current.on('moveend', () => {
      if (fetchDebouncer.current) clearTimeout(fetchDebouncer.current)
      setTimeout(() => {
        fetchPoiDataRef.current()
      }, 100)
      if (map.current) {
        const center = map.current.getCenter()
        setMapState({ center: [center.lng, center.lat], zoom: map.current.getZoom() })
        if (isCreatingPoiRef.current) {
          fetchNearbyMapboxRef.current(center.lat, center.lng)
        }
      }
    })

    map.current.addControl(new mapboxgl.AttributionControl(), 'bottom-right')

    // Prevent attribution links from opening Safari in-app browser on iOS PWA.
    const container = mapContainer.current
    const preventExternalLinks = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href]')
      if (anchor) e.preventDefault()
    }
    container.addEventListener('click', preventExternalLinks, true)

    return () => {
      mapReady.current = false
      if (fetchDebouncer.current) clearTimeout(fetchDebouncer.current)
      if (map.current) map.current.remove()
      container.removeEventListener('click', preventExternalLinks, true)
    }
  }, [])

  // Switch map style when dark mode changes
  useEffect(() => {
    if (!mapReady.current || !map.current) return
    map.current.setStyle(isDark ? MAP_STYLE_DARK : MAP_STYLE_LIGHT)
    map.current.once('style.load', addLayersAndHandlers)
  }, [isDark, addLayersAndHandlers])

  // Sync POIs to GeoJSON sources, split by active filter categories
  useEffect(() => {
    const source = map.current?.getSource('pois') as mapboxgl.GeoJSONSource | undefined
    const dimSource = map.current?.getSource('pois-dim') as mapboxgl.GeoJSONSource | undefined
    if (!source || !dimSource) return

    const active = new Set(activeCategories)
    const activePois = pois.filter((poi) => active.has(poi.category))
    const dimPois = pois.filter((poi) => !active.has(poi.category))

    source.setData({
      type: 'FeatureCollection',
      features: activePois.map((poi) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [poi.longitude, poi.latitude] },
        properties: { id: poi.id, label: poi.label, category: poi.category },
      })),
    })

    dimSource.setData({
      type: 'FeatureCollection',
      features: dimPois.map((poi) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [poi.longitude, poi.latitude] },
        properties: { id: poi.id },
      })),
    })
  }, [pois, activeCategories])

  // Handle create new POI
  const handleCreateNew = () => {
    setIsCreatingPoi(true)
  }

  const handleCreateHere = async () => {
    if (!map.current) return

    const center = map.current.getCenter()
    console.log('Creating POI at:', center)

    handleCancel()
    alert(`New POI would be created at ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`)
  }

  const handleCancel = () => {
    setIsCreatingPoi(false)
  }

  const handleLocateMe = () => {
    if (!map.current) return
    setIsLocating(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        map.current?.flyTo({
          center: [longitude, latitude],
          zoom: 15,
          duration: 1000,
        })
        setIsLocating(false)
      },
      (error) => {
        console.error('Error getting location:', error)
        setIsLocating(false)
      }
    )
  }

  const selectedPoi = pois?.find((poi) => poi.id === selectedPoiId)

  return (
    <div className="fixed inset-0 w-full h-full bg-background">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full z-0" />

      <PageHeader
        left={
          !isCreatingPoi && (
            <div className="flex gap-2" ref={filterBtnRef}>
              <HeaderButton variant="default" onClick={() => setShowFilter((p) => !p)}>
                <FunnelIcon size={20} />
              </HeaderButton>
              {isFiltered && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-primary pointer-events-none" />
              )}
              <HeaderButton onClick={handleLocateMe} disabled={isLocating} className="md:hidden">
                <HashIcon size={20} />
              </HeaderButton>
              <HeaderButton onClick={handleLocateMe} disabled={isLocating} className="md:hidden">
                <NavigationArrowIcon size={20} />
              </HeaderButton>
            </div>
          )
        }
        right={
          !isCreatingPoi && (
            <div className="flex gap-2">
              <HeaderButton onClick={handleCreateNew} variant="primary">
                <PlusIcon size={20} />
              </HeaderButton>
            </div>
          )
        }
      />

      {poisCache.error && (
        <div className="fixed bottom-24 left-4 right-4 z-10 bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive font-semibold">Error: {poisCache.error.message}</p>
        </div>
      )}

      {/* Selected POI Popup */}
      <AnimatePresence>
        {selectedPoiId && selectedPoi && (
          <PoiPopup poi={selectedPoi} onClose={() => setSelectedPoiId(null)} />
        )}
      </AnimatePresence>

      {/* Center Crosshair - Fixed when creating POI */}
      {isCreatingPoi && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-20 pointer-events-none flex flex-col items-center">
          <div className="animate-bounce">
            <MapPinIcon size={40} weight="fill" className="text-primary drop-shadow-md" />
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute w-10 h-10 rounded-full border-2 border-primary animate-ping opacity-30" />
            <div className="w-2 h-2 rounded-full bg-primary/40 blur-[2px]" />
          </div>
        </div>
      )}

      <AnimatePresence>
        {showFilter && (
          <CategoryFilterPopup
            categories={MAP_CATEGORIES}
            activeIds={activeCategories}
            onToggle={toggleCategory}
            onSelectAll={() => setActiveCategories(ALL_CATEGORY_IDS)}
            onClose={() => setShowFilter(false)}
            anchorRect={filterBtnRef.current?.getBoundingClientRect()}
          />
        )}
      </AnimatePresence>

      {/* Create POI sheet — portalled to body to escape stacking context */}
      {createPortal(
        <AnimatePresence>
          {isCreatingPoi && (
            <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32, mass: 0.8 }}
          >
              <div className="w-full max-w-2xl bg-background rounded-t-2xl shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Venues nearby
                    {/* <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-muted text-foreground">
                      {nearbyMapboxPois.length}
                    </span> */}
                    {isLoadingMapbox && <span className="inline-block w-2.5 h-2.5 border-[1.5px] border-current border-t-transparent rounded-full animate-spin" />}
                  </h3>
                  <button onClick={handleCancel} className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground">
                    <XIcon size={16} />
                  </button>
                </div>

                {/* Static-height venue list */}
                <div className="h-42 overflow-y-auto divide-y divide-border/30 px-2">
                  {!mapboxLoadedOnceRef.current && isLoadingMapbox ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
                        <div className="w-5 h-5 rounded-full bg-muted shrink-0" />
                        <div className="h-3 bg-muted rounded-full flex-1" />
                        <div className="h-6 w-14 bg-muted rounded-full shrink-0" />
                      </div>
                    ))
                  ) : nearbyMapboxPois.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs text-muted-foreground">No existing venues nearby</p>
                    </div>
                  ) : (
                    nearbyMapboxPois.map((poi) => {
                      const cat = getMapboxCategory(poi.properties.poi_category_ids ?? poi.properties.poi_category)
                      return (
                        <div key={poi.id} className="flex items-center gap-3 px-4 py-2.5">
                          {cat ? (
                            <cat.Icon size={20} weight="fill" color={cat.color} className="shrink-0" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-muted shrink-0" />
                          )}
                          <span className="text-sm font-medium flex-1 truncate">{poi.properties.name}</span>
                          <button className="shrink-0 text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors">
                            Select
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Create here */}
                <div className="px-6 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                  <Button onClick={handleCreateHere} className="w-full bg-primary text-white flex items-center gap-2">
                    <MapPinIcon size={18} weight="fill" />
                    Create new venue here
                  </Button>
                </div>
              </div>
          </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
