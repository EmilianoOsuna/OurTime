// screens.jsx — Calendar, Gallery, Finance, MoneySheet
// Depends on Icon, ui.jsx, data helpers, overlays Sheet

// ════════════════════════════════════════════════════
//  CALENDAR
// ════════════════════════════════════════════════════
function CalendarScreen({ plans, onOpenPlan }) {
  const [ym, setYm] = React.useState({ y: 2026, m: 5 }); // June 2026 (0-idx)
  const [sel, setSel] = React.useState('2026-06-10');

  const byDate = {};
  plans.forEach(p => { (byDate[p.date] = byDate[p.date] || []).push(p); });

  const first = new Date(ym.y, ym.m, 1);
  let startDow = (first.getDay() + 6) % 7; // Mon=0
  const daysIn = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(d);

  const iso = (d) => `${ym.y}-${String(ym.m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const move = (dir) => setYm(({y,m}) => {
    let nm = m + dir, ny = y;
    if (nm < 0) { nm = 11; ny--; } if (nm > 11) { nm = 0; ny++; }
    return { y: ny, m: nm };
  });

  const selPlans = byDate[sel] || [];

  return (
    <div className="ot-scroll page-enter" style={{ paddingBottom: 130 }}>
      <div style={{ padding: '8px 22px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 7 }}>Vuestra agenda</div>
        <h1 className="display" style={{ fontSize: 32, margin: 0 }}>Calendario</h1>
      </div>

      {/* month switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px 8px' }}>
        <h2 className="display" style={{ fontSize: 22, margin: 0 }}>{MESES_L[ym.m]} <span style={{ color: 'var(--ink-faint)' }}>{ym.y}</span></h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <CircBtn icon="chevL" onClick={() => move(-1)} />
          <CircBtn icon="chevR" onClick={() => move(1)} />
        </div>
      </div>

      {/* grid */}
      <div style={{ padding: '0 18px' }}>
        <div className="card" style={{ padding: '14px 12px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', textAlign: 'center', marginBottom: 6 }}>
            {DIAS.map((d, i) => <div key={i} className="eyebrow" style={{ fontSize: 10, padding: '4px 0' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const day = iso(d);
              const ps = byDate[day] || [];
              const isSel = day === sel;
              const isToday = day === '2026-06-07';
              return (
                <button key={i} onClick={() => setSel(day)} style={{
                  aspectRatio: '1', border: 'none', cursor: 'pointer', borderRadius: 12,
                  background: isSel ? 'var(--ink)' : 'transparent', color: isSel ? '#FBF6EE' : 'var(--ink)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                  position: 'relative', fontFamily: 'var(--font-ui)', transition: 'background .18s',
                }}>
                  <span style={{ fontSize: 14.5, fontWeight: isToday ? 800 : 500,
                    color: isToday && !isSel ? 'var(--orange)' : 'inherit' }}>{d}</span>
                  <span style={{ display: 'flex', gap: 2, height: 5 }}>
                    {ps.slice(0,3).map((p, j) => (
                      <span key={j} className="dot" style={{ width: 5, height: 5,
                        background: isSel ? '#FBF6EE' : (CATS[p.cat].tone === 'blue' ? 'var(--blue)' : 'var(--orange)') }} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* selected day */}
      <div style={{ padding: '24px 22px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>
          {sel ? fmtDate(sel) : 'Selecciona un día'}
        </div>
        {selPlans.length ? selPlans.map(p => (
          <button key={p.id} onClick={() => onOpenPlan(p)} className="card" style={{ width: '100%', textAlign: 'left',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, padding: 14, marginBottom: 10 }}>
            <CatMedallion cat={p.cat} size={46} active={!p.done ? true : true} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="display" style={{ fontSize: 16.5, lineHeight: 1.1 }}>{p.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 4, display: 'flex', gap: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="pin" size={13} />{p.place}</span>
              </div>
            </div>
            {p.done && <span style={{ color: 'var(--done)' }}><Icon name="checkCircle" size={20} /></span>}
          </button>
        )) : (
          <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-soft)' }}>
            <div className="serif-i" style={{ fontSize: 18, color: 'var(--ink)', marginBottom: 4 }}>Un día en blanco</div>
            <div style={{ fontSize: 13.5 }}>Sin planes todavía. ¿Escribís uno?</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
//  GALLERY — working search + filter
// ════════════════════════════════════════════════════
function GalleryScreen({ memories, onOpen }) {
  const [q, setQ] = React.useState('');
  const [filter, setFilter] = React.useState('all');
  const [searchOpen, setSearchOpen] = React.useState(false);

  const cats = ['all', 'fav', ...new Set(memories.map(m => m.cat))];
  const catLabel = (k) => k === 'all' ? 'Todos' : k === 'fav' ? '♥ Favoritos' : CATS[k].label;

  const filtered = memories.filter(m => {
    if (filter === 'fav' && !m.fav) return false;
    if (filter !== 'all' && filter !== 'fav' && m.cat !== filter) return false;
    if (q.trim() && !m.title.toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  });

  // split into 2 masonry columns
  const cols = [[], []];
  filtered.forEach((m, i) => cols[i % 2].push(m));

  return (
    <div className="ot-scroll page-enter" style={{ paddingBottom: 130 }}>
      <div style={{ padding: '8px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 7 }}>Vuestros momentos</div>
            <h1 className="display" style={{ fontSize: 32, margin: 0 }}>Recuerdos</h1>
          </div>
          <CircBtn icon={searchOpen ? 'x' : 'search'} onClick={() => { setSearchOpen(s => !s); setQ(''); }} />
        </div>

        {searchOpen && (
          <div className="anim-up" style={{ marginTop: 14, position: 'relative' }}>
            <Icon name="search" size={18} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--ink-faint)' }} />
            <input className="field" autoFocus placeholder="Busca un recuerdo…" value={q}
              onChange={e => setQ(e.target.value)} style={{ paddingLeft: 42 }} />
          </div>
        )}

        {/* filter chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '16px 0 4px', margin: '0 -22px',
          paddingLeft: 22, paddingRight: 22 }} className="ot-scroll">
          {cats.map(k => (
            <button key={k} onClick={() => setFilter(k)} className={'chip' + (filter === k ? ' active' : '')}
              style={{ flexShrink: 0 }}>{catLabel(k)}</button>
          ))}
        </div>
      </div>

      {/* grid */}
      {filtered.length ? (
        <div style={{ display: 'flex', gap: 10, padding: '14px 18px 0' }}>
          {cols.map((col, ci) => (
            <div key={ci} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {col.map((m, i) => <MemoryCard key={m.id} m={m} onOpen={() => onOpen(m)} delay={i*0.04} />)}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon="search" accent="blue"
          title={q ? 'Sin coincidencias' : 'Aún no hay recuerdos'}
          body={q ? `No encontramos nada para “${q}”. Prueba otra palabra o filtro.`
                  : 'Cada foto que subáis aparecerá aquí, ordenada por capítulos.'} />
      )}
    </div>
  );
}

function MemoryCard({ m, onOpen, delay }) {
  return (
    <button onClick={onOpen} className="anim-up" style={{ border: 'none', cursor: 'pointer', padding: 0,
      borderRadius: 16, overflow: 'hidden', background: 'var(--card)', boxShadow: 'var(--sh-sm)',
      animationDelay: delay + 's', display: 'block' }}>
      <div className={'ph' + (m.tone === 'blue' ? ' blue' : '')} style={{ width: '100%',
        aspectRatio: '1 / ' + m.ratio, position: 'relative' }}>
        {m.fav && <span style={{ position: 'absolute', top: 10, right: 10, color: '#fff',
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}><Icon name="heartFill" size={18} /></span>}
      </div>
      <div style={{ padding: '10px 12px 12px', textAlign: 'left' }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>{m.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <Avatar person={m.by === 'Lucía' ? COUPLE.partner : COUPLE.me} size={17} ring={false} />
          <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{fmtDateShort(m.date)}</span>
        </div>
      </div>
    </button>
  );
}

// lightbox
function Lightbox({ m, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 96, background: 'rgba(20,16,12,0.92)',
      display: 'flex', flexDirection: 'column', animation: 'fadeIn .25s both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '56px 20px 14px' }}>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{fmtDate(m.date)}</div>
        <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none',
          background: 'rgba(255,255,255,0.14)', color: '#fff', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={20} /></button>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 18px' }} onClick={e => e.stopPropagation()}>
        <div className={'ph' + (m.tone === 'blue' ? ' blue' : '')} style={{ width: '100%',
          aspectRatio: '1 / ' + m.ratio, borderRadius: 18 }}>
          <span className="ph-label">recuerdo · {m.title}</span>
        </div>
      </div>
      <div style={{ padding: '20px 24px 40px', color: '#fff' }} onClick={e => e.stopPropagation()}>
        <div className="serif-i" style={{ fontSize: 22 }}>{m.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, color: 'rgba(255,255,255,0.75)', fontSize: 13.5 }}>
          <Avatar person={m.by === 'Lucía' ? COUPLE.partner : COUPLE.me} size={24} /> Subido por {m.by}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
//  FINANCE
// ════════════════════════════════════════════════════
function FinanceScreen({ tx, onAdd }) {
  const [tab, setTab] = React.useState('all');
  const income = tx.filter(t => t.kind === 'in').reduce((s,t)=>s+t.amt,0);
  const spent = tx.filter(t => t.kind === 'out').reduce((s,t)=>s+t.amt,0);
  const balance = income - spent;
  const mateoIn = tx.filter(t => t.kind==='in' && t.who==='Mateo').reduce((s,t)=>s+t.amt,0);
  const luciaIn = tx.filter(t => t.kind==='in' && t.who==='Lucía').reduce((s,t)=>s+t.amt,0);

  const list = tx.filter(t => tab === 'all' ? true : t.kind === tab)
    .slice().sort((a,b) => b.date.localeCompare(a.date));

  return (
    <div className="ot-scroll page-enter" style={{ paddingBottom: 130 }}>
      <div style={{ padding: '8px 22px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 7 }}>Fondo común</div>
        <h1 className="display" style={{ fontSize: 32, margin: 0 }}>Nuestras cuentas</h1>
      </div>

      {/* balance hero */}
      <div style={{ padding: '18px 22px 0' }}>
        <div className="card" style={{ padding: '22px 20px', background: 'var(--ink)', color: '#FBF6EE',
          boxShadow: 'var(--sh-md)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(241,119,32,0.4), transparent 70%)' }} />
          <div className="eyebrow" style={{ color: 'rgba(251,246,238,0.6)' }}>Saldo disponible</div>
          <div className="display" style={{ fontSize: 42, margin: '6px 0 0' }}>{eur(balance)}</div>
          <div style={{ display: 'flex', gap: 20, marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(46,125,91,0.25)',
                color: '#7BD9A8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="trendUp" size={16} /></span>
              <div><div style={{ fontSize: 11, color: 'rgba(251,246,238,0.55)' }}>Aportado</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{eur(income)}</div></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(241,119,32,0.25)',
                color: '#F9A86A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="trendDown" size={16} /></span>
              <div><div style={{ fontSize: 11, color: 'rgba(251,246,238,0.55)' }}>Gastado</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{eur(spent)}</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* contributions */}
      <div style={{ padding: '16px 22px 0', display: 'flex', gap: 12 }}>
        {[{p:COUPLE.me,v:mateoIn},{p:COUPLE.partner,v:luciaIn}].map(({p,v}) => (
          <div key={p.name} className="card" style={{ flex: 1, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 11 }}>
            <Avatar person={p} size={36} />
            <div><div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{p.name}</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{eur(v)}</div></div>
          </div>
        ))}
      </div>

      {/* filter + list */}
      <div style={{ padding: '22px 22px 0' }}>
        <Segmented value={tab} onChange={setTab} options={[
          { value: 'all', label: 'Todo' }, { value: 'in', label: 'Ingresos' }, { value: 'out', label: 'Gastos' } ]} />
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map(t => <TxRow key={t.id} t={t} />)}
        </div>
      </div>
    </div>
  );
}

function TxRow({ t }) {
  const inc = t.kind === 'in';
  const meta = (inc ? TX_CATS_IN : TX_CATS_OUT).find(c => c.id === t.cat) || { icon: 'tag' };
  const plan = t.plan ? PLANS.find(p => p.id === t.plan) : null;
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px' }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: inc ? 'var(--done-tint)' : 'var(--orange-tint)',
        color: inc ? 'var(--done)' : 'var(--orange-deep)',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={meta.icon} size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.2 }}>{t.label}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span>{fmtDateShort(t.date)}</span>
          {plan && <><span>·</span><span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Icon name="feather" size={11} />Cap. {romano(plan.no)}</span></>}
        </div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 15.5, color: inc ? 'var(--done)' : 'var(--ink)' }}>
        {inc ? '+' : '–'}{eur(t.amt)}
      </div>
    </div>
  );
}

// ── Money form (complete: tipo, monto, categoría, plan, quién) ──
function MoneySheet({ onClose, onCreate }) {
  const [kind, setKind] = React.useState('out');
  const [amt, setAmt] = React.useState('');
  const [label, setLabel] = React.useState('');
  const [cat, setCat] = React.useState('cena');
  const [plan, setPlan] = React.useState('');
  const [who, setWho] = React.useState('Mateo');
  const cats = kind === 'in' ? TX_CATS_IN : TX_CATS_OUT;
  React.useEffect(() => { setCat(cats[0].id); }, [kind]);
  const ok = amt && +amt > 0 && label.trim();

  return (
    <Sheet onClose={onClose}>
      <div style={{ padding: '4px 0 8px' }}>
        <div className="eyebrow" style={{ color: 'var(--done)', marginBottom: 6 }}>· Nuevo movimiento ·</div>
        <h2 className="display" style={{ fontSize: 26, margin: '0 0 18px' }}>Una inversión juntos</h2>

        <Segmented value={kind} onChange={setKind} options={[
          { value: 'out', label: 'Gasto' }, { value: 'in', label: 'Ingreso' } ]} />

        {/* amount */}
        <div style={{ textAlign: 'center', padding: '24px 0 10px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
            <span className="display" style={{ fontSize: 34, color: 'var(--ink-faint)' }}>€</span>
            <input value={amt} onChange={e => setAmt(e.target.value.replace(/[^0-9.]/g,''))} placeholder="0"
              inputMode="decimal" style={{ border: 'none', outline: 'none', background: 'transparent',
              fontFamily: 'var(--font-display)', fontSize: 54, fontWeight: 500, width: 'auto', maxWidth: 200,
              textAlign: 'center', color: 'var(--ink)' }} size={Math.max(1, amt.length || 1)} />
          </div>
        </div>

        <label className="field-label">Concepto</label>
        <input className="field" placeholder={kind==='in'?'Aporte de junio…':'Cena en…'} value={label} onChange={e => setLabel(e.target.value)} />

        <label className="field-label" style={{ marginTop: 18 }}>Categoría</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {cats.map(c => {
            const on = cat === c.id;
            return (
              <button key={c.id} onClick={() => setCat(c.id)} style={{ border: 'none', cursor: 'pointer',
                borderRadius: 14, padding: '12px 6px', background: on ? 'var(--ink)' : 'var(--card-2)',
                color: on ? '#FBF6EE' : 'var(--ink-soft)', boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--line)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all .18s' }}>
                <Icon name={c.icon} size={20} />
                <span style={{ fontSize: 11.5, fontWeight: 600 }}>{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* plan selector */}
        <label className="field-label" style={{ marginTop: 18 }}>¿A qué capítulo pertenece? <span style={{ textTransform: 'none', fontWeight: 500, color: 'var(--ink-faint)' }}>(opcional)</span></label>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="ot-scroll">
          <button onClick={() => setPlan('')} className={'chip' + (plan==='' ? ' active' : '')} style={{ flexShrink: 0 }}>Ninguno</button>
          {PLANS.map(p => (
            <button key={p.id} onClick={() => setPlan(p.id)} className={'chip' + (plan===p.id ? ' active' : '')}
              style={{ flexShrink: 0 }}>
              <Icon name={CATS[p.cat].icon} size={13} /> Cap. {romano(p.no)}
            </button>
          ))}
        </div>

        {/* who paid */}
        <label className="field-label" style={{ marginTop: 18 }}>{kind === 'in' ? 'Quién aporta' : 'Quién paga'}</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {[COUPLE.me, COUPLE.partner].map(p => {
            const on = who === p.name;
            return (
              <button key={p.name} onClick={() => setWho(p.name)} style={{ flex: 1, border: 'none', cursor: 'pointer',
                borderRadius: 14, padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                background: on ? 'var(--card)' : 'var(--card-2)', boxShadow: on ? 'inset 0 0 0 2px '+p.color : 'inset 0 0 0 1px var(--line)',
                transition: 'all .18s' }}>
                <Avatar person={p} size={26} /><span style={{ fontWeight: 600, fontSize: 14.5 }}>{p.name}</span>
              </button>
            );
          })}
        </div>

        <button className="btn btn-block" style={{ marginTop: 24,
          background: kind==='in' ? 'var(--done)' : 'var(--orange)', color: '#fff' }}
          disabled={!ok} onClick={() => onCreate({ kind, amt: +amt, label, cat, plan: plan||null, who })}>
          <Icon name="check" size={18} stroke={2.6} /> Guardar movimiento
        </button>
      </div>
    </Sheet>
  );
}

function CircBtn({ icon, onClick }) {
  return (
    <button onClick={onClick} style={{ width: 42, height: 42, borderRadius: '50%', border: 'none',
      background: 'var(--card)', boxShadow: 'var(--sh-sm)', cursor: 'pointer', color: 'var(--ink)',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={19} />
    </button>
  );
}

Object.assign(window, { CalendarScreen, GalleryScreen, Lightbox, FinanceScreen, MoneySheet, CircBtn });
