import { useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import { Icon } from '../ui/Icon'

const CATEGORIES = [
  { key: 'pareja',  label: 'Pareja',  icon: 'heartFill', color: 'var(--orange)',   bg: 'var(--orange-tint)' },
  { key: 'amigos',  label: 'Amigos',  icon: 'users',     color: 'var(--blue)',      bg: 'var(--blue-tint)' },
  { key: 'familia', label: 'Familia', icon: 'home',      color: 'var(--done)',      bg: 'var(--done-tint)' },
  { key: 'otro',    label: 'Otro',    icon: 'tag',       color: 'var(--ink-faint)', bg: 'var(--card-2)' },
]

function randomCode(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

interface Props { onClose: () => void; onCreated: () => void }

export const NewStorySheet: React.FC<Props> = ({ onClose, onCreated }) => {
  const { user, refreshStories, setActiveStoryId } = useAuth()
  const { push } = useToast()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('pareja')
  const [saving, setSaving] = useState(false)

  const ok = name.trim().length >= 2

  const submit = async () => {
    if (!ok || !user) return
    setSaving(true)
    try {
      const invite_code = randomCode()
      const { data: story, error: storyErr } = await supabase
        .from('stories')
        .insert({ name: name.trim(), category, invite_code, created_by: user.id })
        .select('id')
        .single()
      if (storyErr) throw storyErr

      const { error: memberErr } = await supabase
        .from('story_members')
        .insert({ story_id: story.id, user_id: user.id, role: 'admin' })
      if (memberErr) throw memberErr

      await refreshStories()
      setActiveStoryId(story.id)

      push({ icon: 'sparkle', eyebrow: 'Historia creada', title: `«${name.trim()}»`, body: 'Ya puedes empezar a escribirla' })
      onCreated()
      onClose()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ padding: '4px 0 16px' }}>
        <div className="eyebrow" style={{ color: 'var(--orange-deep)', marginBottom: 6 }}>· Nueva Historia ·</div>
        <h2 className="display" style={{ fontSize: 26, margin: '0 0 20px' }}>¿Cómo la llamarán?</h2>

        <label className="field-label">Nombre <span style={{ color: 'var(--orange)' }}>*</span></label>
        <input className="field" placeholder="Ej. Familia García, Los cuatro, …" value={name}
          onChange={e => setName(e.target.value)} autoFocus />

        <label className="field-label" style={{ marginTop: 18 }}>Categoría</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
          {CATEGORIES.map(c => {
            const on = category === c.key
            return (
              <button key={c.key} onClick={() => setCategory(c.key)} style={{
                border: on ? `2px solid ${c.color}` : '2px solid var(--line)',
                borderRadius: 14, background: on ? c.bg : 'var(--card)',
                padding: '14px 12px', cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 10,
                transition: 'all .18s',
              }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: on ? c.color : 'var(--card-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: on ? '#fff' : 'var(--ink-faint)', flexShrink: 0, transition: 'all .18s' }}>
                  <Icon name={c.icon} size={17} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: on ? c.color : 'var(--ink)' }}>{c.label}</div>
                </div>
              </button>
            )
          })}
        </div>

        <button className="btn btn-orange btn-block" style={{ marginTop: 24 }}
          disabled={!ok || saving} onClick={submit}>
          <Icon name="sparkle" size={18} /> {saving ? 'Creando…' : 'Crear Historia'}
        </button>
      </div>
    </BottomSheet>
  )
}
