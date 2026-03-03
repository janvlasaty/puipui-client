import { createContext, useContext, useState, useCallback, useRef } from 'react'

interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastOptions {
  duration?: number  // 0 = persistent until dismissed
  action?: ToastAction
}

interface ToastState {
  message: string
  visible: boolean
  action?: ToastAction
}

interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toast, setToast] = useState<ToastState>({ message: '', visible: false })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    const duration = options?.duration ?? 3000

    if (timerRef.current) clearTimeout(timerRef.current)

    setToast({ message, visible: true, action: options?.action })

    if (duration > 0) {
      timerRef.current = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }))
      }, duration)
    }
  }, [])

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast((prev) => ({ ...prev, visible: false }))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast toast={toast} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

const Toast = ({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) => (
  <div
    className={[
      'fixed top-2 left-1/2 -translate-x-1/2 z-[9999]',
      'flex items-center gap-3',
      'px-5 py-2.5 rounded-full',
      'bg-card border border-border/50 backdrop-blur-sm',
      'text-foreground text-sm font-medium whitespace-nowrap',
      'shadow-lg',
      'transition-all duration-300 ease-out',
      toast.visible
        ? 'opacity-100 translate-y-0 pointer-events-auto'
        : 'opacity-0 -translate-y-2 pointer-events-none',
    ].join(' ')}
  >
    <span>{toast.message}</span>
    {toast.action && (
      <button
        onClick={() => { toast.action!.onClick(); onDismiss() }}
        className="text-xs font-semibold px-2.5 py-1 rounded-full bg-foreground text-background hover:opacity-80 transition-opacity"
      >
        {toast.action.label}
      </button>
    )}
  </div>
)
