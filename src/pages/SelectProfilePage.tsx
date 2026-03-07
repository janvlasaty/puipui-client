import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import type { Profile } from '../hooks/useProfile'
import { decodeAvatar } from '../lib/utils'

export const SelectProfilePage = () => {
  const { session } = useAuth()
  const { fetchProfile, fetchAllProfiles, loading, error } = useProfile()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(true)

  useEffect(() => {
    const loadProfiles = async () => {
      if (session?.user?.id) {
        const allProfiles = await fetchAllProfiles(session.user.id)
        if (allProfiles) {
          setProfiles(allProfiles)
        }
      }
      setLoadingProfiles(false)
    }

    loadProfiles()
  }, [session?.user?.id, fetchAllProfiles])

  const handleSelectProfile = async (profileId: string) => {
    const selectedProfile = profiles.find((p) => p.id === profileId)
    if (selectedProfile) {
      await fetchProfile(selectedProfile.user_id)
    }
  }

  if (loadingProfiles) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">Loading profiles...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Select Profile</h1>
          <p className="text-muted-foreground mt-2">Choose which profile to use</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-6">
            <p className="text-destructive font-semibold">Error: {error}</p>
          </div>
        )}

        {profiles.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <p className="text-muted-foreground mb-4">No profiles found</p>
            <p className="text-sm text-muted-foreground">Create a new profile to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleSelectProfile(profile.id)}
                disabled={loading}
                className="w-full bg-card rounded-lg border border-border p-4 hover:bg-card/80 hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-center gap-3">
                  {decodeAvatar(profile.avatar) && (
                    <img
                      src={decodeAvatar(profile.avatar)!}
                      alt={`${profile.name} ${profile.surname}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-foreground">
                      {profile.name} {profile.surname}
                    </p>
                    <p className="text-sm text-muted-foreground">Created {new Date(profile.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
