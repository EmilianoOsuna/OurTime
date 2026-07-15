import { useState, useRef, useEffect } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { compressToWebP } from '../../lib/imageUtils'
import { Icon } from '../ui/Icon'
import type { StoryType } from '../../lib/supabase'
import { useToast } from '../../context/ToastContext'

const CAT_OPTIONS: { id: StoryType['category']; label: string; icon: string; color: string }[] = [
  { id: 'pareja',  label: 'Pareja',   icon: 'heartFill', color: 'var(--cat-pareja)' },
  { id: 'amigos',  label: 'Amigos',   icon: 'users',     color: 'var(--cat-amigos)' },
  { id: 'familia', label: 'Familia',  icon: 'home',      color: 'var(--cat-familia)' },
  { id: 'otro',    label: 'Otro',     icon: 'tag',       color: 'var(--cat-otro)' },
]

interface Props {
  story: StoryType
  onClose: () => void
  onUpdated: () => void
  isAdmin?: boolean
}

export const EditStorySheet: React.FC<Props> = ({ story, onClose, onUpdated, isAdmin = false }) => {
  const { refreshStories } = useAuth()
  const { push: toast } = useToast()
  const [name, setName] = useState(story.name)
  const [category, setCategory] = useState<StoryType['category']>(story.category)
  const [coverPreview, setCoverPreview] = useState<string | null>(story.cover_url)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPosition, setCoverPosition] = useState({
    x: story.cover_position_x ?? 50,
    y: story.cover_position_y ?? 50,
  })
  const coverObjectUrlRef = useRef<string | null>(null)
  const coverDragRef = useRef<{ pointerId: number; startClientX: number; startClientY: number; x: number; y: number } | null>(null)

  useEffect(() => {
    return () => { if (coverObjectUrlRef.current) URL.revokeObjectURL(coverObjectUrlRef.current) }
  }, [])
  const [uploadingCover, setUploadingCover] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const hasChanges = name.trim() !== story.name || category !== story.category || coverFile !== null
    || coverPosition.x !== (story.cover_position_x ?? 50)
    || coverPosition.y !== (story.cover_position_y ?? 50)
  const ok = name.trim().length > 0 && hasChanges

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setCoverFile(f)
    if (coverObjectUrlRef.current) URL.revokeObjectURL(coverObjectUrlRef.current)
    const url = URL.createObjectURL(f)
    coverObjectUrlRef.current = url
    setCoverPreview(url)
  }

  const startCoverDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!coverPreview) return
    e.currentTarget.setPointerCapture(e.pointerId)
    coverDragRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      x: coverPosition.x,
      y: coverPosition.y,
    }
  }

  const moveCover = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = coverDragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))
    setCoverPosition({
      x: clamp(drag.x - ((e.clientX - drag.startClientX) / rect.width) * 100),
      y: clamp(drag.y - ((e.clientY - drag.startClientY) / rect.height) * 100),
    })
  }

  const endCoverDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (coverDragRef.current?.pointerId === e.pointerId) coverDragRef.current = null
  }

  const save = async () => {
    if (!ok) return
    setSaving(true)
    try {
      let coverUrl = story.cover_url
      if (coverFile) {
        setUploadingCover(true)
        const webp = await compressToWebP(coverFile, 1200, 0.82)
        const path = `covers/${story.id}/${Date.now()}.webp`
        const { error: upErr } = await supabase.storage.from('Fotos').upload(path, webp, {
          contentType: 'image/webp', upsert: true,
        })
        setUploadingCover(false)
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from('Fotos').getPublicUrl(path)
        coverUrl = publicUrl
      }
      const { error } = await supabase.from('stories')
        .update({
          name: name.trim(),
          category,
          cover_url: coverUrl,
          cover_position_x: coverPosition.x,
          cover_position_y: coverPosition.y,
        })
        .eq('id', story.id)
      if (error) throw error
    } catch (e: any) {
      toast({ icon: 'x', title: 'Error', body: e.message })
      setSaving(false)
      return
    }
    setSaving(false)
    await refreshStories()
    onUpdated()
    onClose()
  }

  const leaveStory = async () => {
    setDeleting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setDeleting(false); return }
    await supabase.from('story_members').delete()
      .eq('story_id', story.id).eq('user_id', user.id)
    await refreshStories()
    onClose()
  }

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ padding: '4px 0 16px' }}>
        <div className="eyebrow" style={{ color: 'var(--ink-faint)', marginBottom: 6 }}>
          · {isAdmin ? 'Editar Historia' : 'Opciones de Historia'} ·
        </div>
        <h2 className="display" style={{ fontSize: 26, margin: '0 0 20px' }}>{story.name}</h2>

        {isAdmin ? (
          <>
            {/* Cover image */}
            <input id="story-cover" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverFile} />
            <div
              onPointerDown={startCoverDrag}
              onPointerMove={moveCover}
              onPointerUp={endCoverDrag}
              onPointerCancel={endCoverDrag}
              style={{
                height: 140, borderRadius: 18, overflow: 'hidden', cursor: coverPreview ? 'grab' : 'default',
                marginBottom: 20, position: 'relative',
                background: coverPreview ? '#111' : 'var(--orange-tint)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                touchAction: 'none',
              }}>
              {coverPreview ? (
                <img src={coverPreview} alt="" draggable={false} style={{
                  width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85,
                  objectPosition: `${coverPosition.x}% ${coverPosition.y}%`, userSelect: 'none',
                }} />
              ) : (
                <button type="button" onPointerDown={e => e.stopPropagation()} onClick={() => document.getElementById('story-cover')?.click()} style={{
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--orange)',
                }}>
                  <Icon name="camera" size={28} />
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-ui)', color: 'var(--orange-deep)' }}>
                    Añadir portada
                  </span>
                </button>
              )}
              {coverPreview && <div style={{
                position: 'absolute', left: 10, bottom: 10,
                background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 8,
                padding: '5px 9px', fontSize: 11, fontWeight: 700, pointerEvents: 'none',
              }}>
                Arrastra para reacomodar
              </div>}
              <button type="button" onPointerDown={e => e.stopPropagation()} onClick={() => document.getElementById('story-cover')?.click()} style={{
                position: 'absolute', bottom: 10, right: 10,
                background: 'rgba(0,0,0,0.55)', color: '#fff',
                border: 'none', cursor: 'pointer',
                borderRadius: 8, padding: '5px 9px',
                fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-ui)',
                display: 'flex', alignItems: 'center', gap: 5,
                backdropFilter: 'blur(4px)',
              }}>
                <Icon name="camera" size={12} /> {coverPreview ? 'Cambiar' : 'Subir foto'}
              </button>
            </div>

            <label className="field-label">Nombre</label>
            <input className="field" value={name} onChange={e => setName(e.target.value)}
              placeholder="Nombre de la historia" autoFocus />

            <label className="field-label" style={{ marginTop: 20 }}>Categoría</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 6 }}>
              {CAT_OPTIONS.map(opt => {
                const on = category === opt.id
                return (
                  <button key={opt.id} onClick={() => setCategory(opt.id)} style={{
                    border: on ? `2px solid ${opt.color}` : '2px solid var(--line)',
                    borderRadius: 14, padding: '12px 4px', background: on ? `color-mix(in srgb, ${opt.color} 12%, var(--card))` : 'var(--card)',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    transition: 'all .15s',
                  }}>
                    <div style={{ color: on ? opt.color : 'var(--ink-soft)' }}>
                      <Icon name={opt.icon} size={20} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-ui)',
                      color: on ? opt.color : 'var(--ink-soft)' }}>{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <div style={{ marginBottom: 4, padding: '13px 16px', background: 'var(--card-2)',
            borderRadius: 14, border: '1.5px solid var(--line)',
            display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="shield" size={16} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
              Solo el administrador puede cambiar el nombre, categoría o portada.
            </span>
          </div>
        )}

        {/* Invite code — visible for all */}
        <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--card-2)', borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="share" size={18} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Código de invitación</div>
            <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--ink)', marginTop: 2 }}>
              {story.invite_code.toUpperCase()}
            </div>
          </div>
          <button onClick={() => navigator.clipboard?.writeText(story.invite_code.toUpperCase())}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--orange)', padding: 4 }}>
            <Icon name="copy" size={18} />
          </button>
        </div>

        {isAdmin && (
          <button className="btn btn-orange btn-block" style={{ marginTop: 24 }}
            disabled={!ok || saving} onClick={save}>
            <Icon name="check" size={18} />
            {uploadingCover ? 'Subiendo imagen…' : saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        )}

        {/* Leave story */}
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} style={{
            marginTop: 12, width: '100%', border: 'none', background: 'transparent',
            color: 'var(--orange-deep)', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-ui)',
            cursor: 'pointer', padding: '10px 0',
          }}>
            Salir de esta Historia
          </button>
        ) : (
          <div style={{ marginTop: 12, padding: '14px 16px', background: 'var(--orange-tint)', borderRadius: 14 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--orange-deep)', marginBottom: 10 }}>
              ¿Seguro que quieres salir? No podrás ver su contenido hasta volver a unirte.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(false)} className="btn" style={{ flex: 1, fontSize: 13.5 }}>
                Cancelar
              </button>
              <button onClick={leaveStory} disabled={deleting} style={{
                flex: 1, border: 'none', borderRadius: 12, padding: '12px 0',
                background: 'var(--orange-deep)', color: '#fff',
                fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
              }}>
                {deleting ? 'Saliendo…' : 'Sí, salir'}
              </button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
