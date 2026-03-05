import { CaretLeftIcon } from '@phosphor-icons/react'

interface HeaderButtonProps {
  onClick?: () => void
  disabled?: boolean
  variant?: 'default' | 'primary'
  className?: string
  children: React.ReactNode
}

export const HeaderButton: React.FC<HeaderButtonProps> = ({ onClick, disabled, variant = 'default', className, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={
      variant === 'primary'
        ? `p-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 ${className ?? ''}`
        : `p-2.5 bg-background/70 backdrop-blur-sm rounded-full hover:bg-background/90 transition-colors disabled:opacity-50 ${className ?? ''}`
    }
  >
    {children}
  </button>
)

interface PageHeaderProps {
  title?: React.ReactNode
  onBack?: () => void
  left?: React.ReactNode
  right?: React.ReactNode
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, onBack, left, right }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-10 px-4 py-4">
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: '80px',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
          background: 'linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 100%)',
          zIndex: -1,
        }}
      />
      <div className="max-w-2xl mx-auto w-full flex items-center relative min-h-[44px]">
        <div className="flex items-center gap-1">
          {onBack && (
            <HeaderButton onClick={onBack}>
              <CaretLeftIcon size={20} />
            </HeaderButton>
          )}
          {left}
        </div>

        {title && (
          <div className="absolute inset-x-0 flex justify-center pointer-events-none">
            <div className="pointer-events-auto">
              {typeof title === 'string' ? (
                <div className="px-4 py-1 bg-background/70 backdrop-blur-sm rounded-full border border-border/50">
                  <span className="text-sm font-semibold">{title}</span>
                </div>
              ) : (
                title
              )}
            </div>
          </div>
        )}

        {right && <div className="ml-auto">{right}</div>}
      </div>
    </div>
  )
}
