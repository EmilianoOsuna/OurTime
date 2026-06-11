import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Icon } from '../components/ui/Icon'
import { Segmented } from '../components/ui/Segmented'
import { fmtDateShort } from '../lib/chapterUtils'
import { useCurrency } from '../context/CurrencyContext'
import { useAuth } from '../context/AuthContext'
import type { PlanType } from '../lib/supabase'

const TYPE_ICONS: Record<string, string> = {
  cena: 'utensils', viaje: 'plane', cine: 'film', cafe: 'coffee',
  regalo: 'gift', noche: 'moon', musica: 'music', ruta: 'mapRoute',
  salida: 'coffee', otro: 'tag',
}

function getPeriodBounds(period: 'mensual' | 'semanal' | null) {
  const now = new Date()
  if (period === 'semanal') {
    const day = now.getDay()
    const diff = day === 0 ? 6 : day - 1
    const start = new Date(now)
    start.setDate(now.getDate() - diff)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  }
}

function inPeriod(dateStr: string, period: 'mensual' | 'semanal' | null) {
  const { start, end } = getPeriodBounds(period)
  const d = new Date(dateStr)
  return d >= start && d <= end
}

export default function Finances() {
  const { fmt } = useCurrency()
  const { activeStoryId, stories, refreshStories } = useAuth()
  const [plans, setPlans] = useState<PlanType[]>([])
  const [loading, setLoading] = useState(true)
  const [seg, setSeg] = useState(0)
  const [editingBudget, setEditingBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')
  const [periodInput, setPeriodInput] = useState<'mensual' | 'semanal'>('mensual')
  const [savingBudget, setSavingBudget] = useState(false)

  const activeStory = stories.find(s => s.id === activeStoryId) ?? null
  const budget = activeStory?.budget ?? null
  const budgetPeriod = activeStory?.budget_period ?? 'mensual'

  useEffect(() => {
    if (!activeStoryId) return
    setLoading(true)
    supabase.from('plans').select('*').eq('story_id', activeStoryId)
      .or('budget_amount.not.is.null,actual_amount.not.is.null')
      .order('plan_date', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setPlans(data as PlanType[])
        setLoading(false)
      })
  }, [activeStoryId])

  // Confirmed spending in current period
  const confirmedPlans = plans.filter(p => p.actual_amount != null && inPeriod(p.plan_date, budgetPeriod))
  const spent = confirmedPlans.reduce((s, p) => s + (p.actual_amount ?? 0), 0)

  // Estimated (future plans with budget_amount but no actual_amount)
  const estimatedPlans = plans.filter(p => p.actual_amount == null && p.budget_amount != null)
  const estimatedTotal = estimatedPlans.reduce((s, p) => s + (p.budget_amount ?? 0), 0)

  const balance = budget !== null ? budget - spent : null
  const pct = budget && budget > 0 ? Math.min(spent / budget, 1) : 0

  // How many more moments can we afford?
  const pendingAvg = estimatedPlans.length > 0
    ? estimatedTotal / estimatedPlans.length
    : null
  const canAfford = balance != null && pendingAvg && pendingAvg > 0
    ? Math.floor(balance / pendingAvg)
    : null

  const saveBudget = async () => {
    if (!activeStoryId) return
    const val = parseFloat(budgetInput)
    if (isNaN(val) || val < 0) return
    setSavingBudget(true)
    await supabase.from('stories').update({
      budget: val || null,
      budget_period: periodInput,
    }).eq('id', activeStoryId)
    await refreshStories()
    setSavingBudget(false)
    setEditingBudget(false)
  }

  // Plans shown in list depending on segment
  const allWithAmount = [...confirmedPlans, ...estimatedPlans].sort(
    (a, b) => new Date(b.plan_date).getTime() - new Date(a.plan_date).getTime()
  )
  const listPlans = seg === 0 ? allWithAmount : seg === 1 ? confirmedPlans : estimatedPlans

  const periodLabel = budgetPeriod === 'semanal' ? 'Esta semana' : 'Este mes'
  const periodFullLabel = budgetPeriod === 'semanal' ? 'Presupuesto semanal' : 'Presupuesto mensual'

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

      {/* Hero card */}
      <div style={{ padding: '18px 22px 0' }}>
        <div className="card hero-card" style={{ padding: '22px 20px', boxShadow: 'var(--sh-md)', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(241,119,32,0.35), transparent 70%)',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="eyebrow" style={{ color: 'var(--hero-soft)' }}>
              {budget !== null ? `Saldo · ${periodLabel}` : periodFullLabel}
            </div>
            <button onClick={() => { setBudgetInput(String(budget ?? '')); setPeriodInput(budgetPeriod ?? 'mensual'); setEditingBudget(true) }}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, color: 'var(--hero-soft)', fontFamily: 'var(--font-ui)',
                display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
              <Icon name="edit" size={13} style={{ color: 'var(--hero-soft)' }} />
              {budget !== null ? 'Editar' : 'Añadir presupuesto'}
            </button>
          </div>

          {editingBudget ? (
            <div style={{ marginTop: 14 }}>
              <input value={budgetInput} onChange={e => setBudgetInput(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="Importe…" inputMode="decimal" autoFocus
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid rgba(244,238,228,0.3)',
                  background: 'rgba(255,255,255,0.1)', color: 'var(--hero-text)', fontSize: 18, boxSizing: 'border-box',
                  fontFamily: 'var(--font-ui)', outline: 'none', marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {(['mensual', 'semanal'] as const).map(p => (
                  <button key={p} onClick={() => setPeriodInput(p)} style={{
                    flex: 1, border: 'none', borderRadius: 10, padding: '10px',
                    background: periodInput === p ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                    color: 'var(--hero-text)', fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', transition: 'all .15s',
                  }}>
                    {p === 'mensual' ? 'Mensual' : 'Semanal'}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveBudget} disabled={savingBudget} style={{
                  flex: 1, border: 'none', background: 'rgba(255,255,255,0.2)', color: 'var(--hero-text)',
                  borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font-ui)', fontSize: 14,
                }}>{savingBudget ? '…' : 'Guardar'}</button>
                <button onClick={() => setEditingBudget(false)} style={{
                  border: 'none', background: 'transparent', color: 'var(--hero-soft)',
                  borderRadius: 10, padding: '11px 14px', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 13,
                }}>Cancelar</button>
              </div>
            </div>
          ) : (
            <>
              <div className="display" style={{ fontSize: 42, margin: '6px 0 0', color: 'var(--hero-text)' }}>
                {budget !== null ? fmt(balance!) : fmt(spent)}
              </div>

              <div style={{ display: 'flex', gap: 20, marginTop: 18, flexWrap: 'wrap' }}>
                {budget !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(100,180,140,0.25)', color: '#7BD9A8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="wallet" size={16} />
                    </span>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--hero-soft)' }}>{periodFullLabel}</div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--hero-text)' }}>{fmt(budget)}</div>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(241,119,32,0.25)', color: '#F9A86A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="trendDown" size={16} />
                  </span>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--hero-soft)' }}>Confirmado</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--hero-text)' }}>{fmt(spent)}</div>
                  </div>
                </div>
                {estimatedTotal > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(200,180,120,0.25)', color: '#E8C97A',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="calendar" size={15} />
                    </span>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--hero-soft)' }}>Estimado pendiente</div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--hero-text)' }}>{fmt(estimatedTotal)}</div>
                    </div>
                  </div>
                )}
              </div>

              {budget !== null && budget > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      width: (pct * 100) + '%',
                      background: spent > budget ? '#F9A86A' : '#7BD9A8',
                      transition: 'width .5s cubic-bezier(.2,.8,.2,1)',
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--hero-soft)', marginTop: 6,
                    display: 'flex', justifyContent: 'space-between' }}>
                    <span>{Math.round(pct * 100)}% utilizado</span>
                    {canAfford != null && canAfford > 0 && (
                      <span>~{canAfford} momento{canAfford !== 1 ? 's' : ''} más</span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Plan list */}
      <div style={{ padding: '22px 22px 0' }}>
        <Segmented labels={['Todo', 'Confirmados', 'Estimados']} selected={seg} onChange={setSeg} />

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {listPlans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-faint)' }}>
              <Icon name="wallet" size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 600 }}>Sin momentos con presupuesto</div>
              <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
                Añade un monto estimado a tus momentos para que aparezcan aquí
              </div>
            </div>
          ) : (
            listPlans.map(plan => <PlanRow key={plan.id} plan={plan} fmt={fmt} />)
          )}
        </div>
      </div>
    </div>
  )
}

function PlanRow({ plan, fmt }: { plan: PlanType; fmt: (n: number) => string }) {
  const confirmed = plan.actual_amount != null
  const amount = confirmed ? plan.actual_amount! : plan.budget_amount!
  const past = new Date(plan.plan_date) < new Date()

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px' }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: confirmed ? 'var(--done-tint)' : past ? 'var(--orange-tint)' : 'var(--card-2)',
        color: confirmed ? 'var(--done)' : past ? 'var(--orange-deep)' : 'var(--ink-faint)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={TYPE_ICONS[plan.type] || 'tag'} size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plan.title}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{fmtDateShort(plan.plan_date)}</span>
          <span style={{
            fontSize: 10.5, fontWeight: 700, padding: '1px 7px', borderRadius: 99, fontFamily: 'var(--font-ui)',
            background: confirmed ? 'var(--done-tint)' : past ? 'var(--orange-tint)' : 'var(--card-2)',
            color: confirmed ? 'var(--done)' : past ? 'var(--orange-deep)' : 'var(--ink-faint)',
          }}>
            {confirmed ? 'Confirmado' : past ? 'Por confirmar' : 'Estimado'}
          </span>
        </div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 15.5, color: confirmed ? 'var(--ink)' : 'var(--ink-soft)' }}>
        {confirmed ? '' : '~'}{fmt(amount)}
      </div>
    </div>
  )
}
