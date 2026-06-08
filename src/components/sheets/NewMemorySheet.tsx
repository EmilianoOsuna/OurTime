import { useState, useEffect } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import { toRoman } from '../../lib/chapterUtils'
import { compressToWebP } from '../../lib/imageUtils'
import { Icon } from '../ui/Icon'
import type { PlanType } from '../../lib/supabase'

interface Props { onClose: () => void; onCreated: () => void }

export const NewMemorySheet: React.FC<Props> = ({ onClose, onCreated }) => {
  const { activeStoryId } = useAuth()
  const { push } = useToast()
  const [file, setFile]     = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [planId, setPlanId]   = useState('')
  const [plans, setPlans]     = useState<PlanType[]>([])
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    if (!activeStoryId) return
    supabase.from('plans').select('*').eq('story_id', activeStoryId)
      .order('plan_date', { ascending: true })
      .then(({ data }) => { if (data) setPlans(data as PlanType[]) })
  }, [activeStoryId])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const submit = async () => {
    if (!file || !activeStoryId) return
    setSaving(true)
    try {
      const webp = await compressToWebP(file, 1920, 0.82)
      const path = `${activeStoryId}/${Date.now()}.webp`
      const { error: upErr } = await supabase.storage.from('Fotos').upload(path, webp, { contentType: 'image/webp' })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('Fotos').getPublicUrl(path)
      const { error: insErr } = await supabase.from('memories').insert({
        story_id: activeStoryId, plan_id: planId || null,
        image_url: publicUrl, caption: caption || null,
      })
      if (insErr) throw insErr
      push({ icon: 'image', eyebrow: 'Recuerdo añadido', title: 'Foto guardada en la galería' })
      onCreated()
      onClose()
    } catch (e: any) {
      alert('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ padding: '4px 0 16px' }}>
        <div className="eyebrow" style={{ color: 'var(--blue-deep)', marginBottom: 6 }}>· Nuevo recuerdo ·</div>
        <h2 className="display" style={{ fontSize: 26, margin: '0 0 18px' }}>Guardad el momento</h2>

        {/* Upload area */}
        <div className="ph blue" onClick={() => document.getElementById('mem-file')?.click()}
          style={{ height: 180, borderRadius: 18, flexDirection: 'column', gap: 10, cursor: 'pointer',
            overflow: 'hidden', position: 'relative' }}>
          <input id="mem-file" type="file" accept="image/*" className="hidden" onChange={handleFile} style={{ display: 'none' }} />
          {preview ? (
            <img src={preview} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <>
              <div style={{ width: 52, height: 52, borderRadius: 15, background: 'var(--card)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--blue)', boxShadow: 'var(--sh-sm)' }}>
                <Icon name="camera" size={26} />
              </div>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10,
                background: 'rgba(255,252,247,0.78)', padding: '4px 8px', borderRadius: 6,
                color: 'var(--ink-faint)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Toca para subir una foto
              </span>
            </>
          )}
        </div>

        <label className="field-label" style={{ marginTop: 18 }}>Pie de foto</label>
        <input className="field" placeholder="Un momento especial…" value={caption} onChange={e => setCaption(e.target.value)} />

        <label className="field-label" style={{ marginTop: 18 }}>Momento</label>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="ot-scroll">
          <button onClick={() => setPlanId('')} className={'chip' + (!planId ? ' active' : '')}
            style={{ flexShrink: 0 }}>Sin momento</button>
          {plans.map((p, i) => (
            <button key={p.id} onClick={() => setPlanId(p.id)}
              className={'chip' + (planId === p.id ? ' active' : '')} style={{ flexShrink: 0 }}>
              Mom. {toRoman(i + 1)}
            </button>
          ))}
        </div>

        <button className="btn btn-blue btn-block" style={{ marginTop: 24 }}
          disabled={!file || saving} onClick={submit}>
          <Icon name="check" size={18} /> {saving ? 'Subiendo…' : 'Guardar recuerdo'}
        </button>
      </div>
    </BottomSheet>
  )
}
