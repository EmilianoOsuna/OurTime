import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, animate, useMotionValue, useTransform } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import type { ProfileType } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { buildPerson, type PersonDisplay, type StoryType } from '../lib/supabase'
import { setBackHandler, isNative } from '../lib/native'
import { invokeTopBack, consumeIgnorePop } from '../lib/backStack'

import Dashboard from '../pages/Dashboard'
import Calendar from '../pages/Calendar'
import Gallery from '../pages/Gallery'
import Finances from '../pages/Finances'
import Chat from '../pages/Chat'
import { PlanDetail } from '../pages/PlanDetail'
import { ProfileScreen } from '../pages/Profile'
import { NotificationsPanel, type NotifItem } from './NotificationsPanel'
import { GlobalActionSheet } from './sheets/GlobalActionSheet'
import { NewPlanSheet } from './sheets/NewPlanSheet'
import { MoneySheet } from './sheets/MoneySheet'
import { NewMemorySheet } from './sheets/NewMemorySheet'
import { NewStorySheet } from './sheets/NewStorySheet'
import { EditStorySheet } from './sheets/EditStorySheet'
import { Icon } from './ui/Icon'
import { Avatar } from './ui/Avatar'
import { usePushNotifications } from '../lib/usePushNotifications'

const CAT_COLOR: Record<string, string> = {
  pareja:  'var(--orange)',
  amigos:  'var(--blue)',
  familia: 'var(--done)',
  otro:    'var(--ink-faint)',
}

// Stable colors that never get overridden by the accent-switching effect
const CAT_COLOR_STABLE: Record<string, string> = {
  pareja:  'var(--cat-pareja)',
  amigos:  'var(--cat-amigos)',
  familia: 'var(--cat-familia)',
  otro:    'var(--cat-otro)',
}

export type Tab = 'home' | 'calendar' | 'gallery' | 'finance' | 'chat'
type Overlay = { type: 'plan'; data: any } | { type: 'action' } | { type: 'newplan' } | { type: 'money' } | { type: 'memory' } | { type: 'profile' } | { type: 'newstory' } | { type: 'editstory'; story: StoryType } | null

const NOTIFS: (NotifItem & { id: string })[] = [
  { id: 'welcome', icon: 'sparkle', text: <><strong>Bienvenidos a OurTime</strong></>, time: 'Ahora', read: false },
]

function getInitialTab(): Tab {
  const saved = sessionStorage.getItem('activeTab')
  if (saved === 'home' || saved === 'calendar' || saved === 'gallery' || saved === 'finance' || saved === 'chat') return saved
  return 'home'
}

// Unread message count badge
function useUnreadCount(activeStoryId: string | null, userId: string | undefined, refreshKey?: number): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!activeStoryId || !userId) return
    const fetchCount = () =>
      supabase.from('messages').select('id', { count: 'exact', head: true })
        .eq('story_id', activeStoryId).neq('sender_id', userId).is('read_at', null)
        .then(({ count: n }) => setCount(n ?? 0))
    fetchCount()
    const ch = supabase.channel('unread:' + activeStoryId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `story_id=eq.${activeStoryId}` }, fetchCount)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [activeStoryId, userId, refreshKey])
  return count
}

export default function AppShell() {
  const { activeStoryId, stories, setActiveStoryId, profile, user } = useAuth()
  usePushNotifications()
  const [tab, setTab] = useState<Tab>(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('shortcut') === 'chat') return 'chat'
    return getInitialTab()
  })
  const [overlay, setOverlay] = useState<Overlay>(() => {
    // Handle PWA home screen shortcuts
    const params = new URLSearchParams(window.location.search)
    const shortcut = params.get('shortcut')
    if (shortcut === 'newplan') return { type: 'newplan' }
    if (shortcut === 'memory')  return { type: 'memory' }
    return null
  })
  const [notifsVisible, setNotifsVisible] = useState(false)
  const [storySwitcherOpen, setStorySwitcherOpen] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [memories, setMemories] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [partner, setPartner] = useState<ProfileType | null>(null)
  const [storyCode, setStoryCode] = useState<string | null>(null)
  const [unreadRefreshKey, setUnreadRefreshKey] = useState(0)

  // Native back button/gesture
  useEffect(() => {
    if (!isNative) return
    setBackHandler(() => {
      if (lightbox) { setLightbox(null); return true }
      if (storySwitcherOpen) { setStorySwitcherOpen(false); return true }
      if (invokeTopBack()) return true
      if (overlay) { setOverlay(null); return true }
      if (notifsVisible) { setNotifsVisible(false); return true }
      if (tabRef.current === 'chat') {
        setTab('home')
        sessionStorage.setItem('activeTab', 'home')
        return true
      }
      if (tabRef.current !== 'home') {
        setTab('home')
        sessionStorage.setItem('activeTab', 'home')
        return true
      }
      return false
    })
  }, [lightbox, storySwitcherOpen, overlay, notifsVisible])

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
  const tabRef     = useRef(tab)
  useEffect(() => { overlayRef.current = overlay },      [overlay])
  useEffect(() => { notifsRef.current = notifsVisible }, [notifsVisible])
  useEffect(() => { tabRef.current = tab },              [tab])

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
      if (consumeIgnorePop()) return
      if (invokeTopBack()) {
        // Sub-overlay handled the back. Re-push a history entry so the parent overlay
        // can still be closed via back on next press.
        window.history.pushState({ ot: 'modal' }, '')
        return
      }
      historyPushed.current = false
      if (overlayRef.current !== null) setOverlay(null)
      else if (notifsRef.current)      setNotifsVisible(false)
      else if (tabRef.current === 'chat') {
        setTab('home')
        sessionStorage.setItem('activeTab', 'home')
      }
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

  const leaveChat = useCallback(() => {
    setTab('home')
    sessionStorage.setItem('activeTab', 'home')
    // Mark messages as read and then refresh the unread count
    if (activeStoryId && user) {
      supabase.from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('story_id', activeStoryId)
        .neq('sender_id', user.id)
        .is('read_at', null)
        .then(() => setUnreadRefreshKey(k => k + 1))
    } else {
      setUnreadRefreshKey(k => k + 1)
    }
    if (historyPushed.current) {
      historyPushed.current = false
      ignorePop.current = true
      window.history.back()
    }
  }, [activeStoryId, user])

  const go = useCallback((t: Tab) => {
    // Push history when entering chat so device back gesture exits it
    if (t === 'chat' && tabRef.current !== 'chat' && !historyPushed.current) {
      window.history.pushState({ ot: 'chat' }, '')
      historyPushed.current = true
    }
    setTab(t)
    sessionStorage.setItem('activeTab', t)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Handle push notification taps — SW sends OT_NAVIGATE when app is already open
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const handler = (event: MessageEvent) => {
      if (event.data?.type !== 'OT_NAVIGATE') return
      const url = new URL(event.data.url, window.location.origin)
      const shortcut = url.searchParams.get('shortcut')
      if (shortcut === 'chat')    { go('chat') }
      else if (shortcut === 'gallery') { go('gallery') }
      else if (shortcut === 'calendar') { go('calendar') }
      else if (shortcut === 'newplan') { setOverlay({ type: 'newplan' }) }
      else if (shortcut === 'memory')  { setOverlay({ type: 'memory' }) }
    }
    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [go])

  // Accent color — override --orange* based on active story category
  useEffect(() => {
    const story = stories.find(s => s.id === activeStoryId)
    const cat = story?.category ?? 'pareja'
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
    type Triad = { o: string; od: string; ot: string }
    const OVERRIDES: Record<string, { light: Triad; dark: Triad } | null> = {
      pareja: null,
      amigos: {
        light: { o: '#0474BA', od: '#045E96', ot: '#D7E9F4' },
        dark:  { o: '#3B9EDF', od: '#2D8AC9', ot: '#0E2A3A' },
      },
      familia: {
        light: { o: '#2E7D5B', od: '#1E5C42', ot: '#DCEDE3' },
        dark:  { o: '#4DB880', od: '#3DA068', ot: '#122B1E' },
      },
      otro: {
        light: { o: '#6B7280', od: '#4B5563', ot: '#F3F4F6' },
        dark:  { o: '#9CA3AF', od: '#6B7280', ot: '#1F2937' },
      },
    }
    const override = OVERRIDES[cat]
    const root = document.documentElement
    if (override) {
      const c = dark ? override.dark : override.light
      root.style.setProperty('--orange', c.o)
      root.style.setProperty('--orange-deep', c.od)
      root.style.setProperty('--orange-tint', c.ot)
    } else {
      root.style.removeProperty('--orange')
      root.style.removeProperty('--orange-deep')
      root.style.removeProperty('--orange-tint')
    }
  }, [activeStoryId, stories])

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
  const refreshTransactions = () => {
    if (!activeStoryId) return
    supabase.from('transactions').select('*').eq('story_id', activeStoryId)
      .order('created_at', { ascending: false })
      .then(({ data }) => data && setTransactions(data))
  }

  // Realtime subscriptions
  useEffect(() => {
    if (!activeStoryId) return
    const channel = supabase
      .channel('story-changes:' + activeStoryId)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'plans', filter: `story_id=eq.${activeStoryId}` },
        () => refreshPlans()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'memories', filter: `story_id=eq.${activeStoryId}` },
        () => refreshMemories()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `story_id=eq.${activeStoryId}` },
        () => refreshTransactions()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeStoryId])

  const unreadCount = useUnreadCount(activeStoryId, user?.id, unreadRefreshKey)

  const screen = {
    home: <Dashboard plans={plans} go={go}
            onBell={() => setNotifsVisible(true)} onPlanClick={openPlan}
            onProfileOpen={() => setOverlay({ type: 'profile' })}
            onNewPlan={() => setOverlay({ type: 'newplan' })}
            onStorySwitcher={() => setStorySwitcherOpen(true)}
            me={me} partner={partnerDisplay} />,
    calendar: <Calendar plans={plans} onOpenPlan={openPlan} />,
    gallery: <Gallery memories={memories} setMemories={setMemories}
               onImageClick={(url: string) => setLightbox(url)} me={me} />,
    finance: <Finances />,
    chat: <Chat key={activeStoryId} me={me} partner={partnerDisplay}
             storyName={stories.find(s => s.id === activeStoryId)?.name}
             storyCoverUrl={stories.find(s => s.id === activeStoryId)?.cover_url ?? null}
             onBack={leaveChat} />,
  }[tab]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', position: 'relative' }}>
      {screen}

      {overlay?.type === 'plan' && <PlanDetail plan={overlay.data} onClose={closeOverlay} chapterNo={chapterNo(overlay.data.id)} onUpdated={refreshPlans} />}
      {overlay?.type === 'profile' && (
        <ProfileScreen
          plans={plans} memories={memories}
          onClose={closeOverlay}
          onGoToFinance={() => { closeOverlay(); go('finance') }}
          onOpenPlan={openPlan}
          partner={partnerDisplay}
          storyCode={storyCode}
          onNewStory={() => setOverlay({ type: 'newstory' })}
          onStorySwitcher={() => { closeOverlay(); setStorySwitcherOpen(true) }}
          onEditStory={(s) => setOverlay({ type: 'editstory', story: s })}
        />
      )}
      {overlay?.type === 'action' && <GlobalActionSheet onClose={closeOverlay}
        onNewPlan={() => setOverlay({ type: 'newplan' })}
        onNewMoney={() => setOverlay({ type: 'money' })}
        onNewMemory={() => setOverlay({ type: 'memory' })}
        onNewStory={() => setOverlay({ type: 'newstory' })} />}
      {overlay?.type === 'newplan' && <NewPlanSheet onClose={closeOverlay} onCreated={() => { closeOverlay(); refreshPlans() }} />}
      {overlay?.type === 'money' && <MoneySheet onClose={closeOverlay} onCreated={() => { closeOverlay(); refreshTransactions() }} />}
      {overlay?.type === 'memory' && <NewMemorySheet onClose={closeOverlay} onCreated={() => { closeOverlay(); refreshMemories() }} />}
      {overlay?.type === 'newstory' && <NewStorySheet onClose={closeOverlay} onCreated={() => { closeOverlay(); go('home') }} />}
      {overlay?.type === 'editstory' && <EditStorySheet story={overlay.story} onClose={closeOverlay} onUpdated={() => {}} />}
      {notifsVisible && <NotificationsPanel onClose={closeNotifs} items={NOTIFS} />}
      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox(null)} />}
      {storySwitcherOpen && (
        <StorySwitcherSheet
          stories={stories}
          activeStoryId={activeStoryId}
          onSelect={id => { setActiveStoryId(id); setStorySwitcherOpen(false) }}
          onNewStory={() => { setStorySwitcherOpen(false); setOverlay({ type: 'newstory' }) }}
          onEditStory={s => { setStorySwitcherOpen(false); setOverlay({ type: 'editstory', story: s }) }}
          onClose={() => setStorySwitcherOpen(false)}
        />
      )}

      {tab !== 'chat' && (
        <NavBar tab={tab} setTab={go} onFab={() => setOverlay({ type: 'action' })}
          me={me} onProfileOpen={() => setOverlay({ type: 'profile' })}
          stories={stories} activeStoryId={activeStoryId}
          unreadCount={unreadCount} />
      )}
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

function NavBar({ tab, setTab, onFab, me, onProfileOpen, stories, activeStoryId, unreadCount }: {
  tab: Tab
  setTab: (t: Tab) => void
  onFab: () => void
  me: PersonDisplay
  onProfileOpen: () => void
  stories: StoryType[]
  activeStoryId: string | null
  unreadCount: number
}) {
  const activeStory = stories.find(s => s.id === activeStoryId)
  const catColor = activeStory ? (CAT_COLOR[activeStory.category] || 'var(--orange)') : 'var(--orange)'

  const items: { key: Tab; icon: string; label: string; badge?: number }[] = [
    { key: 'home',     icon: 'home',     label: 'Inicio'      },
    { key: 'calendar', icon: 'calendar', label: 'Agenda'      },
    { key: 'gallery',  icon: 'image',    label: 'Fotos'       },
    { key: 'finance',  icon: 'wallet',   label: 'Gasto'       },
    { key: 'chat',     icon: 'chat',     label: 'Chat', badge: unreadCount },
  ]

  return (
    <nav style={{
      position: 'fixed', bottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
      left: 0, right: 0, zIndex: 70,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      pointerEvents: 'none', padding: '0 16px',
    }}>
      <div className="ot-glass-nav" style={{
        pointerEvents: 'auto',
        display: 'flex', alignItems: 'center', gap: 0,
        borderRadius: 999, padding: '6px 10px',
        width: '100%', maxWidth: 480,
      }}>

        {/* Avatar */}
        <button onClick={onProfileOpen} style={{
          border: 'none', background: 'transparent', cursor: 'pointer',
          width: 48, height: 50, borderRadius: 16, padding: 4,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
          flexShrink: 0,
        }}>
          <div style={{ borderRadius: '50%', padding: 2,
            border: `2px solid ${catColor}`, display: 'inline-flex', transition: 'border-color .3s' }}>
            <Avatar person={me} size={22} />
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-ui)',
            letterSpacing: '0.02em', color: 'var(--ink-faint)' }}>Yo</span>
        </button>

        <NavBtn {...items[0]} active={tab === items[0].key} onClick={() => setTab(items[0].key)} />
        <NavBtn {...items[1]} active={tab === items[1].key} onClick={() => setTab(items[1].key)} />

        <button onClick={onFab} style={{
          width: 48, height: 48, borderRadius: '50%', border: 'none',
          background: catColor, color: '#fff', cursor: 'pointer', margin: '0 4px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 16px color-mix(in srgb, ${catColor} 55%, transparent)`,
          transition: 'background .3s, transform .15s', flexShrink: 0,
        }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.88)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'none')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
          <Icon name="plus" size={22} stroke={2.4} />
        </button>

        <NavBtn {...items[2]} active={tab === items[2].key} onClick={() => setTab(items[2].key)} />
        <NavBtn {...items[3]} active={tab === items[3].key} onClick={() => setTab(items[3].key)} />
        <NavBtn {...items[4]} active={tab === items[4].key} onClick={() => setTab(items[4].key)} />
      </div>
    </nav>
  )
}

function StorySwitcherSheet({ stories, activeStoryId, onSelect, onNewStory, onEditStory, onClose }: {
  stories: StoryType[]
  activeStoryId: string | null
  onSelect: (id: string) => void
  onNewStory: () => void
  onEditStory: (s: StoryType) => void
  onClose: () => void
}) {
  const y = useMotionValue(0)
  const backdropOpacity = useTransform(y, [0, 500], [1, 0])
  const dragState = useRef({
    startY: 0, dragging: false,
    lastY: 0, lastTime: 0, velocity: 0,
  })

  const dragPointerDown = (e: React.PointerEvent) => {
    dragState.current.startY = e.clientY
    dragState.current.dragging = false
    dragState.current.lastY = e.clientY
    dragState.current.lastTime = performance.now()
    dragState.current.velocity = 0
  }
  const dragPointerMove = (e: React.PointerEvent) => {
    const dy = e.clientY - dragState.current.startY
    if (dy > 5) dragState.current.dragging = true
    if (dragState.current.dragging) {
      e.preventDefault()
      const resisted = dy > 200 ? 200 + (dy - 200) * 0.25 : Math.max(0, dy)
      y.set(resisted)
      const now = performance.now()
      if (now - dragState.current.lastTime > 20) {
        dragState.current.velocity = (e.clientY - dragState.current.lastY) / (now - dragState.current.lastTime) * 1000
        dragState.current.lastY = e.clientY
        dragState.current.lastTime = now
      }
    }
  }
  const dragPointerUp = () => {
    if (dragState.current.dragging) {
      const vy = Math.min(Math.max(dragState.current.velocity, -3000), 3000)
      if (y.get() > 120 || vy > 800) {
        const h = window.innerHeight
        animate(y, h, {
          type: 'spring', damping: 30, stiffness: 250, mass: 0.8,
          velocity: vy,
        }).then(() => onClose())
      } else {
        animate(y, 0, {
          type: 'spring', damping: 35, stiffness: 300, mass: 0.6,
          velocity: vy,
        })
      }
    }
    dragState.current.dragging = false
  }

  const dragProps = {
    onPointerDown: dragPointerDown, onPointerMove: dragPointerMove,
    onPointerUp: dragPointerUp, onPointerLeave: dragPointerUp,
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 85, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <motion.div style={{ position: 'absolute', inset: 0, opacity: backdropOpacity,
        background: 'rgba(0,0,0,0.4)', }} onClick={() => {
          const h = window.innerHeight
          animate(y, h, { type: 'spring', damping: 30, stiffness: 250, mass: 0.8 }).then(() => onClose())
        }} />
      <motion.div
        style={{ y, touchAction: 'none', position: 'relative', background: 'var(--card)',
          borderRadius: '24px 24px 0 0', padding: '20px 20px 40px', willChange: 'transform' }}
        {...dragProps}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--line)',
          margin: '0 auto 20px', flexShrink: 0 }} />
        <div className="eyebrow" style={{ marginBottom: 14, color: 'var(--ink-soft)' }}>Tus Historias</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {stories.map(s => {
            const color = CAT_COLOR_STABLE[s.category] || 'var(--cat-otro)'
            const active = s.id === activeStoryId
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => onSelect(s.id)} style={{
                  flex: 1, border: active ? `2px solid ${color}` : '2px solid var(--line)',
                  borderRadius: 16, background: active ? 'var(--card-2)' : 'var(--card)',
                  padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 14, transition: 'all .15s',
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, overflow: 'hidden',
                    background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundImage: s.cover_url ? `url(${s.cover_url})` : undefined,
                    backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    {!s.cover_url && <Icon name={s.category === 'pareja' ? 'heartFill' : s.category === 'amigos' ? 'users' : s.category === 'familia' ? 'home' : 'tag'} size={18} style={{ color: '#fff' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--ink)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2, textTransform: 'capitalize' }}>{s.category}</div>
                  </div>
                  {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />}
                </button>
                <button onClick={() => { onEditStory(s); onClose() }} style={{
                  border: 'none', background: 'var(--card-2)', borderRadius: 12,
                  width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--ink-faint)', flexShrink: 0,
                }}>
                  <Icon name="edit" size={17} />
                </button>
              </div>
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
      </motion.div>
    </div>
  )
}

function NavBtn({ icon, label, active, onClick, badge }: { icon: string; label: string; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick} style={{
      border: 'none', background: 'transparent', cursor: 'pointer',
      flex: 1, minWidth: 44, height: 50, borderRadius: 16, position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
      color: active ? 'var(--orange-deep)' : 'var(--ink-faint)', transition: 'color .2s',
    }}>
      <div style={{ position: 'relative' }}>
        <Icon name={icon} size={21} stroke={active ? 2.3 : 1.8} />
        {badge != null && badge > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -7,
            background: 'var(--orange)', color: '#fff',
            borderRadius: 99, fontSize: 9, fontWeight: 800,
            minWidth: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', fontFamily: 'var(--font-ui)', lineHeight: 1,
          }}>
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 600,
        fontFamily: 'var(--font-ui)', letterSpacing: '0.01em' }}>{label}</span>
    </button>
  )
}
