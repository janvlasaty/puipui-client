import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usePois } from '../hooks/usePois'
import { supabase } from '../lib/supabase'
import { Button } from '@/components/ui/button'

export const HomePage = () => {
  const { session } = useAuth()
  const { pois, loading, error, fetchPois } = usePois()
  const [showPois, setShowPois] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleFetchPois = async () => {
    await fetchPois()
    setShowPois(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Welcome!</h1>
            <p className="text-muted-foreground mb-6">
              You are signed in as: <span className="font-semibold text-foreground">{session?.user?.email}</span>
            </p>
          </div>

          <div className="flex gap-3 justify-center mb-8">
            <Button onClick={handleFetchPois} disabled={loading}>
              {loading ? 'Loading POIs...' : 'Fetch POIs'}
            </Button>
            <Button onClick={handleSignOut} variant="destructive">
              Sign Out
            </Button>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-6">
              <p className="text-destructive font-semibold">Error: {error}</p>
            </div>
          )}

          {showPois && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">POIs Data</h2>
              <p className="text-sm text-muted-foreground mb-3">Total: {pois.length} POIs</p>
              <pre className="bg-muted p-4 rounded overflow-auto max-h-96 text-sm">
                {JSON.stringify(pois, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
