import { useState, useEffect, useRef, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import type { Map as MapboxMap, Marker as MapboxMarker, LngLatLike } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { usePois } from '../hooks/usePois'
import { Button } from '@/components/ui/button'
import { X, Plus, Crosshair } from 'lucide-react'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const MAP_STYLE_LIGHT = import.meta.env.VITE_MAPBOX_STYLE

export const MapPage = () => {
  const { pois, error, fetchPois } = usePois()

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
  const markers = useRef<Record<string, MapboxMarker>>({})
  const fetchDebouncer = useRef<NodeJS.Timeout | null>(null)

  // Persist map state to localStorage
  useEffect(() => {
    localStorage.setItem('mapState', JSON.stringify(mapState))
  }, [mapState])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLE_LIGHT,
      center: mapState.center as LngLatLike,
      zoom: mapState.zoom,
      maxZoom: 18,
      minZoom: 10,
      minPitch: 0,
      maxPitch: 0,
      dragRotate: false,
      attributionControl: false,
    })

    map.current.on('load', () => {
      fetchPoiData()
    })

    map.current.on('movestart', () => {
      if (fetchDebouncer.current) clearTimeout(fetchDebouncer.current)
      fetchDebouncer.current = setInterval(() => {
        fetchPoiData()
      }, 500)
    })

    map.current.on('moveend', () => {
      if (fetchDebouncer.current) clearTimeout(fetchDebouncer.current)
      setTimeout(() => {
        fetchPoiData()
      }, 100)
      // Store map state
      if (map.current) {
        const center = map.current.getCenter()
        setMapState({ center: [center.lng, center.lat], zoom: map.current.getZoom() })
      }
    })

    map.current.addControl(new mapboxgl.AttributionControl(), 'top-right')

    return () => {
      if (fetchDebouncer.current) clearTimeout(fetchDebouncer.current)
      if (map.current) map.current.remove()
    }
  }, [])

  // Fetch POIs based on map bounds
  const fetchPoiData = useCallback(() => {
    if (!map.current) return
    const mapBounds = map.current.getBounds()
    if (!mapBounds) return

    // Fetch POIs within current view bounds
    fetchPois({
      minLng: mapBounds.getWest(),
      maxLng: mapBounds.getEast(),
      minLat: mapBounds.getSouth(),
      maxLat: mapBounds.getNorth(),
    })
  }, [fetchPois])

  // Handle POI markers
  useEffect(() => {
    if (!map.current || !pois || pois.length === 0) return

    // Remove markers that are no longer in pois
    Object.keys(markers.current).forEach((poiId) => {
      if (!pois.find((poi) => poi.id === poiId)) {
        markers.current[poiId].remove()
        delete markers.current[poiId]
      }
    })

    // Add new markers
    pois.forEach((poi) => {
      if (markers.current[poi.id]) return

      const newMarker = new mapboxgl.Marker({
        color: '#fbbf24',
        scale: 0.8,
      })
        .setLngLat([poi.longitude, poi.latitude])
        .addTo(map.current!)

      newMarker.getElement().addEventListener('click', () => {
        setSelectedPoiId(poi.id)
      })

      markers.current[poi.id] = newMarker
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

    // Here you would open a dialog/modal to enter POI details
    // For now, just clean up
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
      
      {error && (
        <div className="fixed bottom-24 left-4 right-4 z-10 bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive font-semibold">Error: {error}</p>
        </div>
      )}

      {/* Selected POI Details */}
      {selectedPoiId && selectedPoi && (
        <div className="fixed top-4 left-4 right-4 z-10 max-w-md bg-card rounded-lg border border-border p-4 shadow-lg">
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

      {/* Create POI Button */}
      {!isCreatingPoi ? (
        <div className="fixed top-4 left-4 z-10 flex gap-2">
          <button
            onClick={handleCreateNew}
            className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg"
          >
            <Plus size={24} />
          </button>
          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg"
          >
            <Crosshair size={24} />
          </button>
        </div>
      ) : (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
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
