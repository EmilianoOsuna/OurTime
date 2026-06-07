import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { CatMedallion } from '../components/ui/CatMedallion'
import { Icon } from '../components/ui/Icon'
import { fmtDate } from '../lib/chapterUtils'
import type { PlanType } from '../lib/supabase'

const DIAS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']
const MESES_L = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const todayStr = new Date().toISOString().slice(0, 10)

function CircBtn({ icon, onClick }: { icon: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: 42, height: 42, borderRadius: '50%', border: 'none',
      background: 'var(--card)', boxShadow: 'var(--sh-sm)', cursor: 'pointer',
      color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon name={icon} size={19} />
    </button>
  )
}

export default function Calendar({ onOpenPlan }: { onOpenPlan?: (p: PlanType) => void }) {
  const { coupleId } = useAuth()
  const [plans, setPlans] = useState<PlanType[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date()
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const [sel, setSel] = useState(todayStr)

  useEffect(() => {
    if (!coupleId) return
    supabase.from('plans').select('*').eq('couple_id', coupleId)
      .order('plan_date', { ascending: true }).then(({ data }) => {
        if (data) setPlans(data as PlanType[])
        setLoading(false)
      })
  }, [coupleId])

  const byDate: Record<string, PlanType[]> = {}
  plans.forEach(p => {
    const d = p.plan_date.slice(0, 10)
    ;(byDate[d] = byDate[d] || []).push(p)
  })

  const first = new Date(ym.y, ym.m, 1)
  const startDow = (first.getDay() + 6) % 7
  const daysIn = new Date(ym.y, ym.m + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysIn; d++) cells.push(d)

  const iso = (d: number) =>
    `${ym.y}-${String(ym.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const move = (dir: number) => setYm(({ y, m }) => {
    let nm = m + dir, ny = y
    if (nm < 0) { nm = 11; ny-- }
    if (nm > 11) { nm = 0; ny++ }
    return { y: ny, m: nm }
  })

  const selPlans = byDate[sel] || []

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
        <div className="eyebrow" style={{ marginBottom: 7 }}>Su agenda</div>
        <h1 className="display" style={{ fontSize: 32, margin: 0 }}>Calendario</h1>
      </div>

      {/* Month switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px 8px' }}>
        <h2 className="display" style={{ fontSize: 22, margin: 0 }}>
          {MESES_L[ym.m]}{' '}
          <span style={{ color: 'var(--ink-faint)' }}>{ym.y}</span>
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <CircBtn icon="chevL" onClick={() => move(-1)} />
          <CircBtn icon="chevR" onClick={() => move(1)} />
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: '0 18px' }}>
        <div className="card" style={{ padding: '14px 12px 16px' }}>
          {/* Day labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', textAlign: 'center', marginBottom: 6 }}>
            {DIAS.map((d, i) => (
              <div key={i} className="eyebrow" style={{ fontSize: 10, padding: '4px 0' }}>{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {cells.map((d, i) => {
              if (!d) return <div key={i} />
              const day = iso(d)
              const ps = byDate[day] || []
              const isSel = day === sel
              const isToday = day === todayStr
              return (
                <button key={i} onClick={() => setSel(day)} style={{
                  aspectRatio: '1', border: 'none', cursor: 'pointer', borderRadius: 12,
                  background: isSel ? 'var(--ink)' : 'transparent',
                  color: isSel ? '#FBF6EE' : 'var(--ink)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 3, position: 'relative',
                  fontFamily: 'var(--font-ui)', transition: 'background .18s',
                }}>
                  <span style={{
                    fontSize: 14.5, fontWeight: isToday ? 800 : 500,
                    color: isToday && !isSel ? 'var(--orange)' : 'inherit',
                  }}>{d}</span>
                  <span style={{ display: 'flex', gap: 2, height: 5 }}>
                    {ps.slice(0, 3).map((p, j) => (
                      <span key={j} className="dot" style={{
                        width: 5, height: 5,
                        background: isSel ? '#FBF6EE'
                          : (p.status === 'completado' ? 'var(--done)' : 'var(--orange)'),
                      }} />
                    ))}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Selected day detail */}
      <div style={{ padding: '24px 22px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>
          {sel ? fmtDate(sel) : 'Selecciona un día'}
        </div>
        {selPlans.length ? selPlans.map(p => (
          <button key={p.id} onClick={() => onOpenPlan?.(p)} className="card" style={{
            width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 14, padding: 14, marginBottom: 10,
          }}>
            <CatMedallion cat={p.type} size={46} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="display" style={{ fontSize: 16.5, lineHeight: 1.1 }}>{p.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 4, display: 'flex', gap: 10 }}>
                {p.description && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="pin" size={13} />{p.description}
                  </span>
                )}
              </div>
            </div>
            {p.status === 'completado' && (
              <span style={{ color: 'var(--done)' }}><Icon name="checkCircle" size={20} /></span>
            )}
          </button>
        )) : (
          <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-soft)' }}>
            <div className="serif-i" style={{ fontSize: 18, color: 'var(--ink)', marginBottom: 4 }}>
              Un día en blanco
            </div>
            <div style={{ fontSize: 13.5 }}>Sin planes todavía. ¿Escriben uno?</div>
          </div>
        )}
      </div>
    </div>
  )
}
