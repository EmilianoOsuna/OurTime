import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { isNative } from '../lib/native'
import { SocialLogin } from '@capgo/capacitor-social-login'
import { Icon } from '../components/ui/Icon'

type Flow = 'welcome' | 'register' | 'login' | 'forgot'

function GoogleBtn({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{
        width: '100%', border: '1.5px solid var(--line)', background: 'var(--card)',
        borderRadius: 999, padding: '14px 20px', fontSize: 15.5, fontWeight: 600,
        color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 12, fontFamily: 'var(--font-ui)', marginTop: 12,
        transition: 'all .18s', boxShadow: 'var(--sh-sm)',
      }}>
      <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84-.02-.68z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continuar con Google
    </button>
  )
}

export default function Auth({ onAuth }: { onAuth: () => void }) {
  const [flow, setFlow] = useState<Flow>('welcome')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const pwOk = password.length >= 8

  const resetFields = () => { setError(''); setForgotSent(false) }
  const go = (f: Flow) => { resetFields(); setFlow(f) }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !emailOk || !pwOk) return
    setLoading(true); setError('')
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: name.trim() } },
      })
      if (error) throw error
      if (data.session) onAuth()
      else setError('Revisa tu correo para confirmar tu cuenta.')
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailOk) return
    setLoading(true); setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      onAuth()
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailOk) return
    setLoading(true)
    try {
      await supabase.auth.resetPasswordForEmail(email)
      setForgotSent(true)
    } catch {}
    finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    try {
      if (isNative) {
        // Clear native session cache first to force account picker
        try {
          await SocialLogin.logout({ provider: 'google' })
        } catch (_) {}

        // Native Google Sign-In on mobile devices
        const result = await SocialLogin.login({
          provider: 'google',
          options: {
            scopes: ['email', 'profile', 'https://www.googleapis.com/auth/calendar.events'],
            style: 'bottom',
            filterByAuthorizedAccounts: false,
            autoSelectEnabled: false,
          },
        })

        if (result.result.responseType === 'online' && result.result.idToken) {
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: result.result.idToken,
          })
          if (error) throw error
          if (data.session) {
            onAuth() // transition screen immediately

            // If the native login successfully returned an access token, save it to automatically connect Google Calendar in background
            if (result.result.accessToken?.token) {
              const userId = data.session.user.id
              Promise.all([
                supabase.from('user_secrets').upsert({
                  user_id: userId,
                  name: 'google_calendar_token',
                  value: result.result.accessToken.token,
                }, { onConflict: 'user_id,name' }),
                supabase.from('user_secrets').upsert({
                  user_id: userId,
                  name: 'google_calendar_token_expires_at',
                  value: String(Date.now() + 50 * 60 * 1000),
                }, { onConflict: 'user_id,name' }),
                supabase.from('profiles').update({
                  google_calendar_enabled: true,
                }).eq('id', userId)
              ]).catch(console.error)
            }
          } else {
            throw new Error('No se pudo establecer la sesión nativa.')
          }
        } else {
          throw new Error('Inicio de sesión cancelado o respuesta de Google no compatible.')
        }
      } else {
        // Web-based Google OAuth redirect requesting Calendar scope and offline access to get the refresh token
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
            skipBrowserRedirect: false,
            scopes: 'email profile https://www.googleapis.com/auth/calendar.events',
            queryParams: { access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true' },
          },
        })
        if (error) throw error
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e)
      // If the user simply cancelled or closed the prompt, don't show it as a loud error card
      if (errMsg.includes('cancel') || errMsg.includes('Cancel') || errMsg.includes('12501')) {
        console.log('[Auth] Google sign-in cancelled by user')
      } else {
        setError(errMsg)
      }
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', position: 'relative', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">

        {/* ── WELCOME ── */}
        {flow === 'welcome' && (
          <motion.div key="welcome"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

            {/* Hero image — top 44% */}
            <div className="ph" style={{
              height: '44%', flexShrink: 0,
              maskImage: 'linear-gradient(to bottom, black 55%, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent)',
            }} />

            {/* Content — distributes title at top, buttons at bottom */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              padding: '20px 28px max(72px, env(safe-area-inset-bottom, 72px))',
            }}>
              <div className="anim-up">
                <div className="eyebrow" style={{ color: 'var(--orange-deep)', marginBottom: 14 }}>· Bienvenidos a OurTime ·</div>
                <h1 className="display" style={{ fontSize: 40, margin: 0, lineHeight: 0.98 }}>
                  Su historia,<br />
                  <span className="serif-i" style={{ color: 'var(--orange)' }}>un momento</span><br />a la vez.
                </h1>
                <p style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.55, marginTop: 14, maxWidth: 300 }}>
                  Planes, recuerdos y cuentas compartidas. Escriban juntos lo que viene.
                </p>
              </div>

              <div className="anim-up">
                <button className="btn btn-orange btn-block" style={{ fontSize: 16 }} onClick={() => go('register')}>
                  Crear cuenta <Icon name="arrowR" size={18} />
                </button>
                <button className="btn btn-ghost btn-block" style={{ marginTop: 10, fontSize: 15 }} onClick={() => go('login')}>
                  Ya tengo cuenta — Iniciar sesión
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
                  <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                  <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600, letterSpacing: '0.05em' }}>O</span>
                  <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                </div>
                <GoogleBtn onClick={handleGoogle} loading={loading} />
                {error && (
                  <div style={{ fontSize: 13, color: '#c0392b', background: 'rgba(192,57,43,0.08)',
                    padding: '10px 14px', borderRadius: 10, fontWeight: 500, marginTop: 12 }}>{error}</div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── REGISTER ── */}
        {flow === 'register' && (
          <motion.div key="register"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35 }}
            style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 'max(56px, env(safe-area-inset-top, 0px) + 20px) 30px max(48px, env(safe-area-inset-bottom, 48px))' }}>
            <button onClick={() => go('welcome')} style={{
              display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'transparent',
              cursor: 'pointer', color: 'var(--ink-soft)', fontSize: 14, fontWeight: 600, marginBottom: 32, padding: 0,
            }}>
              <Icon name="chevL" size={18} /> Volver
            </button>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Tu cuenta</div>
            <h1 className="display" style={{ fontSize: 38, margin: '0 0 6px', lineHeight: 1.02 }}>
              Crea tu <span className="serif-i" style={{ color: 'var(--orange)' }}>cuenta</span>
            </h1>
            <p style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.5, margin: '0 0 20px' }}>
              Solo tú y tu pareja tendrán acceso a su historia.
            </p>

            {/* Avatar preview */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 22px' }}>
              <div className="avatar" style={{ width: 76, height: 76, fontSize: 34,
                background: name.trim() ? 'var(--orange)' : 'var(--card-2)',
                color: name.trim() ? '#fff' : 'var(--ink-faint)',
                animation: 'pop .5s cubic-bezier(.2,.8,.2,1) both',
                boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.3)' }}>
                {name.trim() ? name.trim().charAt(0).toUpperCase() : '?'}
              </div>
            </div>

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <label className="field-label">Tu nombre</label>
              <input className="field" placeholder="Mateo" value={name} autoFocus
                onChange={e => setName(e.target.value)} style={{ marginBottom: 16 }} />

              <label className="field-label">Correo electrónico</label>
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <input className="field" type="email" placeholder="mateo@correo.com"
                  value={email} onChange={e => setEmail(e.target.value)} style={{ paddingRight: 44 }} />
                {email && (
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    color: emailOk ? 'var(--done)' : 'var(--orange-deep)' }}>
                    <Icon name={emailOk ? 'checkCircle' : 'x'} size={18} />
                  </span>
                )}
              </div>

              <label className="field-label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input className="field" placeholder="Mínimo 8 caracteres"
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-faint)', padding: 4,
                }}>
                  <Icon name={showPw ? 'x' : 'wifi'} size={17} />
                </button>
              </div>
              {password && !pwOk && (
                <div style={{ fontSize: 12, color: 'var(--orange-deep)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="x" size={12} /> Mínimo 8 caracteres
                </div>
              )}

              {error && (
                <div style={{ fontSize: 13, color: '#c0392b', background: 'rgba(192,57,43,0.08)',
                  padding: '10px 14px', borderRadius: 10, fontWeight: 500, marginTop: 12 }}>{error}</div>
              )}

              <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 18, lineHeight: 1.5 }}>
                Al continuar aceptas los Términos de uso y la Política de privacidad de OurTime.
              </div>

              <button type="submit" className="btn btn-primary btn-block"
                disabled={!name.trim() || !emailOk || !pwOk || loading} style={{ marginTop: 20 }}>
                {loading ? <span style={{ display: 'flex', gap: 4 }}>
                  {[0,1,2].map(i => <span key={i} className="dot" style={{ background: '#FBF6EE',
                    animation: `pulse 1s ${i*0.15}s infinite` }} />)}
                </span> : <>Continuar <Icon name="arrowR" size={18} /></>}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
              <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600, letterSpacing: '0.05em' }}>O</span>
              <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            </div>
            <GoogleBtn onClick={handleGoogle} loading={loading} />

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--ink-soft)' }}>
              ¿Ya tienes cuenta?{' '}
              <b style={{ color: 'var(--ink)', cursor: 'pointer' }} onClick={() => go('login')}>Inicia sesión</b>
            </div>
          </motion.div>
        )}

        {/* ── LOGIN ── */}
        {flow === 'login' && (
          <motion.div key="login"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35 }}
            style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 'max(56px, env(safe-area-inset-top, 0px) + 20px) 30px max(48px, env(safe-area-inset-bottom, 48px))' }}>
            <button onClick={() => go('welcome')} style={{
              display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'transparent',
              cursor: 'pointer', color: 'var(--ink-soft)', fontSize: 14, fontWeight: 600, marginBottom: 32, padding: 0,
            }}>
              <Icon name="chevL" size={18} /> Volver
            </button>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Bienvenido de nuevo</div>
            <h1 className="display" style={{ fontSize: 38, margin: '0 0 6px', lineHeight: 1.02 }}>
              Iniciar <span className="serif-i" style={{ color: 'var(--orange)' }}>sesión</span>
            </h1>
            <p style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.5, margin: '0 0 28px' }}>
              Tu historia te está esperando.
            </p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <label className="field-label">Correo electrónico</label>
              <input className="field" type="email" placeholder="mateo@correo.com" autoFocus
                value={email} onChange={e => setEmail(e.target.value)} style={{ marginBottom: 16 }} />

              <label className="field-label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input className="field" placeholder="Tu contraseña"
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-faint)', padding: 4,
                }}>
                  <Icon name={showPw ? 'x' : 'wifi'} size={17} />
                </button>
              </div>

              <button type="button" onClick={() => go('forgot')} style={{
                border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'right',
                fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600, marginTop: 10, padding: 0,
              }}>
                ¿Olvidaste tu contraseña?
              </button>

              {error && (
                <div style={{ fontSize: 13, color: '#c0392b', background: 'rgba(192,57,43,0.08)',
                  padding: '10px 14px', borderRadius: 10, fontWeight: 500, marginTop: 8 }}>{error}</div>
              )}

              <button type="submit" className="btn btn-primary btn-block"
                disabled={!emailOk || !password || loading} style={{ marginTop: 20 }}>
                {loading ? <span style={{ display: 'flex', gap: 4 }}>
                  {[0,1,2].map(i => <span key={i} className="dot" style={{ background: '#FBF6EE',
                    animation: `pulse 1s ${i*0.15}s infinite` }} />)}
                </span> : <>Entrar <Icon name="arrowR" size={18} /></>}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
              <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600, letterSpacing: '0.05em' }}>O</span>
              <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            </div>
            <GoogleBtn onClick={handleGoogle} loading={loading} />

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--ink-soft)' }}>
              ¿No tienes cuenta?{' '}
              <b style={{ color: 'var(--ink)', cursor: 'pointer' }} onClick={() => go('register')}>Regístrate</b>
            </div>
          </motion.div>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {flow === 'forgot' && (
          <motion.div key="forgot"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35 }}
            style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 'max(56px, env(safe-area-inset-top, 0px) + 20px) 30px max(48px, env(safe-area-inset-bottom, 48px))' }}>
            <button onClick={() => go('login')} style={{
              display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'transparent',
              cursor: 'pointer', color: 'var(--ink-soft)', fontSize: 14, fontWeight: 600, marginBottom: 32, padding: 0,
            }}>
              <Icon name="chevL" size={18} /> Volver
            </button>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Recuperar acceso</div>
            <h1 className="display" style={{ fontSize: 34, margin: '0 0 10px', lineHeight: 1.05 }}>
              ¿Olvidaste tu<br />contraseña?
            </h1>
            <p style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.55, margin: '0 0 28px' }}>
              Te enviamos un enlace para recuperarla.
            </p>

            {!forgotSent ? (
              <form onSubmit={handleForgot}>
                <label className="field-label">Correo electrónico</label>
                <input className="field" type="email" placeholder="mateo@correo.com" autoFocus
                  value={email} onChange={e => setEmail(e.target.value)} />
                <button type="submit" className="btn btn-primary btn-block"
                  disabled={!emailOk || loading} style={{ marginTop: 24 }}>
                  {loading ? '…' : <>Enviar enlace <Icon name="arrowR" size={18} /></>}
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600,
                color: 'var(--done)', fontSize: 15 }}>
                <Icon name="checkCircle" size={20} /> Correo enviado — revisa tu bandeja
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
