import { useState } from 'react'
import { XIcon, NavigationArrowIcon } from '@phosphor-icons/react'
import { AnimatePresence } from 'framer-motion'
import { BottomSheet } from '../BottomSheet'
import { MAP_CATEGORIES } from './mapCategories'
import { CreatePoiReviewPopup } from './CreatePoiReviewPopup'
import { findOrCreatePoi, createPoiReview } from '../../repositories/pois.repository'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../contexts/ToastContext'
import type { PoiCategory } from './mapCategories'

type Poi = {
  id: string
  label: string
  latitude: number
  longitude: number
  category: PoiCategory
}

const PLACEHOLDER_TAGS: Record<string, string[]> = {
  Coffee: ['#coffee', '#morning', '#work', '#chill'],
  Food:   ['#lunch', '#dinner', '#foodie', '#vibes'],
  Drink:  ['#beer', '#cocktails', '#nightout', '#cheers'],
  Bakery: ['#pastry', '#breakfast', '#sweet', '#brunch'],
  Stay:   ['#cozy', '#hostel', '#travel', '#sleep'],
  Gem:    ['#hidden', '#gem', '#local', '#mustvisit'],
}

function getMapsUrl(lat: number, lng: number, label: string) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  return isIOS
    ? `https://maps.apple.com/?daddr=${lat},${lng}&q=${encodeURIComponent(label)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

export const PoiPopup = ({ poi, onClose }: { poi: Poi; onClose: () => void }) => {
  const { session } = useAuth()
  const { showToast } = useToast()
  const [showReviewPopup, setShowReviewPopup] = useState(false)
  const cat = MAP_CATEGORIES.find((c) => c.id === poi.category)
  const tags = PLACEHOLDER_TAGS[poi.category] ?? []

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
      onClose()
    } catch (error) {
      console.error('Error submitting review:', error)
      showToast('Failed to add review. Please try again.')
    }
  }

  return (
    <>
      <BottomSheet zIndex={10}>
        <div className="px-4 pb-[120px]">
          <div className="bg-card rounded-3xl border border-border/50 shadow-2xl overflow-hidden">
            <div className="p-4 pb-4">
              {/* Header row */}
              <div className="flex items-center gap-3 mb-1">
                {cat && (
                  <cat.Icon size={32} color={cat.color} weight="fill" className="shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold truncate leading-tight">{poi.label}</p>
                  <a
                    href={getMapsUrl(poi.latitude, poi.longitude, poi.label)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                  >
                    <NavigationArrowIcon size={11} />
                    Open in maps
                  </a>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 hover:opacity-70 transition-opacity"
                >
                  <XIcon size={15} />
                </button>
              </div>

              {/* Dashed separator */}
              <div className="flex items-center -mx-1">
                <div className="-ml-2 w-4 h-4 rounded-full bg-background shrink-0" />
                <div className="h-px flex-1 border-t border-dashed border-border" />
                <div className="-mr-2 w-4 h-4 rounded-full bg-background shrink-0" />
              </div>

              {/* Review placeholder line with inline tags */}
              <div className="flex items-baseline gap-1 flex-wrap opacity-60">
                <span className="text-xs font-semibold text-foreground shrink-0">Me:</span>
                <span className="text-xs text-foreground shrink-0">What's the vibe here?</span>
                <span className="shrink-0 text-xs">✨</span>
                <span className="text-xs text-muted-foreground">{tags.join(' ')}</span>
              </div>

              {/* Add review button */}
              <button
                onClick={() => setShowReviewPopup(true)}
                className="w-full mt-3 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                Add Review
              </button>
            </div>
          </div>
        </div>
      </BottomSheet>

      <AnimatePresence>
        {showReviewPopup && (
          <CreatePoiReviewPopup
            mode="existing"
            existingPoiData={{
              name: poi.label,
              category: poi.category,
            }}
            latitude={poi.latitude}
            longitude={poi.longitude}
            onClose={() => setShowReviewPopup(false)}
            onSubmit={handleSubmitReview}
          />
        )}
      </AnimatePresence>
    </>
  )
}
