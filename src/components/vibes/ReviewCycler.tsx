import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Review } from './types'

export const ReviewCycler = ({ reviews }: { reviews: Review[] }) => {
  const [idx, setIdx] = useState(0)
  const intervalRef = useRef(4000 + Math.random() * 3000)

  useEffect(() => {
    if (reviews.length <= 1) return
    const timer = setInterval(
      () => setIdx((i) => (i + 1) % reviews.length),
      intervalRef.current,
    )
    return () => clearInterval(timer)
  }, [reviews.length])

  const r = reviews[idx]

  return (
    <div className="overflow-hidden h-4 mt-0.5 relative">
      <AnimatePresence mode="sync" initial={false}>
        <motion.p
          key={idx}
          className="text-xs text-muted-foreground truncate absolute inset-x-0 flex items-center gap-1"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <span className="font-semibold truncate">{r.user}:</span>
          <span className="truncate flex-1">{r.note}</span>
          <span className="shrink-0">{r.emoji}</span>
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
