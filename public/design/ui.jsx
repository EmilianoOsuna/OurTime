// ui.jsx — shared UI primitives for OurTime
// Depends on: Icon (icons.jsx), data.jsx

function Avatar({ person, size = 40, ring = true, style = {} }) {
  return (
    <div className="avatar" style={{
      width: size, height: size, background: person.color,
      fontSize: size * 0.46, boxShadow: ring ? 'inset 0 0 0 2px rgba(255,255,255,0.55)' : 'none',
      ...style,
    }}>{person.initial}</div>
  );
}

// stacked couple avatars
function CoupleAvatars({ size = 34, gap = -10 }) {
  return (
    <div style={{ display: 'flex' }}>
      <Avatar person={COUPLE.partner} size={size} />
      <div style={{ marginLeft: gap }}><Avatar person={COUPLE.me} size={size} /></div>
    </div>
  );
}

// category tag pill
function CatTag({ cat, subtle = false }) {
  const c = CATS[cat]; if (!c) return null;
  const tone = c.tone === 'blue'
    ? { bg: 'var(--blue-tint)', fg: 'var(--blue-deep)' }
    : { bg: 'var(--orange-tint)', fg: 'var(--orange-deep)' };
  return (
    <span className="chip-tag" style={{
      background: subtle ? 'transparent' : tone.bg, color: tone.fg,
      display: 'inline-flex', alignItems: 'center', gap: 5,
      boxShadow: subtle ? 'inset 0 0 0 1px var(--line)' : 'none',
    }}>
      <Icon name={c.icon} size={13} stroke={2.2} />
      {c.label}
    </span>
  );
}

// circular category medallion (for timeline dots, detail headers)
function CatMedallion({ cat, size = 46, active = true }) {
  const c = CATS[cat]; if (!c) return null;
  const blue = c.tone === 'blue';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: active ? (blue ? 'var(--blue)' : 'var(--orange)') : 'var(--card-2)',
      color: active ? '#fff' : 'var(--ink-faint)',
      boxShadow: active ? (blue ? '0 4px 12px rgba(4,116,186,0.3)' : '0 4px 12px rgba(241,119,32,0.3)') : 'inset 0 0 0 1.5px var(--line)',
      flexShrink: 0,
    }}>
      <Icon name={c.icon} size={size * 0.45} stroke={2} />
    </div>
  );
}

// ── Segmented control ──────────────────────────────
function Segmented({ options, value, onChange, style = {} }) {
  return (
    <div style={{
      display: 'flex', background: 'var(--card-2)', borderRadius: 999,
      padding: 4, boxShadow: 'inset 0 0 0 1px var(--line)', position: 'relative', ...style,
    }}>
      {options.map(o => {
        const on = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} style={{
            flex: 1, border: 'none', cursor: 'pointer', position: 'relative', zIndex: 1,
            background: on ? 'var(--card)' : 'transparent',
            color: on ? 'var(--ink)' : 'var(--ink-soft)',
            boxShadow: on ? 'var(--sh-sm)' : 'none',
            borderRadius: 999, padding: '9px 8px', fontFamily: 'var(--font-ui)',
            fontWeight: on ? 700 : 600, fontSize: 14, transition: 'all .2s',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

// ── Presence — partner live indicator ──────────────
function PresenceDot({ size = 9, color = 'var(--done)' }) {
  return (
    <span style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color,
        animation: 'pulseRing 1.8s ease-out infinite' }} />
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color,
        boxShadow: '0 0 0 2px var(--card)' }} />
    </span>
  );
}

// ── Empty state — illustrated with geometric placeholder ──
function EmptyState({ icon, title, body, action, accent = 'orange' }) {
  const col = accent === 'blue' ? 'var(--blue)' : 'var(--orange)';
  const tint = accent === 'blue' ? 'var(--blue-tint)' : 'var(--orange-tint)';
  return (
    <div className="anim-up" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      padding: '40px 30px',
    }}>
      {/* layered editorial illustration: stacked frames */}
      <div style={{ position: 'relative', width: 132, height: 116, marginBottom: 26 }}>
        <div style={{ position: 'absolute', inset: 0, transform: 'rotate(-7deg) translateY(6px)',
          background: 'var(--card)', borderRadius: 18, boxShadow: 'var(--sh-sm)',
          border: '1px solid var(--line)' }} />
        <div style={{ position: 'absolute', inset: 0, transform: 'rotate(5deg)',
          background: 'var(--card)', borderRadius: 18, boxShadow: 'var(--sh-sm)',
          border: '1px solid var(--line)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: tint, borderRadius: 18, boxShadow: 'var(--sh-md)',
          animation: 'floatY 4s ease-in-out infinite' }}>
          <Icon name={icon} size={44} stroke={1.6} style={{ color: col }} />
        </div>
      </div>
      <div className="display" style={{ fontSize: 25, marginBottom: 8, maxWidth: 250 }}>{title}</div>
      <div style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.5, maxWidth: 270, textWrap: 'pretty' }}>{body}</div>
      {action && <div style={{ marginTop: 22 }}>{action}</div>}
    </div>
  );
}

// ── Confetti burst (for completing a chapter) ──────
function Confetti({ show }) {
  if (!show) return null;
  const colors = ['#F17720', '#0474BA', '#2E7D5B', '#F4B740', '#D75E12'];
  const pieces = Array.from({ length: 36 });
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 80 }}>
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.3;
        const dur = 1.4 + Math.random() * 1;
        const sz = 6 + Math.random() * 7;
        const col = colors[i % colors.length];
        const round = Math.random() > 0.5;
        return (
          <span key={i} style={{
            position: 'absolute', top: -12, left: left + '%',
            width: sz, height: round ? sz : sz * 0.5,
            background: col, borderRadius: round ? '50%' : 2,
            animation: `confettiFall ${dur}s ${delay}s cubic-bezier(.2,.6,.4,1) forwards`,
          }} />
        );
      })}
    </div>
  );
}

// ── Toast / in-app notification stack ──────────────
const ToastCtx = React.createContext(null);
function useToast() { return React.useContext(ToastCtx); }

function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);
  const push = React.useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(ts => [...ts, { id, ...t }]);
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), t.duration || 4200);
  }, []);
  const dismiss = (id) => setToasts(ts => ts.filter(x => x.id !== id));
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div style={{
        position: 'absolute', top: 58, left: 0, right: 0, zIndex: 90,
        display: 'flex', flexDirection: 'column', gap: 8, padding: '0 14px', pointerEvents: 'none',
      }}>
        {toasts.map(t => <Toast key={t.id} t={t} onClose={() => dismiss(t.id)} />)}
      </div>
    </ToastCtx.Provider>
  );
}

function Toast({ t, onClose }) {
  const person = t.person;
  return (
    <div onClick={onClose} style={{
      pointerEvents: 'auto', background: 'var(--card)', borderRadius: 18,
      boxShadow: 'var(--sh-lg)', border: '1px solid var(--line-soft)',
      padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
      animation: 'fadeUp .4s cubic-bezier(.2,.8,.2,1) both', cursor: 'pointer',
    }}>
      {person
        ? <div style={{ position: 'relative' }}>
            <Avatar person={person} size={38} />
            <span style={{ position: 'absolute', bottom: -1, right: -1 }}><PresenceDot size={8} /></span>
          </div>
        : <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--orange-tint)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange-deep)' }}>
            <Icon name={t.icon || 'sparkle'} size={20} />
          </div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        {t.eyebrow && <div className="eyebrow" style={{ fontSize: 9.5, marginBottom: 2 }}>{t.eyebrow}</div>}
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 }}>{t.title}</div>
        {t.body && <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 1 }}>{t.body}</div>}
      </div>
    </div>
  );
}

Object.assign(window, {
  Avatar, CoupleAvatars, CatTag, CatMedallion, Segmented, PresenceDot,
  EmptyState, Confetti, ToastProvider, useToast, Toast,
});
