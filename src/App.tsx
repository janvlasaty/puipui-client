import { useEffect, useState, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'
import { CreateProfilePage } from './pages/CreateProfilePage'
import { SelectProfilePage } from './pages/SelectProfilePage'

function App() {
  const { session, loading } = useAuth()
  const { profile, loading: profileLoading, fetchProfile, fetchAllProfiles } = useProfile()
  const [hasMultipleProfiles, setHasMultipleProfiles] = useState(false)
  const [showProfileSelection, setShowProfileSelection] = useState(false)
  const hasCheckedProfiles = useRef(false)

  useEffect(() => {
    if (session?.user?.id && !hasCheckedProfiles.current && !profileLoading) {
      hasCheckedProfiles.current = true
      checkProfilesCount()
    }
  }, [session?.user?.id, profileLoading, fetchAllProfiles, fetchProfile])

  const checkProfilesCount = async () => {
    if (!session?.user?.id) return

    const profiles = await fetchAllProfiles(session.user.id)
    if (profiles && profiles.length > 1) {
      setHasMultipleProfiles(true)
      setShowProfileSelection(true)
    } else if (profiles && profiles.length === 1) {
      // Automatically select the only profile
      await fetchProfile(session.user.id)
    }
  }

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!session) {
    return <AuthPage />
  }

  if (showProfileSelection && hasMultipleProfiles) {
    return <SelectProfilePage />
  }

  if (!profile) {
    return <CreateProfilePage />
  }

  return (
    <Router basename="/puipui-client">
      <Routes>
        <Route path="/chat/:roomId" element={<HomePage />} />
        <Route path="/chat" element={<HomePage />} />
        <Route path="/map" element={<HomePage />} />
        <Route path="/interests" element={<HomePage />} />
        <Route path="/" element={<Navigate to="/chat" replace />} />
      </Routes>
    </Router>
  )
}

export default App
