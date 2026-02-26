import { createContext, useContext, useRef, useState, ReactNode } from 'react'
import type { Map as MapboxMap, Marker as MapboxMarker } from 'mapbox-gl'

interface MapState {
  center: [number, number]
  zoom: number
}

interface MapContextType {
  map: React.MutableRefObject<MapboxMap | null>
  mapContainer: React.MutableRefObject<HTMLDivElement | null>
  markers: React.MutableRefObject<Record<string, MapboxMarker>>
  mapState: MapState
  setMapState: (state: MapState) => void
}

const MapContext = createContext<MapContextType | undefined>(undefined)

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const map = useRef<MapboxMap | null>(null)
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const markers = useRef<Record<string, MapboxMarker>>({})
  const [mapState, setMapState] = useState<MapState>({ center: [14.43, 50.1], zoom: 13 })

  return (
    <MapContext.Provider value={{ map, mapContainer, markers, mapState, setMapState }}>
      {children}
    </MapContext.Provider>
  )
}

export const useMapContext = () => {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error('useMapContext must be used within MapProvider')
  }
  return context
}
