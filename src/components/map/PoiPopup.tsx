import { XIcon, NavigationArrowIcon } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '../BottomSheet'
import { MAP_CATEGORIES } from './mapCategories'
import { useOverlay } from '../../contexts/OverlayContext'
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
  const { t } = useTranslation()
  const { openPoiReview } = useOverlay()
  const cat = MAP_CATEGORIES.find((c) => c.id === poi.category)
  const tags = PLACEHOLDER_TAGS[poi.category] ?? []

  return (
    <BottomSheet zIndex={10}>
      <div className="px-4 pb-[120px]">
        <div className="bg-card rounded-3xl border border-border/50 shadow-2xl overflow-hidden">
          <div className="p-4 pb-4">
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
                  {t('map.openInMaps')}
                </a>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 hover:opacity-70 transition-opacity"
              >
                <XIcon size={15} />
              </button>
            </div>

            <div className="flex items-center -mx-1">
              <div className="-ml-2 w-4 h-4 rounded-full bg-background shrink-0" />
              <div className="h-px flex-1 border-t border-dashed border-border" />
              <div className="-mr-2 w-4 h-4 rounded-full bg-background shrink-0" />
            </div>

            <div className="flex items-baseline gap-1 flex-wrap opacity-60">
              <span className="text-xs font-semibold text-foreground shrink-0">{t('map.me')}</span>
              <span className="text-xs text-foreground shrink-0">{t('map.whatsTheVibe')}</span>
              <span className="shrink-0 text-xs">✨</span>
              <span className="text-xs text-muted-foreground">{tags.join(' ')}</span>
            </div>

            <button
              onClick={() =>
                openPoiReview({
                  mode: 'existing',
                  existingPoiData: { name: poi.label, category: poi.category },
                  latitude: poi.latitude,
                  longitude: poi.longitude,
                })
              }
              className="w-full mt-3 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity active:scale-[0.98]"
            >
              {t('map.addReview')}
            </button>
          </div>
        </div>
      </div>
    </BottomSheet>
  )
}
