import { motion } from 'framer-motion'
import { XIcon, NavigationArrowIcon } from '@phosphor-icons/react'
import { MAP_CATEGORIES } from './mapCategories'
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
  const cat = MAP_CATEGORIES.find((c) => c.id === poi.category)
  const tags = PLACEHOLDER_TAGS[poi.category] ?? []

  return (
    <motion.div
      className="fixed left-4 right-4 bottom-[120px] z-10 bg-card rounded-3xl border border-border/50 shadow-2xl overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
    >
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
      </div>
    </motion.div>
  )
}
