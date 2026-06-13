import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { CatMedallion } from '../components/ui/CatMedallion'
import { CatTag } from '../components/ui/CatTag'
import { CoupleAvatars } from '../components/ui/Avatar'
import { PresenceDot } from '../components/ui/PresenceDot'
import { Icon } from '../components/ui/Icon'
import { toRoman, fmtDate, fmtDateShort, countdown, CAT_META } from '../lib/chapterUtils'
import type { PlanType, PersonDisplay } from '../lib/supabase'
import type { Tab } from '../components/AppShell'


function daysTogether(since: string) {
  return Math.floor((Date.now() - new Date(since.slice(0,10) + 'T00:00:00Z').getTime()) / 86400000)
}


export default function Dashboard({ plans, go, onBell, onPlanClick, onProfileOpen, onNewPlan, onStorySwitcher, me, partner, unreadNotifs = 0 }: {
  plans: PlanType[]
  go: (t: Tab) => void
  onBell: () => void
  onPlanClick: (p: PlanType) => void
  onProfileOpen?: () => void
  onNewPlan?: () => void
  onStorySwitcher?: () => void
  me: PersonDisplay
  partner: PersonDisplay | null
  unreadNotifs?: number
}) {
  const { activeStoryId, stories, profile } = useAuth()
  const activeStory = stories.find(s => s.id === activeStoryId) ?? null

  const since = (activeStory?.start_date || profile?.anniversary_date) || ''

  const upcoming = plans.filter(p => p.status === 'pendiente').sort((a, b) => a.plan_date.localeCompare(b.plan_date))
  const past = plans.filter(p => p.status === 'completado').sort((a, b) => b.plan_date.localeCompare(a.plan_date))
  const next = upcoming[0]
  const numbered = [...plans].filter(p => p.status !== 'cancelado').sort((a, b) => a.plan_date.localeCompare(b.plan_date))
  const chapterNo = (id: string) => numbered.findIndex(p => p.id === id) + 1
  const isPareja = activeStory?.category === 'pareja'
  const days = (isPareja && since) ? daysTogether(since) : null
  const partnerName = partner?.name || 'Tu pareja'

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      style={{ padding: '8px 22px 150px' }}>

      {/* Header */}
      <div style={{ padding: '8px 0 6px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 7 }}>Nuestra Historia</div>
            <h1 className="display" style={{ fontSize: 34, margin: 0, lineHeight: 0.98 }}>
              {activeStory?.name || 'Nuestro espacio'}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {stories.length > 1 && onStorySwitcher && (
              <button onClick={onStorySwitcher} style={{
                border: 'none', background: 'var(--card)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                borderRadius: 999, padding: '8px 12px 8px 9px',
                boxShadow: 'var(--sh-sm)', flexShrink: 0,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--orange)', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-ui)',
                  maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeStory?.name || 'Historia'}
                </span>
                <Icon name="chevD" size={12} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
              </button>
            )}
            <button onClick={onBell} style={{ border: 'none', background: 'var(--card)', cursor: 'pointer',
              width: 44, height: 44, borderRadius: '50%', boxShadow: 'var(--sh-sm)', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)', flexShrink: 0 }}>
              <Icon name="bell" size={21} />
              {unreadNotifs > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 9, height: 9, borderRadius: '50%',
                  background: 'var(--orange)',
                  border: '2px solid var(--card)',
                }} />
              )}
            </button>
          </div>
        </div>

        {/* Presence card — only for pareja stories */}
        {isPareja && since && (
          <button onClick={onProfileOpen} className="ot-card" style={{
            marginTop: 16, padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 13,
            border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
          }}>
            <div style={{ position: 'relative' }}>
              <CoupleAvatars me={me} partner={partner || { name: partnerName, initial: 'P', color: '#F17720' }} size={38} />
              <span style={{ position: 'absolute', bottom: -2, right: -2 }}><PresenceDot size={9} /></span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{partnerName} está aquí</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Juntos desde {fmtDate(since)}</div>
            </div>
            {days !== null && (
              <div style={{ textAlign: 'right' }}>
                <div className="display" style={{ fontSize: 24, color: 'var(--orange-deep)', lineHeight: 1 }}>{days}</div>
                <div className="eyebrow" style={{ fontSize: 9 }}>días</div>
              </div>
            )}
          </button>
        )}
      </div>


      {/* Next chapter hero */}
      {next ? (
        <div style={{ marginTop: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 12, color: 'var(--orange-deep)' }}>· Su próximo momento ·</div>
          <NextHero plan={next} no={chapterNo(next.id)} onClick={() => onPlanClick(next)} />
        </div>
      ) : plans.length === 0 && <EmptyDashboard onNewPlan={onNewPlan} />}

      {/* Upcoming plans beyond the hero */}
      {upcoming.length > 1 && (
        <div style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span className="eyebrow">Lo que viene</span>
            <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcoming.slice(1).map(p => (
              <button key={p.id} data-testid="plan-card" onClick={() => onPlanClick(p)} className="ot-card" style={{
                border: 'none', cursor: 'pointer', padding: '13px 15px', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--orange-tint)',
                  color: 'var(--orange-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="clock" size={17} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>
                    {fmtDateShort(p.plan_date)}
                  </div>
                </div>
                <Icon name="chevR" size={16} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timeline of lived chapters */}
      {past.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span className="eyebrow">Lo que han vivido</span>
            <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            <span style={{ fontSize: 13, color: 'var(--ink-faint)', fontWeight: 600 }}>{past.length} momentos</span>
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div style={{ position: 'relative', marginTop: 14 }}>
          <div style={{ position: 'absolute', left: 44, top: 24, bottom: 30, width: 2,
            background: 'linear-gradient(var(--orange), var(--blue))', opacity: 0.5,
            transformOrigin: 'top', animation: 'drawLine .9s cubic-bezier(.4,0,.2,1) both' }} />
          {past.map((p, i) => (
            <TimelineRow key={p.id} plan={p} no={chapterNo(p.id)} onClick={() => onPlanClick(p)} index={i} />
          ))}

          {since && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6, paddingLeft: 0 }}>
              <div style={{ width: 46, display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--paper)',
                  boxShadow: 'inset 0 0 0 2px var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)' }} />
                </div>
              </div>
              <div>
                <div className="serif-i" style={{ fontSize: 17 }}>Nuestro inicio</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{fmtDate(since)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick links */}
      {past.length === 0 && plans.length > 0 && (
        <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
          <button onClick={() => go('gallery')} className="ot-card" style={{
            flex: 1, border: 'none', cursor: 'pointer', padding: '18px 16px',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--orange-tint)',
              color: 'var(--orange-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="image" size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Recuerdos</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Su galería</div>
            </div>
          </button>
          <button onClick={() => go('calendar')} className="ot-card" style={{
            flex: 1, border: 'none', cursor: 'pointer', padding: '18px 16px',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--orange-tint)',
              color: 'var(--orange-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="calendar" size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Momentos</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{upcoming.length} por escribir</div>
            </div>
          </button>
        </div>
      )}
    </motion.div>
  )
}

function NextHero({ plan, no, onClick }: { plan: PlanType; no: number; onClick: () => void }) {
  const meta = CAT_META[plan.type] || { tone: 'orange' as const }
  const blue = meta.tone === 'blue'
  return (
    <button data-testid="plan-card" onClick={onClick} className="ot-card anim-up" style={{
      width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', overflow: 'hidden',
      padding: 0, boxShadow: 'var(--sh-md)',
    }}>
      <div className={plan.cover_url ? '' : ('ph' + (blue ? ' blue' : ''))}
        style={{ height: 150, position: 'relative', background: plan.cover_url ? '#111' : undefined, overflow: 'hidden' }}>
        {plan.cover_url
          ? <img src={plan.cover_url} alt="" loading="lazy" decoding="async"
              onLoad={e => { (e.target as HTMLImageElement).style.opacity = '0.9' }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0, transition: 'opacity 0.4s',
                objectPosition: `${plan.cover_position_x ?? 50}% ${plan.cover_position_y ?? 50}%` }} />
          : <span className="ph-label" style={{ position: 'absolute', bottom: 12, right: 12 }}>foto del plan</span>
        }
        <div style={{ position: 'absolute', top: 14, left: 14 }}><CatTag cat={plan.type} /></div>
        <div style={{ position: 'absolute', top: 12, right: 14, display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--card)', borderRadius: 999, padding: '6px 11px',
          fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>
          <Icon name="clock" size={14} /> {countdown(plan.plan_date)}
        </div>
      </div>
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span className="chapter-no" style={{ fontSize: 34, color: blue ? 'var(--blue)' : 'var(--orange)' }}>{toRoman(no)}</span>
          <h2 className="display" style={{ fontSize: 22, margin: 0, flex: 1, lineHeight: 1.05 }}>{plan.title}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12, fontSize: 13.5, color: 'var(--ink-soft)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="clock" size={15} />{fmtDateShort(plan.plan_date)}</span>
          {plan.description && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="pin" size={15} />{plan.description.slice(0, 28)}</span>
          )}
        </div>
      </div>
    </button>
  )
}

function TimelineRow({ plan, no, onClick, index }: { plan: PlanType; no: number; onClick: () => void; index: number }) {
  const done = plan.status === 'completado'
  return (
    <div className="anim-up" style={{ display: 'flex', gap: 16, marginBottom: 18, animationDelay: (index * 0.05) + 's' }}>
      <div style={{ width: 46, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <CatMedallion cat={plan.type} size={42} />
          {done && <span style={{ position: 'absolute', bottom: -3, right: -3, width: 19, height: 19,
            borderRadius: '50%', background: 'var(--done)', color: '#fff', display: 'flex',
            alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2.5px var(--paper)' }}>
            <Icon name="check" size={12} stroke={3} /></span>}
        </div>
      </div>
      <button data-testid="plan-card" onClick={onClick} className="ot-card" style={{
        flex: 1, textAlign: 'left', border: 'none', cursor: 'pointer', padding: '13px 15px',
        minWidth: 0, position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <span className="chapter-no" style={{ fontSize: 19, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
            Mom. {toRoman(no)}</span>
        </div>
        <h3 className="display" style={{ fontSize: 17.5, margin: '6px 0 0', lineHeight: 1.12 }}>{plan.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 9, fontSize: 12.5, color: 'var(--ink-soft)' }}>
          <span>{fmtDateShort(plan.plan_date)} · {new Date(plan.plan_date.slice(0,10) + 'T00:00:00Z').getUTCFullYear()}</span>
        </div>
      </button>
    </div>
  )
}

function EmptyDashboard({ onNewPlan }: { onNewPlan?: () => void }) {
  return (
    <div className="anim-up" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '40px 30px',
    }}>
      <div style={{ position: 'relative', width: 132, height: 116, marginBottom: 26 }}>
        <div style={{ position: 'absolute', inset: 0, transform: 'rotate(-7deg) translateY(6px)',
          background: 'var(--card)', borderRadius: 18, boxShadow: 'var(--sh-sm)', border: '1px solid var(--line)' }} />
        <div style={{ position: 'absolute', inset: 0, transform: 'rotate(5deg)',
          background: 'var(--card)', borderRadius: 18, boxShadow: 'var(--sh-sm)', border: '1px solid var(--line)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--orange-tint)', borderRadius: 18, boxShadow: 'var(--sh-md)',
          animation: 'floatY 4s ease-in-out infinite', color: 'var(--orange)' }}>
          <Icon name="heartFill" size={44} />
        </div>
      </div>
      <div className="display" style={{ fontSize: 25, marginBottom: 8, maxWidth: 250 }}>El primer momento os espera</div>
      <div style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.5, maxWidth: 270 }}>
        Su historia empieza con un plan. ¿Cuál será el primero?
      </div>
      <button className="btn btn-orange" style={{ marginTop: 22 }} onClick={onNewPlan}>
        Crear primer momento
      </button>
    </div>
  )
}
