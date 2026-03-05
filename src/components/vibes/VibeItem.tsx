import { ReviewCycler } from './ReviewCycler'
import { CATEGORY_COLOR } from './vibeData'
import type { VibeEntry } from './types'

export const VibeItem = ({ Icon, title, meta, reviews, onClick }: VibeEntry & { onClick?: () => void }) => (
  <div
    className="flex flex-col gap-2 p-3 rounded-xl bg-card border border-border/50 cursor-pointer active:opacity-70 transition-opacity"
    onClick={onClick}
  >
    <div className="flex items-center gap-1.5 min-w-0">
      <Icon size={14} color={CATEGORY_COLOR.get(Icon)} weight="fill" className="shrink-0" />
      <p className="text-sm font-semibold truncate">{title}</p>
      <span className="text-xs text-muted-foreground truncate shrink-0">{meta}</span>
    </div>
    <hr className="border-border/50" />
    <ReviewCycler reviews={reviews} />
  </div>
)
