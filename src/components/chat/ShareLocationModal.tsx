import { useState, useEffect } from 'react'
import { MapPinIcon, ArrowsClockwiseIcon } from '@phosphor-icons/react'
import { ModalCard } from '../ui/ModalCard'

interface ShareLocationModalProps {
  onClose: () => void
  onSend: (content: string) => void
}

type Status = 'loading' | 'ready' | 'error'

export const ShareLocationModal = ({ onClose, onSend }: ShareLocationModalProps) => {
  const [status, setStatus] = useState<Status>('loading')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const requestLocation = () => {
    setStatus('loading')
    setErrorMsg('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus('ready')
      },
      (err) => {
        setErrorMsg(
          err.code === 1
            ? 'Location permission denied.'
            : 'Could not get your location.'
        )
        setStatus('error')
      },
      { timeout: 10_000, maximumAge: 60_000 },
    )
  }

  useEffect(() => { requestLocation() }, [])

  const handleSend = () => {
    if (!coords) return
    onSend(JSON.stringify(coords))
    onClose()
  }

  return (
    <ModalCard
      icon={<MapPinIcon size={18} className="text-primary" />}
      title="Share location"
      onClose={onClose}
    >
      <div className="p-5 pt-4 space-y-4">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-6 text-muted-foreground">
            <span className="w-6 h-6 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm">Getting your location…</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <MapPinIcon size={32} className="text-muted-foreground/40" weight="thin" />
            <p className="text-sm text-center text-muted-foreground">{errorMsg}</p>
            <button
              onClick={requestLocation}
              className="flex items-center gap-1.5 text-sm text-primary font-medium"
            >
              <ArrowsClockwiseIcon size={14} />
              Try again
            </button>
          </div>
        )}

        {status === 'ready' && coords && (
          <>
            <div className="rounded-xl bg-muted overflow-hidden">
              <img
                src={`https://staticmap.openstreetmap.de/staticmap.php?center=${coords.lat},${coords.lng}&zoom=15&size=400x160&markers=${coords.lat},${coords.lng},red`}
                alt="Map preview"
                className="w-full h-36 object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
              <div className="px-3 py-2 flex items-center gap-1.5">
                <MapPinIcon size={13} className="text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground font-mono">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </span>
                <button
                  onClick={requestLocation}
                  className="ml-auto text-primary"
                  aria-label="Refresh location"
                >
                  <ArrowsClockwiseIcon size={13} />
                </button>
              </div>
            </div>

            <button
              onClick={handleSend}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-medium transition-opacity"
            >
              Send location
            </button>
          </>
        )}
      </div>
    </ModalCard>
  )
}

