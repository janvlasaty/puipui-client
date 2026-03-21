import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import { LandingPage } from './pages/LandingPage'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'
import { CreateProfilePage } from './pages/CreateProfilePage'
import { SelectProfilePage } from './pages/SelectProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import { ConversationListSkeleton } from './components/chat/ConversationListSkeleton'
import { ToastProvider, useToast } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { SheetProvider } from './components/ui/SheetPortal'
import { OverlayProvider } from './contexts/OverlayContext'

function AppInner() {
  const { t } = useTranslation()
  const { showToast } = useToast()

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // If a controller existed at mount, any future controllerchange is an update
    const hadController = !!navigator.serviceWorker.controller

    const handleControllerChange = () => {
      if (!hadController) return
      showToast(t('common.newVersionAvailable'), {
        duration: 0,
        action: { label: t('common.reload'), onClick: () => window.location.reload() },
      })
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
    return () => navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
  }, [])

  return <AppRoutes />
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SheetProvider>
          <OverlayProvider>
            <AppInner />
          </OverlayProvider>
        </SheetProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

function AppRoutes() {
  useEffect(() => {
    const interval = setInterval(async () => {
      const registration = await navigator.serviceWorker?.getRegistration()
      registration?.update()
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  const { session, loading } = useAuth()
  const { profile, loading: profileLoading, fetchProfile, fetchAllProfiles } = useProfile()
  const [hasMultipleProfiles, setHasMultipleProfiles] = useState(false)
  const [showProfileSelection, setShowProfileSelection] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
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
    return <ConversationListSkeleton />
  }

  if (!session) {
    if (showAuth) return <AuthPage />
    return <LandingPage onSignIn={() => setShowAuth(true)} />
  }

  if (showProfileSelection && hasMultipleProfiles) {
    return <SelectProfilePage />
  }

  if (!profile) {
    return <CreateProfilePage />
  }

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/chat/:roomId" element={<HomePage />} />
        <Route path="/chat" element={<HomePage />} />
        <Route path="/map" element={<HomePage />} />
        <Route path="/vibes" element={<HomePage />} />
        <Route path="/rooms" element={<HomePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/" element={<Navigate to="/chat" replace />} />
      </Routes>
    </Router>
  )
}

export default App
