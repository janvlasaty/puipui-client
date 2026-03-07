import { motion } from 'framer-motion'
import type { ElementType } from 'react'

export type FilterCategory = { id: string; label: string; Icon: ElementType; color: string }

export const CategoryFilterPopup = ({
  categories,
  activeIds,
  onToggle,
  onSelectAll,
  onClose,
  anchorRect,
}: {
  categories: FilterCategory[]
  activeIds: string[]
  onToggle: (id: string) => void
  onSelectAll: () => void
  onClose: () => void
  anchorRect?: DOMRect
}) => (
  <>
    <div className="fixed inset-0 z-[15]" onClick={onClose} />
    <motion.div
      style={anchorRect ? { top: anchorRect.bottom + 8, left: anchorRect.left } : undefined}
      className="fixed top-[72px] left-4 z-[16] bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden w-52"
      initial={{ opacity: 0, scale: 0.92, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -6 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
    >
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categories</p>
        {categories.some((c) => !activeIds.includes(c.id)) && (
          <button onClick={onSelectAll} className="text-xs font-semibold text-primary uppercase tracking-wider">All</button>
        )}
      </div>
      <div className="pb-2">
        {categories.map((cat) => {
          const isOn = activeIds.includes(cat.id)
          return (
            <button
              key={cat.id}
              onClick={() => onToggle(cat.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors"
            >
              <cat.Icon size={16} color={isOn ? cat.color : undefined} className={isOn ? '' : 'text-muted-foreground'} />
              <span className={`flex-1 text-sm text-left ${isOn ? '' : 'text-muted-foreground'}`}>{cat.label}</span>
              <div className={`w-8 h-[18px] rounded-full transition-colors duration-200 relative shrink-0 ${isOn ? 'bg-primary' : 'bg-muted-foreground/25'}`}>
                <div className={`absolute top-[3px] w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${isOn ? 'translate-x-[17px]' : 'translate-x-[3px]'}`} />
              </div>
            </button>
          )
        })}
      </div>
    </motion.div>
  </>
)
