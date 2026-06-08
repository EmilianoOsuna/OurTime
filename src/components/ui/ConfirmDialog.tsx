import { createContext, useContext, useState, useCallback } from 'react'
import { Icon } from './Icon'

interface ConfirmOpts {
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type ConfirmFn = (opts: ConfirmOpts) => Promise<boolean>

const Ctx = createContext<ConfirmFn>(async () => false)
export const useConfirm = () => useContext(Ctx)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null)

  const confirm: ConfirmFn = useCallback((opts) =>
    new Promise(resolve => setPending({ ...opts, resolve })), [])

  const handle = (v: boolean) => {
    pending?.resolve(v)
    setPending(null)
  }

  return (
    <Ctx.Provider value={confirm}>
      {children}
      {pending && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 24px',
        }}>
          <div onClick={() => handle(false)} style={{
            position: 'absolute', inset: 0,
            background: 'rgba(33,29,24,0.52)', backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)', animation: 'fadeIn .2s both',
          }} />
          <div style={{
            position: 'relative', background: 'var(--card)', borderRadius: 24,
            padding: '28px 24px 20px', width: '100%', maxWidth: 360,
            boxShadow: '0 24px 60px rgba(33,29,24,0.22)',
            animation: 'popIn .28s cubic-bezier(.2,.8,.2,1) both',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, marginBottom: 16,
              background: pending.danger ? 'rgba(220,38,38,.1)' : 'var(--orange-tint)',
              color: pending.danger ? '#dc2626' : 'var(--orange-deep)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={pending.danger ? 'trash' : 'sparkle'} size={22} />
            </div>
            <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--ink)', marginBottom: 8, fontFamily: 'var(--font-ui)' }}>
              {pending.title}
            </div>
            {pending.body && (
              <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 20 }}>
                {pending.body}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: pending.body ? 0 : 20 }}>
              <button onClick={() => handle(false)} style={{
                flex: 1, padding: '13px 0', border: '1.5px solid var(--line)',
                borderRadius: 14, background: 'transparent', cursor: 'pointer',
                fontSize: 14.5, fontWeight: 600, color: 'var(--ink-soft)', fontFamily: 'var(--font-ui)',
              }}>
                {pending.cancelLabel ?? 'Cancelar'}
              </button>
              <button onClick={() => handle(true)} style={{
                flex: 1, padding: '13px 0', border: 'none',
                borderRadius: 14, cursor: 'pointer', fontSize: 14.5, fontWeight: 700,
                fontFamily: 'var(--font-ui)',
                background: pending.danger ? '#dc2626' : 'var(--orange)',
                color: '#fff',
              }}>
                {pending.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}
