import { createContext, useContext, useState, useCallback, useRef } from 'react'

interface ToastOptions {
  duration?: number
}

interface ToastState {
  message: string
  visible: boolean
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

    setToast({ message, visible: true })

    timerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }))
    }, duration)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast message={toast.message} visible={toast.visible} />
    </ToastContext.Provider>
  )
}

const Toast = ({ message, visible }: ToastState) => (
  <div
    className={[
      'fixed top-2 left-1/2 -translate-x-1/2 z-[9999]',
      'px-5 py-2.5 rounded-full',
      'bg-card border border-border/50 backdrop-blur-sm',
      'text-foreground text-sm font-medium whitespace-nowrap',
      'shadow-lg',
      'transition-all duration-300 ease-out',
      visible
        ? 'opacity-100 translate-y-0 pointer-events-auto'
        : 'opacity-0 -translate-y-2 pointer-events-none',
    ].join(' ')}
  >
    {message}
  </div>
)
