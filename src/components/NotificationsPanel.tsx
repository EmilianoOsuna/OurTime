import React from 'react'
import { Sheet } from './ui/Sheet'
import { Icon } from './ui/Icon'

interface NotifItem {
  person?: { name: string; initial: string; color: string }
  icon?: string
  text: React.ReactNode
  time: string
  read: boolean
}

export function NotificationsPanel({ onClose, items }: {
  onClose: () => void
  items: NotifItem[]
}) {
  return (
    <Sheet onClose={onClose} height="78%">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0 16px' }}>
        <h2 className="display" style={{ fontSize: 26, margin: 0 }}>Novedades</h2>
        <button onClick={onClose} className="chip">Marcar leído</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((n, i) => (
          <div key={i} className="ot-card" style={{ display: 'flex', gap: 13, padding: 14, alignItems: 'flex-start',
            opacity: n.read ? 0.6 : 1 }}>
            {n.person
              ? <div className="avatar" style={{ width: 40, height: 40, background: n.person.color,
                  fontSize: 18, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.55)' }}>{n.person.initial}</div>
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
  )
}
