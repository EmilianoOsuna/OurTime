// overlays.jsx — PlanDetail, ActionSheet, NewPlanSheet, Notifications
// Depends on Icon, ui.jsx, data helpers

// ── Generic bottom-sheet shell ─────────────────────
function Sheet({ onClose, children, height = 'auto', pad = true }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 95, display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(33,29,24,0.42)',
        animation: 'fadeIn .25s both', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: 'var(--paper)', borderRadius: '28px 28px 0 0',
        boxShadow: '0 -10px 40px rgba(33,29,24,0.2)', maxHeight: '92%', height,
        animation: 'sheetUp .42s cubic-bezier(.2,.9,.2,1) both', display: 'flex', flexDirection: 'column',
        paddingBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', flexShrink: 0 }}>
          <div style={{ width: 40, height: 5, borderRadius: 3, background: 'var(--line)' }} />
        </div>
        <div className="ot-scroll" style={{ padding: pad ? '4px 22px 0' : 0 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Plan / chapter detail ──────────────────────────
function PlanDetail({ plan, onClose, onComplete, onAddMemory }) {
  const [done, setDone] = React.useState(plan.done);
  const [burst, setBurst] = React.useState(false);
  const c = CATS[plan.cat];
  const blue = c.tone === 'blue';

  const complete = () => {
    setDone(true); setBurst(true);
    onComplete(plan.id);
    setTimeout(() => setBurst(false), 2600);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 95, background: 'var(--paper)',
      display: 'flex', flexDirection: 'column', animation: 'sheetUp .42s cubic-bezier(.2,.9,.2,1) both' }}>
      <Confetti show={burst} />
      {/* hero */}
      <div className={'ph' + (blue ? ' blue' : '')} style={{ height: 270, position: 'relative', flexShrink: 0 }}>
        <span className="ph-label" style={{ position: 'absolute', bottom: 52, right: 16 }}>foto del capítulo</span>
        <button onClick={onClose} style={{ position: 'absolute', top: 56, left: 18, width: 42, height: 42,
          borderRadius: '50%', border: 'none', background: 'rgba(255,252,247,0.9)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--sh-sm)', color: 'var(--ink)' }}>
          <Icon name="chevD" size={22} />
        </button>
        <div style={{ position: 'absolute', top: 56, right: 18, display: 'flex', gap: 8 }}>
          <RoundBtn icon="share" /><RoundBtn icon="more" />
        </div>
        <div style={{ position: 'absolute', bottom: 52, left: 18 }}><CatTag cat={plan.cat} /></div>
      </div>

      <div className="ot-scroll" style={{ flex: 1, padding: '0 24px 130px' }}>
        {/* chapter heading */}
        <div style={{ marginTop: -34, position: 'relative' }}>
          <div className="card" style={{ padding: '20px 20px 22px', boxShadow: 'var(--sh-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="eyebrow" style={{ color: blue ? 'var(--blue-deep)' : 'var(--orange-deep)' }}>· Capítulo {romano(plan.no)} ·</span>
              {done
                ? <span className="chip-tag" style={{ background: 'var(--done-tint)', color: 'var(--done)',
                    display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="check" size={12} stroke={3} />Vivido</span>
                : <span className="chip-tag" style={{ background: 'var(--card-2)', color: 'var(--ink-soft)',
                    boxShadow: 'inset 0 0 0 1px var(--line)' }}>{countdown(plan.date)}</span>}
            </div>
            <h1 className="display" style={{ fontSize: 28, margin: '10px 0 0', lineHeight: 1.04 }}>{plan.title}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 14, fontSize: 13.5, color: 'var(--ink-soft)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="calendar" size={15} />{fmtDate(plan.date)}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="pin" size={15} />{plan.place}</span>
            </div>
          </div>
        </div>

        {/* note in serif */}
        <div style={{ padding: '24px 4px 0' }}>
          <div className="serif-i" style={{ fontSize: 20, lineHeight: 1.45, color: 'var(--ink)' }}>“{plan.note}”</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <Avatar person={plan.by === 'Lucía' ? COUPLE.partner : COUPLE.me} size={26} />
            <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Escrito por <b style={{ color: 'var(--ink)' }}>{plan.by}</b></span>
          </div>
        </div>

        {/* memories strip */}
        <div style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="eyebrow">Recuerdos de este capítulo</span>
            {plan.memories > 0 && <span style={{ fontSize: 13, color: 'var(--ink-faint)', fontWeight: 600 }}>{plan.memories}</span>}
          </div>
          {plan.memories > 0 ? (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }} className="ot-scroll">
              {Array.from({ length: Math.min(plan.memories, 5) }).map((_, i) => (
                <div key={i} className={'ph' + (i % 2 ? ' blue' : '')} style={{ width: 108, height: 134,
                  borderRadius: 14, flexShrink: 0 }} />
              ))}
              <button onClick={onAddMemory} style={{ width: 108, height: 134, borderRadius: 14, flexShrink: 0,
                border: '1.5px dashed var(--line)', background: 'transparent', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                color: 'var(--ink-soft)', fontSize: 12, fontWeight: 600 }}>
                <Icon name="plus" size={20} />Añadir
              </button>
            </div>
          ) : (
            <button onClick={onAddMemory} className="card" style={{ width: '100%', padding: '20px', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--orange-tint)',
                color: 'var(--orange-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="camera" size={22} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Aún sin recuerdos</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Añade la primera foto de este capítulo</div>
              </div>
              <Icon name="plus" size={20} style={{ color: 'var(--ink-faint)' }} />
            </button>
          )}
        </div>
      </div>

      {/* sticky action */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 24px 30px',
        background: 'linear-gradient(transparent, var(--paper) 28%)' }}>
        {done ? (
          <button className="btn btn-block" disabled style={{ background: 'var(--done-tint)', color: 'var(--done)' }}>
            <Icon name="checkCircle" size={19} /> Capítulo vivido
          </button>
        ) : (
          <button className="btn btn-orange btn-block" style={{ fontSize: 17 }} onClick={complete}>
            <Icon name="check" size={19} stroke={2.6} /> Marcar como vivido
          </button>
        )}
      </div>
    </div>
  );
}

function RoundBtn({ icon, onClick }) {
  return (
    <button onClick={onClick} style={{ width: 42, height: 42, borderRadius: '50%', border: 'none',
      background: 'rgba(255,252,247,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center',
      justifyContent: 'center', boxShadow: 'var(--sh-sm)', color: 'var(--ink)' }}>
      <Icon name={icon} size={19} />
    </button>
  );
}

// ── Action sheet (from + button) ───────────────────
function ActionSheet({ onClose, onPick }) {
  const items = [
    { id: 'plan', icon: 'feather', tint: 'var(--orange-tint)', col: 'var(--orange-deep)',
      title: 'Nuevo capítulo', body: 'Un plan, una cita, una aventura' },
    { id: 'memory', icon: 'camera', tint: 'var(--blue-tint)', col: 'var(--blue-deep)',
      title: 'Nuevo recuerdo', body: 'Sube una foto a la galería' },
    { id: 'money', icon: 'wallet', tint: 'var(--done-tint)', col: 'var(--done)',
      title: 'Nuevo movimiento', body: 'Un ingreso o gasto del fondo común' },
  ];
  return (
    <Sheet onClose={onClose}>
      <div style={{ padding: '6px 0 8px' }}>
        <h2 className="display" style={{ fontSize: 24, margin: '0 0 4px' }}>¿Qué añadimos?</h2>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: '0 0 18px' }}>Sigue escribiendo vuestra historia.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {items.map(it => (
            <button key={it.id} onClick={() => onPick(it.id)} className="card" style={{ display: 'flex',
              alignItems: 'center', gap: 15, padding: 15, border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 50, height: 50, borderRadius: 15, background: it.tint, color: it.col,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={it.icon} size={24} stroke={1.9} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{it.title}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 1 }}>{it.body}</div>
              </div>
              <Icon name="chevR" size={19} style={{ color: 'var(--ink-faint)' }} />
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

// ── New plan / chapter form ────────────────────────
function NewPlanSheet({ onClose, onCreate }) {
  const [title, setTitle] = React.useState('');
  const [cat, setCat] = React.useState('cafe');
  const [date, setDate] = React.useState('');
  const [place, setPlace] = React.useState('');
  const cats = Object.keys(CATS);
  const ok = title.trim() && date;

  return (
    <Sheet onClose={onClose}>
      <div style={{ padding: '4px 0 8px' }}>
        <div className="eyebrow" style={{ color: 'var(--orange-deep)', marginBottom: 6 }}>· Nuevo capítulo ·</div>
        <h2 className="display" style={{ fontSize: 26, margin: '0 0 20px' }}>Un plan por escribir</h2>

        <label className="field-label">Título del capítulo</label>
        <input className="field" placeholder="Cena sorpresa en…" value={title} onChange={e => setTitle(e.target.value)} />

        <label className="field-label" style={{ marginTop: 18 }}>Categoría</label>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="ot-scroll">
          {cats.map(k => {
            const on = cat === k; const m = CATS[k];
            return (
              <button key={k} onClick={() => setCat(k)} className={'chip' + (on ? ' active' : '')}
                style={{ flexShrink: 0 }}>
                <Icon name={m.icon} size={14} /> {m.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
          <div style={{ flex: 1 }}>
            <label className="field-label">Fecha</label>
            <input className="field" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        <label className="field-label" style={{ marginTop: 18 }}>Lugar</label>
        <input className="field" placeholder="¿Dónde será?" value={place} onChange={e => setPlace(e.target.value)} />

        <button className="btn btn-orange btn-block" style={{ marginTop: 24 }} disabled={!ok}
          onClick={() => onCreate({ title, cat, date, place })}>
          <Icon name="feather" size={18} /> Crear capítulo
        </button>
      </div>
    </Sheet>
  );
}

// ── Notifications panel ────────────────────────────
function NotificationsPanel({ onClose, items }) {
  return (
    <Sheet onClose={onClose} height="78%">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0 16px' }}>
        <h2 className="display" style={{ fontSize: 26, margin: 0 }}>Novedades</h2>
        <button onClick={onClose} className="chip">Marcar leído</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((n, i) => (
          <div key={i} className="card" style={{ display: 'flex', gap: 13, padding: 14, alignItems: 'flex-start',
            opacity: n.read ? 0.6 : 1 }}>
            {n.person
              ? <Avatar person={n.person === 'Lucía' ? COUPLE.partner : COUPLE.me} size={40} />
              : <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--orange-tint)',
                  color: 'var(--orange-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={n.icon || 'sparkle'} size={20} /></div>}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, lineHeight: 1.4 }}>{n.text}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 3 }}>{n.time}</div>
            </div>
            {!n.read && <span className="dot" style={{ background: 'var(--orange)', marginTop: 6 }} />}
          </div>
        ))}
      </div>
    </Sheet>
  );
}

Object.assign(window, { Sheet, PlanDetail, ActionSheet, NewPlanSheet, NotificationsPanel });
