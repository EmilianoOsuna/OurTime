import { useState, useEffect, useCallback } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { CurrencyProvider } from './context/CurrencyContext'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import AppShell from './components/AppShell'

function AppInner() {
  const { session, user, profile, isLoading, refreshProfile } = useAuth()
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [stateLoading, setStateLoading] = useState(true)

  // AuthContext already fetches the profile on session init — no redundant call needed here.
  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        setStateLoading(false)
      } else if (profile) {
        setNeedsOnboarding(!profile.couple_id)
        setStateLoading(false)
      } else {
        // session activa pero sin fila en profiles (trigger pendiente o primer login)
        setNeedsOnboarding(true)
        setStateLoading(false)
      }
    }
  }, [isLoading, session, profile])

  const handleAuth = useCallback(() => setStateLoading(true), [])
  const handleOnboarded = useCallback(async () => {
    setNeedsOnboarding(false)
    if (user) await refreshProfile()
  }, [user, refreshProfile])

  if (stateLoading || isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex',
        alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--orange)',
          borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (!session) return <Auth onAuth={handleAuth} />
  if (needsOnboarding) return <Onboarding onComplete={handleOnboarded} />
  return <AppShell />
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CurrencyProvider>
          <AppInner />
        </CurrencyProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
