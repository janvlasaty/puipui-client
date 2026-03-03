import { useState, useEffect, useRef, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import type { Map as MapboxMap, LngLatLike } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useDataCache } from '../contexts/DataCacheContext'
import { getPoisInBounds, POIS_REQUEST_LIMIT } from '../repositories/pois.repository'
import { useToast } from '../contexts/ToastContext'
import { useTheme } from '../contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { X, Plus, Crosshair } from 'lucide-react'

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

  // Refs
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const map = useRef<MapboxMap | null>(null)
  const fetchDebouncer = useRef<NodeJS.Timeout | null>(null)
  const mapReady = useRef(false)

  // Stable refs to avoid stale closures inside addLayersAndHandlers
  const fetchPoiDataRef = useRef<() => void>(() => {})
  const poisCacheRef = useRef(poisCache)
  poisCacheRef.current = poisCache
  const isCacheStaleRef = useRef(isCacheStale)
  isCacheStaleRef.current = isCacheStale
  const poisRef = useRef<typeof poisCache.data>([])
  const pois = poisCache.data || []
  poisRef.current = pois

  // Persist map state to localStorage
  useEffect(() => {
    localStorage.setItem('mapState', JSON.stringify(mapState))
  }, [mapState])

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

    const markerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 1C7.373 1 2 6.373 2 13c0 8.5 12 22 12 22S26 21.5 26 13C26 6.373 20.627 1 14 1z" fill="#fbbf24" stroke="#ffffff" stroke-width="2.5"/>
      <circle cx="14" cy="13" r="5" fill="#ffffff"/>
    </svg>`

    const markerImg = new Image(28, 36)
    markerImg.onload = () => {
      if (!map.current) return

      map.current.addImage('poi-marker', markerImg)

      map.current.addSource('pois', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
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
          'circle-stroke-color': '#ffffff',
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
          'text-size': 12,
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        },
        paint: { 'text-color': '#ffffff' },
      })

      // Individual points as pin markers
      map.current.addLayer({
        id: 'pois-layer',
        type: 'symbol',
        source: 'pois',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'icon-image': 'poi-marker',
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
        const source = map.current.getSource('pois') as mapboxgl.GeoJSONSource
        source.setData({
          type: 'FeatureCollection',
          features: (poisRef.current || []).map((poi) => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [poi.longitude, poi.latitude] },
            properties: { id: poi.id, label: poi.label },
          })),
        })
      }

      // Fetch fresh data if cache is missing or stale
      const cache = poisCacheRef.current
      if (!cache.data || isCacheStaleRef.current(cache.lastFetched)) {
        fetchPoiDataRef.current()
      }
    }
    markerImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markerSvg)
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

  // Sync POIs to GeoJSON source
  useEffect(() => {
    const source = map.current?.getSource('pois') as mapboxgl.GeoJSONSource | undefined
    if (!source) return

    source.setData({
      type: 'FeatureCollection',
      features: pois.map((poi) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [poi.longitude, poi.latitude] },
        properties: { id: poi.id, label: poi.label },
      })),
    })
  }, [pois])

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

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
          <h1 className="text-lg font-semibold">Map</h1>
          {!isCreatingPoi && (
            <div className="flex gap-1">
              <button
                onClick={handleCreateNew}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <Plus size={20} />
              </button>
              <button
                onClick={handleLocateMe}
                disabled={isLocating}
                className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
              >
                <Crosshair size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      {poisCache.error && (
        <div className="fixed bottom-24 left-4 right-4 z-10 bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive font-semibold">Error: {poisCache.error.message}</p>
        </div>
      )}

      {/* Selected POI Details */}
      {selectedPoiId && selectedPoi && (
        <div className="fixed top-16 left-4 right-4 z-10 max-w-md bg-card rounded-lg border border-border p-4 shadow-lg">
          <div className="flex justify-between items-start gap-2 mb-2">
            <h2 className="text-lg font-bold">{selectedPoi.label}</h2>
            <button
              onClick={() => setSelectedPoiId(null)}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedPoi.latitude.toFixed(4)}, {selectedPoi.longitude.toFixed(4)}
          </p>
        </div>
      )}

      {/* Center Crosshair - Fixed when creating POI */}
      {isCreatingPoi && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="w-12 h-12 rounded-full border-2 border-red-500 flex items-center justify-center">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
          </div>
        </div>
      )}

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
