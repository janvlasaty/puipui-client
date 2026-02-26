import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { Button } from '@/components/ui/button'

export const CreateProfilePage = () => {
  const { session } = useAuth()
  const { createProfile, loading, error } = useProfile()
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !surname.trim()) {
      return
    }

    if (session?.user?.id) {
      const result = await createProfile(name, surname, session.user.id)
      if (result) {
        setSuccess(true)
        setName('')
        setSurname('')
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Create Your Profile</h1>
          <p className="text-muted-foreground mt-2">Let's get to know you!</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          {success && (
            <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 mb-6">
              <p className="text-green-700 font-semibold">Profile created successfully!</p>
              <p className="text-sm text-green-600 mt-1">Redirecting to home...</p>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-6">
              <p className="text-destructive font-semibold">Error: {error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loading || success}
                required
              />
            </div>

            <div>
              <label htmlFor="surname" className="block text-sm font-medium mb-2">
                Surname
              </label>
              <input
                id="surname"
                type="text"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                placeholder="Enter your surname"
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loading || success}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || success || !name.trim() || !surname.trim()}>
              {loading ? 'Creating Profile...' : 'Create Profile'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
