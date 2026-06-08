import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
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
      <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 7.5 29.5 5.5 24 5.5 12.7 5.5 3.5 14.7 3.5 26S12.7 46.5 24 46.5 44.5 37.3 44.5 26c0-1.9-.2-3.6-.9-5.5z"/>
        <path fill="#FF3D00" d="M6.3 15.7l6.6 4.8C14.5 16.2 18.9 13.5 24 13.5c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 7.5 29.5 5.5 24 5.5c-7.7 0-14.4 4.4-17.7 10.2z"/>
        <path fill="#4CAF50" d="M24 46.5c5.4 0 10.3-1.9 14-5.1l-6.5-5.5c-2 1.5-4.7 2.4-7.5 2.4-5.1 0-9.6-3.3-11.2-8H6.2C9.4 40.9 16.2 46.5 24 46.5z"/>
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2.1-2 3.9-3.7 5.2l6.5 5.5C42.8 35.3 44.5 31 44.5 26c0-1.9-.2-3.6-.9-5.5z"/>
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (error) throw error
    } catch (e: any) { setError(e.message); setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', position: 'relative', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">

        {/* ── WELCOME ── */}
        {flow === 'welcome' && (
          <motion.div key="welcome"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column',
              padding: '0 30px 40px', position: 'relative' }}>
            <div className="ph" style={{ position: 'absolute', inset: 0, opacity: 0.5,
              maskImage: 'linear-gradient(to bottom, black, transparent 62%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 62%)' }} />
            <div style={{ flex: 1 }} />
            <div className="anim-up" style={{ position: 'relative' }}>
              <div className="eyebrow" style={{ color: 'var(--orange-deep)', marginBottom: 18 }}>· Bienvenidos a OurTime ·</div>
              <h1 className="display" style={{ fontSize: 52, margin: 0, lineHeight: 0.98 }}>
                Su<br />historia,<br />
                <span className="serif-i" style={{ color: 'var(--orange)' }}>un capítulo</span><br />a la vez.
              </h1>
              <p style={{ fontSize: 16.5, color: 'var(--ink-soft)', lineHeight: 1.55, marginTop: 22, maxWidth: 320 }}>
                Planes, recuerdos y cuentas compartidas en un mismo lugar. Escriban juntos lo que viene.
              </p>
              <button className="btn btn-orange btn-block" style={{ marginTop: 28, fontSize: 17 }} onClick={() => go('register')}>
                Crear cuenta <Icon name="arrowR" size={19} />
              </button>
              <button className="btn btn-ghost btn-block" style={{ marginTop: 12, fontSize: 16 }} onClick={() => go('login')}>
                Ya tengo cuenta — Iniciar sesión
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
                <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600, letterSpacing: '0.05em' }}>O</span>
                <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              </div>
              <GoogleBtn onClick={handleGoogle} loading={loading} />
            </div>
          </motion.div>
        )}

        {/* ── REGISTER ── */}
        {flow === 'register' && (
          <motion.div key="register"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35 }}
            style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 'max(56px, env(safe-area-inset-top) + 20px) 30px 40px' }}>
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
                {name.trim() ? name.trim()[0].toUpperCase() : '?'}
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
            style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 'max(56px, env(safe-area-inset-top) + 20px) 30px 40px' }}>
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
            style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 'max(56px, env(safe-area-inset-top) + 20px) 30px 40px' }}>
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
