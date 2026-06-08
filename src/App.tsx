import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { CurrencyProvider } from './context/CurrencyContext'
import { ConfirmProvider } from './components/ui/ConfirmDialog'

const Auth = lazy(() => import('./pages/Auth'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const AppShell = lazy(() => import('./components/AppShell'))

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex',
      alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--orange)',
        borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}

function AppInner() {
  const { session, user, profile, stories, isLoading, refreshProfile, refreshStories } = useAuth()
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [stateLoading, setStateLoading] = useState(true)

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        setStateLoading(false)
      } else if (profile || session) {
        setNeedsOnboarding(stories.length === 0)
        setStateLoading(false)
      }
    }
  }, [isLoading, session, profile, stories])

  const handleAuth = useCallback(() => setStateLoading(true), [])
  const handleOnboarded = useCallback(async () => {
    setNeedsOnboarding(false)
    if (user) await refreshProfile()
    await refreshStories()
  }, [user, refreshProfile, refreshStories])

  if (stateLoading || isLoading) return <Spinner />

  return (
    <Suspense fallback={<Spinner />}>
      {!session ? <Auth onAuth={handleAuth} /> : needsOnboarding ? <Onboarding onComplete={handleOnboarded} /> : <AppShell />}
    </Suspense>
  )
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CurrencyProvider>
          <ConfirmProvider>
            <AppInner />
          </ConfirmProvider>
        </CurrencyProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
