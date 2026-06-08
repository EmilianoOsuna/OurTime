import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Icon } from '../components/ui/Icon'
import { Avatar } from '../components/ui/Avatar'
import { Segmented } from '../components/ui/Segmented'
import { fmtDateShort } from '../lib/chapterUtils'
import { useCurrency } from '../context/CurrencyContext'
import { useAuth } from '../context/AuthContext'
import type { PersonDisplay, PlanType } from '../lib/supabase'

interface Tx {
  id: string
  type: 'ingreso' | 'gasto'
  amount: number
  description: string | null
  category: string | null
  transaction_date: string
  created_at: string
  user_id?: string | null
}

const CAT_ICONS: Record<string, string> = {
  cena: 'utensils', viaje: 'plane', cine: 'film', cafe: 'coffee',
  regalo: 'gift', noche: 'moon', musica: 'music', ruta: 'mapRoute',
  salida: 'coffee', otro: 'tag', hogar: 'home',
}

export default function Finances({ me, partner }: {
  me: PersonDisplay
  partner: PersonDisplay | null
}) {
  const { fmt } = useCurrency()
  const { user, activeStoryId } = useAuth()
  const [txs, setTxs] = useState<Tx[]>([])
  const [budgetPlans, setBudgetPlans] = useState<PlanType[]>([])
  const [seg, setSeg] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeStoryId) return
    supabase.from('transactions').select('*').eq('story_id', activeStoryId)
      .order('created_at', { ascending: false }).then(({ data }) => {
        if (data) setTxs(data as Tx[])
        setLoading(false)
      })
    supabase.from('plans').select('*').eq('story_id', activeStoryId)
      .not('budget_amount', 'is', null)
      .order('plan_date', { ascending: true })
      .then(({ data }) => { if (data) setBudgetPlans(data as PlanType[]) })
  }, [activeStoryId])

  const income = txs.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
  const spent = txs.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0)
  const balance = income - spent

  const myIn = txs.filter(t => t.type === 'ingreso' && t.user_id === user?.id).reduce((s, t) => s + t.amount, 0)
  const partnerIn = txs.filter(t => t.type === 'ingreso' && t.user_id !== user?.id && t.user_id != null).reduce((s, t) => s + t.amount, 0)

  const list = seg === 0 ? txs : seg === 1
    ? txs.filter(t => t.type === 'ingreso')
    : txs.filter(t => t.type === 'gasto')

  if (loading) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--orange)',
          borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div className="ot-scroll page-enter" style={{ paddingBottom: 130 }}>
      {/* Header */}
      <div style={{ padding: '8px 22px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 7 }}>Fondo común</div>
        <h1 className="display" style={{ fontSize: 32, margin: 0 }}>Presupuesto</h1>
      </div>

      {/* Balance hero card */}
      <div style={{ padding: '18px 22px 0' }}>
        <div className="card hero-card" style={{
          padding: '22px 20px',
          boxShadow: 'var(--sh-md)', position: 'relative', overflow: 'hidden',
        }}>
          {/* Radial orange accent */}
          <div style={{
            position: 'absolute', right: -30, top: -30, width: 130, height: 130,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(241,119,32,0.35), transparent 70%)',
          }} />

          <div className="eyebrow" style={{ color: 'var(--hero-soft)' }}>Saldo disponible</div>
          <div className="display" style={{ fontSize: 42, margin: '6px 0 0', color: 'var(--hero-text)' }}>{fmt(balance)}</div>

          <div style={{ display: 'flex', gap: 20, marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 30, height: 30, borderRadius: 9,
                background: 'rgba(46,125,91,0.25)', color: '#7BD9A8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="trendUp" size={16} />
              </span>
              <div>
                <div style={{ fontSize: 11, color: 'var(--hero-soft)' }}>Aportado</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--hero-text)' }}>{fmt(income)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 30, height: 30, borderRadius: 9,
                background: 'rgba(241,119,32,0.25)', color: '#F9A86A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="trendDown" size={16} />
              </span>
              <div>
                <div style={{ fontSize: 11, color: 'var(--hero-soft)' }}>Gastado</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--hero-text)' }}>{fmt(spent)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contributions */}
      <div style={{ padding: '16px 22px 0', display: 'flex', gap: 12 }}>
        {[{ p: me, v: myIn }, { p: partner || { name: 'Pareja', initial: 'P', color: '#F17720' }, v: partnerIn }].map(({ p, v }) => (
          <div key={p.name} className="card" style={{
            flex: 1, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 11,
          }}>
            <Avatar person={p} size={36} />
            <div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{p.name}</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{fmt(v)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + list */}
      <div style={{ padding: '22px 22px 0' }}>
        <Segmented labels={['Todo', 'Ingresos', 'Gastos']} selected={seg} onChange={setSeg} />

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-faint)' }}>
              <Icon name="wallet" size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 600 }}>Sin movimientos</div>
            </div>
          )}
          {list.map(tx => <TxRow key={tx.id} tx={tx} fmt={fmt} />)}
        </div>
      </div>

      {/* Budget per plan */}
      {budgetPlans.length > 0 && (
        <div style={{ padding: '22px 22px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span className="eyebrow">Presupuesto por momento</span>
            <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {budgetPlans.map(plan => {
              const planSpent = txs
                .filter(t => (t as any).plan_id === plan.id && t.type === 'gasto')
                .reduce((s, t) => s + t.amount, 0)
              const budget = plan.budget_amount ?? 0
              const pct = budget > 0 ? Math.min(planSpent / budget, 1) : 0
              const over = planSpent > budget
              return (
                <div key={plan.id} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {plan.title}
                      </div>
                      {plan.place && (
                        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Icon name="pin" size={11} /> {plan.place}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: over ? 'var(--orange-deep)' : 'var(--ink)' }}>
                        {fmt(planSpent)}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>/ {fmt(budget)}</div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 6, borderRadius: 99, background: 'var(--card-2)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99, transition: 'width .5s cubic-bezier(.2,.8,.2,1)',
                      width: (pct * 100) + '%',
                      background: over ? 'var(--orange-deep)' : pct > 0.8 ? 'var(--orange)' : 'var(--done)',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11.5, color: 'var(--ink-faint)' }}>
                    <span>{Math.round(pct * 100)}% utilizado</span>
                    <span>{over ? `+${fmt(planSpent - budget)} sobre presupuesto` : `${fmt(budget - planSpent)} restante`}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function TxRow({ tx, fmt }: { tx: Tx; fmt: (n: number) => string }) {
  const inc = tx.type === 'ingreso'
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px' }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: inc ? 'var(--done-tint)' : 'var(--orange-tint)',
        color: inc ? 'var(--done)' : 'var(--orange-deep)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={CAT_ICONS[tx.category ?? ''] || 'tag'} size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.2 }}>{tx.description || tx.category}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span>{fmtDateShort(tx.transaction_date?.slice(0, 10) || tx.created_at?.slice(0, 10) || '')}</span>
        </div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 15.5, color: inc ? 'var(--done)' : 'var(--ink)' }}>
        {inc ? '+' : '–'}{fmt(tx.amount)}
      </div>
    </div>
  )
}
