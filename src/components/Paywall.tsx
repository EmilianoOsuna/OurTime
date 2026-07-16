import { useState } from 'react'
import { BottomSheet } from './ui/BottomSheet'
import { Icon } from './ui/Icon'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useEntitlement } from '../lib/useEntitlement'
import { startCheckout, openBillingPortal, type CheckoutInterval } from '../lib/stripe'
import { PAYWALL_COPY, type PaywallReason } from '../lib/paywall'
import type { PlanTier } from '../lib/supabase'

type TierCard = {
  plan: Extract<PlanTier, 'duo' | 'familia'>
  name: string
  tagline: string
  priceMonthly: string
  priceYearly?: string
  features: string[]
  highlight?: boolean
}

const TIERS: TierCard[] = [
  {
    plan: 'duo',
    name: 'Duo',
    tagline: 'Para su relación, sin límites',
    priceMonthly: '$3.99',
    priceYearly: '$34.99',
    highlight: true,
    features: [
      'Historias ilimitadas',
      'Momentos y fotos ilimitados',
      'Sincronización con Google Calendar',
      'Exportar recuerdos en PDF',
      'Soporte prioritario',
    ],
  },
  {
    plan: 'familia',
    name: 'Familia',
    tagline: 'Todo Duo, para toda la familia',
    priceMonthly: '$6.99',
    features: [
      'Todo lo de Duo',
      'Hasta 6 miembros por Historia',
      'Roles y permisos por miembro',
      'Presupuesto familiar por categorías',
    ],
  },
]

interface Props { onClose: () => void; reason?: PaywallReason }

export const Paywall: React.FC<Props> = ({ onClose, reason = 'generic' }) => {
  const { activeStoryId, entitlements } = useAuth()
  const { push } = useToast()
  const { isPro } = useEntitlement(activeStoryId)
  const [interval, setInterval] = useState<CheckoutInterval>('month')
  const [busy, setBusy] = useState<string | null>(null)

  const copy = PAYWALL_COPY[reason]
  const currentEnt = activeStoryId ? entitlements[activeStoryId] : undefined

  const onSubscribe = async (plan: 'duo' | 'familia') => {
    if (!activeStoryId) { push({ icon: 'x', title: 'Selecciona una Historia primero' }); return }
    // Familia solo mensual en v1; Duo respeta el toggle.
    const chosen: CheckoutInterval = plan === 'familia' ? 'month' : interval
    setBusy(plan)
    try {
      await startCheckout({ storyId: activeStoryId, plan, interval: chosen })
    } catch (e) {
      push({ icon: 'x', title: 'No se pudo iniciar el pago', body: e instanceof Error ? e.message : undefined })
    } finally {
      setBusy(null)
    }
  }

  const onManage = async () => {
    if (!activeStoryId) return
    setBusy('manage')
    try {
      await openBillingPortal(activeStoryId)
    } catch (e) {
      push({ icon: 'x', title: 'No se pudo abrir la gestión', body: e instanceof Error ? e.message : undefined })
    } finally {
      setBusy(null)
    }
  }

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ paddingTop: 4, paddingBottom: 8 }}>
        <div className="eyebrow" style={{ color: 'var(--orange)' }}>{copy.eyebrow}</div>
        <h2 className="display" style={{ fontSize: 26, lineHeight: 1.15, margin: '6px 0 4px' }}>
          {copy.title}
        </h2>
        <p style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.55, margin: '0 0 18px' }}>
          El plan gratis es para probar. Cuando lo hacen suyo, desbloqueen todo el espacio compartido —
          cuesta menos que un café al mes para los dos.
        </p>

        {isPro ? (
          <div className="ot-card" style={{ padding: 18, textAlign: 'center' }}>
            <Icon name="check" size={22} />
            <div style={{ fontWeight: 700, marginTop: 8 }}>
              Esta Historia ya tiene {currentEnt?.plan === 'familia' ? 'Familia' : 'Duo'}
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', margin: '6px 0 14px' }}>
              {currentEnt?.cancel_at_period_end
                ? 'Se cancelará al final del periodo actual.'
                : 'Gracias por apoyar OurTime 💛'}
            </p>
            <button onClick={onManage} disabled={busy === 'manage'} style={btnSecondary}>
              {busy === 'manage' ? 'Abriendo…' : 'Gestionar suscripción'}
            </button>
          </div>
        ) : (
          <>
            {/* Toggle mensual / anual (aplica a Duo) */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--paper-2, var(--card))',
              border: '1px solid var(--line)', borderRadius: 999, padding: 4, marginBottom: 16 }}>
              {(['month', 'year'] as CheckoutInterval[]).map(i => (
                <button key={i} onClick={() => setInterval(i)} style={{
                  flex: 1, border: 'none', borderRadius: 999, padding: '9px 12px', cursor: 'pointer',
                  fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600,
                  background: interval === i ? 'var(--ink)' : 'transparent',
                  color: interval === i ? 'var(--paper)' : 'var(--ink-soft)',
                }}>
                  {i === 'month' ? 'Mensual' : 'Anual · ahorra 27%'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {TIERS.map(t => {
                const price = t.plan === 'duo' && interval === 'year' && t.priceYearly ? t.priceYearly : t.priceMonthly
                const per = t.plan === 'duo' && interval === 'year' ? '/año' : '/mes'
                return (
                  <div key={t.plan} className="ot-card" style={{
                    padding: 18, position: 'relative',
                    border: t.highlight ? '1.5px solid var(--orange)' : '1px solid var(--line)',
                  }}>
                    {t.highlight && (
                      <div style={{ position: 'absolute', top: -10, right: 16, background: 'var(--orange)',
                        color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                        letterSpacing: '0.03em' }}>
                        POPULAR
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>{t.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{t.tagline}</div>
                      </div>
                      <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>{price}</span>
                        <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{per}</span>
                      </div>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 16px', display: 'flex',
                      flexDirection: 'column', gap: 7 }}>
                      {t.features.map(f => (
                        <li key={f} style={{ display: 'flex', gap: 9, alignItems: 'center', fontSize: 14 }}>
                          <span style={{ color: 'var(--orange)', flexShrink: 0, display: 'inline-flex' }}>
                            <Icon name="check" size={16} />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => onSubscribe(t.plan)} disabled={busy === t.plan}
                      style={t.highlight ? btnPrimary : btnSecondary}>
                      {busy === t.plan ? 'Abriendo…' : `Elegir ${t.name}`}
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <p style={{ fontSize: 11.5, color: 'var(--ink-faint)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
          Se cobra a través de Stripe. Cancela cuando quieras. Cualquier miembro admin puede pagar y el plan
          aplica a toda la Historia.
        </p>
      </div>
    </BottomSheet>
  )
}

const btnBase: React.CSSProperties = {
  width: '100%', borderRadius: 999, padding: '13px 20px', fontSize: 15, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'var(--font-ui)',
}
const btnPrimary: React.CSSProperties = {
  ...btnBase, border: 'none', background: 'var(--orange)', color: '#fff', boxShadow: 'var(--sh-sm)',
}
const btnSecondary: React.CSSProperties = {
  ...btnBase, border: '1.5px solid var(--line)', background: 'var(--card)', color: 'var(--ink)',
}
