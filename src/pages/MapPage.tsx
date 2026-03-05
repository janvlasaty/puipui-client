import { useState, useEffect, useRef, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import type { Map as MapboxMap, LngLatLike } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useDataCache } from '../contexts/DataCacheContext'
import { getPoisInBounds, POIS_REQUEST_LIMIT } from '../repositories/pois.repository'
import { useToast } from '../contexts/ToastContext'
import { useTheme } from '../contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { PageHeader, HeaderButton } from '../components/PageHeader'
import { PlusIcon, FunnelIcon, NavigationArrowIcon } from '@phosphor-icons/react'
import { AnimatePresence } from 'framer-motion'
import { VibeFilterPopup } from '../components/vibes/VibeFilterPopup'
import { MAP_CATEGORIES, makeCategoryMarkerSvg } from '../components/map/mapCategories'
import { PoiPopup } from '../components/map/PoiPopup'

const ALL_CATEGORY_IDS = MAP_CATEGORIES.map((c) => c.id)

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
  const [isLocating, setIsLocating] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
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

  // Persist map state to localStorage
  useEffect(() => {
    localStorage.setItem('mapState', JSON.stringify(mapState))
  }, [mapState])

  useEffect(() => {
    localStorage.setItem('map-filter', JSON.stringify(activeCategories))
  }, [activeCategories])

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
      }
    })

    map.current.addControl(new mapboxgl.AttributionControl(), 'top-right')

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
            <div className="relative">
              <HeaderButton variant="default" onClick={() => setShowFilter((p) => !p)}>
                <FunnelIcon size={20} />
              </HeaderButton>
              {isFiltered && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-primary pointer-events-none" />
              )}
            </div>
          )
        }
        right={
          !isCreatingPoi && (
            <div className="flex gap-2">
              <HeaderButton onClick={handleLocateMe} disabled={isLocating} className="md:hidden">
                <NavigationArrowIcon size={20} />
              </HeaderButton>
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
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="w-12 h-12 rounded-full border-2 border-red-500 flex items-center justify-center">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
          </div>
        </div>
      )}

      <AnimatePresence>
        {showFilter && (
          <VibeFilterPopup
            categories={MAP_CATEGORIES}
            activeIds={activeCategories}
            onToggle={toggleCategory}
            onSelectAll={() => setActiveCategories(ALL_CATEGORY_IDS)}
            onClose={() => setShowFilter(false)}
          />
        )}
      </AnimatePresence>

      {/* Create POI confirm/cancel */}
      {isCreatingPoi && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
          <Button onClick={handleCancel} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleCreateHere} className="bg-red-500 hover:bg-red-600">
            Create here
          </Button>
        </div>
      )}
    </div>
  )
}
