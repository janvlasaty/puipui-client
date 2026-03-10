import { useState, useRef, useCallback, useEffect } from 'react'
import { CheckIcon, UserIcon, XIcon } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { SheetPortal } from '@/components/ui/SheetPortal'
import { Button } from '@/components/ui/button'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { decodeAvatar, encodeAvatarForStorage } from '../../lib/utils'
import { updateProfile } from '../../repositories/profiles.repository'

const slideTransition = { type: 'spring' as const, stiffness: 300, damping: 32, mass: 0.8 }

const resizeImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 300
      const srcSize = Math.min(img.width, img.height)
      const sx = (img.width - srcSize) / 2
      const sy = (img.height - srcSize) / 2
      const outSize = Math.min(srcSize, MAX)
      const canvas = document.createElement('canvas')
      canvas.width = outSize
      canvas.height = outSize
      canvas.getContext('2d')!.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, outSize, outSize)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
    img.src = url
  })

type Props = {
  open: boolean
  onClose: () => void
}

export const EditProfileSheet = ({ open, onClose }: Props) => {
  const { session } = useAuth()
  const { profile, fetchProfile } = useProfile()

  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setName(profile?.name ?? '')
    setSurname(profile?.surname ?? '')
    setAvatarPreview(decodeAvatar(profile?.avatar ?? null))
    setSaved(false)
    setError(null)
  }, [open])

  const handleAvatarFile = useCallback(async (file: File) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPG and PNG files are supported')
      return
    }
    try {
      const dataUrl = await resizeImage(file)
      setAvatarPreview(dataUrl)
    } catch {
      setError('Failed to process image')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id || !name.trim() || !surname.trim()) return
    setSaving(true); setError(null); setSaved(false)
    const currentAvatar = decodeAvatar(profile?.avatar ?? null)
    const avatarChanged = avatarPreview !== currentAvatar
    const { error: updateError } = await updateProfile(
      session.user.id, name.trim(), surname.trim(),
      avatarChanged ? (avatarPreview ? encodeAvatarForStorage(avatarPreview) : null) : undefined,
    )
    if (updateError) {
      setError(updateError.message)
    } else {
      await fetchProfile(session.user.id)
      setSaved(true)
      setTimeout(() => onClose(), 600)
    }
    setSaving(false)
  }

  const isDirty = name !== (profile?.name ?? '') || surname !== (profile?.surname ?? '') || avatarPreview !== decodeAvatar(profile?.avatar ?? null)

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
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Edit profile</h3>
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground">
                  <XIcon size={16} />
                </button>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/jpeg,image/png"
                capture="user"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarFile(f); e.target.value = '' }}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarFile(f); e.target.value = '' }}
              />

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex flex-col items-center gap-3 pb-2">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                      <UserIcon size={28} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs rounded-full border border-border hover:bg-muted transition-colors"
                    >
                      Take photo
                    </button>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs rounded-full border border-border hover:bg-muted transition-colors"
                    >
                      Choose from library
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="name" className="text-sm font-medium">Name</label>
                  <input
                    id="name" type="text" value={name} autoFocus
                    onChange={(e) => { setName(e.target.value); setSaved(false) }}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                    disabled={saving} required
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="surname" className="text-sm font-medium">Surname</label>
                  <input
                    id="surname" type="text" value={surname}
                    onChange={(e) => { setSurname(e.target.value); setSaved(false) }}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                    disabled={saving} required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex items-center gap-3 pt-1">
                  <Button type="submit" className="flex-1" disabled={saving || !isDirty || !name.trim() || !surname.trim()}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </Button>
                  {saved && !isDirty && (
                    <span className="flex items-center gap-1 text-sm text-green-600 shrink-0">
                      <CheckIcon size={14} /> Saved
                    </span>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </SheetPortal>
  )
}
