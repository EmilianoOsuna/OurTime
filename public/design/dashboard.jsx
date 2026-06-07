// dashboard.jsx — "Nuestra Historia": relationship timeline of chapters
// Props: plans, onOpenPlan(plan), partnerEditing (planId|null)

function Dashboard({ plans, onOpenPlan, partnerEditing, onBell, unread }) {
  const upcoming = plans.filter(p => !p.done).sort((a,b) => a.date.localeCompare(b.date));
  const past = plans.filter(p => p.done).sort((a,b) => b.date.localeCompare(a.date));
  const next = upcoming[0];

  return (
    <div className="ot-scroll page-enter" style={{ paddingBottom: 130 }}>
      {/* ── Header ─────────────────────────────── */}
      <div style={{ padding: '8px 22px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 7 }}>Nuestra historia</div>
            <h1 className="display" style={{ fontSize: 34, margin: 0, lineHeight: 0.98 }}>{COUPLE.title}</h1>
          </div>
          <button onClick={onBell} style={{ border: 'none', background: 'var(--card)', cursor: 'pointer',
            width: 44, height: 44, borderRadius: '50%', boxShadow: 'var(--sh-sm)', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }}>
            <Icon name="bell" size={21} />
            {unread > 0 && <span style={{ position: 'absolute', top: 9, right: 10, width: 8, height: 8,
              borderRadius: '50%', background: 'var(--orange)', boxShadow: '0 0 0 2px var(--card)' }} />}
          </button>
        </div>

        {/* presence + stats strip */}
        <div className="card" style={{ marginTop: 16, padding: '12px 15px', display: 'flex',
          alignItems: 'center', gap: 13 }}>
          <div style={{ position: 'relative' }}>
            <CoupleAvatars size={38} />
            <span style={{ position: 'absolute', bottom: -2, right: -2 }}><PresenceDot size={9} /></span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              Lucía está aquí
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Juntos desde {COUPLE.since}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="display" style={{ fontSize: 24, color: 'var(--orange-deep)', lineHeight: 1 }}>{COUPLE.days}</div>
            <div className="eyebrow" style={{ fontSize: 9 }}>días</div>
          </div>
        </div>
      </div>

      {/* ── Next chapter — hero ─────────────────── */}
      {next && (
        <div style={{ padding: '20px 22px 4px' }}>
          <div className="eyebrow" style={{ marginBottom: 12, color: 'var(--orange-deep)' }}>· Vuestro próximo capítulo ·</div>
          <NextHero plan={next} onOpen={() => onOpenPlan(next)} editing={partnerEditing === next.id} />
        </div>
      )}

      {/* ── Timeline of lived chapters ──────────── */}
      <div style={{ padding: '26px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span className="eyebrow">Lo que habéis vivido</span>
          <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          <span style={{ fontSize: 13, color: 'var(--ink-faint)', fontWeight: 600 }}>{past.length} capítulos</span>
        </div>
      </div>

      <div style={{ position: 'relative', padding: '14px 22px 0' }}>
        {/* vertical spine */}
        <div style={{ position: 'absolute', left: 44, top: 24, bottom: 30, width: 2,
          background: 'linear-gradient(var(--orange), var(--blue))', opacity: 0.5,
          transformOrigin: 'top', animation: 'drawLine .9s cubic-bezier(.4,0,.2,1) both' }} />
        {past.map((p, i) => (
          <TimelineRow key={p.id} plan={p} onOpen={() => onOpenPlan(p)}
            editing={partnerEditing === p.id} index={i} />
        ))}

        {/* origin marker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6, paddingLeft: 0 }}>
          <div style={{ width: 46, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--paper)',
              boxShadow: 'inset 0 0 0 2px var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="dot" style={{ width: 6, height: 6, background: 'var(--orange)' }} />
            </div>
          </div>
          <div>
            <div className="serif-i" style={{ fontSize: 17 }}>El día que os conocisteis</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{COUPLE.since}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Next chapter hero card ─────────────────────────
function NextHero({ plan, onOpen, editing }) {
  const c = CATS[plan.cat];
  const blue = c.tone === 'blue';
  return (
    <button onClick={onOpen} className="card anim-up" style={{
      width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', overflow: 'hidden',
      padding: 0, boxShadow: 'var(--sh-md)',
    }}>
      <div className={'ph' + (blue ? ' blue' : '')} style={{ height: 150, position: 'relative' }}>
        <span className="ph-label" style={{ position: 'absolute', bottom: 12, right: 12 }}>foto del plan</span>
        <div style={{ position: 'absolute', top: 14, left: 14 }}><CatTag cat={plan.cat} /></div>
        <div style={{ position: 'absolute', top: 12, right: 14, display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,252,247,0.9)', borderRadius: 999, padding: '6px 11px',
          fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>
          <Icon name="clock" size={14} style={{ color: blue ? 'var(--blue)' : 'var(--orange)' }} /> {countdown(plan.date)}
        </div>
        {editing && <LiveEditBadge />}
      </div>
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span className="chapter-no" style={{ fontSize: 34, color: blue ? 'var(--blue)' : 'var(--orange)' }}>{romano(plan.no)}</span>
          <h2 className="display" style={{ fontSize: 22, margin: 0, flex: 1, lineHeight: 1.05 }}>{plan.title}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12, fontSize: 13.5, color: 'var(--ink-soft)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="calendar" size={15} />{fmtDateShort(plan.date)}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="pin" size={15} />{plan.place}</span>
        </div>
      </div>
    </button>
  );
}

// ── Timeline row ───────────────────────────────────
function TimelineRow({ plan, onOpen, editing, index }) {
  const c = CATS[plan.cat];
  return (
    <div className="anim-up" style={{ display: 'flex', gap: 16, marginBottom: 18, animationDelay: (index*0.05)+'s' }}>
      {/* node */}
      <div style={{ width: 46, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <CatMedallion cat={plan.cat} size={42} />
          {plan.done && <span style={{ position: 'absolute', bottom: -3, right: -3, width: 19, height: 19,
            borderRadius: '50%', background: 'var(--done)', color: '#fff', display: 'flex',
            alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2.5px var(--paper)' }}>
            <Icon name="check" size={12} stroke={3} /></span>}
        </div>
      </div>
      {/* card */}
      <button onClick={onOpen} className="card" style={{ flex: 1, textAlign: 'left', border: 'none',
        cursor: 'pointer', padding: '13px 15px', minWidth: 0, position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <span className="chapter-no" style={{ fontSize: 19, color: 'var(--ink-faint)', lineHeight: 1, fontStyle: 'italic' }}>Cap. {romano(plan.no)}</span>
          {plan.fav && <Icon name="heartFill" size={15} style={{ color: 'var(--orange)' }} />}
        </div>
        <h3 className="display" style={{ fontSize: 17.5, margin: '6px 0 0', lineHeight: 1.12 }}>{plan.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 9, fontSize: 12.5, color: 'var(--ink-soft)' }}>
          <span>{fmtDateShort(plan.date)} · {new Date(plan.date).getFullYear()}</span>
          {plan.memories > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="image" size={13} />{plan.memories}</span>}
        </div>
        {editing && <div style={{ marginTop: 9 }}><LiveEditBadge inline /></div>}
      </button>
    </div>
  );
}

function LiveEditBadge({ inline }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      position: inline ? 'static' : 'absolute', bottom: 12, left: 14,
      background: inline ? 'var(--orange-tint)' : 'rgba(255,252,247,0.92)',
      borderRadius: 999, padding: '5px 11px', fontSize: 12, fontWeight: 600, color: 'var(--orange-deep)',
      boxShadow: inline ? 'none' : 'var(--sh-sm)',
    }}>
      <Avatar person={COUPLE.partner} size={18} ring={false} />
      <span>Lucía está editando</span>
      <span style={{ display: 'flex', gap: 2 }}>
        {[0,1,2].map(i => <span key={i} style={{ width: 3, height: 3, borderRadius: '50%',
          background: 'var(--orange)', animation: `pulse 1s ${i*0.18}s infinite` }} />)}
      </span>
    </div>
  );
}

// ── helpers ────────────────────────────────────────
function romano(n) {
  const map = [[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let r = '', x = n;
  for (const [v, s] of map) { while (x >= v) { r += s; x -= v; } }
  return r;
}
function countdown(iso) {
  const ms = new Date(iso + 'T00:00:00') - new Date('2026-06-07T00:00:00');
  const d = Math.round(ms / 86400000);
  if (d < 0) return 'pasado';
  if (d === 0) return 'hoy';
  if (d === 1) return 'mañana';
  if (d < 7) return `en ${d} días`;
  if (d < 14) return 'en 1 semana';
  return `en ${Math.round(d/7)} semanas`;
}

Object.assign(window, { Dashboard, romano, countdown });
