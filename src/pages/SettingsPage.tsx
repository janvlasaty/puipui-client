import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, User, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'
import { updateProfile } from '../repositories/profiles.repository'

const slideTransition = { type: 'spring' as const, stiffness: 300, damping: 32, mass: 0.8 }

export const SettingsPage = () => {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { profile, fetchProfile } = useProfile()
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExiting, setIsExiting] = useState(false)

  const handleBack = async () => {
    setIsExiting(true)
    await new Promise((r) => setTimeout(r, 280))
    navigate(-1)
  }

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setSurname(profile.surname)
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id || !name.trim() || !surname.trim()) return

    setSaving(true)
    setError(null)
    setSaved(false)

    const { error: updateError } = await updateProfile(session.user.id, name.trim(), surname.trim())

    if (updateError) {
      setError(updateError.message)
    } else {
      await fetchProfile(session.user.id)
      setSaved(true)
    }

    setSaving(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const isDirty = name !== (profile?.name ?? '') || surname !== (profile?.surname ?? '')

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={{ x: '100%' }}
      animate={{ x: isExiting ? '100%' : 0 }}
      transition={slideTransition}
    >
      <div className="sticky top-0 z-10 bg-background px-4 py-4 border-b border-border">
        <div className="max-w-2xl mx-auto w-full flex items-center gap-3">
          <button onClick={handleBack} className="p-1 hover:bg-muted rounded transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </div>

      <div className="px-4 py-6 max-w-sm mx-auto space-y-8">

        <section>
          <div className="flex items-center gap-2 mb-4">
            <User size={14} className="text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profile</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="name" className="text-sm font-medium">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setSaved(false) }}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                disabled={saving}
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="surname" className="text-sm font-medium">Surname</label>
              <input
                id="surname"
                type="text"
                value={surname}
                onChange={(e) => { setSurname(e.target.value); setSaved(false) }}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                disabled={saving}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Button
                type="submit"
                className="flex-1"
                disabled={saving || !isDirty || !name.trim() || !surname.trim()}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
              {saved && !isDirty && (
                <span className="flex items-center gap-1 text-sm text-green-600 shrink-0">
                  <Check size={14} /> Saved
                </span>
              )}
            </div>
          </form>
        </section>

        <section className="border-t border-border pt-6">
          <p className="text-xs text-muted-foreground text-center mb-6">
            Build <span className="font-mono">{import.meta.env.VITE_COMMIT_HASH}</span>
          </p>
        </section>

        <section className="border-t border-border pt-6 space-y-3">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full"
          >
            <RefreshCw size={14} />
            Reload app
          </Button>
          <Button onClick={handleSignOut} variant="destructive" className="w-full">
            Sign out
          </Button>
        </section>

      </div>
    </motion.div>
  )
}
