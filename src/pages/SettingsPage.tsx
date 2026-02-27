import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'
import { updateProfile } from '../repositories/profiles.repository'

export const SettingsPage = () => {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { profile, fetchProfile } = useProfile()
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-muted rounded transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold">Settings</h1>
      </div>

      <div className="px-4 py-6 max-w-md">
        <h2 className="text-sm font-medium text-muted-foreground mb-4">PROFILE</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setSaved(false) }}
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={saving}
              required
            />
          </div>

          <div>
            <label htmlFor="surname" className="block text-sm font-medium mb-1">Surname</label>
            <input
              id="surname"
              type="text"
              value={surname}
              onChange={(e) => { setSurname(e.target.value); setSaved(false) }}
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={saving}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm text-green-600">Saved</p>}

          <Button
            type="submit"
            className="w-full"
            disabled={saving || !name.trim() || !surname.trim()}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-border">
          <Button onClick={handleSignOut} variant="destructive" className="w-full">
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
