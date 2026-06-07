import { useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import { CAT_META } from '../../lib/chapterUtils'
import { Icon } from '../ui/Icon'

const CAT_ICON: Record<string, string> = {
  cena: 'utensils', viaje: 'plane', cine: 'film', cafe: 'coffee',
  regalo: 'gift', noche: 'moon', musica: 'music', ruta: 'mapRoute',
  salida: 'coffee', otro: 'tag',
}

interface Props { onClose: () => void; onCreated: () => void }

export const NewPlanSheet: React.FC<Props> = ({ onClose, onCreated }) => {
  const { coupleId } = useAuth()
  const { push } = useToast()
  const [title, setTitle]   = useState('')
  const [cat, setCat]       = useState<string>('salida')
  const [date, setDate]     = useState('')
  const [place, setPlace]   = useState('')
  const [saving, setSaving] = useState(false)

  const ok = title.trim() && date

  const submit = async () => {
    if (!ok || !coupleId) return
    setSaving(true)
    const { error } = await supabase.from('plans').insert({
      couple_id: coupleId,
      title: title.trim(),
      type: cat,
      plan_date: date,
      description: place.trim() || null,
      status: 'pendiente',
    })
    setSaving(false)
    if (error) { alert(error.message); return }
    push({ icon: 'sparkle', eyebrow: 'Capítulo creado', title: `«${title.trim()}»`, body: 'Añadido a su historia' })
    onCreated()
    onClose()
  }

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ padding: '4px 0 16px' }}>
        <div className="eyebrow" style={{ color: 'var(--orange-deep)', marginBottom: 6 }}>· Nuevo capítulo ·</div>
        <h2 className="display" style={{ fontSize: 26, margin: '0 0 20px' }}>Un plan por escribir</h2>

        <label className="field-label">Título del capítulo</label>
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
          <label className="field-label">Fecha</label>
          <input className="field" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <label className="field-label" style={{ marginTop: 18 }}>Lugar</label>
        <input className="field" placeholder="¿Dónde será?" value={place} onChange={e => setPlace(e.target.value)} />

        <button className="btn btn-orange btn-block" style={{ marginTop: 24 }}
          disabled={!ok || saving} onClick={submit}>
          <Icon name="feather" size={18} /> {saving ? 'Guardando…' : 'Crear capítulo'}
        </button>
      </div>
    </BottomSheet>
  )
}
