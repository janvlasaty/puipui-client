import { useState, useRef, useEffect } from 'react'
import { XIcon } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { SheetPortal } from '@/components/ui/SheetPortal'
import { getInvitationByCode } from '../../repositories/invitations.repository'
import { useToast } from '../../contexts/ToastContext'

const slideTransition = { type: 'spring' as const, stiffness: 300, damping: 32, mass: 0.8 }

type Props = {
  open: boolean
  onClose: () => void
}

export const AcceptCodeSheet = ({ open, onClose }: Props) => {
  const { showToast } = useToast()

  const [acceptDigits, setAcceptDigits] = useState(['', '', '', '', '', ''])
  const [checkingCode, setCheckingCode] = useState(false)
  const [acceptResult, setAcceptResult] = useState<'not_found' | null>(null)
  const [acceptError, setAcceptError] = useState<string | null>(null)
  const acceptInputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!open) return
    setAcceptDigits(['', '', '', '', '', ''])
    setAcceptResult(null)
    setAcceptError(null)
    const t = setTimeout(() => acceptInputRefs.current[0]?.focus(), 150)
    return () => clearTimeout(t)
  }, [open])

  const checkCode = async (code: string) => {
    setCheckingCode(true)
    setAcceptError(null)
    const { error } = await getInvitationByCode(code)
    if (error) {
      setAcceptResult('not_found')
      setAcceptError(error.message)
    } else {
      onClose()
      showToast('Invitation accepted')
    }
    setCheckingCode(false)
  }

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...acceptDigits]
    newDigits[index] = digit
    setAcceptDigits(newDigits)
    setAcceptResult(null)
    setAcceptError(null)
    if (digit && index < 5) acceptInputRefs.current[index + 1]?.focus()
    if (newDigits.every(d => d)) checkCode(newDigits.join(''))
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !acceptDigits[index] && index > 0) {
      const newDigits = [...acceptDigits]
      newDigits[index - 1] = ''
      setAcceptDigits(newDigits)
      acceptInputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <SheetPortal>
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-20 bg-black/40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-30 flex justify-center"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={slideTransition}
          >
            <div className="w-full max-w-2xl bg-background rounded-t-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Enter invite code</h3>
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground">
                  <XIcon size={16} />
                </button>
              </div>

              <div className="flex flex-col items-center gap-5">
                <div className="flex gap-2">
                  {acceptDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { acceptInputRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleDigitChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      className={`w-10 h-14 text-center text-2xl font-mono font-bold border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                        acceptResult === 'not_found' ? 'border-destructive' : 'border-border'
                      }`}
                    />
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {checkingCode ? (
                    <motion.p
                      key="checking"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-xs text-muted-foreground text-center"
                    >
                      Checking…
                    </motion.p>
                  ) : acceptResult === 'not_found' ? (
                    <motion.p
                      key="not_found"
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-xs text-destructive text-center"
                    >
                      {acceptError ?? 'Code not found or expired.'}
                    </motion.p>
                  ) : (
                    <motion.p
                      key="hint"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-xs text-muted-foreground text-center"
                    >
                      Enter the 6-digit code your friend shared with you.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </SheetPortal>
  )
}
