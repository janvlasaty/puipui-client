import { AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from './BottomSheet'

interface ConfirmActionSheetProps {
  open: boolean
  message: string
  confirmLabel?: string
  overlayZIndex?: number
  zIndex?: number
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmActionSheet: React.FC<ConfirmActionSheetProps> = ({
  open,
  message,
  confirmLabel = 'Delete',
  overlayZIndex,
  zIndex,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation()
  return (
  <AnimatePresence>
    {open && (
      <BottomSheet overlay onClose={onCancel} overlayZIndex={overlayZIndex} zIndex={zIndex}>
        <div className="p-4 pb-8">
          <div className="bg-card rounded-2xl overflow-hidden mb-3">
            <div className="px-4 py-3 border-b border-border/50 text-center">
              <p className="text-xs text-muted-foreground">{message}</p>
            </div>
            <button
              onClick={onConfirm}
              className="w-full py-3.5 text-sm font-semibold text-destructive hover:bg-muted transition-colors"
            >
              {confirmLabel}
            </button>
          </div>
          <button
            onClick={onCancel}
            className="w-full bg-card rounded-2xl py-3.5 text-sm font-semibold hover:bg-muted transition-colors"
          >
            {t('common.cancel')}
          </button>
        </div>
      </BottomSheet>
    )}
  </AnimatePresence>
  )
}
