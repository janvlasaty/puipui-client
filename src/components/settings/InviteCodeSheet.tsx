import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckIcon, XIcon, CopySimpleIcon, TrashSimpleIcon } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { SheetPortal } from '@/components/ui/SheetPortal'
import { Button } from '@/components/ui/button'
import { useAuth } from '../../hooks/useAuth'
import { getMyActiveInvitation, generateUniqueCode, deleteExpiredInvitations, deleteInvitationByCode } from '../../repositories/invitations.repository'
import { ConfirmActionSheet } from '../ConfirmActionSheet'

const slideTransition = { type: 'spring' as const, stiffness: 300, damping: 32, mass: 0.8 }

type Props = {
  open: boolean
  onClose: () => void
}

export const InviteCodeSheet = ({ open, onClose }: Props) => {
  const { t } = useTranslation()
  const { session } = useAuth()

  const [activeInvitation, setActiveInvitation] = useState<{ code: string; expire_at: string } | null | undefined>(undefined)
  const [loadingInvitation, setLoadingInvitation] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    setActiveInvitation(undefined)
    setGenerateError(null)
    setCopied(false)
    setConfirmDelete(false)
    setLoadingInvitation(true)
    const load = async () => {
      if (session?.user?.id) {
        await deleteExpiredInvitations(session.user.id)
        const { data } = await getMyActiveInvitation(session.user.id)
        setActiveInvitation(data ? { code: data.code, expire_at: data.expire_at } : null)
      }
      setLoadingInvitation(false)
    }
    load()
  }, [open])

  useEffect(() => {
    if (!activeInvitation) { setCountdown(''); return }
    const update = () => {
      const remaining = new Date(activeInvitation.expire_at).getTime() - Date.now()
      if (remaining <= 0) { setActiveInvitation(null); setCountdown(''); return }
      const mins = Math.floor(remaining / 60000)
      const secs = Math.floor((remaining % 60000) / 1000)
      setCountdown(`${mins}:${secs.toString().padStart(2, '0')}`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [activeInvitation?.expire_at])

  const handleGenerateCode = async () => {
    if (!session?.user?.id) return
    setGeneratingCode(true)
    setGenerateError(null)
    const inv = await generateUniqueCode(session.user.id)
    if (inv) {
      setActiveInvitation(inv)
    } else {
      setGenerateError(t('inviteSheet.couldNotGenerate'))
    }
    setGeneratingCode(false)
  }

  const handleCopy = () => {
    if (!activeInvitation) return
    navigator.clipboard.writeText(activeInvitation.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDeleteCode = async () => {
    if (!activeInvitation) return
    await deleteInvitationByCode(activeInvitation.code)
    setActiveInvitation(null)
    setConfirmDelete(false)
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
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('inviteSheet.yourInviteCode')}</h3>
                  <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground">
                    <XIcon size={16} />
                  </button>
                </div>

                <div className="flex flex-col items-center">
                  <div className="h-14 flex items-center">
                    {loadingInvitation ? (
                      <div className="flex gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-10 h-14 bg-muted rounded-xl animate-pulse"
                            style={{ animationDelay: `${i * 80}ms` }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {Array.from({ length: 6 }).map((_, i) => {
                          const digit = activeInvitation?.code[i]
                          return (
                            <div key={i} className="w-10 h-14 bg-muted rounded-xl overflow-hidden relative">
                              <AnimatePresence>
                                {digit !== undefined && (
                                  <motion.div
                                    key={activeInvitation?.code}
                                    className="absolute top-0 left-0 w-full flex flex-col"
                                    initial={{ y: 56 }}
                                    animate={{ y: -(Number(digit) * 56) }}
                                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                                    transition={{
                                      type: 'spring' as const,
                                      stiffness: 130,
                                      damping: 16,
                                      delay: i * 0.09,
                                    }}
                                  >
                                    {['0','1','2','3','4','5','6','7','8','9'].map(d => (
                                      <div key={d} className="h-14 w-10 flex items-center justify-center text-2xl font-mono font-bold">
                                        {d}
                                      </div>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 h-20 w-full flex flex-col items-center justify-center gap-2">
                    {!loadingInvitation && activeInvitation && (
                      <>
                        <button
                          onClick={handleCopy}
                          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copied
                            ? <><CheckIcon size={14} className="text-green-600" /><span className="text-green-600">{t('inviteSheet.copied')}</span></>
                            : <><CopySimpleIcon size={14} /><span>{t('inviteSheet.copy')}</span></>
                          }
                        </button>
                        <p className={`text-xs font-mono text-center tabular-nums ${
                          countdown.startsWith('0:') ? 'text-destructive' : 'text-muted-foreground'
                        }`}>
                          {t('inviteSheet.expiresIn', { time: countdown })}
                        </p>
                        <button
                          onClick={() => setConfirmDelete(true)}
                          className="flex items-center gap-1.5 text-sm text-destructive hover:opacity-70 transition-opacity"
                        >
                          <TrashSimpleIcon size={14} /><span>{t('inviteSheet.deleteCode')}</span>
                        </button>
                      </>
                    )}
                    {!loadingInvitation && !activeInvitation && (
                      <>
                        {generateError && <p className="text-sm text-destructive text-center">{generateError}</p>}
                        <Button onClick={handleGenerateCode} disabled={generatingCode}>
                          {t('inviteSheet.createInvitationCode')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmActionSheet
        open={confirmDelete}
        message={t('inviteSheet.deleteInviteCode')}
        onConfirm={handleDeleteCode}
        onCancel={() => setConfirmDelete(false)}
      />
    </SheetPortal>
  )
}
