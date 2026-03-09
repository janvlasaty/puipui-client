import { useCallback } from 'react'
import type { MutableRefObject } from 'react'
import mapboxgl from 'mapbox-gl'
import { MAP_CATEGORIES, makeCategoryMarkerSvg } from '../components/map/mapCategories'

interface UseMapLayersParams {
  mapRef: MutableRefObject<mapboxgl.Map | null>
  setSelectedPoiId: (id: string | null) => void
  isDarkRef: MutableRefObject<boolean>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  poisRef: MutableRefObject<any[] | null | undefined>
  activeCategoriesRef: MutableRefObject<string[]>
  fetchPoiDataRef: MutableRefObject<() => void>
  isCacheStaleRef: MutableRefObject<(lastFetched: number | null) => boolean>
  poisCacheRef: MutableRefObject<{ data: unknown[] | null; lastFetched: number | null }>
}

export function useMapLayers({
  mapRef,
  setSelectedPoiId,
  isDarkRef,
  poisRef,
  activeCategoriesRef,
  fetchPoiDataRef,
  isCacheStaleRef,
  poisCacheRef,
}: UseMapLayersParams) {
  const addLayersAndHandlers = useCallback(() => {
    const m = mapRef.current
    if (!m) return

    const dark = isDarkRef.current

    const imageLoads = MAP_CATEGORIES.map((cat) =>
      new Promise<void>((resolve) => {
        const img = new Image(56, 72)
        img.onload = () => {
          if (mapRef.current) mapRef.current.addImage(`poi-marker-${cat.id}`, img, { pixelRatio: 2 })
          resolve()
        }
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(makeCategoryMarkerSvg(cat))
      })
    )

    Promise.all(imageLoads).then(() => {
      if (!mapRef.current) return

      mapRef.current.addSource('pois-dim', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      mapRef.current.addLayer({
        id: 'pois-dim-layer',
        type: 'circle',
        source: 'pois-dim',
        paint: {
          'circle-radius': 3,
          'circle-color': '#9CA3AF',
          'circle-opacity': 0.5,
        },
      })

      mapRef.current.addSource('pois', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 35,
      })

      mapRef.current.addLayer({
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

      mapRef.current.addLayer({
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

      mapRef.current.addLayer({
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

      mapRef.current.on('click', 'pois-clusters', (e) => {
        const feature = e.features?.[0]
        if (!feature) return
        const clusterId = feature.properties?.cluster_id
        const source = mapRef.current!.getSource('pois') as mapboxgl.GeoJSONSource
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom == null) return
          mapRef.current!.easeTo({
            center: (feature.geometry as GeoJSON.Point).coordinates as [number, number],
            zoom,
          })
        })
      })

      mapRef.current.on('click', 'pois-layer', (e) => {
        const feature = e.features?.[0]
        if (feature) setSelectedPoiId(feature.properties?.id ?? null)
      })

      mapRef.current.on('mouseenter', 'pois-clusters', () => { mapRef.current!.getCanvas().style.cursor = 'pointer' })
      mapRef.current.on('mouseleave', 'pois-clusters', () => { mapRef.current!.getCanvas().style.cursor = '' })
      mapRef.current.on('mouseenter', 'pois-layer',    () => { mapRef.current!.getCanvas().style.cursor = 'pointer' })
      mapRef.current.on('mouseleave', 'pois-layer',    () => { mapRef.current!.getCanvas().style.cursor = '' })

      // Repopulate with already-loaded POIs (important after a style change)
      if (poisRef.current?.length) {
        const active = new Set(activeCategoriesRef.current)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const activePois = (poisRef.current as any[]).filter((p) => active.has(p.category))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dimPois    = (poisRef.current as any[]).filter((p) => !active.has(p.category))

        const source = mapRef.current.getSource('pois') as mapboxgl.GeoJSONSource
        source.setData({
          type: 'FeatureCollection',
          features: activePois.map((poi) => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [poi.longitude, poi.latitude] },
            properties: { id: poi.id, label: poi.label, category: poi.category },
          })),
        })

        const dimSource = mapRef.current.getSource('pois-dim') as mapboxgl.GeoJSONSource
        dimSource.setData({
          type: 'FeatureCollection',
          features: dimPois.map((poi) => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [poi.longitude, poi.latitude] },
            properties: { id: poi.id },
          })),
        })
      }

      const cache = poisCacheRef.current
      if (!cache.data || isCacheStaleRef.current(cache.lastFetched)) {
        fetchPoiDataRef.current()
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return addLayersAndHandlers
}
