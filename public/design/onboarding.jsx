// onboarding.jsx — couple pairing / onboarding flow
// Props: onComplete()

function Onboarding({ onComplete }) {
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState('');
  const [mode, setMode] = React.useState(null);   // 'create' | 'join'
  const [code, setCode] = React.useState('');
  const [joined, setJoined] = React.useState(false);
  const INVITE = 'LUNA-7432';

  const go = (n) => setStep(n);

  // simulate partner joining after landing on the waiting screen
  React.useEffect(() => {
    if (step === 3 && mode === 'create' && !joined) {
      const t = setTimeout(() => setJoined(true), 3400);
      return () => clearTimeout(t);
    }
  }, [step, mode, joined]);

  React.useEffect(() => {
    if (joined) { const t = setTimeout(() => go(4), 1500); return () => clearTimeout(t); }
  }, [joined]);

  return (
    <div className="ot-root" style={{ background: 'var(--paper)' }}>
      {/* progress chapters */}
      {step > 0 && step < 4 && (
        <div style={{ position: 'absolute', top: 64, left: 24, right: 24, zIndex: 10,
          display: 'flex', gap: 6 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2,
              background: i <= step ? 'var(--orange)' : 'var(--line)', transition: 'background .4s' }} />
          ))}
        </div>
      )}

      <div className="ot-scroll" style={{ display: 'flex', flexDirection: 'column' }}>
        {step === 0 && <Welcome onNext={() => go(1)} />}
        {step === 1 && <NameStep name={name} setName={setName} onNext={() => go(2)} />}
        {step === 2 && <LinkStep onPick={(m) => { setMode(m); go(3); }} />}
        {step === 3 && mode === 'create' && <WaitStep invite={INVITE} joined={joined} />}
        {step === 3 && mode === 'join' && <JoinStep code={code} setCode={setCode} onNext={() => go(4)} />}
        {step === 4 && <ReadyStep name={name} onComplete={onComplete} />}
      </div>
    </div>
  );
}

// ── 0 · Welcome ────────────────────────────────────
function Welcome({ onNext }) {
  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column',
      padding: '0 30px 40px', position: 'relative' }}>
      {/* hero imagery placeholder */}
      <div className="ph" style={{ position: 'absolute', inset: 0, opacity: 0.5,
        maskImage: 'linear-gradient(to bottom, black, transparent 62%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 62%)' }}>
        <span className="ph-label" style={{ position: 'absolute', top: 90, right: 18 }}>foto de portada</span>
      </div>

      <div style={{ flex: 1 }} />
      <div className="anim-up" style={{ position: 'relative' }}>
        <div className="eyebrow" style={{ color: 'var(--orange-deep)', marginBottom: 18 }}>· Bienvenidos a OurTime ·</div>
        <h1 className="display" style={{ fontSize: 52, margin: 0, lineHeight: 0.98 }}>
          Vuestra<br/>historia,<br/><span className="serif-i" style={{ color: 'var(--orange)' }}>un capítulo</span><br/>a la vez.
        </h1>
        <p style={{ fontSize: 16.5, color: 'var(--ink-soft)', lineHeight: 1.55, marginTop: 22, maxWidth: 320, textWrap: 'pretty' }}>
          Planes, recuerdos y cuentas compartidas en un mismo lugar. Escribid juntos lo que viene.
        </p>
        <button className="btn btn-orange btn-block" style={{ marginTop: 28, fontSize: 17 }} onClick={onNext}>
          Empezar nuestra historia <Icon name="arrowR" size={19} />
        </button>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--ink-soft)' }}>
          ¿Ya tenéis cuenta? <b style={{ color: 'var(--ink)' }}>Iniciar sesión</b>
        </div>
      </div>
    </div>
  );
}

// ── 1 · Your name ──────────────────────────────────
function NameStep({ name, setName, onNext }) {
  return (
    <StepShell
      no="01" eyebrow="Tu perfil"
      title={<>¿Cómo te <span className="serif-i" style={{ color: 'var(--orange)' }}>llaman</span>?</>}
      sub="Tu pareja te verá así en cada capítulo que escribáis."
    >
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
  );
}

// ── 2 · Link mode ──────────────────────────────────
function LinkStep({ onPick }) {
  return (
    <StepShell
      no="02" eyebrow="Vuestro espacio"
      title={<>Sois <span className="serif-i" style={{ color: 'var(--orange)' }}>dos</span>.<br/>Conectémoslo.</>}
      sub="Una historia se escribe a cuatro manos. Crea vuestro espacio o únete al de tu pareja."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
        <PickCard accent="orange" icon="feather" title="Crear nuestro espacio"
          body="Genera un código y compártelo con tu pareja." onClick={() => onPick('create')} />
        <PickCard accent="blue" icon="users" title="Unirme a mi pareja"
          body="Ya tienes un código de invitación." onClick={() => onPick('join')} />
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center',
        color: 'var(--ink-faint)', fontSize: 13 }}>
        <Icon name="heart" size={14} /> Privado para vosotros dos
      </div>
    </StepShell>
  );
}

function PickCard({ accent, icon, title, body, onClick }) {
  const col = accent === 'blue' ? 'var(--blue)' : 'var(--orange)';
  const tint = accent === 'blue' ? 'var(--blue-tint)' : 'var(--orange-tint)';
  return (
    <button onClick={onClick} className="card" style={{
      display: 'flex', alignItems: 'center', gap: 15, padding: 16, textAlign: 'left',
      border: 'none', cursor: 'pointer', width: '100%',
    }}>
      <div style={{ width: 52, height: 52, borderRadius: 15, background: tint, color: col,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={26} stroke={1.8} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 16.5 }}>{title}</div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 2, lineHeight: 1.35 }}>{body}</div>
      </div>
      <Icon name="chevR" size={20} style={{ color: 'var(--ink-faint)' }} />
    </button>
  );
}

// ── 3a · Waiting (create) ──────────────────────────
function WaitStep({ invite, joined }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <StepShell
      no="03" eyebrow="Invitación"
      title={joined ? <>¡Lucía se <span className="serif-i" style={{ color: 'var(--done)' }}>unió</span>!</>
                    : <>Comparte <span className="serif-i" style={{ color: 'var(--orange)' }}>el código</span></>}
      sub={joined ? 'Vuestro espacio está conectado. Preparando todo…'
                  : 'Tu pareja lo introduce en su OurTime y quedáis vinculados al instante.'}
    >
      {!joined ? (
        <>
          <div className="card" style={{ padding: '26px 20px', textAlign: 'center', marginTop: 6 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Código de invitación</div>
            <div className="display" style={{ fontSize: 40, letterSpacing: '0.08em', color: 'var(--orange-deep)' }}>{invite}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-soft" style={{ flex: 1 }} onClick={() => { setCopied(true); setTimeout(()=>setCopied(false),1600); }}>
                <Icon name={copied ? 'check' : 'copy'} size={17} /> {copied ? 'Copiado' : 'Copiar'}
              </button>
              <button className="btn btn-orange" style={{ flex: 1 }}>
                <Icon name="share" size={17} /> Compartir
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 30 }}>
            <span style={{ display: 'flex', gap: 5 }}>
              {[0,1,2].map(i => <span key={i} className="dot" style={{ background: 'var(--orange)',
                animation: `pulse 1.2s ${i*0.2}s ease-in-out infinite` }} />)}
            </span>
            <span style={{ fontSize: 14.5, color: 'var(--ink-soft)' }}>Esperando a tu pareja…</span>
          </div>
        </>
      ) : (
        <div className="anim-scale" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar person={COUPLE.me} size={68} />
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--done)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 -8px', zIndex: 2,
              boxShadow: 'var(--sh-md)', animation: 'pop .5s .1s both' }}>
              <Icon name="heart" size={20} />
            </div>
            <Avatar person={COUPLE.partner} size={68} />
          </div>
          <div className="serif-i" style={{ fontSize: 22, marginTop: 20, color: 'var(--ink)' }}>{COUPLE.title}</div>
        </div>
      )}
      <div style={{ flex: 1 }} />
    </StepShell>
  );
}

// ── 3b · Join (enter code) ─────────────────────────
function JoinStep({ code, setCode, onNext }) {
  const ok = code.replace(/[^A-Za-z0-9]/g, '').length >= 6;
  return (
    <StepShell
      no="03" eyebrow="Vincular"
      title={<>Introduce <span className="serif-i" style={{ color: 'var(--blue)' }}>el código</span></>}
      sub="Tu pareja lo encuentra al crear vuestro espacio compartido."
    >
      <label className="field-label">Código de invitación</label>
      <input className="field" placeholder="LUNA-7432" value={code} autoFocus
        style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: '0.06em', textAlign: 'center' }}
        onChange={e => setCode(e.target.value.toUpperCase())} />
      <div style={{ flex: 1 }} />
      <button className="btn btn-blue btn-block" disabled={!ok} onClick={onNext}>
        Vincular ahora <Icon name="heart" size={17} />
      </button>
    </StepShell>
  );
}

// ── 4 · Ready ──────────────────────────────────────
function ReadyStep({ name, onComplete }) {
  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 32px' }}>
      <Confetti show={true} />
      <div className="anim-scale" style={{ marginBottom: 26 }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--orange)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
          boxShadow: '0 12px 30px rgba(241,119,32,0.4)', animation: 'pop .6s both' }}>
          <Icon name="bookOpen" size={46} stroke={1.6} />
        </div>
      </div>
      <div className="eyebrow" style={{ color: 'var(--orange-deep)', marginBottom: 14 }}>· Capítulo 01 ·</div>
      <h1 className="display" style={{ fontSize: 38, margin: 0, lineHeight: 1.02 }}>
        Todo listo,<br/><span className="serif-i" style={{ color: 'var(--orange)' }}>{name || 'Mateo'}</span>.
      </h1>
      <p style={{ fontSize: 16, color: 'var(--ink-soft)', lineHeight: 1.55, marginTop: 18, maxWidth: 290, textWrap: 'pretty' }}>
        Vuestra historia empieza ahora. El primer capítulo está en blanco, esperándoos.
      </p>
      <button className="btn btn-primary btn-block" style={{ marginTop: 34, maxWidth: 320 }} onClick={onComplete}>
        Abrir nuestra historia <Icon name="arrowR" size={18} />
      </button>
    </div>
  );
}

// ── shared step shell ──────────────────────────────
function StepShell({ no, eyebrow, title, sub, children }) {
  return (
    <div className="page-enter" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column',
      padding: '96px 30px 38px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <span className="chapter-no" style={{ fontSize: 30, color: 'var(--ink-faint)', lineHeight: 1 }}>{no}</span>
        <span className="eyebrow" style={{ whiteSpace: 'nowrap' }}>{eyebrow}</span>
      </div>
      <h1 className="display" style={{ fontSize: 38, margin: '0 0 12px', lineHeight: 1.0 }}>{title}</h1>
      <p style={{ fontSize: 15.5, color: 'var(--ink-soft)', lineHeight: 1.5, margin: '0 0 24px', maxWidth: 320, textWrap: 'pretty' }}>{sub}</p>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  );
}

window.Onboarding = Onboarding;
