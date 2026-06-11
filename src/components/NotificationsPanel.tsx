import { useState, type ReactNode } from 'react'
import { motion, animate, AnimatePresence, useMotionValue } from 'framer-motion'
import { Sheet } from './ui/Sheet'
import { Icon } from './ui/Icon'

export interface NotifItem {
  id: string
  person?: { name: string; initial: string; color: string }
  icon?: string
  text: ReactNode
  time: string
  read: boolean
}

function NotifRow({ item, onDismiss }: { item: NotifItem; onDismiss: () => void }) {
  const x = useMotionValue(0)

  return (
    <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: '#dc2626',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 18 }}>
        <Icon name="trash" size={18} style={{ color: 'white' }} />
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={{ left: 0.5, right: 0 }}
        style={{ x, background: 'var(--card)', borderRadius: 22, position: 'relative' }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60) {
            animate(x, -120, { duration: 0.15 }).then(onDismiss)
          }
        }}
      >
        <div className="ot-card" style={{ display: 'flex', gap: 13, padding: 14, alignItems: 'flex-start',
          opacity: item.read ? 0.6 : 1, boxShadow: 'none', background: 'transparent' }}>
          {item.person
            ? <div className="avatar" style={{ width: 40, height: 40, background: item.person.color,
                fontSize: 18, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.55)' }}>{item.person.initial}</div>
            : <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--orange-tint)',
                color: 'var(--orange-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={item.icon || 'sparkle'} size={20} /></div>}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, lineHeight: 1.4 }}>{item.text}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 3 }}>{item.time}</div>
          </div>
          {!item.read && <span className="dot" style={{ background: 'var(--orange)', marginTop: 6 }} />}
        </div>
      </motion.div>
    </div>
  )
}

export function NotificationsPanel({ onClose, items }: {
  onClose: () => void
  items: NotifItem[]
}) {
  const storageKey = 'ourtime:dismissedNotifs'
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch { return new Set() }
  })

  const dismiss = (id: string) => {
    setDismissed(prev => {
      const next = new Set(prev)
      next.add(id)
      localStorage.setItem(storageKey, JSON.stringify([...next]))
      return next
    })
  }

  return (
    <Sheet onClose={onClose} height="78%">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0 16px' }}>
        <h2 className="display" style={{ fontSize: 26, margin: 0 }}>Novedades</h2>
        <button onClick={() => { const all = items.map(n => n.id); setDismissed(new Set(all)); localStorage.setItem(storageKey, JSON.stringify(all)) }} className="chip">Marcar leído</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <AnimatePresence>
          {items.map(n => {
            if (dismissed.has(n.id)) return null
            return (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 120 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}>
                <NotifRow item={n} onDismiss={() => dismiss(n.id)} />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </Sheet>
  )
}
