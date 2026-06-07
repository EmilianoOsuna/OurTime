import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { CatTag } from '../components/ui/CatTag'
import { Icon } from '../components/ui/Icon'
import { Confetti } from '../components/ui/Confetti'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { toRoman, fmtDate, countdown, CAT_META } from '../lib/chapterUtils'
import { compressToWebP } from '../lib/imageUtils'
import type { PlanType } from '../lib/supabase'

type PlanCategory = PlanType['type']

const CATEGORIES: { value: PlanCategory; label: string }[] = [
  { value: 'cena', label: 'Cena' },
  { value: 'cine', label: 'Cine' },
  { value: 'viaje', label: 'Viaje' },
  { value: 'salida', label: 'Salida' },
  { value: 'cafe', label: 'Café' },
  { value: 'regalo', label: 'Regalo' },
  { value: 'noche', label: 'Noche' },
  { value: 'musica', label: 'Música' },
  { value: 'ruta', label: 'Ruta' },
  { value: 'otro', label: 'Otro' },
]

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 13px', borderRadius: 12,
  border: '1.5px solid var(--line)', background: 'var(--card-2)',
  fontSize: 15, color: 'var(--ink)', fontFamily: 'var(--font-ui)',
  outline: 'none', appearance: 'none', WebkitAppearance: 'none',
}

interface Memory { id: string; image_url: string; caption: string | null; created_at: string }

function RoundBtn({ icon, onClick }: { icon: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: 42, height: 42, borderRadius: '50%', border: 'none',
      background: 'rgba(255,252,247,0.9)', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: 'var(--sh-sm)', color: 'var(--ink)',
    }}>
      <Icon name={icon} size={19} />
    </button>
  )
}

export function PlanDetail({ plan: initialPlan, onClose, chapterNo, onUpdated }: {
  plan: PlanType
  onClose: () => void
  chapterNo?: number
  onUpdated?: () => void
}) {
  const { coupleId } = useAuth()
  const { push } = useToast()
  const [plan, setPlan] = useState(initialPlan)
  const [done, setDone] = useState(initialPlan.status === 'completado')
  const [burst, setBurst] = useState(false)
  const [memories, setMemories] = useState<Memory[]>([])

  // Edit mode
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(initialPlan.title)
  const [editDate, setEditDate] = useState(initialPlan.plan_date)
  const [editType, setEditType] = useState<PlanCategory>(initialPlan.type)
  const [editDesc, setEditDesc] = useState(initialPlan.description || '')
  const [saving, setSaving] = useState(false)

  // Cover photo
  const [coverUrl, setCoverUrl] = useState<string | null>(initialPlan.cover_url)
  const [uploadingCover, setUploadingCover] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const meta = CAT_META[plan.type] || { tone: 'orange' as const }
  const blue = meta.tone === 'blue'
  const no = chapterNo ?? 1

  useEffect(() => {
    if (!coupleId) return
    supabase.from('memories').select('*')
      .eq('couple_id', coupleId)
      .eq('plan_id', plan.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setMemories(data as Memory[]) })
  }, [coupleId, plan.id])

  const complete = async () => {
    setDone(true)
    setBurst(true)
    await supabase.from('plans').update({ status: 'completado' }).eq('id', plan.id)
    setPlan(p => ({ ...p, status: 'completado' }))
    push({ icon: '🎉', eyebrow: 'Capítulo', title: '¡Capítulo vivido!', body: `"${plan.title}" ya forma parte de su historia.` })
    setTimeout(() => setBurst(false), 2600)
    onUpdated?.()
  }

  const uncomplete = async () => {
    setDone(false)
    await supabase.from('plans').update({ status: 'pendiente' }).eq('id', plan.id)
    setPlan(p => ({ ...p, status: 'pendiente' }))
    push({ icon: '↩️', eyebrow: 'Capítulo', title: 'Marcado como pendiente', body: `"${plan.title}" vuelve a estar por vivir.` })
    onUpdated?.()
  }

  const startEdit = () => {
    setEditTitle(plan.title)
    setEditDate(plan.plan_date)
    setEditType(plan.type)
    setEditDesc(plan.description || '')
    setEditing(true)
  }

  const saveEdit = async () => {
    if (!editTitle.trim()) return
    setSaving(true)
    const updates = {
      title: editTitle.trim(),
      plan_date: editDate,
      type: editType,
      description: editDesc.trim() || null,
    }
    await supabase.from('plans').update(updates).eq('id', plan.id)
    setPlan(p => ({ ...p, ...updates }))
    setSaving(false)
    setEditing(false)
    push({ icon: '✏️', eyebrow: 'Capítulo', title: 'Cambios guardados', body: null })
    onUpdated?.()
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const webp = await compressToWebP(file, 1920, 0.82)
      const path = `plans/${plan.id}.webp`
      const { error } = await supabase.storage.from('Fotos').upload(path, webp, { upsert: true, contentType: 'image/webp' })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('Fotos').getPublicUrl(path)
      const url = publicUrl + '?t=' + Date.now()
      await supabase.from('plans').update({ cover_url: url }).eq('id', plan.id)
      setCoverUrl(url)
      setPlan(p => ({ ...p, cover_url: url }))
      onUpdated?.()
    } catch {
      push({ icon: '⚠️', eyebrow: 'Error', title: 'No se pudo subir la foto', body: null })
    } finally {
      setUploadingCover(false)
      e.target.value = ''
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 95, background: 'var(--paper)',
      display: 'flex', flexDirection: 'column',
      animation: 'sheetUp .42s cubic-bezier(.2,.9,.2,1) both',
    }}>
      <Confetti show={burst} />

      {/* Hero */}
      <div
        className={coverUrl ? '' : ('ph' + (blue ? ' blue' : ''))}
        style={{
          height: 270, position: 'relative', flexShrink: 0, overflow: 'hidden',
          background: coverUrl ? '#111' : undefined,
        }}
      >
        {coverUrl && (
          <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
        )}
        {!coverUrl && (
          <span className="ph-label" style={{ position: 'absolute', bottom: 52, right: 16 }}>
            foto del capítulo
          </span>
        )}

        <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverUpload} />

        {/* Upload overlay spinner */}
        {uploadingCover && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', border: '3px solid #fff',
              borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 56, left: 18, width: 42, height: 42,
          borderRadius: '50%', border: 'none', background: 'rgba(255,252,247,0.9)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--sh-sm)', color: 'var(--ink)',
        }}>
          <Icon name="chevD" size={22} />
        </button>

        {/* Top-right: camera + edit */}
        <div style={{ position: 'absolute', top: 56, right: 18, display: 'flex', gap: 8 }}>
          <RoundBtn icon="camera" onClick={() => coverInputRef.current?.click()} />
          {!editing && <RoundBtn icon="edit" onClick={startEdit} />}
        </div>

        {/* Category tag */}
        <div style={{ position: 'absolute', bottom: 52, left: 18 }}>
          <CatTag cat={editing ? editType : plan.type} />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="ot-scroll" style={{ flex: 1, padding: '0 24px 130px' }}>
        {/* Chapter card — overlaps hero */}
        <div style={{ marginTop: -34, position: 'relative' }}>
          <div className="card" style={{ padding: '20px 20px 22px', boxShadow: 'var(--sh-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="eyebrow" style={{ color: blue ? 'var(--blue-deep)' : 'var(--orange-deep)' }}>
                · Capítulo {toRoman(no)} ·
              </span>
              {editing
                ? <span className="chip-tag" style={{ background: 'var(--blue-tint)', color: 'var(--blue-deep)' }}>Editando</span>
                : done
                  ? <span className="chip-tag" style={{ background: 'var(--done-tint)', color: 'var(--done)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Icon name="check" size={12} stroke={3} />Vivido
                    </span>
                  : <span className="chip-tag" style={{ background: 'var(--card-2)', color: 'var(--ink-soft)', boxShadow: 'inset 0 0 0 1px var(--line)' }}>
                      {countdown(plan.plan_date)}
                    </span>
              }
            </div>

            {editing ? (
              /* Edit form */
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 6 }}>
                    Título
                  </label>
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                    style={INPUT_STYLE} placeholder="Nombre del capítulo" />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 6 }}>
                    Fecha
                  </label>
                  <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                    style={INPUT_STYLE} />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 8 }}>
                    Categoría
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {CATEGORIES.map(c => (
                      <button key={c.value} onClick={() => setEditType(c.value)} style={{
                        padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600,
                        background: editType === c.value ? 'var(--orange)' : 'var(--card-2)',
                        color: editType === c.value ? '#fff' : 'var(--ink-soft)',
                        boxShadow: editType === c.value ? '0 2px 8px rgba(241,119,32,.35)' : 'inset 0 0 0 1px var(--line)',
                        transition: 'all .15s',
                      }}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 6 }}>
                    Descripción
                  </label>
                  <input value={editDesc} onChange={e => setEditDesc(e.target.value)}
                    style={INPUT_STYLE} placeholder="Lugar, detalles…" />
                </div>
              </div>
            ) : (
              /* Display mode */
              <>
                <h1 className="display" style={{ fontSize: 28, margin: '10px 0 0', lineHeight: 1.04 }}>
                  {plan.title}
                </h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 14, fontSize: 13.5, color: 'var(--ink-soft)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="calendar" size={15} />{fmtDate(plan.plan_date)}
                  </span>
                  {plan.description && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="pin" size={15} />{plan.description}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Memories strip — hidden in edit mode */}
        {!editing && (
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="eyebrow">Recuerdos de este capítulo</span>
              {memories.length > 0 && (
                <span style={{ fontSize: 13, color: 'var(--ink-faint)', fontWeight: 600 }}>{memories.length}</span>
              )}
            </div>

            {memories.length > 0 ? (
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }} className="ot-scroll">
                {memories.slice(0, 5).map((m, i) => (
                  <div key={m.id} className={'ph' + (i % 2 === 1 ? ' blue' : '')}
                    style={{ width: 108, height: 134, borderRadius: 14, flexShrink: 0, overflow: 'hidden' }}>
                    <img src={m.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
                <button style={{
                  width: 108, height: 134, borderRadius: 14, flexShrink: 0,
                  border: '1.5px dashed var(--line)', background: 'transparent', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 6, color: 'var(--ink-soft)', fontSize: 12, fontWeight: 600,
                }}>
                  <Icon name="plus" size={20} />Añadir
                </button>
              </div>
            ) : (
              <button className="card" style={{
                width: '100%', padding: '20px', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: 'var(--orange-tint)',
                  color: 'var(--orange-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="camera" size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Aún sin recuerdos</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                    Añade la primera foto de este capítulo
                  </div>
                </div>
                <Icon name="plus" size={20} style={{ color: 'var(--ink-faint)' }} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 24px 30px',
        background: 'linear-gradient(transparent, var(--paper) 28%)',
      }}>
        {editing ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setEditing(false)} className="btn btn-block"
              style={{ flex: 1, background: 'var(--card-2)', color: 'var(--ink-soft)', boxShadow: 'inset 0 0 0 1px var(--line)' }}>
              Cancelar
            </button>
            <button onClick={saveEdit} disabled={saving || !editTitle.trim()}
              className="btn btn-orange btn-block" style={{ flex: 2, fontSize: 16 }}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        ) : done ? (
          <button onClick={uncomplete} className="btn btn-block"
            style={{ background: 'var(--done-tint)', color: 'var(--done)', border: 'none', gap: 10 }}>
            <Icon name="checkCircle" size={19} />
            <span>Capítulo vivido</span>
            <span style={{ opacity: 0.6, fontSize: 13, fontWeight: 500 }}>· Deshacer</span>
          </button>
        ) : (
          <button onClick={complete} className="btn btn-orange btn-block" style={{ fontSize: 17 }}>
            <Icon name="check" size={19} stroke={2.6} /> Marcar como vivido
          </button>
        )}
      </div>
    </div>
  )
}
