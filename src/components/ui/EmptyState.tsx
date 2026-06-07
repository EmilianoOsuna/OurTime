import { Icon } from './Icon'

export function EmptyState({ icon, title, body, action, accent = 'orange' }: {
  icon: string
  title: string
  body: string
  action?: React.ReactNode
  accent?: 'orange' | 'blue'
}) {
  const col = accent === 'blue' ? 'var(--blue)' : 'var(--orange)'
  const tint = accent === 'blue' ? 'var(--blue-tint)' : 'var(--orange-tint)'
  return (
    <div className="anim-up" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      padding: '40px 30px',
    }}>
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
          <Icon name={icon} size={44} style={{ color: col }} />
        </div>
      </div>
      <div className="display" style={{ fontSize: 25, marginBottom: 8, maxWidth: 250 }}>{title}</div>
      <div style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.5, maxWidth: 270, textWrap: 'pretty' }}>{body}</div>
      {action && <div style={{ marginTop: 22 }}>{action}</div>}
    </div>
  )
}
