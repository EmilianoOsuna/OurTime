import React, { createContext, useContext, useState, useCallback } from 'react'
import { Icon } from '../components/ui/Icon'

export type Toast = {
  id: string
  icon?: string
  eyebrow?: string
  title: string
  body?: string
  duration?: number
}

type ToastCtx = { push: (t: Omit<Toast, 'id'>) => void }
const Ctx = createContext<ToastCtx>({ push: () => {} })
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(Ctx)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(ts => [...ts, { id, ...t }])
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), t.duration ?? 4000)
  }, [])

  const dismiss = (id: string) => setToasts(ts => ts.filter(x => x.id !== id))

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div style={{
        position: 'fixed', top: 64, left: '50%', transform: 'translateX(-50%)',
        width: 'min(100vw - 28px, 420px)', zIndex: 200,
        display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} onClick={() => dismiss(t.id)} style={{
            pointerEvents: 'auto', background: 'var(--card)', borderRadius: 18,
            boxShadow: 'var(--sh-lg)', border: '1px solid var(--line-soft)',
            padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
            animation: 'fadeUp .4s cubic-bezier(.2,.8,.2,1) both', cursor: 'pointer',
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--orange-tint)',
              color: 'var(--orange-deep)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
              <Icon name={t.icon || 'sparkle'} size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {t.eyebrow && <div className="eyebrow" style={{ fontSize: 9.5, marginBottom: 2 }}>{t.eyebrow}</div>}
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 }}>{t.title}</div>
              {t.body && <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 1 }}>{t.body}</div>}
            </div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
