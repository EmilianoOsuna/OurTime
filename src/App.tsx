import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { CurrencyProvider } from './context/CurrencyContext'
import { ConfirmProvider } from './components/ui/ConfirmDialog'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

function DuplicateAccountScreen({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--paper)', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '40px 28px', textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--orange-tint)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <svg width="32" height="32" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84-.02-.68z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 10 }}>
        ¿Ya tienes cuenta?
      </div>
      <p style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.6, maxWidth: 300, marginBottom: 28 }}>
        Parece que tu cuenta de Google no está vinculada a tu cuenta de OurTime. Cierra sesión e inicia con tu correo y contraseña.
      </p>
      <button onClick={onSignOut} style={{
        width: '100%', maxWidth: 320, border: '1.5px solid var(--line)', background: 'var(--card)',
        borderRadius: 999, padding: '14px 20px', fontSize: 15.5, fontWeight: 600,
        color: 'var(--ink)', cursor: 'pointer', fontFamily: 'var(--font-ui)',
        boxShadow: 'var(--sh-sm)',
      }}>
        Cerrar sesión e intentar de nuevo
      </button>
      <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 20, maxWidth: 280, lineHeight: 1.5 }}>
        Para usar Google como método de acceso, primero inicia sesión con tu correo y luego vincúlalo desde Perfil → Google Calendar.
      </p>
    </div>
  )
}

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
  const { session, user, profile, stories, isLoading, refreshProfile, refreshStories, signOut } = useAuth()
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [stateLoading, setStateLoading] = useState(true)

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        setNeedsOnboarding(false)
        setStateLoading(false)
      } else {
        if (profile) {
          setNeedsOnboarding(stories.length === 0)
        }
        setStateLoading(false)
      }
    }
  }, [isLoading, session, profile, stories])

  // Detect Google duplicate-account issue: signed in via Google but 0 stories and account is old
  const isGoogleProvider = session?.user?.app_metadata?.provider === 'google'
  const accountAgeMs = session?.user?.created_at
    ? Date.now() - new Date(session.user.created_at).getTime()
    : 0
  const likelyDuplicateAccount = needsOnboarding && isGoogleProvider && accountAgeMs > 5 * 60 * 1000

  const handleAuth = useCallback(() => setStateLoading(true), [])
  const handleOnboarded = useCallback(async () => {
    setNeedsOnboarding(false)
    if (user) await refreshProfile()
    await refreshStories()
  }, [user, refreshProfile, refreshStories])

  // Keep loading while auth is initializing OR session exists but profile hasn't loaded yet
  if (stateLoading || isLoading || (session && !profile)) return <Spinner />

  return (
    <Suspense fallback={<Spinner />}>
      {!session
        ? <Auth onAuth={handleAuth} />
        : likelyDuplicateAccount
          ? <DuplicateAccountScreen onSignOut={signOut} />
          : needsOnboarding
            ? <Onboarding onComplete={handleOnboarded} />
            : <AppShell />
      }
    </Suspense>
  )
}

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <ToastProvider>
        <CurrencyProvider>
          <ConfirmProvider>
            <AppInner />
          </ConfirmProvider>
        </CurrencyProvider>
      </ToastProvider>
    </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
