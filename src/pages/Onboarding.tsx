import { useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '../components/ui/Icon'
import { Confetti } from '../components/ui/Confetti'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const WORDS = ['LUNA', 'ROSA', 'CIELO', 'MAR', 'SOL', 'AMOR', 'NOVA', 'EDEN']
function genCode() {
  const w = WORDS[Math.floor(Math.random() * WORDS.length)]
  const n = Math.floor(1000 + Math.random() * 9000)
  return `${w}-${n}`
}

const ME = { name: 'Tú', initial: 'M', color: '#0474BA' }

function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [mode, setMode] = useState<'create' | 'join' | null>(null)
  const [code, setCode] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const go = (n: number) => { setError(''); setStep(n) }

  const createCouple = async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const ic = genCode()
      const { data, error: insErr } = await supabase.from('couples').insert({
        invite_code: ic,
        created_by: user.id,
      }).select('id').single()
      if (insErr) throw insErr
      const { error: updErr } = await supabase.from('profiles').update({
        full_name: name.trim() || null,
        couple_id: data.id,
      }).eq('id', user.id)
      if (updErr) throw updErr
      setInviteCode(ic)
      go(3)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const joinCouple = async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const { data, error: selErr } = await supabase.from('couples')
        .select('id').eq('invite_code', code.trim().toUpperCase()).single()
      if (selErr || !data) throw new Error('Código no encontrado. Comprueba con tu pareja.')
      const { error: updErr } = await supabase.from('profiles').update({
        full_name: name.trim() || null,
        couple_id: data.id,
      }).eq('id', user.id)
      if (updErr) throw updErr
      go(4)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const pickMode = (m: 'create' | 'join') => {
    setMode(m)
    if (m === 'create') createCouple()
    else go(3)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', position: 'relative' }}>
      {step > 0 && step < 4 && (
        <div style={{ position: 'fixed', top: 64, left: 24, right: 24, zIndex: 10, display: 'flex', gap: 6 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2,
              background: i <= step ? 'var(--orange)' : 'var(--line)', transition: 'background .4s' }} />
          ))}
        </div>
      )}

      <div className="ot-scroll" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {step === 0 && <Welcome onNext={() => go(1)} />}
        {step === 1 && <NameStep name={name} setName={setName} onNext={() => go(2)} />}
        {step === 2 && <LinkStep onPick={pickMode} loading={loading} error={error} />}
        {step === 3 && mode === 'create' && <WaitStep invite={inviteCode} onContinue={() => go(4)} />}
        {step === 3 && mode === 'join' && (
          <JoinStep code={code} setCode={setCode} error={error} loading={loading} onNext={joinCouple} />
        )}
        {step === 4 && <ReadyStep name={name} onComplete={onComplete} />}
      </div>
    </div>
  )
}

function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '0 30px 40px', position: 'relative' }}>
      <div className="ph" style={{ position: 'absolute', inset: 0, opacity: 0.5,
        maskImage: 'linear-gradient(to bottom, black, transparent 62%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 62%)' }}>
        <span className="ph-label" style={{ position: 'absolute', top: 90, right: 18 }}>foto de portada</span>
      </div>
      <div style={{ flex: 1 }} />
      <div className="anim-up" style={{ position: 'relative' }}>
        <div className="eyebrow" style={{ color: 'var(--orange-deep)', marginBottom: 18 }}>· Bienvenidos a OurTime ·</div>
        <h1 className="display" style={{ fontSize: 52, margin: 0, lineHeight: 0.98 }}>
          Nuestra<br />historia,<br />
          <span className="serif-i" style={{ color: 'var(--orange)' }}>un capítulo</span><br />a la vez.
        </h1>
        <p style={{ fontSize: 16.5, color: 'var(--ink-soft)', lineHeight: 1.55, marginTop: 22, maxWidth: 320, textWrap: 'pretty' }}>
          Planes, recuerdos y cuentas compartidas en un mismo lugar. Escriban juntos lo que viene.
        </p>
        <button className="btn btn-orange btn-block" style={{ marginTop: 28, fontSize: 17 }} onClick={onNext}>
          Empezar nuestra historia <Icon name="arrowR" size={19} />
        </button>
      </div>
    </div>
  )
}

function NameStep({ name, setName, onNext }: { name: string; setName: (v: string) => void; onNext: () => void }) {
  return (
    <StepShell no="01" eyebrow="Tu perfil"
      title={<>¿Cómo te <span className="serif-i" style={{ color: 'var(--orange)' }}>llaman</span>?</>}
      sub="Tu pareja te verá así en cada capítulo que escribáis.">
      <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 26px' }}>
        <div className="avatar" style={{ width: 88, height: 88, background: 'var(--blue)', fontSize: 40,
          animation: 'pop .5s cubic-bezier(.2,.8,.2,1) both' }}>
          {name.trim() ? name.trim()[0].toUpperCase() : '—'}
        </div>
      </div>
      <label className="field-label">Tu nombre</label>
      <input className="field" placeholder="Mateo" value={name} autoFocus
        onChange={e => setName(e.target.value)} />
      <div style={{ flex: 1 }} />
      <button className="btn btn-primary btn-block" disabled={!name.trim()} onClick={onNext}>
        Continuar <Icon name="arrowR" size={18} />
      </button>
    </StepShell>
  )
}

function LinkStep({ onPick, loading, error }: {
  onPick: (m: 'create' | 'join') => void; loading: boolean; error: string
}) {
  return (
    <StepShell no="02" eyebrow="Su espacio"
      title={<>Son <span className="serif-i" style={{ color: 'var(--orange)' }}>dos</span>.<br />Conéctalo.</>}
      sub="Una historia se escribe a cuatro manos. Crea su espacio o únete al de tu pareja.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
        <PickCard accent="orange" icon="feather" title="Crear nuestro espacio"
          body="Genera un código y compártelo con tu pareja."
          onClick={() => !loading && onPick('create')} />
        <PickCard accent="blue" icon="users" title="Unirme a mi pareja"
          body="Ya tienes un código de invitación."
          onClick={() => !loading && onPick('join')} />
      </div>
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 24 }}>
          {[0, 1, 2].map(i => (
            <span key={i} className="dot" style={{ background: 'var(--orange)',
              animation: `pulse 1s ${i * 0.15}s infinite` }} />
          ))}
        </div>
      )}
      {error && (
        <div style={{ fontSize: 13, color: '#c0392b', background: 'rgba(192,57,43,0.08)',
          padding: '10px 14px', borderRadius: 10, fontWeight: 500, marginTop: 12 }}>{error}</div>
      )}
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center',
        color: 'var(--ink-faint)', fontSize: 13 }}>
        <Icon name="heart" size={14} /> Privado para ustedes dos
      </div>
    </StepShell>
  )
}

function PickCard({ accent, icon, title, body, onClick }: {
  accent: string; icon: string; title: string; body: string; onClick: () => void
}) {
  const col = accent === 'blue' ? 'var(--blue)' : 'var(--orange)'
  const tint = accent === 'blue' ? 'var(--blue-tint)' : 'var(--orange-tint)'
  return (
    <button onClick={onClick} className="ot-card" style={{
      display: 'flex', alignItems: 'center', gap: 15, padding: 16, textAlign: 'left',
      border: 'none', cursor: 'pointer', width: '100%',
    }}>
      <div style={{ width: 52, height: 52, borderRadius: 15, background: tint, color: col,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={26} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 16.5 }}>{title}</div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 2, lineHeight: 1.35 }}>{body}</div>
      </div>
      <Icon name="chevR" size={20} style={{ color: 'var(--ink-faint)' }} />
    </button>
  )
}

function WaitStep({ invite, onContinue }: { invite: string; onContinue: () => void }) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const text = `Únete a nuestra historia en OurTime con el código: ${invite}`
    if (navigator.share) {
      await navigator.share({ text })
    } else {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }
  }

  return (
    <StepShell no="03" eyebrow="Invitación"
      title={<>Comparte <span className="serif-i" style={{ color: 'var(--orange)' }}>el código</span></>}
      sub="Tu pareja lo introduce en su OurTime y quedan vinculados al instante.">
      <div className="ot-card" style={{ padding: '26px 20px', textAlign: 'center', marginTop: 6 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Código de invitación</div>
        <div className="display" style={{ fontSize: 40, letterSpacing: '0.08em', color: 'var(--orange-deep)' }}>{invite}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-soft" style={{ flex: 1 }}
            onClick={() => { navigator.clipboard.writeText(invite); setCopied(true); setTimeout(() => setCopied(false), 1600) }}>
            <Icon name={copied ? 'check' : 'copy'} size={17} /> {copied ? 'Copiado' : 'Copiar'}
          </button>
          <button className="btn btn-orange" style={{ flex: 1 }} onClick={share}>
            <Icon name="share" size={17} /> Compartir
          </button>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <button className="btn btn-primary btn-block" onClick={onContinue}>
        Continuar <Icon name="arrowR" size={18} />
      </button>
    </StepShell>
  )
}

function JoinStep({ code, setCode, error, loading, onNext }: {
  code: string; setCode: (v: string) => void; error: string; loading: boolean; onNext: () => void
}) {
  const ok = code.replace(/[^A-Za-z0-9]/g, '').length >= 6
  return (
    <StepShell no="03" eyebrow="Vincular"
      title={<>Introduce <span className="serif-i" style={{ color: 'var(--blue)' }}>el código</span></>}
      sub="Tu pareja lo encuentra al crear su espacio compartido.">
      <label className="field-label">Código de invitación</label>
      <input className="field" placeholder="LUNA-7432" value={code} autoFocus
        style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: '0.06em', textAlign: 'center' }}
        onChange={e => setCode(e.target.value.toUpperCase())} />
      {error && (
        <div style={{ fontSize: 13, color: '#c0392b', background: 'rgba(192,57,43,0.08)',
          padding: '10px 14px', borderRadius: 10, fontWeight: 500, marginTop: 12 }}>{error}</div>
      )}
      <div style={{ flex: 1 }} />
      <button className="btn btn-blue btn-block" disabled={!ok || loading} onClick={onNext}>
        {loading ? <span style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          {[0, 1, 2].map(i => <span key={i} className="dot" style={{ background: '#fff',
            animation: `pulse 1s ${i * 0.15}s infinite` }} />)}
        </span> : <><Icon name="heart" size={17} /> Vincular ahora</>}
      </button>
    </StepShell>
  )
}

function ReadyStep({ name, onComplete }: { name: string; onComplete: () => void }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 32px' }}>
      <Confetti show={true} />
      <div className="anim-scale" style={{ marginBottom: 26 }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--orange)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
          boxShadow: '0 12px 30px rgba(241,119,32,0.4)', animation: 'pop .6s both' }}>
          <Icon name="bookOpen" size={46} />
        </div>
      </div>
      <div className="eyebrow" style={{ color: 'var(--orange-deep)', marginBottom: 14 }}>· Capítulo 01 ·</div>
      <h1 className="display" style={{ fontSize: 38, margin: 0, lineHeight: 1.02 }}>
        Todo listo,<br /><span className="serif-i" style={{ color: 'var(--orange)' }}>{name || 'bienvenido'}</span>.
      </h1>
      <p style={{ fontSize: 16, color: 'var(--ink-soft)', lineHeight: 1.55, marginTop: 18, maxWidth: 290, textWrap: 'pretty' }}>
        Su historia empieza ahora. El primer capítulo está en blanco, esperándolos.
      </p>
      <button className="btn btn-primary btn-block" style={{ marginTop: 34, maxWidth: 320 }} onClick={onComplete}>
        Abrir nuestra historia <Icon name="arrowR" size={18} />
      </button>
    </div>
  )
}

function StepShell({ no, eyebrow, title, sub, children }: {
  no: string; eyebrow: string; title: React.ReactNode; sub: string; children: React.ReactNode
}) {
  return (
    <div className="page-enter" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '96px 30px 38px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <span className="chapter-no" style={{ fontSize: 30, color: 'var(--ink-faint)', lineHeight: 1 }}>{no}</span>
        <span className="eyebrow" style={{ whiteSpace: 'nowrap' }}>{eyebrow}</span>
      </div>
      <h1 className="display" style={{ fontSize: 38, margin: '0 0 12px', lineHeight: 1.0 }}>{title}</h1>
      <p style={{ fontSize: 15.5, color: 'var(--ink-soft)', lineHeight: 1.5, margin: '0 0 24px', maxWidth: 320, textWrap: 'pretty' }}>{sub}</p>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  )
}

export default Onboarding
