import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { Button } from '@/components/ui/button'
import { supabase } from '../lib/supabase'

export const InterestsPage = () => {
  const { session: _session } = useAuth()
  const { profile } = useProfile()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 bg-background border-b border-border px-4 py-4 z-10">
        <div className="max-w-2xl mx-auto w-full flex items-center">
          <h1 className="text-lg font-semibold">Interests</h1>
        </div>
      </div>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-muted-foreground">
              Welcome, {profile?.name} {profile?.surname}!
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 text-center">
            <p className="text-muted-foreground mb-4">Manage your interests</p>
            <p className="text-sm text-muted-foreground">Personalize your experience by selecting your interests</p>
          </div>

          <div className="flex gap-3 justify-center mt-8">
            <Button onClick={handleSignOut} variant="destructive">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
