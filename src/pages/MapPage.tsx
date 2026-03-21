import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import mapboxgl from 'mapbox-gl'
import type { Map as MapboxMap, LngLatLike } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useDataCache } from '../contexts/DataCacheContext'
import { getPoisInBounds, POIS_REQUEST_LIMIT } from '../repositories/pois.repository'
import { useToast } from '../contexts/ToastContext'
import { useTheme } from '../contexts/ThemeContext'
import { PageHeader, HeaderButton } from '../components/PageHeader'
import { PlusIcon, XIcon, FunnelIcon, NavigationArrowIcon, MapPinIcon } from '@phosphor-icons/react'
import { AnimatePresence } from 'framer-motion'
import { CategoryFilterPopup } from '../components/CategoryFilterPopup'
import { MAP_CATEGORIES } from '../components/map/mapCategories'
import { PoiPopup } from '../components/map/PoiPopup'
import { useMapLayers } from '../hooks/useMapLayers'
import { useOverlay } from '../contexts/OverlayContext'
import { fetchNearbyMapbox } from '../utils/mapFetches'
import type { MapboxFeature } from '../utils/mapFetches'

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
  const { t } = useTranslation()
  const { poisCache, setPoisCache, setPoisLoading, isCacheStale } = useDataCache()
  const { showToast } = useToast()
  const { theme } = useTheme()

  const [isDark, setIsDark] = useState(() => computeIsDark(theme))

  useEffect(() => {
    setIsDark(computeIsDark(theme))
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setIsDark(computeIsDark('system'))
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const [mapState, setMapState] = useState(() => {
    try {
      const stored = localStorage.getItem('mapState')
      return stored ? JSON.parse(stored) : { center: [14.43, 50.1], zoom: 13 }
    } catch {
      return { center: [14.43, 50.1], zoom: 13 }
    }
  })

  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null)
  const [isCreatingPoi, setIsCreatingPoi] = useState(false)
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
  const mapboxLoadedOnceRef = useRef(false)

  // Stable refs to avoid stale closures
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
  const loadNearbyMapboxRef = useRef<(lat: number, lng: number) => void>(() => {})

  useEffect(() => {
    localStorage.setItem('mapState', JSON.stringify(mapState))
  }, [mapState])

  useEffect(() => {
    localStorage.setItem('map-filter', JSON.stringify(activeCategories))
  }, [activeCategories])

  useEffect(() => {
    if (isCreatingPoi && map.current) {
      const center = map.current.getCenter()
      loadNearbyMapboxRef.current(center.lat, center.lng)
    } else {
      setNearbyMapboxPois([])
      setIsLoadingMapbox(false)
      mapboxLoadedOnceRef.current = false
    }
  }, [isCreatingPoi])

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
          showToast(t('map.zoomIn'))
        }
      }
    })
  }, [setPoisCache, setPoisLoading])

  fetchPoiDataRef.current = fetchPoiData

  const loadNearbyMapbox = useCallback(async (lat: number, lng: number) => {
    setIsLoadingMapbox(true)
    try {
      const bounds = map.current?.getBounds()
      const bbox = bounds
        ? `&bbox=${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`
        : ''
      const features = await fetchNearbyMapbox(lat, lng, MAPBOX_TOKEN, bbox)
      setNearbyMapboxPois(features)
    } catch (e) {
      console.error('Mapbox fetch error:', e)
      setNearbyMapboxPois([])
    } finally {
      mapboxLoadedOnceRef.current = true
      setIsLoadingMapbox(false)
    }
  }, [])

  loadNearbyMapboxRef.current = loadNearbyMapbox

  const addLayersAndHandlers = useMapLayers({
    mapRef: map,
    setSelectedPoiId,
    isDarkRef,
    poisRef,
    activeCategoriesRef,
    fetchPoiDataRef,
    isCacheStaleRef,
    poisCacheRef,
  })

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
      fetchDebouncer.current = setInterval(() => fetchPoiDataRef.current(), 500)
    })

    map.current.on('moveend', () => {
      if (fetchDebouncer.current) clearTimeout(fetchDebouncer.current)
      setTimeout(() => fetchPoiDataRef.current(), 100)
      if (map.current) {
        const center = map.current.getCenter()
        setMapState({ center: [center.lng, center.lat], zoom: map.current.getZoom() })
        if (isCreatingPoiRef.current) loadNearbyMapboxRef.current(center.lat, center.lng)
      }
    })

    map.current.addControl(new mapboxgl.AttributionControl(), 'bottom-right')

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
    const source    = map.current?.getSource('pois')     as mapboxgl.GeoJSONSource | undefined
    const dimSource = map.current?.getSource('pois-dim') as mapboxgl.GeoJSONSource | undefined
    if (!source || !dimSource) return

    const active    = new Set(activeCategories)
    const activePois = pois.filter((poi) =>  active.has(poi.category))
    const dimPois    = pois.filter((poi) => !active.has(poi.category))

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

  const { openPoiSheet, updatePoiSheet, closePoiSheet } = useOverlay()

  const handleCancel = () => {
    setIsCreatingPoi(false)
    closePoiSheet()
  }

  const handleCreateHere = async () => {
    if (!map.current) return
    const center = map.current.getCenter()
    console.log('Creating POI at:', center)
    fetchPoiData()
  }

  const handleCreateNew = () => {
    setIsCreatingPoi(true)
    openPoiSheet({
      nearbyPois: nearbyMapboxPois,
      isLoading: isLoadingMapbox,
      hasLoadedOnce: mapboxLoadedOnceRef.current,
      centerLat: map.current?.getCenter().lat ?? mapState.center[1],
      centerLng: map.current?.getCenter().lng ?? mapState.center[0],
      onCancel: handleCancel,
      onSuccess: handleCreateHere,
    })
  }

  useEffect(() => {
    if (isCreatingPoi) {
      updatePoiSheet({
        nearbyPois: nearbyMapboxPois,
        isLoading: isLoadingMapbox,
        hasLoadedOnce: mapboxLoadedOnceRef.current,
      })
    }
  }, [isCreatingPoi, nearbyMapboxPois, isLoadingMapbox])

  const handleLocateMe = () => {
    if (!map.current) return
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        map.current?.flyTo({ center: [coords.longitude, coords.latitude], zoom: 15, duration: 1000 })
        setIsLocating(false)
      },
      (error) => {
        console.error('Error getting location:', error)
        setIsLocating(false)
      },
    )
  }

  const selectedPoi = pois?.find((poi) => poi.id === selectedPoiId)

  return (
    <div className="fixed inset-0 w-full h-full bg-background">
      <div ref={mapContainer} className="w-full h-full z-0" />

      <PageHeader
        left={
          <div className="flex gap-2" ref={filterBtnRef}>
            <HeaderButton variant="default" onClick={() => setShowFilter((p) => !p)}>
              <FunnelIcon size={20} />
            </HeaderButton>
            {isFiltered && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-primary pointer-events-none" />
            )}
            <HeaderButton onClick={handleLocateMe} disabled={isLocating} className="md:hidden">
              <NavigationArrowIcon size={20} />
            </HeaderButton>
          </div>
        }
        right={
          isCreatingPoi ? (
            <HeaderButton onClick={handleCancel} variant="default">
              <XIcon size={20} />
            </HeaderButton>
          ) : (
            <HeaderButton onClick={handleCreateNew} variant="primary">
              <PlusIcon size={20} />
            </HeaderButton>
          )
        }
      />

      {poisCache.error && (
        <div className="fixed bottom-24 left-4 right-4 z-10 bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive font-semibold">Error: {poisCache.error.message}</p>
        </div>
      )}

      <AnimatePresence>
        {selectedPoiId && selectedPoi && (
          <PoiPopup poi={selectedPoi} onClose={() => setSelectedPoiId(null)} />
        )}
      </AnimatePresence>

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
            categories={MAP_CATEGORIES.map(c => ({ ...c, label: t(`mapCategory.${c.id}`) }))}
            activeIds={activeCategories}
            onToggle={toggleCategory}
            onSelectAll={() => setActiveCategories(ALL_CATEGORY_IDS)}
            onClose={() => setShowFilter(false)}
            anchorRect={filterBtnRef.current?.getBoundingClientRect()}
          />
        )}
      </AnimatePresence>

    </div>
  )
}
