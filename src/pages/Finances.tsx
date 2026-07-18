import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Icon } from '../components/ui/Icon'
import { Segmented } from '../components/ui/Segmented'
import { fmtDateShort } from '../lib/chapterUtils'
import { useCurrency } from '../context/CurrencyContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { EditAction } from '../components/ui/EditAction'
import { FinancesSkeleton } from '../components/ui/Skeletons'
import type { PlanType, TransactionType } from '../lib/supabase'

const TYPE_ICONS: Record<string, string> = {
  cena: 'utensils', viaje: 'plane', cine: 'film', cafe: 'coffee',
  regalo: 'gift', noche: 'moon', musica: 'music', ruta: 'mapRoute',
  salida: 'coffee', otro: 'tag', casa: 'home', aporte: 'wallet',
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

export default function Finances({ onPlanClick, refreshKey = 0 }: { onPlanClick?: (p: PlanType) => void; refreshKey?: number }) {
  const { fmt } = useCurrency()
  const { activeStoryId, stories, refreshStories } = useAuth()
  const { push: toast } = useToast()
  const [plans, setPlans] = useState<PlanType[]>([])
  const [transactions, setTransactions] = useState<TransactionType[]>([])
  const [loadedStoryId, setLoadedStoryId] = useState<string | null>(null)
  const [seg, setSeg] = useState(0)
  const [editingBudget, setEditingBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')
  const [periodInput, setPeriodInput] = useState<'mensual' | 'semanal'>('mensual')
  const [savingBudget, setSavingBudget] = useState(false)

  const activeStory = stories.find(s => s.id === activeStoryId) ?? null
  const budget = activeStory?.budget ?? null
  const budgetPeriod = activeStory?.budget_period ?? 'mensual'

  // Skeleton only until the first load of the current story; refreshKey
  // bumps refetch silently.
  const loading = activeStoryId !== null && loadedStoryId !== activeStoryId

  useEffect(() => {
    if (!activeStoryId) return
    Promise.all([
      supabase.from('plans').select('*').eq('story_id', activeStoryId).neq('status', 'cancelado')
        .or('budget_amount.not.is.null,actual_amount.not.is.null')
        .order('plan_date', { ascending: false })
        .limit(50),
      supabase.from('transactions').select('*').eq('story_id', activeStoryId)
        .eq('type', 'gasto')
        .order('transaction_date', { ascending: false })
        .limit(100),
    ]).then(([plansRes, txRes]) => {
      if (plansRes.data) setPlans(plansRes.data as PlanType[])
      if (txRes.data) setTransactions(txRes.data as TransactionType[])
      setLoadedStoryId(activeStoryId)
    })
  }, [activeStoryId, refreshKey])

  // Confirmed spending in current period: confirmed plans + loose expenses.
  // Expenses linked to a plan are already folded into that plan's actual_amount.
  const confirmedPlans = plans.filter(p => p.actual_amount != null)
  const looseTx = transactions.filter(t => t.plan_id == null)
  const spent = confirmedPlans
    .filter(p => inPeriod(p.plan_date, budgetPeriod))
    .reduce((s, p) => s + (p.actual_amount ?? 0), 0)
    + looseTx
      .filter(t => inPeriod(t.transaction_date, budgetPeriod))
      .reduce((s, t) => s + t.amount, 0)

  // Estimated: pending plans with a budget_amount. Only those inside the
  // current period count against the projected balance.
  const estimatedPlans = plans.filter(p => p.actual_amount == null && p.budget_amount != null)
  const estimatedTotal = estimatedPlans
    .filter(p => inPeriod(p.plan_date, budgetPeriod))
    .reduce((s, p) => s + (p.budget_amount ?? 0), 0)

  const balance = budget !== null ? budget - spent : null
  const projected = balance !== null ? balance - estimatedTotal : null
  const pctSpent = budget && budget > 0 ? Math.min(spent / budget, 1) : 0
  const pctEstimated = budget && budget > 0
    ? Math.min(estimatedTotal / budget, 1 - pctSpent)
    : 0

  const saveBudget = async () => {
    if (!activeStoryId) return
    const val = parseFloat(budgetInput)
    if (isNaN(val) || val < 0) return
    setSavingBudget(true)
    const { error } = await supabase.from('stories').update({
      budget: val,
      budget_period: periodInput,
    }).eq('id', activeStoryId)
    if (error) {
      setSavingBudget(false)
      toast({ icon: 'x', title: 'No se pudo guardar el presupuesto', body: error.message })
      return
    }
    await refreshStories()
    setSavingBudget(false)
    setEditingBudget(false)
  }

  // Rows shown in list depending on segment (plans + loose expenses)
  type Row = { key: string; date: string; plan?: PlanType; tx?: TransactionType }
  const confirmedRows: Row[] = [
    ...confirmedPlans.map(p => ({ key: 'p' + p.id, date: p.plan_date, plan: p })),
    ...looseTx.map(t => ({ key: 't' + t.id, date: t.transaction_date, tx: t })),
  ]
  const estimatedRows: Row[] = estimatedPlans.map(p => ({ key: 'p' + p.id, date: p.plan_date, plan: p }))
  const listRows = (seg === 0 ? [...confirmedRows, ...estimatedRows] : seg === 1 ? confirmedRows : estimatedRows)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const periodLabel = budgetPeriod === 'semanal' ? 'Esta semana' : 'Este mes'
  const periodFullLabel = budgetPeriod === 'semanal' ? 'Presupuesto semanal' : 'Presupuesto mensual'

  if (loading) {
    return <FinancesSkeleton />
  }

  return (
    <div className="ot-scroll page-enter" style={{ paddingBottom: 130, paddingTop: 'var(--page-top)' }}>
      {/* Header - Drenched Block */}
      <div style={{
        margin: 'calc(-1 * var(--page-top)) 0 24px 0',
        padding: 'var(--page-top) 22px 28px',
        background: 'var(--hero-bg)',
        color: 'var(--hero-text)',
        borderRadius: '0 0 34px 34px'
      }}>
        <div className="eyebrow" style={{ marginBottom: 7, color: 'var(--hero-soft)' }}>Fondo común</div>
        <h1 className="display" style={{ fontSize: 44, margin: 0 }}>Presupuesto</h1>
        <span className="squiggle" aria-hidden="true" style={{ color: 'currentColor', width: 92, marginTop: 12 }} />
      </div>

      {/* Hero card */}
      <div style={{ padding: '18px 22px 0' }}>
        <div className="card hero-card" style={{ padding: '22px 20px', boxShadow: 'var(--sh-md)', position: 'relative', overflow: 'hidden' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="eyebrow" style={{ color: 'var(--hero-soft)' }}>
              {budget !== null ? `Disponible · ${periodLabel}` : periodFullLabel}
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <EditAction
                tone="onDark"
                label={budget !== null ? 'Editar' : 'Añadir presupuesto'}
                onClick={() => {
                  setBudgetInput(budget === null ? '' : String(budget))
                  setPeriodInput(budgetPeriod)
                  setEditingBudget(true)
                }}
              />
            </div>
          </div>

          {editingBudget ? (
            <div style={{ marginTop: 14 }}>
              <input value={budgetInput} onChange={e => setBudgetInput(e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                placeholder="Importe…" inputMode="decimal" autoFocus
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--line)',
                  background: 'var(--card-2)', color: 'var(--hero-text)', fontSize: 18, boxSizing: 'border-box',
                  fontFamily: 'var(--font-ui)', outline: 'none', marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {(['mensual', 'semanal'] as const).map(p => (
                  <button key={p} onClick={() => setPeriodInput(p)} style={{
                    flex: 1, border: 'none', borderRadius: 10, padding: '10px',
                    background: periodInput === p ? 'var(--ink)' : 'var(--card-2)',
                    color: periodInput === p ? 'var(--paper)' : 'var(--hero-text)', fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', transition: 'all .15s',
                  }}>
                    {p === 'mensual' ? 'Mensual' : 'Semanal'}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveBudget} disabled={savingBudget} style={{
                  flex: 1, border: 'none', background: 'var(--ink)', color: 'var(--paper)',
                  borderRadius: 10, padding: '11px', fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font-ui)', fontSize: 14,
                }}>{savingBudget ? '…' : 'Guardar'}</button>
                <button onClick={() => setEditingBudget(false)} style={{
                  border: 'none', background: 'transparent', color: 'var(--hero-text)',
                  borderRadius: 10, padding: '11px 14px', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 13,
                }}>Cancelar</button>
              </div>
            </div>
          ) : (
            <>
              <div className="display" style={{ fontSize: 46, margin: '6px 0 0', color: 'var(--hero-text)' }}>
                {budget !== null ? (projected! < 0 ? '−' : '') + fmt(projected!) : fmt(spent)}
              </div>
              {budget !== null && estimatedTotal > 0 && (
                <div style={{ fontSize: 12.5, color: 'var(--hero-soft)', marginTop: 4 }}>
                  {projected! < 0
                    ? `Los planes estimados rebasan tu presupuesto por ${fmt(-projected!)}`
                    : `Sin contar estimados te queda ${fmt(balance!)}`}
                </div>
              )}

              <div style={{ display: 'flex', gap: 20, marginTop: 18, flexWrap: 'wrap' }}>
                {budget !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 999, background: 'rgba(255,255,255,0.4)', color: 'var(--hero-text)',
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
                  <span style={{ width: 30, height: 30, borderRadius: 999, background: 'rgba(255,255,255,0.4)', color: 'var(--hero-text)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="trendDown" size={16} />
                  </span>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--hero-soft)' }}>Gastado</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--hero-text)' }}>{fmt(spent)}</div>
                  </div>
                </div>
                {estimatedTotal > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 999, background: 'rgba(255,255,255,0.4)', color: 'var(--hero-text)',
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
                  <div style={{ height: 4, borderRadius: 99, background: 'var(--line)',
                    overflow: 'hidden', display: 'flex' }}>
                    <div style={{
                      height: '100%',
                      width: (pctSpent * 100) + '%',
                      background: spent > budget ? 'var(--orange)' : 'var(--done)',
                      transition: 'width .5s cubic-bezier(.2,.8,.2,1)',
                    }} />
                    <div style={{
                      height: '100%',
                      width: (pctEstimated * 100) + '%',
                      background: 'var(--blue)', opacity: 0.75,
                      transition: 'width .5s cubic-bezier(.2,.8,.2,1)',
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--hero-soft)', marginTop: 6,
                    display: 'flex', justifyContent: 'space-between' }}>
                    <span>{Math.round(pctSpent * 100)}% gastado</span>
                    {estimatedTotal > 0 && (
                      <span>{Math.round(pctEstimated * 100)}% apartado en planes</span>
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
          {listRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-faint)' }}>
              <div style={{ width: 72, height: 72, borderRadius: 22, background: 'var(--orange-tint)',
                color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Icon name="wallet" size={34} />
              </div>
              <div className="display" style={{ fontSize: 24, marginBottom: 6 }}>¡Cero movimientos!</div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 20 }}>
                Añade un estimado a tus planes o registra un gasto. La cartera está en paz... por ahora.
              </div>
              <button onClick={() => { setBudgetInput(''); setEditingBudget(true); }} className="btn btn-orange" style={{ padding: '12px 20px' }}>
                Configurar presupuesto
              </button>
            </div>
          ) : (
            listRows.map(row => row.plan
              ? <PlanRow key={row.key} plan={row.plan} fmt={fmt} onClick={() => onPlanClick?.(row.plan!)} />
              : <TxRow key={row.key} tx={row.tx!} fmt={fmt} />)
          )}
        </div>
      </div>
    </div>
  )
}

function PlanRow({ plan, fmt, onClick }: { plan: PlanType; fmt: (n: number) => string; onClick: () => void }) {
  const confirmed = plan.actual_amount != null
  const amount = confirmed ? plan.actual_amount! : plan.budget_amount!
  const past = new Date(plan.plan_date) < new Date()

  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onClick} className="ot-card" style={{ 
      display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px',
      border: 'none', textAlign: 'left', cursor: 'pointer', minWidth: 0
    }}>
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
    </motion.button>
  )
}

function TxRow({ tx, fmt }: { tx: TransactionType; fmt: (n: number) => string }) {
  return (
    <div className="ot-card" style={{
      display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px', minWidth: 0
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: 'var(--done-tint)', color: 'var(--done)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={TYPE_ICONS[tx.category ?? 'otro'] || 'tag'} size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {tx.description || 'Gasto'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{fmtDateShort(tx.transaction_date)}</span>
          <span style={{
            fontSize: 10.5, fontWeight: 700, padding: '1px 7px', borderRadius: 99, fontFamily: 'var(--font-ui)',
            background: 'var(--done-tint)', color: 'var(--done)',
          }}>
            Gasto
          </span>
        </div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--ink)' }}>
        {fmt(tx.amount)}
      </div>
    </div>
  )
}
