import { createContext, useContext, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence } from 'framer-motion'
import { VibeDetailModal } from '../components/vibes/VibeDetailModal'
import { CreatePoiReviewPopup } from '../components/map/CreatePoiReviewPopup'
import { CreatePoiSheet } from '../components/map/CreatePoiSheet'
import { CreateVibeReviewPopup } from '../components/vibes/CreateVibeReviewPopup'
import { findOrCreatePoi, createPoiReview } from '../repositories/pois.repository'
import { useAuth } from '../hooks/useAuth'
import { useToast } from './ToastContext'
import type { VibeEntry } from '../components/vibes/types'
import type { PoiCategory } from '../components/map/mapCategories'
import type { Enums } from '../types/database'
import type { MapboxFeature } from '../utils/mapFetches'

export interface PoiSheetConfig {
  nearbyPois: MapboxFeature[]
  isLoading: boolean
  hasLoadedOnce: boolean
  centerLat: number
  centerLng: number
  onCancel: () => void
  onSuccess?: () => void
}

export interface PoiReviewConfig {
  mode: 'existing' | 'new'
  existingPoiData?: { name: string; category: PoiCategory }
  latitude: number
  longitude: number
  onSuccess?: () => void
}

type ModalState =
  | { kind: 'vibe-detail'; item: VibeEntry }
  | { kind: 'poi-review'; config: PoiReviewConfig }
  | { kind: 'vibe-review' }
  | null

interface OverlayContextValue {
  openPoiSheet: (config: PoiSheetConfig) => void
  updatePoiSheet: (partial: Partial<PoiSheetConfig>) => void
  closePoiSheet: () => void
  openVibeDetail: (item: VibeEntry) => void
  openPoiReview: (config: PoiReviewConfig) => void
  openVibeReview: () => void
  closeModal: () => void
}

const OverlayContext = createContext<OverlayContextValue | null>(null)

export const useOverlay = () => {
  const ctx = useContext(OverlayContext)
  if (!ctx) throw new Error('useOverlay must be used within OverlayProvider')
  return ctx
}

export const OverlayProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation()
  const { session } = useAuth()
  const { showToast } = useToast()

  const [sheet, setSheet] = useState<{ open: boolean; config: PoiSheetConfig | null }>({
    open: false,
    config: null,
  })
  const [modal, setModal] = useState<ModalState>(null)

  const openPoiSheet = (config: PoiSheetConfig) => setSheet({ open: true, config })
  const updatePoiSheet = (partial: Partial<PoiSheetConfig>) =>
    setSheet((prev) => (prev.config ? { ...prev, config: { ...prev.config, ...partial } } : prev))
  const closePoiSheet = () => setSheet((prev) => ({ ...prev, open: false }))
  const openVibeDetail = (item: VibeEntry) => setModal({ kind: 'vibe-detail', item })
  const openPoiReview = (config: PoiReviewConfig) => setModal({ kind: 'poi-review', config })
  const openVibeReview = () => setModal({ kind: 'vibe-review' })
  const closeModal = () => setModal(null)

  const handleSubmitReview = async (
    data: {
      name: string
      category: PoiCategory
      emoji: string
      note: string
      latitude: number
      longitude: number
    },
    onSuccess?: () => void
  ) => {
    if (!session?.user?.id) {
      showToast(t('toasts.mustBeLoggedInReview'))
      return
    }
    try {
      const { data: poiData, error: poiError } = await findOrCreatePoi(
        data.name,
        data.category,
        data.latitude,
        data.longitude
      )
      if (poiError || !poiData) throw new Error(poiError?.message || 'Failed to find or create POI')

      const { error: reviewError } = await createPoiReview(
        poiData.id,
        session.user.id,
        data.emoji as Enums<'type_emoji_char'>,
        data.note
      )
      if (reviewError) throw new Error(reviewError.message)

      showToast(t('toasts.reviewAdded'))
      closeModal()
      onSuccess?.()
    } catch (err) {
      console.error('Error submitting review:', err)
      showToast(t('toasts.reviewFailed'))
    }
  }

  const handleSubmitVibeReview = async (data: {
    category: string
    title: string
    meta: string
    emoji: string
    note: string
  }) => {
    if (!session?.user?.id) {
      showToast(t('toasts.mustBeLoggedInVibe'))
      return
    }
    try {
      // TODO: Connect to backend when vibe review API is ready
      // For now, just show success message
      console.log('Vibe review submitted:', data)
      showToast(t('toasts.vibeAdded'))
      closeModal()
    } catch (err) {
      console.error('Error submitting vibe review:', err)
      showToast(t('toasts.vibeFailed'))
    }
  }

  return (
    <OverlayContext.Provider
      value={{ openPoiSheet, updatePoiSheet, closePoiSheet, openVibeDetail, openPoiReview, openVibeReview, closeModal }}
    >
      {children}

      {sheet.config && (
        <CreatePoiSheet open={sheet.open} {...sheet.config} />
      )}

      <AnimatePresence>
        {modal?.kind === 'vibe-detail' && (
          <VibeDetailModal key="vibe-detail" item={modal.item} onClose={closeModal} />
        )}
        {modal?.kind === 'poi-review' && (
          <CreatePoiReviewPopup
            key="poi-review"
            mode={modal.config.mode}
            existingPoiData={modal.config.existingPoiData}
            latitude={modal.config.latitude}
            longitude={modal.config.longitude}
            onClose={closeModal}
            onSubmit={(data) => handleSubmitReview(data, modal.config.onSuccess)}
          />
        )}
        {modal?.kind === 'vibe-review' && (
          <CreateVibeReviewPopup
            key="vibe-review"
            onClose={closeModal}
            onSubmit={handleSubmitVibeReview}
          />
        )}
      </AnimatePresence>
    </OverlayContext.Provider>
  )
}
