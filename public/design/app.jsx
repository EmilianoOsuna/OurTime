// app.jsx — OurTime shell: nav, routing, realtime sim, tweaks
// Depends on all prior files (Onboarding, Dashboard, screens, overlays, ui, icons, data)

const { useState, useEffect, useRef } = React;

const DIRECTIONS = {
  A: { name: 'Clásico', display: "'Newsreader', Georgia, serif", ui: "'Hanken Grotesk', system-ui, sans-serif" },
  B: { name: 'Moderno', display: "'Instrument Serif', Georgia, serif", ui: "'Schibsted Grotesk', system-ui, sans-serif" },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "A",
  "accent": "orange",
  "radius": 22,
  "liveDemo": true
}/*EDITMODE-END*/;

function Root() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [paired, setPaired] = useState(false);
  const [tab, setTab] = useState('home');
  const [plans, setPlans] = useState(PLANS);
  const [tx, setTx] = useState(TX);
  const [overlay, setOverlay] = useState(null);     // {type, data}
  const [partnerEditing, setPartnerEditing] = useState(null);
  const [notifs, setNotifs] = useState([
    { person: 'Lucía', text: <><b>Lucía</b> añadió un recuerdo a <b>«Ruta al amanecer»</b>.</>, time: 'hace 2 h', read: false },
    { icon: 'gift', text: <>Vuestro <b>Capítulo IX</b> es una sorpresa. Aún está sellado 🤫</>, time: 'ayer', read: false },
    { person: 'Mateo', text: <><b>Tú</b> marcaste <b>«Ruta de senderismo»</b> como vivido.</>, time: 'hace 3 días', read: true },
  ]);
  const unread = notifs.filter(n => !n.read).length;

  // apply tweaks → CSS vars
  useEffect(() => {
    const dir = DIRECTIONS[t.direction] || DIRECTIONS.A;
    const r = document.documentElement;
    r.style.setProperty('--font-display', dir.display);
    r.style.setProperty('--font-ui', dir.ui);
    r.style.setProperty('--r-md', t.radius + 'px');
    r.style.setProperty('--r-lg', (t.radius + 8) + 'px');
    // swap brand primary/secondary
    if (t.accent === 'blue') {
      r.style.setProperty('--orange', '#0474BA'); r.style.setProperty('--orange-deep', '#045E96');
      r.style.setProperty('--orange-tint', '#D7E9F4'); r.style.setProperty('--blue', '#F17720');
      r.style.setProperty('--blue-deep', '#D75E12'); r.style.setProperty('--blue-tint', '#FBE6D2');
    } else {
      r.style.setProperty('--orange', '#F17720'); r.style.setProperty('--orange-deep', '#D75E12');
      r.style.setProperty('--orange-tint', '#FBE6D2'); r.style.setProperty('--blue', '#0474BA');
      r.style.setProperty('--blue-deep', '#045E96'); r.style.setProperty('--blue-tint', '#D7E9F4');
    }
  }, [t.direction, t.accent, t.radius]);

  return (
    <>
      <Stage>
        <Phone>
          <ToastProvider>
            <AppInner {...{ t, setTweak, paired, setPaired, tab, setTab, plans, setPlans, tx, setTx,
              overlay, setOverlay, partnerEditing, setPartnerEditing, notifs, setNotifs, unread }} />
          </ToastProvider>
        </Phone>
      </Stage>
      <TweaksUI t={t} setTweak={setTweak} />
    </>
  );
}

// ── Viewport stage + phone bezel ───────────────────
function Stage({ children }) {
  const ref = useRef(null);
  useEffect(() => {
    const W = 402, H = 874;
    const fit = () => {
      const s = Math.min((window.innerWidth - 24) / W, (window.innerHeight - 24) / H, 1.12);
      if (ref.current) ref.current.style.transform = `scale(${s})`;
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#1a1714', display: 'flex',
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div ref={ref} style={{ transformOrigin: 'center center' }}>{children}</div>
    </div>
  );
}

function Phone({ children }) {
  return (
    <div style={{ width: 402, height: 874, borderRadius: 48, overflow: 'hidden', position: 'relative',
      background: 'var(--paper)', boxShadow: '0 40px 90px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.2)',
      WebkitFontSmoothing: 'antialiased' }}>
      {/* dynamic island */}
      <div style={{ position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 124, height: 36, borderRadius: 22, background: '#000', zIndex: 100 }} />
      {/* status bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40 }}>
        <IOSStatusBar dark={false} />
      </div>
      {children}
      {/* home indicator */}
      <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, zIndex: 95, display: 'flex',
        justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ width: 134, height: 5, borderRadius: 100, background: 'rgba(33,29,24,0.22)' }} />
      </div>
    </div>
  );
}

function AppInner(P) {
  const { t, setTweak, paired, setPaired, tab, setTab, plans, setPlans, tx, setTx,
    overlay, setOverlay, partnerEditing, setPartnerEditing, notifs, setNotifs, unread } = P;
  const push = useToast();

  // ── realtime collaboration simulation ──
  useEffect(() => {
    if (!paired || !t.liveDemo) { setPartnerEditing(null); return; }
    const timers = [];
    timers.push(setTimeout(() => {
      setPartnerEditing('p7');
      push({ person: COUPLE.partner, eyebrow: 'En vivo', title: 'Lucía está aquí',
        body: 'Editando «Picnic en el parque botánico»' });
    }, 4200));
    timers.push(setTimeout(() => {
      setPlans(ps => ps.map(p => p.id === 'p7' ? { ...p, place: 'Jardín Botánico · pérgola norte' } : p));
      setPartnerEditing(null);
      push({ person: COUPLE.partner, eyebrow: 'Capítulo actualizado', title: 'Lucía cambió el lugar',
        body: 'Picnic → pérgola norte' });
    }, 9000));
    timers.push(setTimeout(() => {
      push({ icon: 'image', eyebrow: 'Nuevo recuerdo', title: 'Lucía subió una foto',
        body: 'A «Escapada a la costa»' });
      setNotifs(n => [{ person: 'Lucía', text: <><b>Lucía</b> subió una foto a <b>«Escapada a la costa»</b>.</>, time: 'ahora', read: false }, ...n]);
    }, 14000));
    return () => timers.forEach(clearTimeout);
  }, [paired, t.liveDemo]);

  const openPlan = (plan) => setOverlay({ type: 'plan', data: plan });
  const completePlan = (id) => {
    setPlans(ps => ps.map(p => p.id === id ? { ...p, done: true } : p));
    setTimeout(() => push({ icon: 'sparkle', eyebrow: 'Capítulo vivido',
      title: '¡Un recuerdo más en vuestra historia!', body: 'Lucía recibirá la novedad' }), 400);
  };
  const createPlan = ({ title, cat, date, place }) => {
    const no = Math.max(...plans.map(p => p.no)) + 1;
    setPlans(ps => [...ps, { id: 'p'+Date.now(), no, title, cat, date, place: place || 'Por decidir',
      done: false, fav: false, note: 'Un nuevo capítulo por escribir.', cost: 0, memories: 0, by: 'Mateo' }]);
    setOverlay(null);
    push({ icon: 'feather', eyebrow: 'Capítulo creado', title: '«' + title + '»', body: 'Añadido a vuestra historia' });
  };
  const createTx = ({ kind, amt, label, cat, plan, who }) => {
    setTx(list => [...list, { id: 't'+Date.now(), kind, amt, label, cat, date: '2026-06-07', who, plan }]);
    setOverlay(null);
    push({ icon: kind==='in'?'trendUp':'wallet', eyebrow: 'Movimiento guardado',
      title: (kind==='in'?'+':'–') + eur(amt), body: label });
  };

  if (!paired) return <Onboarding onComplete={() => setPaired(true)} />;

  const screen = {
    home: <Dashboard plans={plans} onOpenPlan={openPlan} partnerEditing={partnerEditing}
      onBell={() => setOverlay({ type: 'notifs' })} unread={unread} />,
    calendar: <CalendarScreen plans={plans} onOpenPlan={openPlan} />,
    gallery: <GalleryScreen memories={MEMORIES} onOpen={(m) => setOverlay({ type: 'lightbox', data: m })} />,
    finance: <FinanceScreen tx={tx} onAdd={() => setOverlay({ type: 'money' })} />,
  }[tab];

  return (
    <div className="ot-root">
      <div style={{ height: '100%', paddingTop: 50 }}>{screen}</div>

      <NavBar tab={tab} setTab={setTab} onPlus={() => setOverlay({ type: 'action' })} />

      {/* overlays */}
      {overlay?.type === 'plan' && <PlanDetail plan={overlay.data} onClose={() => setOverlay(null)}
        onComplete={completePlan} onAddMemory={() => { setOverlay(null); setTab('gallery'); }} />}
      {overlay?.type === 'action' && <ActionSheet onClose={() => setOverlay(null)}
        onPick={(id) => setOverlay({ type: id === 'plan' ? 'newplan' : id === 'memory' ? 'newmemory' : 'money' })} />}
      {overlay?.type === 'newplan' && <NewPlanSheet onClose={() => setOverlay(null)} onCreate={createPlan} />}
      {overlay?.type === 'money' && <MoneySheet onClose={() => setOverlay(null)} onCreate={createTx} />}
      {overlay?.type === 'newmemory' && <NewMemorySheet onClose={() => setOverlay(null)}
        onDone={() => { setOverlay(null); setTab('gallery'); push({ icon:'image', eyebrow:'Recuerdo añadido', title:'Foto subida a la galería' }); }} />}
      {overlay?.type === 'lightbox' && <Lightbox m={overlay.data} onClose={() => setOverlay(null)} />}
      {overlay?.type === 'notifs' && <NotificationsPanel items={notifs}
        onClose={() => { setNotifs(n => n.map(x => ({ ...x, read: true }))); setOverlay(null); }} />}
    </div>
  );
}

// ── Bottom floating nav ────────────────────────────
function NavBar({ tab, setTab, onPlus }) {
  const items = [
    { id: 'home', icon: 'bookOpen', label: 'Historia' },
    { id: 'calendar', icon: 'calendar', label: 'Agenda' },
    { id: '_plus' },
    { id: 'gallery', icon: 'image', label: 'Recuerdos' },
    { id: 'finance', icon: 'wallet', label: 'Cuentas' },
  ];
  return (
    <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, zIndex: 70, display: 'flex',
      justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 2,
        background: 'rgba(255,252,247,0.82)', backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)', borderRadius: 999, padding: '8px 10px',
        boxShadow: 'var(--sh-lg)', border: '1px solid rgba(255,255,255,0.6)' }}>
        {items.map(it => {
          if (it.id === '_plus') return (
            <button key="plus" onClick={onPlus} style={{ width: 54, height: 54, borderRadius: '50%', border: 'none',
              background: 'var(--orange)', color: '#fff', cursor: 'pointer', margin: '0 4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(241,119,32,0.45)', transition: 'transform .15s' }}
              onMouseDown={e => e.currentTarget.style.transform='scale(0.9)'}
              onMouseUp={e => e.currentTarget.style.transform='none'}
              onMouseLeave={e => e.currentTarget.style.transform='none'}>
              <Icon name="plus" size={26} stroke={2.4} />
            </button>
          );
          const on = tab === it.id;
          return (
            <button key={it.id} onClick={() => setTab(it.id)} style={{ border: 'none', background: 'transparent',
              cursor: 'pointer', width: 58, height: 50, borderRadius: 18, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
              color: on ? 'var(--orange-deep)' : 'var(--ink-faint)', transition: 'color .2s' }}>
              <Icon name={it.icon} size={22} stroke={on ? 2.3 : 1.9} />
              <span style={{ fontSize: 9.5, fontWeight: on ? 700 : 600, fontFamily: 'var(--font-ui)' }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── New memory (upload placeholder) ────────────────
function NewMemorySheet({ onClose, onDone }) {
  const [plan, setPlan] = useState('');
  return (
    <Sheet onClose={onClose}>
      <div style={{ padding: '4px 0 8px' }}>
        <div className="eyebrow" style={{ color: 'var(--blue-deep)', marginBottom: 6 }}>· Nuevo recuerdo ·</div>
        <h2 className="display" style={{ fontSize: 26, margin: '0 0 18px' }}>Guardad el momento</h2>
        <div className="ph blue" style={{ height: 180, borderRadius: 18, flexDirection: 'column', gap: 10, cursor: 'pointer' }}>
          <div style={{ width: 52, height: 52, borderRadius: 15, background: 'var(--card)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--blue)', boxShadow: 'var(--sh-sm)' }}>
            <Icon name="camera" size={26} /></div>
          <span className="ph-label">Toca para subir una foto</span>
        </div>
        <label className="field-label" style={{ marginTop: 18 }}>Capítulo</label>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="ot-scroll">
          {PLANS.map(p => (
            <button key={p.id} onClick={() => setPlan(p.id)} className={'chip' + (plan===p.id ? ' active' : '')}
              style={{ flexShrink: 0 }}><Icon name={CATS[p.cat].icon} size={13} /> Cap. {romano(p.no)}</button>
          ))}
        </div>
        <button className="btn btn-blue btn-block" style={{ marginTop: 24 }} onClick={onDone}>
          <Icon name="check" size={18} stroke={2.4} /> Guardar recuerdo
        </button>
      </div>
    </Sheet>
  );
}

// ── Tweaks panel ───────────────────────────────────
function TweaksUI({ t, setTweak }) {
  return (
    <TweaksPanel>
      <TweakSection label="Dirección editorial" />
      <TweakRadio label="Tipografía" value={t.direction}
        options={[{ label: 'A · Clásico', value: 'A' }, { label: 'B · Moderno', value: 'B' }]}
        onChange={v => setTweak('direction', v)} />
      <div style={{ fontSize: 11, color: 'var(--tw-muted, #888)', padding: '2px 2px 6px', lineHeight: 1.4 }}>
        A: Newsreader + Hanken Grotesk · B: Instrument Serif + Schibsted Grotesk
      </div>
      <TweakColor label="Acento principal" value={t.accent === 'blue' ? '#0474BA' : '#F17720'}
        options={['#F17720', '#0474BA']}
        onChange={v => setTweak('accent', v === '#0474BA' ? 'blue' : 'orange')} />
      <TweakSection label="Forma" />
      <TweakSlider label="Esquinas" value={t.radius} min={10} max={32} unit="px"
        onChange={v => setTweak('radius', v)} />
      <TweakSection label="Demo" />
      <TweakToggle label="Pareja en vivo" value={t.liveDemo} onChange={v => setTweak('liveDemo', v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
