import { ChevronLeft } from 'lucide-react'

interface PageHeaderProps {
  title?: React.ReactNode
  onBack?: () => void
  left?: React.ReactNode
  right?: React.ReactNode
  sticky?: boolean
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, onBack, left, right, sticky }) => {
  return (
    <div className={`bg-background border-b border-border px-4 py-4${sticky ? ' sticky top-0 z-10' : ''}`}>
      <div className="max-w-2xl mx-auto w-full flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-1 hover:bg-muted rounded transition-colors">
            <ChevronLeft size={20} />
          </button>
        )}
        {left}
        {title && <h1 className="text-lg font-semibold">{title}</h1>}
        {right && <div className="ml-auto">{right}</div>}
      </div>
    </div>
  )
}
