import { AnimatePresence, motion } from 'framer-motion'
import { SheetPortal } from '@/components/ui/SheetPortal'
import { XIcon, MapPinIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { getMapboxCategory } from '../../utils/mapFetches'
import type { MapboxFeature } from '../../utils/mapFetches'

interface CreatePoiSheetProps {
  open: boolean
  nearbyPois: MapboxFeature[]
  isLoading: boolean
  hasLoadedOnce: boolean
  onCancel: () => void
  onCreateHere: () => void
}

export const CreatePoiSheet = ({
  open,
  nearbyPois,
  isLoading,
  hasLoadedOnce,
  onCancel,
  onCreateHere,
}: CreatePoiSheetProps) => {
  return (
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
                        <button className="shrink-0 text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors">
                          Select
                        </button>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="px-6 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                <Button onClick={onCreateHere} className="w-full bg-primary text-white flex items-center gap-2">
                  <MapPinIcon size={18} weight="fill" />
                  Create new venue here
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SheetPortal>
  )
}
