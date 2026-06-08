import { useState, useEffect } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useCurrency, CURRENCIES } from '../../context/CurrencyContext'
import { supabase } from '../../lib/supabase'
import { toRoman } from '../../lib/chapterUtils'
import { Icon } from '../ui/Icon'
import type { PlanType } from '../../lib/supabase'
import { sendPushToStoryMembers } from '../../lib/usePushNotifications'

const CATS_OUT = [
  { id: 'cena',   label: 'Gastronomía', icon: 'utensils' },
  { id: 'viaje',  label: 'Viajes',      icon: 'plane' },
  { id: 'cine',   label: 'Ocio',        icon: 'film' },
  { id: 'regalo', label: 'Regalos',     icon: 'gift' },
  { id: 'casa',   label: 'Hogar',       icon: 'home' },
  { id: 'otro',   label: 'Otros',       icon: 'tag' },
]
const CATS_IN = [
  { id: 'aporte', label: 'Aporte',  icon: 'wallet' },
  { id: 'regalo', label: 'Regalo',  icon: 'gift' },
  { id: 'otro',   label: 'Otros',   icon: 'trendUp' },
]

interface Props { onClose: () => void; onCreated: () => void }

export const MoneySheet: React.FC<Props> = ({ onClose, onCreated }) => {
  const { activeStoryId } = useAuth()
  const { push } = useToast()
  const { currency } = useCurrency()
  const sym = CURRENCIES[currency].symbol
  const [kind, setKind]   = useState<'gasto' | 'ingreso'>('gasto')
  const [amt, setAmt]     = useState('')
  const [label, setLabel] = useState('')
  const [cat, setCat]     = useState('cena')
  const [planId, setPlanId] = useState('')
  const [plans, setPlans]   = useState<PlanType[]>([])
  const [saving, setSaving] = useState(false)

  const cats = kind === 'ingreso' ? CATS_IN : CATS_OUT
  const ok = amt && +amt > 0 && label.trim()

  useEffect(() => { setCat(cats[0].id) }, [kind])

  useEffect(() => {
    if (!activeStoryId) return
    supabase.from('plans').select('*').eq('story_id', activeStoryId)
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
      type: kind,
      amount: +amt,
      description: label.trim(),
      category: cat,
      plan_id: planId || null,
      transaction_date: new Date().toISOString().slice(0, 10),
    })
    setSaving(false)
    if (error) { alert(error.message); return }
    push({ icon: 'check', eyebrow: 'Movimiento guardado',
      title: (kind === 'ingreso' ? '+' : '–') + sym + (+amt).toLocaleString('es-ES'),
      body: label.trim() })
    if (user?.id && kind === 'gasto') {
      sendPushToStoryMembers(activeStoryId, user.id, 'Nuevo gasto registrado', `${sym}${(+amt).toLocaleString('es-ES')} · ${label.trim()}`)
    }
    onCreated()
    onClose()
  }

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ padding: '4px 0 16px' }}>
        <div className="eyebrow" style={{ color: 'var(--done)', marginBottom: 6 }}>· Nuevo movimiento ·</div>
        <h2 className="display" style={{ fontSize: 26, margin: '0 0 18px' }}>Una inversión juntos</h2>

        {/* Tipo */}
        <div className="segmented">
          {(['gasto','ingreso'] as const).map(k => (
            <button key={k} className={kind === k ? 'active' : ''} onClick={() => setKind(k)}>
              {k === 'gasto' ? 'Gasto' : 'Ingreso'}
            </button>
          ))}
        </div>

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
        <input className="field" placeholder={kind === 'ingreso' ? 'Aporte de junio…' : 'Cena en…'}
          value={label} onChange={e => setLabel(e.target.value)} />

        <label className="field-label" style={{ marginTop: 18 }}>Categoría</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {cats.map(c => {
            const on = cat === c.id
            return (
              <button key={c.id} onClick={() => setCat(c.id)} style={{ border: 'none', cursor: 'pointer',
                borderRadius: 14, padding: '12px 6px', background: on ? 'var(--ink)' : 'var(--card-2)',
                color: on ? '#FBF6EE' : 'var(--ink-soft)',
                boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--line)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all .18s' }}>
                <Icon name={c.icon} size={20} />
                <span style={{ fontSize: 11.5, fontWeight: 600 }}>{c.label}</span>
              </button>
            )
          })}
        </div>

        <label className="field-label" style={{ marginTop: 18 }}>
          ¿A qué momento? <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--ink-faint)' }}>(opcional)</span>
        </label>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="ot-scroll">
          <button onClick={() => setPlanId('')} className={'chip' + (!planId ? ' active' : '')}
            style={{ flexShrink: 0 }}>Ninguno</button>
          {plans.map((p, i) => (
            <button key={p.id} onClick={() => setPlanId(p.id)}
              className={'chip' + (planId === p.id ? ' active' : '')} style={{ flexShrink: 0 }}>
              Mom. {toRoman(i + 1)}
            </button>
          ))}
        </div>

        <button className="btn btn-block" style={{ marginTop: 24,
          background: kind === 'ingreso' ? 'var(--done)' : 'var(--orange)', color: '#fff' }}
          disabled={!ok || saving} onClick={submit}>
          <Icon name="check" size={18} /> {saving ? 'Guardando…' : 'Guardar movimiento'}
        </button>
      </div>
    </BottomSheet>
  )
}
