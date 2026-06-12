import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import { motion, animate, useMotionValue, useTransform } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import type { ProfileType } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { buildPerson, type PersonDisplay, type StoryType } from '../lib/supabase'
import { setBackHandler, isNative } from '../lib/native'
import { invokeTopBack, consumeIgnorePop } from '../lib/backStack'

import type { NotifItem } from './NotificationsPanel'

const Dashboard = lazy(() => import('../pages/Dashboard'))
const Calendar = lazy(() => import('../pages/Calendar'))
const Gallery = lazy(() => import('../pages/Gallery'))
const Finances = lazy(() => import('../pages/Finances'))
const Chat = lazy(() => import('../pages/Chat'))
const PlanDetail = lazy(() => import('../pages/PlanDetail').then(m => ({ default: m.PlanDetail })))
const ProfileScreen = lazy(() => import('../pages/Profile').then(m => ({ default: m.ProfileScreen })))
const NotificationsPanel = lazy(() => import('./NotificationsPanel').then(m => ({ default: m.NotificationsPanel })))
const GlobalActionSheet = lazy(() => import('./sheets/GlobalActionSheet').then(m => ({ default: m.GlobalActionSheet })))
const NewPlanSheet = lazy(() => import('./sheets/NewPlanSheet').then(m => ({ default: m.NewPlanSheet })))
const MoneySheet = lazy(() => import('./sheets/MoneySheet').then(m => ({ default: m.MoneySheet })))
const NewMemorySheet = lazy(() => import('./sheets/NewMemorySheet').then(m => ({ default: m.NewMemorySheet })))
const NewStorySheet = lazy(() => import('./sheets/NewStorySheet').then(m => ({ default: m.NewStorySheet })))
const EditStorySheet = lazy(() => import('./sheets/EditStorySheet').then(m => ({ default: m.EditStorySheet })))
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
  const [allCalendarPlans, setAllCalendarPlans] = useState<any[]>([])
  const [memories, setMemories] = useState<any[]>([])
  const [, setTransactions] = useState<any[]>([])
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [partner, setPartner] = useState<ProfileType | null>(null)
  const [storyCode, setStoryCode] = useState<string | null>(null)
  const [unreadRefreshKey, setUnreadRefreshKey] = useState(0)
  const [notifications, setNotifications] = useState<(NotifItem & { id: string })[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminStoryIds, setAdminStoryIds] = useState<Set<string>>(new Set())
  const prevTabRef = useRef<Tab>(tab)

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

  // Clear previous story data immediately on story switch to avoid limbo state
  useEffect(() => {
    setPartner(null)
    setPlans([])
    setMemories([])
    setTransactions([])
    setStoryCode(null)
    setIsAdmin(false)
  }, [activeStoryId])

  // Track which stories the user is admin of (for StorySwitcher edit buttons)
  useEffect(() => {
    if (!user || stories.length === 0) return
    supabase.from('story_members')
      .select('story_id, permission_level')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setAdminStoryIds(new Set(
          data.filter((m: any) => m.permission_level === 'admin').map((m: any) => m.story_id as string)
        ))
      })
  }, [user?.id, stories.length])

  useEffect(() => {
    if (!activeStoryId || !user) return

    supabase.from('plans').select('*').eq('story_id', activeStoryId).neq('status', 'cancelado')
      .order('plan_date', { ascending: false })
      .limit(50)
      .then(({ data }) => { if (data) setPlans(data) })

    supabase.from('memories').select('*').eq('story_id', activeStoryId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { if (data) setMemories(data) })

    supabase.from('transactions').select('*').eq('story_id', activeStoryId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { if (data) setTransactions(data) })

    // Find co-members of this story
    supabase.from('story_members')
      .select('user_id')
      .eq('story_id', activeStoryId)
      .neq('user_id', user.id)
      .then(async ({ data: coMembers }) => {
        if (coMembers && coMembers.length > 0 && coMembers[0]) {
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

    // Fetch current user's permission level for this story
    supabase.from('story_members')
      .select('permission_level')
      .eq('story_id', activeStoryId)
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => setIsAdmin(data?.permission_level === 'admin'))
  }, [activeStoryId, user])

  // Fetch plans from ALL stories for the calendar view
  useEffect(() => {
    if (!stories.length) { setAllCalendarPlans([]); return }
    const storyIds = stories.map(s => s.id)
    supabase.from('plans').select('*')
      .in('story_id', storyIds)
      .neq('status', 'cancelado')
      .limit(50)
      .then(({ data }) => {
        if (!data) return
        const withStory = data.map((p: any) => {
          const story = stories.find((s: any) => s.id === p.story_id)
          return { ...p, storyName: story?.name || '', storyCategory: story?.category || 'otro' }
        })
        setAllCalendarPlans(withStory)
      })
  }, [stories])

  // Mark chat messages as read when ENTERING chat — so badge is already 0 when NavBar reappears on exit
  useEffect(() => {
    if (tab === 'chat' && prevTabRef.current !== 'chat') {
      if (activeStoryId && user) {
        supabase.from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('story_id', activeStoryId)
          .neq('sender_id', user.id)
          .is('read_at', null)
          .then(() => setUnreadRefreshKey(k => k + 1), console.error)
      } else {
        setUnreadRefreshKey(k => k + 1)
      }
    } else if (prevTabRef.current === 'chat' && tab !== 'chat') {
      // Leaving chat — force refresh to confirm count is 0
      setUnreadRefreshKey(k => k + 1)
    }
    prevTabRef.current = tab
  }, [tab, activeStoryId, user])

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
  }, [])

  const closeNotifs = useCallback(() => {
    setNotifsVisible(false)
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
        .then(() => setUnreadRefreshKey(k => k + 1), console.error)
    } else {
      setUnreadRefreshKey(k => k + 1)
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
    supabase.from('plans').select('*').eq('story_id', activeStoryId).neq('status', 'cancelado')
      .order('plan_date', { ascending: true })
      .limit(50)
      .then(({ data }) => data && setPlans(data))
  }
  const refreshMemories = () => {
    if (!activeStoryId) return
    supabase.from('memories').select('*').eq('story_id', activeStoryId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => data && setMemories(data))
  }
  const refreshTransactions = () => {
    if (!activeStoryId) return
    supabase.from('transactions').select('*').eq('story_id', activeStoryId)
      .order('created_at', { ascending: false })
      .limit(50)
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

  // Realtime notifications from DB
  useEffect(() => {
    if (!activeStoryId) return
    const loadNotifs = () =>
      supabase.from('notifications').select('*')
        .eq('story_id', activeStoryId)
        .order('created_at', { ascending: false })
        .limit(40)
        .then(({ data }) => {
          if (!data) return
          setNotifications(data.map((n: any) => ({
            id: n.id,
            icon: n.type === 'plan_created' ? 'calendarCheck'
                : n.type === 'plan_completed' ? 'checkCircle'
                : n.type === 'memory_added' ? 'camera'
                : 'sparkle',
            text: <><strong>{n.title}</strong>{n.body ? ` — ${n.body}` : ''}</>,
            time: new Date(n.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            read: n.read,
          })))
        })
    loadNotifs()
    const ch = supabase.channel('notifs:' + activeStoryId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `story_id=eq.${activeStoryId}` }, loadNotifs)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [activeStoryId])

  const unreadCount = useUnreadCount(activeStoryId, user?.id, unreadRefreshKey)
  const unreadNotifs = notifications.filter(n => !n.read).length

  const markNotifsRead = () => {
    if (!activeStoryId) return
    supabase.from('notifications').update({ read: true })
      .eq('story_id', activeStoryId).eq('read', false)
      .then(undefined, console.error)
    setNotifications(ns => ns.map(n => ({ ...n, read: true })))
  }

  const ease = [0.16, 1, 0.3, 1] as const

  const screen = {
    home: <Dashboard plans={plans} go={go}
            onBell={() => { setNotifsVisible(true); markNotifsRead() }} onPlanClick={openPlan}
            onProfileOpen={() => setOverlay({ type: 'profile' })}
            onNewPlan={() => setOverlay({ type: 'newplan' })}
            onStorySwitcher={() => setStorySwitcherOpen(true)}
            me={me} partner={partnerDisplay} unreadNotifs={unreadNotifs} />,
    calendar: <Calendar plans={allCalendarPlans} onOpenPlan={openPlan} />,
    gallery: <Gallery memories={memories} setMemories={setMemories}
               onImageClick={(url: string) => setLightbox(url)} me={me} />,
    finance: <Finances />,
    chat: <Chat key={activeStoryId} me={me} partner={partnerDisplay}
             storyName={stories.find(s => s.id === activeStoryId)?.name}
             storyCoverUrl={stories.find(s => s.id === activeStoryId)?.cover_url ?? null}
             onBack={leaveChat} />,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', position: 'relative' }}>
      <Suspense fallback={
        <div style={{ padding: '80px 22px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--orange)',
            borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        </div>
      }>
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease }}
      >
        {screen[tab]}
      </motion.div>
      </Suspense>

      <Suspense fallback={null}>
      {overlay?.type === 'plan' && (
        <motion.div key="plan-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
          style={{ position: 'relative', zIndex: 100 }}>
          <PlanDetail plan={overlay.data} onClose={closeOverlay} chapterNo={chapterNo(overlay.data.id)} onUpdated={refreshPlans} />
        </motion.div>
      )}
      {overlay?.type === 'profile' && (
        <motion.div key="profile-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
          style={{ position: 'relative', zIndex: 100 }}>
          <ProfileScreen
            plans={plans}
            onClose={closeOverlay}
            onGoToFinance={() => { closeOverlay(); go('finance') }}
            storyCode={storyCode}
            isAdmin={isAdmin}
            onEditStory={(s) => setOverlay({ type: 'editstory', story: s })}
          />
        </motion.div>
      )}
      {overlay?.type === 'action' && (
        <motion.div key="action-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
          style={{ position: 'relative', zIndex: 100 }}>
          <GlobalActionSheet onClose={closeOverlay}
            onNewPlan={() => setOverlay({ type: 'newplan' })}
            onNewMoney={() => setOverlay({ type: 'money' })}
            onNewMemory={() => setOverlay({ type: 'memory' })}
            onNewStory={() => setOverlay({ type: 'newstory' })} />
        </motion.div>
      )}
      {overlay?.type === 'newplan' && (
        <motion.div key="newplan-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
          style={{ position: 'relative', zIndex: 100 }}>
          <NewPlanSheet onClose={closeOverlay} onCreated={() => { closeOverlay(); refreshPlans() }} />
        </motion.div>
      )}
      {overlay?.type === 'money' && (
        <motion.div key="money-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
          style={{ position: 'relative', zIndex: 100 }}>
          <MoneySheet onClose={closeOverlay} onCreated={() => { closeOverlay(); refreshTransactions() }} />
        </motion.div>
      )}
      {overlay?.type === 'memory' && (
        <motion.div key="memory-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
          style={{ position: 'relative', zIndex: 100 }}>
          <NewMemorySheet onClose={closeOverlay} onCreated={() => { closeOverlay(); refreshMemories() }} />
        </motion.div>
      )}
      {overlay?.type === 'newstory' && (
        <motion.div key="newstory-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
          style={{ position: 'relative', zIndex: 100 }}>
          <NewStorySheet onClose={closeOverlay} onCreated={() => { closeOverlay(); go('home') }} />
        </motion.div>
      )}
      {overlay?.type === 'editstory' && (
        <motion.div key="editstory-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
          style={{ position: 'relative', zIndex: 100 }}>
          <EditStorySheet story={overlay.story} onClose={closeOverlay} onUpdated={() => {}} isAdmin={adminStoryIds.has(overlay.story.id)} />
        </motion.div>
      )}
      </Suspense>
      <Suspense fallback={null}>
      {notifsVisible && <NotificationsPanel onClose={closeNotifs} items={notifications} />}
      </Suspense>
      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox(null)} />}
      {storySwitcherOpen && (
        <StorySwitcherSheet
          stories={stories}
          activeStoryId={activeStoryId}
          adminStoryIds={adminStoryIds}
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

  const items = [
    { tab: 'home' as const,     icon: 'home' as const,     label: 'Inicio'      },
    { tab: 'calendar' as const, icon: 'calendar' as const, label: 'Agenda'      },
    { tab: 'gallery' as const,  icon: 'image' as const,    label: 'Fotos'       },
    { tab: 'finance' as const,  icon: 'wallet' as const,   label: 'Gasto'       },
    { tab: 'chat' as const,     icon: 'chat' as const,     label: 'Chat', badge: unreadCount },
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

        <NavBtn icon={items[0]!.icon} label={items[0]!.label} active={tab === items[0]!.tab} onClick={() => setTab(items[0]!.tab)} />
        <NavBtn icon={items[1]!.icon} label={items[1]!.label} active={tab === items[1]!.tab} onClick={() => setTab(items[1]!.tab)} />

        <button data-testid="fab-btn" onClick={onFab} style={{
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

        <NavBtn icon={items[2]!.icon} label={items[2]!.label} active={tab === items[2]!.tab} onClick={() => setTab(items[2]!.tab)} />
        <NavBtn icon={items[3]!.icon} label={items[3]!.label} active={tab === items[3]!.tab} onClick={() => setTab(items[3]!.tab)} />
        <NavBtn icon={items[4]!.icon} label={items[4]!.label} badge={items[4]!.badge} active={tab === items[4]!.tab} onClick={() => setTab(items[4]!.tab)} />
      </div>
    </nav>
  )
}

function StorySwitcherSheet({ stories, activeStoryId, adminStoryIds, onSelect, onNewStory, onEditStory, onClose }: {
  stories: StoryType[]
  activeStoryId: string | null
  adminStoryIds: Set<string>
  onSelect: (id: string) => void
  onNewStory: () => void
  onEditStory: (s: StoryType) => void
  onClose: () => void
}) {
  const y = useMotionValue(0)
  const backdropOpacity = useTransform(y, [0, 500], [1, 0])
  const rootRef = useRef<HTMLDivElement>(null)
  const dragState = useRef({
    pointerId: -1, startY: 0, dragging: false,
    lastY: 0, lastTime: 0, velocity: 0,
  })

  const dragPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return
    dragState.current.pointerId = e.pointerId
    e.currentTarget.setPointerCapture(e.pointerId)
    dragState.current.startY = e.clientY
    dragState.current.dragging = false
    dragState.current.lastY = e.clientY
    dragState.current.lastTime = performance.now()
    dragState.current.velocity = 0
  }
  const dragPointerMove = (e: React.PointerEvent) => {
    if (dragState.current.pointerId !== e.pointerId) return
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
  const dragPointerUp = (e: React.PointerEvent, cancelled = false) => {
    if (dragState.current.pointerId !== e.pointerId) return
    if (dragState.current.dragging && !cancelled) {
      const vy = Math.min(Math.max(dragState.current.velocity, -3000), 3000)
      if (y.get() > 120 || vy > 800) {
        if (rootRef.current) rootRef.current.style.visibility = 'hidden'
        onClose()
      } else {
        animate(y, 0, {
          type: 'spring', damping: 35, stiffness: 300, mass: 0.6,
          velocity: vy,
        })
      }
    }
    if (cancelled) y.set(0)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    dragState.current.pointerId = -1
    dragState.current.dragging = false
  }

  const dragProps = {
    onPointerDown: dragPointerDown, onPointerMove: dragPointerMove,
    onPointerUp: dragPointerUp, onPointerCancel: (e: React.PointerEvent) => dragPointerUp(e, true),
  }

  return (
    <div ref={rootRef} style={{ position: 'fixed', inset: 0, zIndex: 85, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <motion.div style={{ position: 'absolute', inset: 0, opacity: backdropOpacity,
        background: 'rgba(0,0,0,0.4)', }} onClick={() => {
          if (rootRef.current) rootRef.current.style.visibility = 'hidden'
          onClose()
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
                {adminStoryIds.has(s.id) && (
                  <button onClick={() => { onEditStory(s); onClose() }} style={{
                    border: 'none', background: 'var(--card-2)', borderRadius: 12,
                    width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--ink-faint)', flexShrink: 0,
                  }}>
                    <Icon name="edit" size={17} />
                  </button>
                )}
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
