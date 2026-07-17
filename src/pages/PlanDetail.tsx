import { useState, useEffect, useRef } from 'react'
import { pushBack, removeBack, scheduleIgnorePop } from '../lib/backStack'
import { supabase } from '../lib/supabase'
import { CatTag } from '../components/ui/CatTag'
import { Icon } from '../components/ui/Icon'
import { Confetti } from '../components/ui/Confetti'
import { DatePicker } from '../components/ui/DatePicker'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { fmtDate, fmtDateShort, countdown, CAT_META } from '../lib/chapterUtils'
import { compressToWebP } from '../lib/imageUtils'
import { NewPlanSheet } from '../components/sheets/NewPlanSheet'
import type { PlanType } from '../lib/supabase'
import { deletePlanFromGoogleCalendar, syncPlanToGoogleCalendar } from '../lib/usePushNotifications'
import { Lightbox } from '../components/ui/Lightbox'

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

interface Memory { id: string; image_url: string; caption: string | null; created_at: string; position_x?: number; position_y?: number }

function RoundBtn({ icon, onClick }: { icon: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: 42, height: 42, borderRadius: '50%', border: 'none',
      background: 'var(--card)', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: 'var(--sh-sm)', color: 'var(--ink)',
    }}>
      <Icon name={icon} size={19} />
    </button>
  )
}

export function PlanDetail({ plan: initialPlan, onClose, onUpdated }: {
  plan: PlanType
  onClose: () => void
  onUpdated?: () => void
}) {
  const { activeStoryId } = useAuth()
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
  const [editPlace, setEditPlace] = useState(initialPlan.place || '')
  const [editBudget, setEditBudget] = useState(initialPlan.budget_amount ? String(initialPlan.budget_amount) : '')
  const [saving, setSaving] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  // Sub-momentos
  const [subPlans, setSubPlans] = useState<PlanType[]>([])
  const [addingSubPlan, setAddingSubPlan] = useState(false)
  const [activeSubPlan, setActiveSubPlan] = useState<PlanType | null>(null)
  const subPlanByBack = useRef(false)
  const unmounting = useRef(false)

  useEffect(() => { return () => { unmounting.current = true } }, [])

  useEffect(() => {
    if (!activeSubPlan) return
    window.history.pushState({ ot: 'subplan' }, '')
    const handler = () => { subPlanByBack.current = true; setActiveSubPlan(null) }
    pushBack(handler)
    return () => {
      removeBack(handler)
      if (!subPlanByBack.current && !unmounting.current) {
        scheduleIgnorePop()
        window.history.back()
      }
      subPlanByBack.current = false
    }
  }, [activeSubPlan])

  // Memory lightbox
  const [lightboxMemory, setLightboxMemory] = useState<Memory | null>(null)

  // Past plan prompt
  const [pastPromptDismissed, setPastPromptDismissed] = useState(false)

  // Spending confirmation
  const [confirmingAmount, setConfirmingAmount] = useState(false)
  const [actualAmountInput, setActualAmountInput] = useState('')
  const [savingActual, setSavingActual] = useState(false)
  const [amountDismissed, setAmountDismissed] = useState(false)

  // Cover photo
  const [coverUrl, setCoverUrl] = useState<string | null>(initialPlan.cover_url)
  const [uploadingCover, setUploadingCover] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [coverPosition, setCoverPosition] = useState({
    x: initialPlan.cover_position_x ?? 50,
    y: initialPlan.cover_position_y ?? 50,
  })
  const coverDragRef = useRef<{ pointerId: number; startClientX: number; startClientY: number; x: number; y: number } | null>(null)

  const startCoverDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!editing || !coverUrl) return
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

  // Memory upload
  const [uploadingMemory, setUploadingMemory] = useState(false)
  const memoryInputRef = useRef<HTMLInputElement>(null)

  const meta = CAT_META[plan.type] || { tone: 'orange' as const }
  const blue = meta.tone === 'blue'
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const isFuture = plan.plan_date > todayStr

  useEffect(() => {
    if (!activeStoryId) return
    supabase.from('memories').select('*')
      .eq('story_id', activeStoryId)
      .eq('plan_id', plan.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setMemories(data as Memory[]) })

    supabase.from('plans').select('*')
      .eq('parent_plan_id', plan.id)
      .order('plan_date', { ascending: true })
      .then(({ data }) => { if (data) setSubPlans(data as PlanType[]) })
  }, [activeStoryId, plan.id])

  const refreshSubPlans = () => {
    supabase.from('plans').select('*')
      .eq('parent_plan_id', plan.id)
      .order('plan_date', { ascending: true })
      .then(({ data }) => { if (data) setSubPlans(data as PlanType[]) })
  }

  const complete = async () => {
    if (isFuture) {
      push({ icon: 'clock', eyebrow: 'Aún no es el día', title: `Este momento es el ${fmtDate(plan.plan_date)}` })
      return
    }
    setDone(true)
    setBurst(true)
    await supabase.from('plans').update({ status: 'completado' }).eq('id', plan.id)
    setPlan(p => ({ ...p, status: 'completado' }))
    push({ icon: 'sparkle', eyebrow: 'Momento', title: '¡Momento vivido!', body: `"${plan.title}" ya forma parte de su historia.` })
    if (activeStoryId) {
      supabase.from('notifications').insert({
        story_id: activeStoryId,
        type: 'plan_completed',
        title: '¡Momento vivido!',
        body: `«${plan.title}» completado`,
        read: false,
      }).then(undefined, console.error)
    }
    setTimeout(() => setBurst(false), 2600)
    onUpdated?.()
  }

  const uncomplete = async () => {
    setDone(false)
    await supabase.from('plans').update({ status: 'pendiente' }).eq('id', plan.id)
    setPlan(p => ({ ...p, status: 'pendiente' }))
    push({ icon: 'rotateCw', eyebrow: 'Momento', title: 'Marcado como pendiente' })
    onUpdated?.()
  }

  const startEdit = () => {
    setEditTitle(plan.title)
    setEditDate(plan.plan_date)
    setEditType(plan.type)
    setEditDesc(plan.description || '')
    setEditPlace(plan.place || '')
    setEditBudget(plan.budget_amount ? String(plan.budget_amount) : '')
    setConfirmCancel(false)
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
      place: editPlace.trim() || null,
      budget_amount: editBudget ? +editBudget : null,
      cover_position_x: coverPosition.x,
      cover_position_y: coverPosition.y,
    }
    await supabase.from('plans').update(updates).eq('id', plan.id)
    setPlan(p => ({ ...p, ...updates }))
    setSaving(false)
    setEditing(false)
    push({ icon: 'edit', eyebrow: 'Momento', title: 'Cambios guardados' })
    syncPlanToGoogleCalendar(plan.id).catch(console.error)
    onUpdated?.()
  }

  const cancelPlan = async () => {
    try {
      await deletePlanFromGoogleCalendar(plan.id)
    } catch (error) {
      push({ icon: 'x', eyebrow: 'Google Calendar', title: 'No se pudo eliminar el evento', body: error instanceof Error ? error.message : 'Inténtalo de nuevo.' })
    }
    await supabase.from('plans').update({ status: 'cancelado' }).eq('id', plan.id)
    push({ icon: 'x', eyebrow: 'Momento', title: 'Momento cancelado' })
    onUpdated?.()
    onClose()
  }

  const saveActualAmount = async () => {
    const val = parseFloat(actualAmountInput)
    if (isNaN(val) || val < 0) return
    setSavingActual(true)
    await supabase.from('plans').update({ actual_amount: val }).eq('id', plan.id)
    setPlan(p => ({ ...p, actual_amount: val }))
    setSavingActual(false)
    setConfirmingAmount(false)
    push({ icon: 'check', eyebrow: 'Gasto confirmado', title: `${val.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} registrado` })
    onUpdated?.()
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const webp = await compressToWebP(file, 1920, 0.82)
      const path = `plans/${plan.id}.webp`
      await supabase.storage.from('Fotos').remove([path])
      const { error } = await supabase.storage.from('Fotos').upload(path, webp, { contentType: 'image/webp' })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('Fotos').getPublicUrl(path)
      const url = publicUrl + '?t=' + Date.now()
      await supabase.from('plans').update({ cover_url: url, cover_position_x: 50, cover_position_y: 50 }).eq('id', plan.id)
      setCoverUrl(url)
      setCoverPosition({ x: 50, y: 50 })
      setPlan(p => ({ ...p, cover_url: url, cover_position_x: 50, cover_position_y: 50 }))
      onUpdated?.()
    } catch {
      push({ icon: 'x', eyebrow: 'Error', title: 'No se pudo subir la foto' })
    } finally {
      setUploadingCover(false)
      e.target.value = ''
    }
  }

  const handleMemoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeStoryId) return
    setUploadingMemory(true)
    try {
      const webp = await compressToWebP(file, 1920, 0.82)
      const path = `${activeStoryId}/${Date.now()}.webp`
      const { error: upErr } = await supabase.storage.from('Fotos').upload(path, webp, { contentType: 'image/webp' })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('Fotos').getPublicUrl(path)
      const { data: mem, error: insErr } = await supabase.from('memories')
        .insert({ story_id: activeStoryId, plan_id: plan.id, image_url: publicUrl, caption: null })
        .select().single()
      if (insErr) throw insErr
      if (mem) setMemories(ms => [mem as Memory, ...ms])
      push({ icon: 'camera', eyebrow: 'Recuerdo', title: 'Foto añadida al momento' })
    } catch {
      push({ icon: 'x', eyebrow: 'Error', title: 'No se pudo subir la foto' })
    } finally {
      setUploadingMemory(false)
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
        onPointerDown={startCoverDrag}
        onPointerMove={moveCover}
        onPointerUp={endCoverDrag}
        onPointerCancel={endCoverDrag}
        style={{
          height: 250, position: 'relative', flexShrink: 0, overflow: 'hidden',
          background: coverUrl ? '#111' : (blue ? 'var(--blue)' : 'var(--orange)'),
          borderRadius: '0 0 var(--r-md) var(--r-md)',
          cursor: (editing && coverUrl) ? 'grab' : 'default',
          touchAction: (editing && coverUrl) ? 'none' : 'auto',
        }}
      >
        {coverUrl && (
          <img src={coverUrl} alt="" loading="eager" decoding="async"
            onLoad={e => { (e.target as HTMLImageElement).style.opacity = '0.9' }}
            style={{
              width: '100%', height: '100%', objectFit: 'cover', opacity: 0, transition: 'opacity 0.4s',
              objectPosition: `${coverPosition.x}% ${coverPosition.y}%`,
              userSelect: 'none', pointerEvents: 'none'
            }} />
        )}
        {!coverUrl && (
          <span className="ph-label" style={{ position: 'absolute', bottom: 20, right: 16 }}>
            foto del momento
          </span>
        )}
        {editing && coverUrl && (
          <div style={{
            position: 'absolute', left: 18, bottom: 60,
            background: 'rgba(0,0,0,0.55)', color: 'var(--paper)', borderRadius: 8,
            padding: '5px 9px', fontSize: 11, fontWeight: 700, pointerEvents: 'none',
            zIndex: 2, backdropFilter: 'blur(4px)',
          }}>
            Arrastra para reacomodar
          </div>
        )}

        <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverUpload} />
        <input ref={memoryInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleMemoryUpload} />

        {/* Upload overlay spinner */}
        {uploadingCover && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', border: '3px solid var(--paper)',
              borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 56, left: 18, width: 42, height: 42,
          borderRadius: '50%', border: 'none', background: 'var(--card)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--sh-sm)', color: 'var(--ink)', zIndex: 3,
        }}>
          <Icon name="chevD" size={22} />
        </button>

        {/* Top-right: camera + edit */}
        <div style={{ position: 'absolute', top: 56, right: 18, display: 'flex', gap: 8, zIndex: 3 }}>
          <RoundBtn icon="camera" onClick={() => coverInputRef.current?.click()} />
          {!editing && <RoundBtn icon="edit" onClick={startEdit} />}
        </div>

        {/* Category tag */}
        <div style={{ position: 'absolute', bottom: 20, left: 18, zIndex: 3 }}>
          <CatTag cat={editing ? editType : plan.type} />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="ot-scroll" style={{ flex: 1, padding: '0 20px 140px' }}>
        <div style={{ marginTop: 14, position: 'relative' }}>
          <div className="card" style={{ padding: '20px 18px 22px', boxShadow: 'var(--sh-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="eyebrow" style={{ color: blue ? 'var(--blue-deep)' : 'var(--orange-deep)' }}>
                · El momento ·
              </span>
              {editing
                ? <span className="chip-tag" style={{ background: 'var(--blue-tint)', color: 'var(--blue-deep)' }}>Editando</span>
                : done
                  ? <span className="chip-tag" style={{ background: 'var(--done-tint)', color: 'var(--done)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Icon name="check" size={12} stroke={3} />Vivido
                    </span>
                  : <span className="chip-tag" style={{ background: 'var(--card-2)', color: 'var(--ink-soft)', boxShadow: 'inset 0 0 0 1px var(--line)' }}>
                      {isFuture ? countdown(plan.plan_date) : 'Listo para vivir'}
                    </span>
              }
            </div>

            {editing ? (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 6 }}>
                    Título
                  </label>
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                    style={INPUT_STYLE} placeholder="Nombre del momento" />
                </div>

                <DatePicker label="Fecha" value={editDate} onChange={setEditDate} />

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
                        color: editType === c.value ? 'var(--paper)' : 'var(--ink-soft)',
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
                    Lugar <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--ink-faint)' }}>(opcional)</span>
                  </label>
                  <input value={editPlace} onChange={e => setEditPlace(e.target.value)}
                    style={INPUT_STYLE} placeholder="¿Dónde será?" />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 6 }}>
                    Presupuesto estimado <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--ink-faint)' }}>(opcional)</span>
                  </label>
                  <input value={editBudget} onChange={e => setEditBudget(e.target.value.replace(/[^0-9.]/g, ''))}
                    style={INPUT_STYLE} placeholder="0.00" inputMode="decimal" />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.07em', display: 'block', marginBottom: 6 }}>
                    Notas <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--ink-faint)' }}>(opcional)</span>
                  </label>
                  <input value={editDesc} onChange={e => setEditDesc(e.target.value)}
                    style={INPUT_STYLE} placeholder="Detalles adicionales…" />
                </div>

                {/* Cancel plan — two-step */}
                <div style={{ marginTop: 4 }}>
                  {!confirmCancel ? (
                    <button onClick={() => setConfirmCancel(true)} style={{
                      width: '100%', border: 'none', background: 'transparent', cursor: 'pointer',
                      fontSize: 13.5, fontWeight: 600, color: 'var(--ink-faint)', padding: '8px 0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                      <Icon name="trash" size={15} /> Cancelar momento
                    </button>
                  ) : (
                    <div style={{ borderRadius: 14, background: 'var(--card-2)', padding: '14px 16px', border: '1px solid var(--line-soft)' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 10, textAlign: 'center' }}>
                        ¿Confirmar cancelación?
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setConfirmCancel(false)} style={{
                          flex: 1, border: '1.5px solid var(--line)', background: 'transparent', cursor: 'pointer',
                          borderRadius: 12, padding: '9px 0', fontSize: 13.5, fontWeight: 600, color: 'var(--ink-soft)',
                          fontFamily: 'var(--font-ui)',
                        }}>
                          No, volver
                        </button>
                        <button onClick={cancelPlan} style={{
                          flex: 1, border: 'none', background: 'var(--ink)', cursor: 'pointer',
                          borderRadius: 12, padding: '9px 0', fontSize: 13.5, fontWeight: 700, color: 'var(--paper)',
                          fontFamily: 'var(--font-ui)',
                        }}>
                          Sí, cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <h1 className="display" style={{ fontSize: 34, margin: '10px 0 0', lineHeight: 0.98 }}>
                  {plan.title}
                </h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 14, fontSize: 13.5, color: 'var(--ink-soft)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="calendar" size={15} />{fmtDate(plan.plan_date)}
                  </span>
                  {plan.place && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="pin" size={15} />{plan.place}
                    </span>
                  )}
                  {plan.description && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="feather" size={15} />{plan.description}
                    </span>
                  )}
                </div>
                {plan.budget_amount && (
                  <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 7,
                    background: 'var(--done-tint)', borderRadius: 10, padding: '7px 12px',
                    fontSize: 13.5, color: 'var(--done-deep)', fontWeight: 600 }}>
                    <Icon name="wallet" size={15} />
                    Presupuesto estimado: {plan.budget_amount.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Past plan prompt — "¿Ya vivieron?" */}
        {!editing && !isFuture && !done && !pastPromptDismissed && (
          <div className="card anim-up" style={{ marginTop: 14, padding: '16px 18px', border: '1.5px solid var(--orange)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--orange-tint)',
                color: 'var(--orange-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="sparkle" size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 3 }}>¿Qué tal estuvo?</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
                  Este momento ya pasó el <strong>{fmtDate(plan.plan_date)}</strong>. Si ya lo vivieron, confírmalo para guardarlo en la historia.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={complete} className="btn btn-orange" style={{ flex: 2, padding: '10px', fontSize: 13.5, borderRadius: 12 }}>
                <Icon name="check" size={16} stroke={2.5} /> Sí, marcarlo
              </button>
              <button onClick={() => setPastPromptDismissed(true)} style={{
                flex: 1, border: '1.5px solid var(--line)', background: 'transparent', cursor: 'pointer',
                borderRadius: 12, padding: '10px', fontSize: 13, fontWeight: 600, color: 'var(--ink-faint)',
                fontFamily: 'var(--font-ui)',
              }}>
                Todavía no
              </button>
            </div>
          </div>
        )}

        {/* Spending confirmation banner */}
        {!editing && !isFuture && plan.actual_amount == null && !amountDismissed && (
          <div className="card anim-up" style={{ marginTop: 14, padding: '16px 18px', border: '1.5px solid var(--orange-tint)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--orange-tint)',
                color: 'var(--orange-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="wallet" size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 3 }}>¿Cuánto gastaron?</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
                  {plan.budget_amount != null ? (
                    <>Tenían estimado <strong>{plan.budget_amount.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</strong>. Confirma el gasto real para mantener el presupuesto al día.</>
                  ) : (
                    <>Registren lo que gastaron para llevar un control de sus finanzas.</>
                  )}
                </div>
              </div>
            </div>
            {confirmingAmount ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input value={actualAmountInput} onChange={e => setActualAmountInput(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder={plan.budget_amount != null ? String(plan.budget_amount) : '0'} inputMode="decimal" autoFocus
                  style={{ ...INPUT_STYLE, flex: 1 }} />
                <button onClick={saveActualAmount} disabled={savingActual}
                  className="btn btn-orange" style={{ flexShrink: 0, padding: '10px 16px', borderRadius: 12, fontSize: 14 }}>
                  {savingActual ? '…' : 'OK'}
                </button>
                <button onClick={() => setConfirmingAmount(false)} style={{
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  color: 'var(--ink-faint)', padding: '8px', flexShrink: 0,
                }}>
                  <Icon name="x" size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setActualAmountInput(String(plan.budget_amount ?? '')); setConfirmingAmount(true) }}
                  className="btn btn-orange" style={{ flex: 2, padding: '10px', fontSize: 13.5, borderRadius: 12 }}>
                  Confirmar gasto
                </button>
                <button onClick={() => setAmountDismissed(true)} style={{
                  flex: 1, border: '1.5px solid var(--line)', background: 'transparent', cursor: 'pointer',
                  borderRadius: 12, padding: '10px', fontSize: 13, fontWeight: 600, color: 'var(--ink-faint)',
                  fontFamily: 'var(--font-ui)',
                }}>
                  Después
                </button>
              </div>
            )}
          </div>
        )}

        {/* Actual amount badge (when confirmed) */}
        {!editing && plan.actual_amount != null && (
          <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'var(--done-tint)', borderRadius: 10, padding: '7px 12px',
            fontSize: 13, color: 'var(--done-deep)', fontWeight: 600 }}>
            <Icon name="checkCircle" size={14} />
            Gasto confirmado: {plan.actual_amount.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
        )}

        {/* Sub-momentos — hidden in edit mode */}
        {!editing && (
          <div style={{ marginTop: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="eyebrow">Momentos dentro de este plan</span>
              {subPlans.length > 0 && (
                <button onClick={() => setAddingSubPlan(true)} style={{
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  fontSize: 12.5, fontWeight: 700, color: 'var(--orange)', fontFamily: 'var(--font-ui)', padding: 0,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <Icon name="plus" size={14} stroke={2.5} /> Añadir
                </button>
              )}
            </div>

            {subPlans.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {subPlans.map(sp => {
                  const spDone = sp.status === 'completado'
                  return (
                    <button key={sp.id} onClick={() => setActiveSubPlan(sp)} className="ot-card" style={{
                      width: '100%', border: spDone ? '1.5px solid var(--done-tint)' : '1.5px solid var(--line)',
                      cursor: 'pointer', textAlign: 'left', padding: '13px 15px',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        background: spDone ? 'var(--done-tint)' : 'var(--card-2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: spDone ? 'var(--done)' : 'var(--ink-faint)' }}>
                        <Icon name={spDone ? 'checkCircle' : 'feather'} size={17} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.2,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sp.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 3 }}>
                          {fmtDateShort(sp.plan_date)}
                          {sp.place && ` · ${sp.place}`}
                        </div>
                      </div>
                      <Icon name="chevR" size={16} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
                    </button>
                  )
                })}
                <div style={{ fontSize: 12, color: 'var(--ink-faint)', textAlign: 'right', marginTop: 2 }}>
                  {subPlans.filter(s => s.status === 'completado').length}/{subPlans.length} completados
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingSubPlan(true)} className="ot-card" style={{
                width: '100%', border: '1.5px dashed var(--line)', background: 'transparent', cursor: 'pointer',
                padding: '16px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--orange-tint)',
                  color: 'var(--orange-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="plus" size={20} stroke={2} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>Añadir sub-momento</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
                    Divide este plan en pasos más pequeños
                  </div>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Memories strip — hidden in edit mode */}
        {!editing && (
          <div style={{ marginTop: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="eyebrow">Recuerdos de este momento</span>
              {memories.length > 0 && (
                <span style={{ fontSize: 13, color: 'var(--ink-faint)', fontWeight: 600 }}>{memories.length}</span>
              )}
            </div>

            {memories.length > 0 ? (
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }} className="ot-scroll">
                {memories.slice(0, 8).map((m) => (
                  <button key={m.id} onClick={() => setLightboxMemory(m)}
                    style={{ width: 108, height: 134, borderRadius: 14, flexShrink: 0, overflow: 'hidden',
                      background: 'var(--card-2)', border: 'none', padding: 0, cursor: 'pointer' }}>
                    <img src={m.image_url} alt="" loading="lazy" decoding="async"
                      onLoad={e => { (e.target as HTMLImageElement).style.opacity = '1' }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0, transition: 'opacity 0.35s', display: 'block',
                        objectPosition: `${m.position_x ?? 50}% ${m.position_y ?? 50}%` }} />
                  </button>
                ))}
                <button onClick={() => memoryInputRef.current?.click()}
                  disabled={uploadingMemory}
                  style={{
                    width: 108, height: 134, borderRadius: 14, flexShrink: 0,
                    border: '1.5px dashed var(--line)', background: 'transparent', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 6, color: 'var(--ink-soft)', fontSize: 12, fontWeight: 600,
                  }}>
                  {uploadingMemory
                    ? <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid var(--ink-faint)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                    : <><Icon name="plus" size={20} />Añadir</>
                  }
                </button>
              </div>
            ) : (
              <button onClick={() => memoryInputRef.current?.click()}
                disabled={uploadingMemory}
                className="card" style={{
                  width: '100%', padding: '20px', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left',
                }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: 'var(--orange-tint)',
                  color: 'var(--orange-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {uploadingMemory
                    ? <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid var(--orange)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                    : <Icon name="camera" size={22} />
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Aún sin recuerdos</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                    Añade la primera foto de este momento
                  </div>
                </div>
                <Icon name="plus" size={20} style={{ color: 'var(--ink-faint)' }} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sub-momento detail overlay (nested) */}
      {activeSubPlan && (
        <PlanDetail
          plan={activeSubPlan}
          onClose={() => setActiveSubPlan(null)}
          onUpdated={() => { refreshSubPlans(); onUpdated?.() }}
        />
      )}

      {/* Memory lightbox */}
      {lightboxMemory && (
        <Lightbox
          url={lightboxMemory.image_url}
          memoryId={lightboxMemory.id}
          onDelete={async (id, url) => {
            const { error } = await supabase.from('memories').delete().eq('id', id)
            if (error) throw error

            try {
              const parts = url.split('/storage/v1/object/public/Fotos/')
              if (parts.length > 1 && parts[1]) {
                const path = decodeURIComponent(parts[1])
                await supabase.storage.from('Fotos').remove([path])
              }
            } catch (err) {
              console.error('Failed to remove image from storage bucket:', err)
            }

            setMemories(ms => ms.filter(x => x.id !== id))
            push({ icon: 'trash', eyebrow: 'Recuerdo', title: 'Foto eliminada' })
            onUpdated?.()
          }}
          onClose={() => setLightboxMemory(null)}
        />
      )}

      {/* New sub-momento sheet */}
      {addingSubPlan && (
        <NewPlanSheet
          parentPlanId={plan.id}
          onClose={() => setAddingSubPlan(false)}
          onCreated={() => { setAddingSubPlan(false); refreshSubPlans() }}
        />
      )}

      {/* Sticky CTA */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 20px 30px',
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
            <span>Momento vivido</span>
            <span style={{ opacity: 0.6, fontSize: 13, fontWeight: 500 }}>· Deshacer</span>
          </button>
        ) : (
          <button onClick={complete} className="btn btn-orange btn-block" style={{ fontSize: 17 }}
            title={isFuture ? `Disponible el ${fmtDate(plan.plan_date)}` : undefined}>
            <Icon name="check" size={19} stroke={2.6} />
            {isFuture ? `Vivir el ${fmtDate(plan.plan_date)}` : 'Marcar como vivido'}
          </button>
        )}
      </div>
    </div>
  )
}
