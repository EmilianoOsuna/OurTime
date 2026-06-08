import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import type { ProfileType } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { buildPerson, type PersonDisplay } from '../lib/supabase'

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
import { LiveEditBadge } from './ui/LiveEditBadge'
import { Icon } from './ui/Icon'

export type Tab = 'home' | 'calendar' | 'gallery' | 'finance'
type Overlay = { type: 'plan'; data: any } | { type: 'action' } | { type: 'newplan' } | { type: 'money' } | { type: 'memory' } | { type: 'profile' } | null

const NOTIFS = [
  { icon: 'sparkle', text: <><strong>Bienvenidos a OurTime</strong> 💛</>, time: 'Ahora', read: false },
]

export default function AppShell() {
  const { coupleId, profile, user } = useAuth()
  const [tab, setTab] = useState<Tab>('home')
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [notifsVisible, setNotifsVisible] = useState(false)
  const [partnerEditing, setPartnerEditing] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [memories, setMemories] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [partner, setPartner] = useState<ProfileType | null>(null)
  const [coupleCode, setCoupleCode] = useState<string | null>(null)

  useEffect(() => {
    if (!coupleId || !user) return

    supabase.from('plans').select('*').eq('couple_id', coupleId).order('plan_date', { ascending: false }).then(({ data }) => {
      if (data) setPlans(data)
    })
    supabase.from('memories').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setMemories(data)
    })
    supabase.from('transactions').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setTransactions(data)
    })
    supabase.from('profiles').select('*').eq('couple_id', coupleId).neq('id', user.id).maybeSingle().then(({ data }) => {
      if (data) setPartner(data as ProfileType)
    })
    supabase.from('couples').select('invite_code').eq('id', coupleId).single().then(({ data }) => {
      if (data?.invite_code) setCoupleCode(data.invite_code)
    })
  }, [coupleId, user])

  // Partner editing simulation
  useEffect(() => {
    if (!partner) return
    const iv = setInterval(() => {
      if (Math.random() < 0.08) {
        setPartnerEditing(true)
        setTimeout(() => setPartnerEditing(false), 4000)
      }
    }, 5000)
    return () => clearInterval(iv)
  }, [partner])

  // ── Back gesture / hardware back button ──
  const historyPushed = useRef(false)
  const ignorePop = useRef(false)
  // Refs so the popstate handler always reads current state without re-registering
  const overlayRef = useRef(overlay)
  const notifsRef  = useRef(notifsVisible)
  useEffect(() => { overlayRef.current = overlay },       [overlay])
  useEffect(() => { notifsRef.current = notifsVisible },  [notifsVisible])

  // Push a history entry whenever a modal opens for the first time
  useEffect(() => {
    const open = overlay !== null || notifsVisible
    if (open && !historyPushed.current) {
      window.history.pushState({ ot: 'modal' }, '')
      historyPushed.current = true
    }
    if (!open) historyPushed.current = false
  }, [overlay, notifsVisible])

  // Handle the browser/OS back gesture — close the topmost modal
  useEffect(() => {
    const handlePop = () => {
      if (ignorePop.current) { ignorePop.current = false; return }
      historyPushed.current = false
      if (overlayRef.current !== null) setOverlay(null)
      else if (notifsRef.current)     setNotifsVisible(false)
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, []) // empty — reads state via refs

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

  const go = useCallback((t: Tab) => { setTab(t); window.scrollTo({ top: 0, behavior: 'smooth' }) }, [])

  const sortedPlans = [...plans].sort((a, b) => a.plan_date.localeCompare(b.plan_date))
  const chapterNo = (id: string) => sortedPlans.findIndex(p => p.id === id) + 1

  const openPlan = (p: any) => setOverlay({ type: 'plan', data: p })

  const me: PersonDisplay = buildPerson(profile, true)
  const partnerDisplay: PersonDisplay | null = partner ? buildPerson(partner, false) : null

  const refreshPlans = () => {
    if (!coupleId) return
    supabase.from('plans').select('*').eq('couple_id', coupleId).order('plan_date', { ascending: true }).then(({ data }) => data && setPlans(data))
  }
  const refreshMemories = () => {
    if (!coupleId) return
    supabase.from('memories').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }).then(({ data }) => data && setMemories(data))
  }

  const screen = {
    home: <Dashboard partnerEditing={partnerEditing} plans={plans} go={go}
            onBell={() => setNotifsVisible(true)} onPlanClick={openPlan}
            onProfileOpen={() => setOverlay({ type: 'profile' })}
            me={me} partner={partnerDisplay} />,
    calendar: <Calendar onOpenPlan={openPlan} />,
    gallery: <Gallery coupleId={coupleId} memories={memories} setMemories={setMemories}
               onImageClick={(url: string) => setLightbox(url)} me={me} />,
    finance: <Finances coupleId={coupleId} me={me} partner={partnerDisplay} />,
  }[tab]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', position: 'relative' }}>
      {screen}

      {partnerEditing && <LiveEditBadge />}

      {overlay?.type === 'plan' && <PlanDetail plan={overlay.data} onClose={closeOverlay} chapterNo={chapterNo(overlay.data.id)} onUpdated={refreshPlans} />}
      {overlay?.type === 'profile' && (
        <ProfileScreen
          plans={plans} transactions={transactions} memories={memories}
          onClose={closeOverlay}
          onGoToFinance={() => { closeOverlay(); go('finance') }}
          onOpenPlan={openPlan}
          partner={partnerDisplay}
          coupleCode={coupleCode}
        />
      )}
      {overlay?.type === 'action' && <GlobalActionSheet onClose={closeOverlay}
        onNewPlan={() => setOverlay({ type: 'newplan' })}
        onNewMoney={() => setOverlay({ type: 'money' })}
        onNewMemory={() => setOverlay({ type: 'memory' })} />}
      {overlay?.type === 'newplan' && <NewPlanSheet onClose={closeOverlay} onCreated={() => { closeOverlay(); refreshPlans() }} />}
      {overlay?.type === 'money' && <MoneySheet onClose={closeOverlay} onCreated={() => closeOverlay()} />}
      {overlay?.type === 'memory' && <NewMemorySheet onClose={closeOverlay} onCreated={() => { closeOverlay(); refreshMemories() }} />}
      {notifsVisible && <NotificationsPanel onClose={closeNotifs} items={NOTIFS} />}
      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox(null)} />}

      <NavBar tab={tab} setTab={go} onFab={() => setOverlay({ type: 'action' })} />
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

function NavBar({ tab, setTab, onFab }: { tab: Tab; setTab: (t: Tab) => void; onFab: () => void }) {
  const items: { key: Tab; icon: string; label: string }[] = [
    { key: 'home', icon: 'home', label: 'Historia' },
    { key: 'calendar', icon: 'calendar', label: 'Agenda' },
    { key: 'gallery', icon: 'image', label: 'Recuerdos' },
    { key: 'finance', icon: 'wallet', label: 'Cuentas' },
  ]

  return (
    <nav style={{ position: 'fixed', bottom: 22, left: 0, right: 0, zIndex: 70,
      display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 2,
        background: 'rgba(255,252,247,0.88)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRadius: 999, padding: '8px 10px',
        boxShadow: 'var(--sh-lg)', border: '1px solid rgba(255,255,255,0.6)' }}>
        <NavBtn {...items[0]} active={tab === items[0].key} onClick={() => setTab(items[0].key)} />
        <NavBtn {...items[1]} active={tab === items[1].key} onClick={() => setTab(items[1].key)} />
        <button onClick={onFab} style={{
          width: 54, height: 54, borderRadius: '50%', border: 'none',
          background: 'var(--orange)', color: '#fff', cursor: 'pointer', margin: '0 4px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 18px rgba(241,119,32,0.45)', transition: 'transform .15s', flexShrink: 0,
        }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'none')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
          <Icon name="plus" size={26} stroke={2.4} />
        </button>
        <NavBtn {...items[2]} active={tab === items[2].key} onClick={() => setTab(items[2].key)} />
        <NavBtn {...items[3]} active={tab === items[3].key} onClick={() => setTab(items[3].key)} />
      </div>
    </nav>
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
