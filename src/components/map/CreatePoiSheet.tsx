import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SheetPortal } from '@/components/ui/SheetPortal'
import { XIcon, MapPinIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { getMapboxCategory, mapMapboxCategoryToPoiCategory } from '../../utils/mapFetches'
import { CreatePoiReviewPopup } from './CreatePoiReviewPopup'
import { findOrCreatePoi, createPoiReview } from '../../repositories/pois.repository'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../contexts/ToastContext'
import type { MapboxFeature } from '../../utils/mapFetches'
import type { PoiCategory } from './mapCategories'

interface CreatePoiSheetProps {
  open: boolean
  nearbyPois: MapboxFeature[]
  isLoading: boolean
  hasLoadedOnce: boolean
  centerLat: number
  centerLng: number
  onCancel: () => void
  onSuccess?: () => void
}

export const CreatePoiSheet = ({
  open,
  nearbyPois,
  isLoading,
  hasLoadedOnce,
  centerLat,
  centerLng,
  onCancel,
  onSuccess,
}: CreatePoiSheetProps) => {
  const { session } = useAuth()
  const { showToast } = useToast()
  const [showReviewPopup, setShowReviewPopup] = useState(false)
  const [reviewMode, setReviewMode] = useState<'existing' | 'new'>('new')
  const [selectedPoi, setSelectedPoi] = useState<{ name: string; category: PoiCategory; lat: number; lng: number } | null>(null)

  const handleSelectExisting = (poi: MapboxFeature) => {
    const category = mapMapboxCategoryToPoiCategory(poi.properties.poi_category_ids ?? poi.properties.poi_category)
    if (!category) {
      showToast('Unable to determine venue category')
      return
    }

    setSelectedPoi({
      name: poi.properties.name,
      category,
      lat: poi.geometry.coordinates[1],
      lng: poi.geometry.coordinates[0],
    })
    setReviewMode('existing')
    setShowReviewPopup(true)
  }

  const handleCreateNew = () => {
    setSelectedPoi(null)
    setReviewMode('new')
    setShowReviewPopup(true)
  }

  const handleSubmitReview = async (data: {
    name: string
    category: PoiCategory
    emoji: string
    note: string
    latitude: number
    longitude: number
  }) => {
    if (!session?.user?.id) {
      showToast('You must be logged in to add a review')
      return
    }

    try {
      // Find or create the POI
      const { data: poiData, error: poiError } = await findOrCreatePoi(
        data.name,
        data.category,
        data.latitude,
        data.longitude
      )

      if (poiError || !poiData) {
        throw new Error(poiError?.message || 'Failed to find or create POI')
      }

      // Create the review
      const { error: reviewError } = await createPoiReview(
        poiData.id,
        session.user.id,
        data.emoji,
        data.note
      )

      if (reviewError) {
        throw new Error(reviewError.message)
      }

      showToast('Review added successfully! ✨')
      setShowReviewPopup(false)
      onCancel()
      onSuccess?.()
    } catch (error) {
      console.error('Error submitting review:', error)
      showToast('Failed to add review. Please try again.')
    }
  }

  return (
    <>
      <SheetPortal>
        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32, mass: 0.8 }}
            >
              <div className="w-full max-w-2xl bg-background rounded-t-2xl shadow-xl">
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Venues nearby
                    {isLoading && <span className="inline-block w-2.5 h-2.5 border-[1.5px] border-current border-t-transparent rounded-full animate-spin" />}
                  </h3>
                  <button onClick={onCancel} className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground">
                    <XIcon size={16} />
                  </button>
                </div>

                <div className="h-42 overflow-y-auto divide-y divide-border/30 px-2">
                  {!hasLoadedOnce && isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
                        <div className="w-5 h-5 rounded-full bg-muted shrink-0" />
                        <div className="h-3 bg-muted rounded-full flex-1" />
                        <div className="h-6 w-14 bg-muted rounded-full shrink-0" />
                      </div>
                    ))
                  ) : nearbyPois.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs text-muted-foreground">No existing venues nearby</p>
                    </div>
                  ) : (
                    nearbyPois.map((poi) => {
                      const cat = getMapboxCategory(poi.properties.poi_category_ids ?? poi.properties.poi_category)
                      return (
                        <div key={poi.id} className="flex items-center gap-3 px-4 py-2.5">
                          {cat ? (
                            <cat.Icon size={20} weight="fill" color={cat.color} className="shrink-0" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-muted shrink-0" />
                          )}
                          <span className="text-sm font-medium flex-1 truncate">{poi.properties.name}</span>
                          <button
                            onClick={() => handleSelectExisting(poi)}
                            className="shrink-0 text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Select
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="px-6 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                  <Button onClick={handleCreateNew} className="w-full bg-primary text-white flex items-center gap-2">
                    <MapPinIcon size={18} weight="fill" />
                    Create new venue here
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetPortal>

      <AnimatePresence>
        {showReviewPopup && (
          <CreatePoiReviewPopup
            mode={reviewMode}
            existingPoiData={selectedPoi ? { name: selectedPoi.name, category: selectedPoi.category } : undefined}
            latitude={selectedPoi?.lat ?? centerLat}
            longitude={selectedPoi?.lng ?? centerLng}
            onClose={() => setShowReviewPopup(false)}
            onSubmit={handleSubmitReview}
          />
        )}
      </AnimatePresence>
    </>
  )
}
