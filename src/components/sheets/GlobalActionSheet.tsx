import { BottomSheet } from '../ui/BottomSheet'
import { Icon } from '../ui/Icon'

const ITEMS = [
  { id: 'newplan',    icon: 'calendarCheck', tint: 'var(--orange-tint)', col: 'var(--orange-deep)',
    title: 'Nuevo momento', body: 'Un plan, una cita, una aventura' },
  { id: 'newmemory',  icon: 'camera',        tint: 'var(--blue-tint)',   col: 'var(--blue-deep)',
    title: 'Nuevo recuerdo', body: 'Sube una foto a la galería' },
  { id: 'money',      icon: 'wallet',        tint: 'var(--done-tint)',   col: 'var(--done)',
    title: 'Nuevo movimiento', body: 'Un ingreso o gasto del fondo común' },
] as const

export function GlobalActionSheet({ onClose, onNewPlan, onNewMoney, onNewMemory }: {
  onClose: () => void
  onNewPlan: () => void
  onNewMoney: () => void
  onNewMemory: () => void
}) {
  const handlers: Record<string, () => void> = {
    newplan: onNewPlan, money: onNewMoney, newmemory: onNewMemory,
  }
  return (
    <BottomSheet onClose={onClose}>
      <div style={{ padding: '6px 0 12px' }}>
        <h2 className="display" style={{ fontSize: 24, margin: '0 0 4px' }}>¿Qué añadimos?</h2>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: '0 0 18px' }}>
          Sigue escribiendo su historia.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {ITEMS.map(it => (
            <button key={it.id} onClick={handlers[it.id]}
              className="ot-card" style={{ display: 'flex', alignItems: 'center', gap: 15,
                padding: 15, border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 50, height: 50, borderRadius: 15, background: it.tint,
                color: it.col, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={it.icon} size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{it.title}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 1 }}>{it.body}</div>
              </div>
              <Icon name="chevR" size={19} style={{ color: 'var(--ink-faint)' }} />
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  )
}
