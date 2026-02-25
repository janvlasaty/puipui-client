import { useAuth } from './hooks/useAuth'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'

function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!session) {
    return <AuthPage />
  }

  return <HomePage />
}

export default App
