import { useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import { CAT_META } from '../../lib/chapterUtils'
import { Icon } from '../ui/Icon'
import { DatePicker } from '../ui/DatePicker'

const CAT_ICON: Record<string, string> = {
  cena: 'utensils', viaje: 'plane', cine: 'film', cafe: 'coffee',
  regalo: 'gift', noche: 'moon', musica: 'music', ruta: 'mapRoute',
  salida: 'coffee', otro: 'tag',
}

interface Props { onClose: () => void; onCreated: () => void }

export const NewPlanSheet: React.FC<Props> = ({ onClose, onCreated }) => {
  const { activeStoryId } = useAuth()
  const { push } = useToast()
  const [title, setTitle]         = useState('')
  const [cat, setCat]             = useState<string>('salida')
  const [date, setDate]           = useState('')
  const [place, setPlace]         = useState('')
  const [budget, setBudget]       = useState('')
  const [saving, setSaving]       = useState(false)

  const ok = title.trim() && date

  const submit = async () => {
    if (!ok || !activeStoryId) return
    setSaving(true)
    const { error } = await supabase.from('plans').insert({
      story_id: activeStoryId,
      title: title.trim(),
      type: cat,
      plan_date: date,
      place: place.trim() || null,
      budget_amount: budget ? +budget : null,
      status: 'pendiente',
    })
    setSaving(false)
    if (error) { alert(error.message); return }
    push({ icon: 'sparkle', eyebrow: 'Momento creado', title: `«${title.trim()}»`, body: 'Añadido a tu historia' })
    onCreated()
    onClose()
  }

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ padding: '4px 0 16px' }}>
        <div className="eyebrow" style={{ color: 'var(--orange-deep)', marginBottom: 6 }}>· Nuevo momento ·</div>
        <h2 className="display" style={{ fontSize: 26, margin: '0 0 20px' }}>Un plan por escribir</h2>

        <label className="field-label">Título <span style={{ color: 'var(--orange)' }}>*</span></label>
        <input className="field" placeholder="Cena sorpresa en…" value={title}
          onChange={e => setTitle(e.target.value)} autoFocus />

        <label className="field-label" style={{ marginTop: 18 }}>Categoría</label>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="ot-scroll">
          {Object.entries(CAT_META).map(([k, m]) => {
            const icon = CAT_ICON[k] || 'tag'
            const on = cat === k
            return (
              <button key={k} onClick={() => setCat(k)}
                className={'chip' + (on ? ' active' : '')} style={{ flexShrink: 0 }}>
                <Icon name={icon} size={13} /> {m.label}
              </button>
            )
          })}
        </div>

        <div style={{ marginTop: 18 }}>
          <DatePicker label="Fecha *" value={date} onChange={setDate} />
        </div>

        <label className="field-label" style={{ marginTop: 18 }}>Lugar <span style={{ color: 'var(--ink-faint)', fontWeight: 400, textTransform: 'none' }}>(opcional)</span></label>
        <input className="field" placeholder="¿Dónde será?" value={place} onChange={e => setPlace(e.target.value)} />

        <label className="field-label" style={{ marginTop: 18 }}>Presupuesto estimado <span style={{ color: 'var(--ink-faint)', fontWeight: 400, textTransform: 'none' }}>(opcional)</span></label>
        <input className="field" placeholder="0.00" value={budget} inputMode="decimal"
          onChange={e => setBudget(e.target.value.replace(/[^0-9.]/g, ''))} />

        <button className="btn btn-orange btn-block" style={{ marginTop: 24 }}
          disabled={!ok || saving} onClick={submit}>
          <Icon name="feather" size={18} /> {saving ? 'Guardando…' : 'Crear momento'}
        </button>
      </div>
    </BottomSheet>
  )
}
