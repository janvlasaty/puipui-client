import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface BottomSheetProps {
  children: ReactNode
  onClose?: () => void
  overlay?: boolean
  overlayZIndex?: number
  zIndex?: number
}

export const BottomSheet = ({
  children,
  onClose,
  overlay = false,
  overlayZIndex = 47,
  zIndex = 48,
}: BottomSheetProps) => (
  <>
    {overlay && (
      <motion.div
        className="fixed inset-0 bg-black/20"
        style={{ zIndex: overlayZIndex }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
    )}
    <motion.div
      className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none"
      style={{ zIndex }}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
    >
      <div className="w-full max-w-2xl pointer-events-auto">
        {children}
      </div>
    </motion.div>
  </>
)
