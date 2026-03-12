import { motion } from 'framer-motion'
import { XIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

interface ModalCardProps {
  icon?: ReactNode
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}

export const ModalCard = ({ icon, title, subtitle, onClose, children }: ModalCardProps) => (
  <>
    <motion.div
      className="fixed inset-0 z-[60] bg-black/40"
      style={{ backdropFilter: 'blur(10px) grayscale(1)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    />
    <div className="fixed inset-0 z-[61] flex items-center justify-center p-6 pointer-events-none">
      <motion.div
        className="bg-card rounded-3xl w-full max-w-sm shadow-2xl pointer-events-auto"
        initial={{ opacity: 0, scale: 0.86, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.86, y: 12 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        layout
        layoutDependency={undefined}
        style={{ originY: 0 }}
      >
        <div className="flex items-center gap-3 p-5 pb-4">
          {icon}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{title}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 hover:opacity-70 transition-opacity"
          >
            <XIcon size={15} />
          </button>
        </div>
        <div className="mx-5 border-t border-dashed border-border" />
        {children}
      </motion.div>
    </div>
  </>
)
