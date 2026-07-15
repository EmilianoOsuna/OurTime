import { useState, useEffect } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useCurrency, CURRENCIES } from '../../context/CurrencyContext'
import { supabase } from '../../lib/supabase'

import { Icon } from '../ui/Icon'
import type { PlanType } from '../../lib/supabase'
import { sendPushToStoryMembers } from '../../lib/usePushNotifications'

const CATS = [
  { id: 'cena',   label: 'Gastronomía', icon: 'utensils' },
  { id: 'viaje',  label: 'Viajes',      icon: 'plane' },
  { id: 'cine',   label: 'Ocio',        icon: 'film' },
  { id: 'regalo', label: 'Regalos',     icon: 'gift' },
  { id: 'casa',   label: 'Hogar',       icon: 'home' },
  { id: 'otro',   label: 'Otros',       icon: 'tag' },
]

interface Props { onClose: () => void; onCreated: () => void }

export const MoneySheet: React.FC<Props> = ({ onClose, onCreated }) => {
  const { activeStoryId, stories } = useAuth()
  const { push } = useToast()
  const { currency } = useCurrency()
  const sym = CURRENCIES[currency].symbol
  const [amt, setAmt]     = useState('')
  const [label, setLabel] = useState('')
  const [cat, setCat]     = useState('cena')
  const [planId, setPlanId] = useState('')
  const [plans, setPlans]   = useState<PlanType[]>([])
  const [saving, setSaving] = useState(false)

  const ok = amt && +amt > 0 && label.trim()

  useEffect(() => {
    if (!activeStoryId) return
    supabase.from('plans').select('*').eq('story_id', activeStoryId).neq('status', 'cancelado')
      .order('plan_date', { ascending: true })
      .then(({ data }) => { if (data) setPlans(data as PlanType[]) })
  }, [activeStoryId])

  const submit = async () => {
    if (!ok || !activeStoryId) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('transactions').insert({
      story_id: activeStoryId,
      user_id: user?.id ?? null,
      type: 'gasto',
      amount: +amt,
      description: label.trim(),
      category: cat,
      plan_id: planId || null,
      transaction_date: new Date().toISOString().slice(0, 10),
    })
    if (error) { setSaving(false); push({ icon: 'x', title: 'Error', body: error.message }); return }

    // Linking to a plan confirms the expense on it: the amount accumulates
    // into the plan's actual_amount so the budget counts it there.
    const linkedPlan = planId ? plans.find(p => p.id === planId) : null
    if (linkedPlan) {
      const { error: planError } = await supabase.from('plans')
        .update({ actual_amount: (linkedPlan.actual_amount ?? 0) + +amt })
        .eq('id', linkedPlan.id)
      if (planError) console.error('No se pudo actualizar el gasto del momento:', planError)
    }

    setSaving(false)
    push({ icon: 'check', eyebrow: 'Gasto guardado',
      title: '–' + sym + (+amt).toLocaleString('es-ES'),
      body: linkedPlan ? `${label.trim()} · sumado a “${linkedPlan.title}”` : label.trim() })
    if (user?.id) {
      const storyName = stories.find(story => story.id === activeStoryId)?.name ?? 'tu historia'
      sendPushToStoryMembers(
        activeStoryId,
        user.id,
        `Nuevo gasto · ${storyName}`,
        `${sym}${(+amt).toLocaleString('es-ES')} · ${label.trim()}`,
        `/?shortcut=finance&story=${encodeURIComponent(activeStoryId)}`,
        { event_type: 'expense_created', target_id: planId || undefined },
      ).catch(console.error)
    }
    onCreated()
    onClose()
  }

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ padding: '4px 0 16px' }}>
        <div className="eyebrow" style={{ color: 'var(--done)', marginBottom: 6 }}>· Nuevo gasto ·</div>
        <h2 className="display" style={{ fontSize: 26, margin: '0 0 18px' }}>Una inversión juntos</h2>

        {/* Importe */}
        <div style={{ textAlign: 'center', padding: '24px 0 10px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
            <span className="display" style={{ fontSize: 34, color: 'var(--ink-faint)' }}>{sym}</span>
            <input value={amt} onChange={e => setAmt(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="0" inputMode="decimal"
              style={{ border: 'none', outline: 'none', background: 'transparent',
                fontFamily: 'var(--font-display)', fontSize: 54, fontWeight: 500,
                width: 'auto', maxWidth: 200, textAlign: 'center', color: 'var(--ink)' }}
              size={Math.max(1, amt.length || 1)} />
          </div>
        </div>

        <label className="field-label">Concepto</label>
        <input className="field" placeholder="Cena en…"
          value={label} onChange={e => setLabel(e.target.value)} />

        <label className="field-label" style={{ marginTop: 18 }}>Categoría</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {CATS.map(c => {
            const on = cat === c.id
            return (
              <button key={c.id} onClick={() => setCat(c.id)} style={{ border: 'none', cursor: 'pointer',
                borderRadius: 14, padding: '12px 6px', background: on ? 'var(--ink)' : 'var(--card-2)',
                color: on ? 'var(--paper)' : 'var(--ink-soft)',
                boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--line)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all .18s' }}>
                <Icon name={c.icon} size={20} />
                <span style={{ fontSize: 11.5, fontWeight: 600 }}>{c.label}</span>
              </button>
            )
          })}
        </div>

        <label className="field-label" style={{ marginTop: 18 }}>
          ¿A qué momento? <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--ink-faint)' }}>(opcional · se suma al gasto real del momento)</span>
        </label>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="ot-scroll">
          <button onClick={() => setPlanId('')} className={'chip' + (!planId ? ' active' : '')}
            style={{ flexShrink: 0 }}>Ninguno</button>
          {plans.map((p) => (
            <button key={p.id} onClick={() => setPlanId(p.id)}
              className={'chip' + (planId === p.id ? ' active' : '')} style={{ flexShrink: 0 }}>
              {p.title.length > 20 ? p.title.slice(0, 18) + '…' : p.title}
            </button>
          ))}
        </div>

        <button className="btn btn-block" style={{ marginTop: 24,
          background: 'var(--orange)', color: '#fff' }}
          disabled={!ok || saving} onClick={submit}>
          <Icon name="check" size={18} /> {saving ? 'Guardando…' : 'Guardar gasto'}
        </button>
      </div>
    </BottomSheet>
  )
}
