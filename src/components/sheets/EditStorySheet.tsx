import { useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { compressToWebP } from '../../lib/imageUtils'
import { Icon } from '../ui/Icon'
import type { StoryType } from '../../lib/supabase'
import { useToast } from '../../context/ToastContext'

const CAT_OPTIONS: { id: StoryType['category']; label: string; icon: string; color: string }[] = [
  { id: 'pareja',  label: 'Pareja',   icon: 'heartFill', color: 'var(--orange)' },
  { id: 'amigos',  label: 'Amigos',   icon: 'users',     color: 'var(--blue)'   },
  { id: 'familia', label: 'Familia',  icon: 'home',      color: 'var(--done)'   },
  { id: 'otro',    label: 'Otro',     icon: 'tag',       color: 'var(--ink-soft)' },
]

interface Props {
  story: StoryType
  onClose: () => void
  onUpdated: () => void
}

export const EditStorySheet: React.FC<Props> = ({ story, onClose, onUpdated }) => {
  const { refreshStories } = useAuth()
  const { push: toast } = useToast()
  const [name, setName] = useState(story.name)
  const [category, setCategory] = useState<StoryType['category']>(story.category)
  const [coverPreview, setCoverPreview] = useState<string | null>(story.cover_url)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const hasChanges = name.trim() !== story.name || category !== story.category || coverFile !== null
  const ok = name.trim().length > 0 && hasChanges

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setCoverFile(f)
    setCoverPreview(URL.createObjectURL(f))
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
        .update({ name: name.trim(), category, cover_url: coverUrl })
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
        <div className="eyebrow" style={{ color: 'var(--ink-faint)', marginBottom: 6 }}>· Editar Historia ·</div>
        <h2 className="display" style={{ fontSize: 26, margin: '0 0 20px' }}>{story.name}</h2>

        {/* Cover image */}
        <input id="story-cover" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverFile} />
        <div onClick={() => document.getElementById('story-cover')?.click()}
          style={{
            height: 140, borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
            marginBottom: 20, position: 'relative',
            background: coverPreview ? '#111' : 'var(--orange-tint)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          {coverPreview ? (
            <img src={coverPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--orange)' }}>
              <Icon name="camera" size={28} />
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-ui)', color: 'var(--orange-deep)' }}>
                Añadir portada
              </span>
            </div>
          )}
          <div style={{
            position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(0,0,0,0.55)', color: '#fff',
            borderRadius: 8, padding: '5px 9px',
            fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-ui)',
            display: 'flex', alignItems: 'center', gap: 5,
            backdropFilter: 'blur(4px)',
          }}>
            <Icon name="camera" size={12} /> {coverPreview ? 'Cambiar' : 'Subir foto'}
          </div>
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

        {/* Invite code display */}
        <div style={{ marginTop: 24, padding: '14px 16px', background: 'var(--card-2)', borderRadius: 14,
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

        <button className="btn btn-orange btn-block" style={{ marginTop: 24 }}
          disabled={!ok || saving} onClick={save}>
          <Icon name="check" size={18} />
          {uploadingCover ? 'Subiendo imagen…' : saving ? 'Guardando…' : 'Guardar cambios'}
        </button>

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
