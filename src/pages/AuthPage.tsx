import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'

const BASE = import.meta.env.BASE_URL

export const AuthPage = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setSuccess('Check your email for a confirmation link.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src={`${BASE}puipui-192x192.png`} alt="PuiPui" className="w-16 h-16 rounded-2xl shadow-sm" />
          <span
            className="text-6xl font-extrabold tracking-tight bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to bottom, #B8800A, #EDD020)' }}
          >
            PuiPui
          </span>
          <p className="text-muted-foreground text-sm">
            {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow placeholder:text-muted-foreground"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}
          {success && (
            <p className="text-sm text-primary bg-primary/10 rounded-lg px-3 py-2">{success}</p>
          )}

          <Button type="submit" className="w-full mt-1" disabled={loading}>
            {loading ? '...' : mode === 'signin' ? 'Sign in' : 'Sign up'}
          </Button>
        </form>

        {/* Toggle */}
        <p className="text-center text-sm text-muted-foreground mt-5">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setSuccess(null) }}
            className="text-primary font-medium hover:underline"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

      </div>
    </div>
  )
}
