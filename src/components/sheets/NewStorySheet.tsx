import { useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import { Icon } from '../ui/Icon'
import { DatePicker } from '../ui/DatePicker'

const CATEGORIES = [
  { key: 'pareja',  label: 'Pareja',  icon: 'heartFill', color: 'var(--orange)',   bg: 'var(--orange-tint)' },
  { key: 'amigos',  label: 'Amigos',  icon: 'users',     color: 'var(--blue)',      bg: 'var(--blue-tint)' },
  { key: 'familia', label: 'Familia', icon: 'home',      color: 'var(--done)',      bg: 'var(--done-tint)' },
  { key: 'otro',    label: 'Otro',    icon: 'tag',       color: 'var(--ink-faint)', bg: 'var(--card-2)' },
]

const FAMILY_ROLES = ['Papá', 'Mamá', 'Hijo/a', 'Hermano/a', 'Abuelo/a', 'Tío/a', 'Primo/a', 'Otro']

function randomCode(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

interface Props { onClose: () => void; onCreated: () => void }

export const NewStorySheet: React.FC<Props> = ({ onClose, onCreated }) => {
  const { user, refreshStories, setActiveStoryId, refreshProfile } = useAuth()
  const { push } = useToast()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('pareja')
  const [startDate, setStartDate] = useState('')
  const [originPlace, setOriginPlace] = useState('')
  const [familyRole, setFamilyRole] = useState('')
  const [userBirthday, setUserBirthday] = useState('')
  const [saving, setSaving] = useState(false)

  const ok = name.trim().length >= 2

  const submit = async () => {
    if (!ok || !user) return
    setSaving(true)
    try {
      const invite_code = randomCode()

      // Build contextual story fields
      let storyOriginPlace: string | null = null
      let storyStartDate: string | null = null

      if (category === 'pareja') {
        storyStartDate = startDate || null
        storyOriginPlace = originPlace.trim() || null
      } else if (category === 'amigos') {
        storyStartDate = startDate || null
        storyOriginPlace = originPlace.trim() || null
      } else if (category === 'familia') {
        storyOriginPlace = familyRole || null
      }

      const { data: story, error: storyErr } = await supabase
        .from('stories')
        .insert({
          name: name.trim(),
          category,
          invite_code,
          created_by: user.id,
          start_date: storyStartDate,
          origin_place: storyOriginPlace,
        })
        .select('id')
        .single()
      if (storyErr) throw storyErr

      const { error: memberErr } = await supabase
        .from('story_members')
        .insert({
          story_id: story.id,
          user_id: user.id,
          permission_level: 'admin',
          role: category === 'familia' ? (familyRole || null) : null,
        })
      if (memberErr) throw memberErr

      // Save birthday to profile for familia
      if (category === 'familia' && userBirthday) {
        await supabase.from('profiles').update({ birthday: userBirthday }).eq('id', user.id)
        await refreshProfile()
      }

      await refreshStories()
      setActiveStoryId(story.id)

      push({ icon: 'sparkle', eyebrow: 'Historia creada', title: `«${name.trim()}»`, body: 'Ya puedes empezar a escribirla' })
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

        {/* ── Contextual fields: Pareja ── */}
        {category === 'pareja' && (
          <div className="anim-up" style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, padding: '10px 14px',
              background: 'var(--orange-tint)', borderRadius: 12 }}>
              <Icon name="heartFill" size={13} style={{ color: 'var(--orange)', marginRight: 6, verticalAlign: 'middle' }} />
              Cuéntanos un poco sobre su historia de amor
            </div>
            <div>
              <DatePicker label="Fecha de aniversario" value={startDate} onChange={setStartDate} />
            </div>
            <div>
              <label className="field-label">¿Dónde se conocieron? <span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>(opcional)</span></label>
              <input className="field" placeholder="Ej. En la universidad, en un café…" value={originPlace}
                onChange={e => setOriginPlace(e.target.value)} />
            </div>
          </div>
        )}

        {/* ── Contextual fields: Amigos ── */}
        {category === 'amigos' && (
          <div className="anim-up" style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, padding: '10px 14px',
              background: 'var(--blue-tint)', borderRadius: 12 }}>
              <Icon name="users" size={13} style={{ color: 'var(--blue)', marginRight: 6, verticalAlign: 'middle' }} />
              Cuéntanos cómo inició esta amistad
            </div>
            <div>
              <DatePicker label="¿Desde cuándo se conocen?" value={startDate} onChange={setStartDate} />
            </div>
            <div>
              <label className="field-label">Apodo del grupo <span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>(opcional)</span></label>
              <input className="field" placeholder="Ej. Los de siempre, La banda…" value={originPlace}
                onChange={e => setOriginPlace(e.target.value)} />
            </div>
          </div>
        )}

        {/* ── Contextual fields: Familia ── */}
        {category === 'familia' && (
          <div className="anim-up" style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, padding: '10px 14px',
              background: 'var(--done-tint)', borderRadius: 12 }}>
              <Icon name="home" size={13} style={{ color: 'var(--done)', marginRight: 6, verticalAlign: 'middle' }} />
              Un poco sobre ti en esta familia
            </div>
            <div>
              <label className="field-label">¿Cuál es tu rol?</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 4 }}>
                {FAMILY_ROLES.map(r => (
                  <button key={r} onClick={() => setFamilyRole(r)} style={{
                    border: familyRole === r ? '2px solid var(--done)' : '2px solid var(--line)',
                    borderRadius: 10, background: familyRole === r ? 'var(--done-tint)' : 'var(--card)',
                    padding: '10px 8px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    color: familyRole === r ? 'var(--done)' : 'var(--ink)', transition: 'all .15s',
                    fontFamily: 'var(--font-ui)',
                  }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <DatePicker label="Tu fecha de cumpleaños" value={userBirthday} onChange={setUserBirthday} />
            </div>
          </div>
        )}

        <button className="btn btn-orange btn-block" style={{ marginTop: 24 }}
          disabled={!ok || saving} onClick={submit}>
          <Icon name="sparkle" size={18} /> {saving ? 'Creando…' : 'Crear Historia'}
        </button>
      </div>
    </BottomSheet>
  )
}
