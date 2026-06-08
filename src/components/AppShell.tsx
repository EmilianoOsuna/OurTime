import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import type { ProfileType } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { buildPerson, type PersonDisplay, type StoryType } from '../lib/supabase'

import Dashboard from '../pages/Dashboard'
import Calendar from '../pages/Calendar'
import Gallery from '../pages/Gallery'
import Finances from '../pages/Finances'
import { PlanDetail } from '../pages/PlanDetail'
import { ProfileScreen } from '../pages/Profile'
import { NotificationsPanel } from './NotificationsPanel'
import { GlobalActionSheet } from './sheets/GlobalActionSheet'
import { NewPlanSheet } from './sheets/NewPlanSheet'
import { MoneySheet } from './sheets/MoneySheet'
import { NewMemorySheet } from './sheets/NewMemorySheet'
import { NewStorySheet } from './sheets/NewStorySheet'
import { Icon } from './ui/Icon'
import { Avatar } from './ui/Avatar'

const CAT_COLOR: Record<string, string> = {
  pareja:  'var(--orange)',
  amigos:  'var(--blue)',
  familia: 'var(--done)',
  otro:    'var(--ink-faint)',
}

export type Tab = 'home' | 'calendar' | 'gallery' | 'finance'
type Overlay = { type: 'plan'; data: any } | { type: 'action' } | { type: 'newplan' } | { type: 'money' } | { type: 'memory' } | { type: 'profile' } | { type: 'newstory' } | null

const NOTIFS = [
  { icon: 'sparkle', text: <><strong>Bienvenidos a OurTime</strong> 💛</>, time: 'Ahora', read: false },
]

function getInitialTab(): Tab {
  const saved = sessionStorage.getItem('activeTab')
  if (saved === 'home' || saved === 'calendar' || saved === 'gallery' || saved === 'finance') return saved
  return 'home'
}

export default function AppShell() {
  const { activeStoryId, stories, setActiveStoryId, profile, user } = useAuth()
  const [tab, setTab] = useState<Tab>(getInitialTab)
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [notifsVisible, setNotifsVisible] = useState(false)
  const [storySwitcherOpen, setStorySwitcherOpen] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [memories, setMemories] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [partner, setPartner] = useState<ProfileType | null>(null)
  const [storyCode, setStoryCode] = useState<string | null>(null)

  useEffect(() => {
    if (!activeStoryId || !user) return

    supabase.from('plans').select('*').eq('story_id', activeStoryId)
      .order('plan_date', { ascending: false })
      .then(({ data }) => { if (data) setPlans(data) })

    supabase.from('memories').select('*').eq('story_id', activeStoryId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setMemories(data) })

    supabase.from('transactions').select('*').eq('story_id', activeStoryId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setTransactions(data) })

    // Find co-members of this story
    supabase.from('story_members')
      .select('user_id')
      .eq('story_id', activeStoryId)
      .neq('user_id', user.id)
      .then(async ({ data: coMembers }) => {
        if (coMembers && coMembers.length > 0) {
          const { data: coProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', coMembers[0].user_id)
            .single()
          if (coProfile) setPartner(coProfile as ProfileType)
        }
      })

    supabase.from('stories').select('invite_code').eq('id', activeStoryId).single()
      .then(({ data }) => { if (data?.invite_code) setStoryCode(data.invite_code) })
  }, [activeStoryId, user])

  // ── Back gesture / hardware back button ──
  const historyPushed = useRef(false)
  const ignorePop = useRef(false)
  const overlayRef = useRef(overlay)
  const notifsRef  = useRef(notifsVisible)
  useEffect(() => { overlayRef.current = overlay },       [overlay])
  useEffect(() => { notifsRef.current = notifsVisible },  [notifsVisible])

  useEffect(() => {
    const open = overlay !== null || notifsVisible
    if (open && !historyPushed.current) {
      window.history.pushState({ ot: 'modal' }, '')
      historyPushed.current = true
    }
    if (!open) historyPushed.current = false
  }, [overlay, notifsVisible])

  useEffect(() => {
    const handlePop = () => {
      if (ignorePop.current) { ignorePop.current = false; return }
      historyPushed.current = false
      if (overlayRef.current !== null) setOverlay(null)
      else if (notifsRef.current)     setNotifsVisible(false)
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  const closeOverlay = useCallback(() => {
    setOverlay(null)
    if (historyPushed.current) {
      historyPushed.current = false
      ignorePop.current = true
      window.history.back()
    }
  }, [])

  const closeNotifs = useCallback(() => {
    setNotifsVisible(false)
    if (historyPushed.current && overlayRef.current === null) {
      historyPushed.current = false
      ignorePop.current = true
      window.history.back()
    }
  }, [])

  const go = useCallback((t: Tab) => {
    setTab(t)
    sessionStorage.setItem('activeTab', t)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const sortedPlans = [...plans].sort((a, b) => a.plan_date.localeCompare(b.plan_date))
  const chapterNo = (id: string) => sortedPlans.findIndex(p => p.id === id) + 1

  const openPlan = (p: any) => setOverlay({ type: 'plan', data: p })

  const me: PersonDisplay = buildPerson(profile, true)
  const partnerDisplay: PersonDisplay | null = partner ? buildPerson(partner, false) : null

  const refreshPlans = () => {
    if (!activeStoryId) return
    supabase.from('plans').select('*').eq('story_id', activeStoryId)
      .order('plan_date', { ascending: true })
      .then(({ data }) => data && setPlans(data))
  }
  const refreshMemories = () => {
    if (!activeStoryId) return
    supabase.from('memories').select('*').eq('story_id', activeStoryId)
      .order('created_at', { ascending: false })
      .then(({ data }) => data && setMemories(data))
  }

  const screen = {
    home: <Dashboard plans={plans} go={go}
            onBell={() => setNotifsVisible(true)} onPlanClick={openPlan}
            onProfileOpen={() => setOverlay({ type: 'profile' })}
            onStorySwitcher={() => setStorySwitcherOpen(true)}
            me={me} partner={partnerDisplay} />,
    calendar: <Calendar onOpenPlan={openPlan} />,
    gallery: <Gallery memories={memories} setMemories={setMemories}
               onImageClick={(url: string) => setLightbox(url)} me={me} />,
    finance: <Finances me={me} partner={partnerDisplay} />,
  }[tab]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', position: 'relative' }}>
      {screen}

      {overlay?.type === 'plan' && <PlanDetail plan={overlay.data} onClose={closeOverlay} chapterNo={chapterNo(overlay.data.id)} onUpdated={refreshPlans} />}
      {overlay?.type === 'profile' && (
        <ProfileScreen
          plans={plans} transactions={transactions} memories={memories}
          onClose={closeOverlay}
          onGoToFinance={() => { closeOverlay(); go('finance') }}
          onOpenPlan={openPlan}
          partner={partnerDisplay}
          storyCode={storyCode}
        />
      )}
      {overlay?.type === 'action' && <GlobalActionSheet onClose={closeOverlay}
        onNewPlan={() => setOverlay({ type: 'newplan' })}
        onNewMoney={() => setOverlay({ type: 'money' })}
        onNewMemory={() => setOverlay({ type: 'memory' })} />}
      {overlay?.type === 'newplan' && <NewPlanSheet onClose={closeOverlay} onCreated={() => { closeOverlay(); refreshPlans() }} />}
      {overlay?.type === 'money' && <MoneySheet onClose={closeOverlay} onCreated={() => closeOverlay()} />}
      {overlay?.type === 'memory' && <NewMemorySheet onClose={closeOverlay} onCreated={() => { closeOverlay(); refreshMemories() }} />}
      {overlay?.type === 'newstory' && <NewStorySheet onClose={closeOverlay} onCreated={() => { closeOverlay(); go('home') }} />}
      {notifsVisible && <NotificationsPanel onClose={closeNotifs} items={NOTIFS} />}
      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox(null)} />}
      {storySwitcherOpen && (
        <StorySwitcherSheet
          stories={stories}
          activeStoryId={activeStoryId}
          onSelect={id => { setActiveStoryId(id); setStorySwitcherOpen(false) }}
          onNewStory={() => { setStorySwitcherOpen(false); setOverlay({ type: 'newstory' }) }}
          onClose={() => setStorySwitcherOpen(false)}
        />
      )}

      <NavBar tab={tab} setTab={go} onFab={() => setOverlay({ type: 'action' })}
        me={me} onProfileOpen={() => setOverlay({ type: 'profile' })}
        onBell={() => setNotifsVisible(true)}
        stories={stories} activeStoryId={activeStoryId}
        onStorySwitcher={() => setStorySwitcherOpen(true)} />
    </div>
  )
}

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)', animation: 'fadeIn .2s both' }}>
      <div style={{ maxWidth: '92%', maxHeight: '82%', borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <img src={url} alt="" decoding="async"
          onLoad={e => { (e.target as HTMLImageElement).style.opacity = '1' }}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', opacity: 0, transition: 'opacity 0.3s' }} />
      </div>
    </div>
  )
}

function NavBar({ tab, setTab, onFab, me, onProfileOpen, onBell, stories, activeStoryId, onStorySwitcher }: {
  tab: Tab
  setTab: (t: Tab) => void
  onFab: () => void
  me: PersonDisplay
  onProfileOpen: () => void
  onBell: () => void
  stories: StoryType[]
  activeStoryId: string | null
  onStorySwitcher: () => void
}) {
  const activeStory = stories.find(s => s.id === activeStoryId)
  const catColor = activeStory ? (CAT_COLOR[activeStory.category] || 'var(--orange)') : 'var(--orange)'

  const items: { key: Tab; icon: string; label: string }[] = [
    { key: 'home',     icon: 'home',     label: 'Inicio'       },
    { key: 'calendar', icon: 'calendar', label: 'Agenda'       },
    { key: 'gallery',  icon: 'image',    label: 'Recuerdos'    },
    { key: 'finance',  icon: 'wallet',   label: 'Presupuesto'  },
  ]

  return (
    <nav style={{ position: 'fixed', bottom: 22, left: 0, right: 0, zIndex: 70,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none' }}>

      {/* Stories switcher pill — only shown when >1 story */}
      {stories.length > 1 && (
        <button onClick={onStorySwitcher} style={{
          pointerEvents: 'auto', border: '1px solid rgba(255,255,255,0.6)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(255,252,247,0.9)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 999, padding: '6px 14px 6px 8px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: catColor, flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-ui)', maxWidth: 120,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeStory?.name || 'Historia'}
          </span>
          <Icon name="chevD" size={13} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
        </button>
      )}

      <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 2,
        background: 'rgba(255,252,247,0.88)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRadius: 999, padding: '8px 10px',
        boxShadow: 'var(--sh-lg)', border: '1px solid rgba(255,255,255,0.6)' }}>

        {/* Avatar — izquierda del todo */}
        <button onClick={onProfileOpen} style={{
          border: 'none', background: 'transparent', cursor: 'pointer',
          width: 50, height: 50, borderRadius: 18, padding: 4,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
        }}>
          <div style={{ borderRadius: '50%', padding: 2,
            border: `2px solid ${catColor}`, display: 'inline-flex', transition: 'border-color .3s' }}>
            <Avatar person={me} size={26} />
          </div>
          <span style={{ fontSize: 9.5, fontWeight: 700, fontFamily: 'var(--font-ui)',
            letterSpacing: '0.02em', color: 'var(--ink-faint)' }}>Yo</span>
        </button>

        <NavBtn {...items[0]} active={tab === items[0].key} onClick={() => setTab(items[0].key)} />
        <NavBtn {...items[1]} active={tab === items[1].key} onClick={() => setTab(items[1].key)} />

        <button onClick={onFab} style={{
          width: 54, height: 54, borderRadius: '50%', border: 'none',
          background: catColor, color: '#fff', cursor: 'pointer', margin: '0 4px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 6px 18px color-mix(in srgb, ${catColor} 50%, transparent)`,
          transition: 'background .3s, transform .15s', flexShrink: 0,
        }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'none')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
          <Icon name="plus" size={26} stroke={2.4} />
        </button>

        <NavBtn {...items[2]} active={tab === items[2].key} onClick={() => setTab(items[2].key)} />
        <NavBtn {...items[3]} active={tab === items[3].key} onClick={() => setTab(items[3].key)} />

        {/* Bell — derecha del todo */}
        <button onClick={onBell} style={{
          border: 'none', background: 'transparent', cursor: 'pointer',
          width: 50, height: 50, borderRadius: 18, padding: 4,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
          color: 'var(--ink-faint)',
        }}>
          <Icon name="bell" size={22} stroke={1.9} />
          <span style={{ fontSize: 9.5, fontWeight: 600, fontFamily: 'var(--font-ui)',
            letterSpacing: '0.02em' }}>Avisos</span>
        </button>
      </div>
    </nav>
  )
}

function StorySwitcherSheet({ stories, activeStoryId, onSelect, onNewStory, onClose }: {
  stories: StoryType[]
  activeStoryId: string | null
  onSelect: (id: string) => void
  onNewStory: () => void
  onClose: () => void
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 85, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)', animation: 'fadeIn .2s both' }} onClick={onClose} />
      <div style={{ position: 'relative', background: 'var(--card)', borderRadius: '24px 24px 0 0',
        padding: '20px 20px 40px', animation: 'sheetUp .38s cubic-bezier(.2,.9,.2,1) both' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--line)',
          margin: '0 auto 20px', flexShrink: 0 }} />
        <div className="eyebrow" style={{ marginBottom: 14, color: 'var(--ink-soft)' }}>Tus Historias</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {stories.map(s => {
            const color = CAT_COLOR[s.category] || 'var(--ink-faint)'
            const active = s.id === activeStoryId
            return (
              <button key={s.id} onClick={() => onSelect(s.id)} style={{
                border: active ? `2px solid ${color}` : '2px solid var(--line)',
                borderRadius: 16, background: active ? 'var(--card-2)' : 'var(--card)',
                padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 14, transition: 'all .15s',
              }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={s.category === 'pareja' ? 'heartFill' : s.category === 'amigos' ? 'users' : s.category === 'familia' ? 'home' : 'tag'} size={18} style={{ color: '#fff' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--ink)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2, textTransform: 'capitalize' }}>{s.category}</div>
                </div>
                {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>

        <button onClick={onNewStory} style={{
          width: '100%', border: '2px dashed var(--line)', borderRadius: 16, background: 'transparent',
          padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
          color: 'var(--ink-soft)', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 14.5,
        }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--card-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="plus" size={18} stroke={2.2} />
          </div>
          Nueva Historia
        </button>
      </div>
    </div>
  )
}

function NavBtn({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      border: 'none', background: 'transparent', cursor: 'pointer',
      width: 58, height: 50, borderRadius: 18,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
      color: active ? 'var(--orange-deep)' : 'var(--ink-faint)', transition: 'color .2s',
    }}>
      <Icon name={icon} size={22} stroke={active ? 2.3 : 1.9} />
      <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 600,
        fontFamily: 'var(--font-ui)', letterSpacing: '0.02em' }}>{label}</span>
    </button>
  )
}
