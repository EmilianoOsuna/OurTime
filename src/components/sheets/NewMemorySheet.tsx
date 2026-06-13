import { useState, useEffect, useRef } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import { toRoman } from '../../lib/chapterUtils'
import { compressToWebP } from '../../lib/imageUtils'
import { sendPushToStoryMembers } from '../../lib/usePushNotifications'
import { Icon } from '../ui/Icon'
import type { PlanType, AlbumType } from '../../lib/supabase'

interface Props { onClose: () => void; onCreated: () => void; initialAlbumId?: string }

export const NewMemorySheet: React.FC<Props> = ({ onClose, onCreated, initialAlbumId }) => {
  const { activeStoryId, stories } = useAuth()
  const { push } = useToast()
  const [file, setFile]     = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const dragRef = useRef<{ pointerId: number; clientX: number; clientY: number; x: number; y: number } | null>(null)
  const ignoreSaveUntil = useRef(0)
  const [caption, setCaption] = useState('')
  const [planId, setPlanId]   = useState('')
  const [albumId, setAlbumId] = useState(initialAlbumId ?? '')
  const [plans, setPlans]     = useState<PlanType[]>([])
  const [albums, setAlbums]   = useState<AlbumType[]>([])
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])

  useEffect(() => {
    const blockPickerClickThrough = () => { ignoreSaveUntil.current = Date.now() + 600 }
    window.addEventListener('focus', blockPickerClickThrough)
    document.addEventListener('visibilitychange', blockPickerClickThrough)
    return () => {
      window.removeEventListener('focus', blockPickerClickThrough)
      document.removeEventListener('visibilitychange', blockPickerClickThrough)
    }
  }, [])

  useEffect(() => {
    if (!activeStoryId) return
    supabase.from('plans').select('*').eq('story_id', activeStoryId).neq('status', 'cancelado')
      .order('plan_date', { ascending: true })
      .then(({ data }) => { if (data) setPlans(data as PlanType[]) })
    supabase.from('albums').select('*').eq('story_id', activeStoryId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setAlbums(data as AlbumType[]) })
  }, [activeStoryId])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPosition({ x: 50, y: 50 })
    setPreview(URL.createObjectURL(f))
  }

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!preview) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY, ...position }
  }

  const moveImage = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))
    setPosition({
      x: clamp(drag.x - ((e.clientX - drag.clientX) / rect.width) * 100),
      y: clamp(drag.y - ((e.clientY - drag.clientY) / rect.height) * 100),
    })
  }

  const endDrag = () => { dragRef.current = null }

  const submit = async () => {
    if (!file || !activeStoryId || Date.now() < ignoreSaveUntil.current) return
    setSaving(true)
    try {
      const webp = await compressToWebP(file, 1920, 0.82)
      const path = `${activeStoryId}/${Date.now()}.webp`
      const { error: upErr } = await supabase.storage.from('Fotos').upload(path, webp, { contentType: 'image/webp' })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('Fotos').getPublicUrl(path)
      const { error: insErr } = await supabase.from('memories').insert({
        story_id: activeStoryId, plan_id: planId || null,
        album_id: albumId || null,
        image_url: publicUrl, caption: caption || null,
        position_x: position.x, position_y: position.y,
      })
      if (insErr) throw insErr
      push({ icon: 'image', eyebrow: 'Recuerdo añadido', title: 'Foto guardada en la galería' })
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const storyName = stories.find(story => story.id === activeStoryId)?.name ?? 'tu historia'
        sendPushToStoryMembers(
          activeStoryId, user.id,
          `Nuevo recuerdo · ${storyName}`,
          caption ? `«${caption}»` : 'Se añadió una nueva foto a la galería',
          `/?shortcut=gallery&story=${encodeURIComponent(activeStoryId)}`,
          { event_type: 'memory_created' },
        ).catch(console.error)
      }
      onCreated()
      onClose()
    } catch (e: any) {
      push({ icon: 'x', title: 'Error', body: e.message })
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
        <div className="ph blue"
          onPointerDown={startDrag} onPointerMove={moveImage} onPointerUp={endDrag} onPointerCancel={endDrag}
          onClick={() => { if (!preview) document.getElementById('mem-file')?.click() }}
          style={{ height: 180, borderRadius: 18, flexDirection: 'column', gap: 10, cursor: 'pointer',
            overflow: 'hidden', position: 'relative', touchAction: preview ? 'none' : 'auto' }}>
          <input id="mem-file" type="file" accept="image/*" className="hidden" onChange={handleFile} style={{ display: 'none' }} />
          {preview ? (
            <>
              <img src={preview} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: `${position.x}% ${position.y}%`, userSelect: 'none' }} />
              <div style={{ position: 'absolute', left: 10, bottom: 10, borderRadius: 9, padding: '6px 9px',
                background: 'rgba(0,0,0,.58)', color: '#fff', fontSize: 11.5, fontWeight: 700, pointerEvents: 'none' }}>
                Arrastra para reacomodar
              </div>
              <button type="button" onPointerDown={e => e.stopPropagation()} onClick={() => document.getElementById('mem-file')?.click()}
                style={{ position: 'absolute', right: 10, bottom: 10, border: 'none', borderRadius: 9, padding: '6px 9px',
                  background: 'rgba(0,0,0,.58)', color: '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                Cambiar
              </button>
            </>
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

        {albums.length > 0 && (
          <>
            <label className="field-label" style={{ marginTop: 18 }}>Álbum</label>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="ot-scroll">
              <button onClick={() => setAlbumId('')} className={'chip' + (!albumId ? ' active' : '')}
                style={{ flexShrink: 0 }}>Sin álbum</button>
              {albums.map(a => (
                <button key={a.id} onClick={() => setAlbumId(a.id)}
                  className={'chip' + (albumId === a.id ? ' active' : '')} style={{ flexShrink: 0 }}>
                  {a.name}
                </button>
              ))}
            </div>
          </>
        )}

        <button className="btn btn-blue btn-block" style={{ marginTop: 24 }}
          disabled={!file || saving} onClick={submit}>
          <Icon name="check" size={18} /> {saving ? 'Subiendo…' : 'Guardar recuerdo'}
        </button>
      </div>
    </BottomSheet>
  )
}
