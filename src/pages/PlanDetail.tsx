import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { CatTag } from '../components/ui/CatTag'
import { Icon } from '../components/ui/Icon'
import { Confetti } from '../components/ui/Confetti'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { toRoman, fmtDate, countdown, CAT_META } from '../lib/chapterUtils'
import type { PlanType } from '../lib/supabase'

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

export function PlanDetail({ plan, onClose, chapterNo }: {
  plan: PlanType
  onClose: () => void
  chapterNo?: number
}) {
  const { coupleId } = useAuth()
  const { push } = useToast()
  const [done, setDone] = useState(plan.status === 'completado')
  const [burst, setBurst] = useState(false)
  const [memories, setMemories] = useState<Memory[]>([])

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
    if (done) return
    setDone(true)
    setBurst(true)
    await supabase.from('plans').update({ status: 'completado' }).eq('id', plan.id)
    push({ icon: '🎉', eyebrow: 'Capítulo', title: '¡Capítulo vivido!', body: `"${plan.title}" ya forma parte de su historia.` })
    setTimeout(() => setBurst(false), 2600)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 95, background: 'var(--paper)',
      display: 'flex', flexDirection: 'column',
      animation: 'sheetUp .42s cubic-bezier(.2,.9,.2,1) both',
    }}>
      <Confetti show={burst} />

      {/* Hero */}
      <div className={'ph' + (blue ? ' blue' : '')}
        style={{ height: 270, position: 'relative', flexShrink: 0 }}>
        <span className="ph-label" style={{ position: 'absolute', bottom: 52, right: 16 }}>
          foto del capítulo
        </span>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 56, left: 18, width: 42, height: 42,
          borderRadius: '50%', border: 'none', background: 'rgba(255,252,247,0.9)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--sh-sm)', color: 'var(--ink)',
        }}>
          <Icon name="chevD" size={22} />
        </button>
        {/* Top right buttons */}
        <div style={{ position: 'absolute', top: 56, right: 18, display: 'flex', gap: 8 }}>
          <RoundBtn icon="share" />
          <RoundBtn icon="more" />
        </div>
        {/* Category tag */}
        <div style={{ position: 'absolute', bottom: 52, left: 18 }}>
          <CatTag cat={plan.type} />
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
              {done
                ? <span className="chip-tag" style={{
                    background: 'var(--done-tint)', color: 'var(--done)',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}>
                    <Icon name="check" size={12} stroke={3} />Vivido
                  </span>
                : <span className="chip-tag" style={{
                    background: 'var(--card-2)', color: 'var(--ink-soft)',
                    boxShadow: 'inset 0 0 0 1px var(--line)',
                  }}>{countdown(plan.plan_date)}</span>}
            </div>
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
          </div>
        </div>


        {/* Memories strip */}
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
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 24px 30px',
        background: 'linear-gradient(transparent, var(--paper) 28%)',
      }}>
        {done ? (
          <button className="btn btn-block" disabled
            style={{ background: 'var(--done-tint)', color: 'var(--done)' }}>
            <Icon name="checkCircle" size={19} /> Capítulo vivido
          </button>
        ) : (
          <button className="btn btn-orange btn-block" style={{ fontSize: 17 }} onClick={complete}>
            <Icon name="check" size={19} stroke={2.6} /> Marcar como vivido
          </button>
        )}
      </div>
    </div>
  )
}
