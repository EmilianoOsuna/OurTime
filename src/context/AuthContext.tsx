import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { StoryType, EntitlementType } from '../lib/supabase'

export type ProfileType = {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  anniversary_date: string | null
  birthday: string | null
  nickname: string | null
  accessory: string | null
}

type AuthContextType = {
  session: Session | null
  user: User | null
  activeStoryId: string | null
  setActiveStoryId: (id: string | null) => void
  stories: StoryType[]
  profile: ProfileType | null
  isLoading: boolean
  entitlements: Record<string, EntitlementType>
  userHasPaidStory: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshStories: () => Promise<void>
  refreshEntitlements: () => Promise<void>
}

function indexEntitlements(rows: EntitlementType[] | null | undefined): Record<string, EntitlementType> {
  const map: Record<string, EntitlementType> = {}
  for (const row of rows ?? []) map[row.story_id] = row
  return map
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  activeStoryId: null,
  setActiveStoryId: () => {},
  stories: [],
  profile: null,
  isLoading: true,
  entitlements: {},
  userHasPaidStory: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  refreshStories: async () => {},
  refreshEntitlements: async () => {},
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [activeStoryId, _setActiveStoryId] = useState<string | null>(null)
  const [stories, setStories] = useState<StoryType[]>([])
  const [profile, setProfile] = useState<ProfileType | null>(null)
  const [entitlements, setEntitlements] = useState<Record<string, EntitlementType>>({})
  const [isLoading, setIsLoading] = useState(true)
  const loadedUserIdRef = useRef<string | null>(null)
  const setActiveStoryId = useCallback((id: string | null) => {
    _setActiveStoryId(id)
    if (id) localStorage.setItem('activeStoryId', id)
    else localStorage.removeItem('activeStoryId')
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        setSession(nextSession)
        setUser(nextSession?.user ?? null)

        if (nextSession?.user) {
          const userChanged = loadedUserIdRef.current !== nextSession.user.id
          if (event === 'INITIAL_SESSION' || event === 'USER_UPDATED' || userChanged) {
            loadedUserIdRef.current = nextSession.user.id
            setIsLoading(true)
            const userId = nextSession.user.id
            setTimeout(() => void fetchProfileAndStories(userId), 0)
          }

          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && nextSession.provider_token) {
            const authSession = nextSession
            setTimeout(() => void persistGoogleAccount(authSession).catch(console.error), 0)
          }
        } else {
          loadedUserIdRef.current = null
          _setActiveStoryId(null)
          setStories([])
          setProfile(null)
          setEntitlements({})
          setIsLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const persistGoogleAccount = async (authSession: Session) => {
    if (!authSession.provider_token) return

    await supabase.from('user_secrets').upsert({
      user_id: authSession.user.id,
      name: 'google_calendar_token',
      value: authSession.provider_token,
    }, { onConflict: 'user_id,name' })
    if (authSession.provider_refresh_token) {
      await supabase.from('user_secrets').upsert({
        user_id: authSession.user.id,
        name: 'google_calendar_refresh_token',
        value: authSession.provider_refresh_token,
      }, { onConflict: 'user_id,name' })
    }
    await supabase.from('user_secrets').upsert({
      user_id: authSession.user.id,
      name: 'google_calendar_token_expires_at',
      value: String(Date.now() + 50 * 60 * 1000),
    }, { onConflict: 'user_id,name' })

    const updates: Record<string, unknown> = { google_calendar_enabled: true }
    const googleAvatar = authSession.user.user_metadata?.avatar_url as string | undefined
      ?? authSession.user.user_metadata?.picture as string | undefined
    if (googleAvatar) {
      const { data: existing } = await supabase
        .from('profiles').select('avatar_url').eq('id', authSession.user.id).single()
      if (!existing?.avatar_url) updates.avatar_url = googleAvatar
    }
    await supabase.from('profiles').update(updates).eq('id', authSession.user.id)
  }

  const fetchProfileAndStories = async (userId: string) => {
    try {
      const [{ data: profileData }, { data: memberships }, { data: entRows }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('story_members')
          .select('story_id, stories(*)')
          .eq('user_id', userId),
        // RLS limita a las entitlements de las Historias del usuario.
        supabase.from('story_entitlements').select('*'),
      ])

      if (profileData) setProfile(profileData as ProfileType)

      const storyList: StoryType[] = (memberships ?? [])
        .map((m: any) => m.stories)
        .filter(Boolean)
      setStories(storyList)

      setEntitlements(indexEntitlements(entRows as EntitlementType[] | null))

      const savedId = localStorage.getItem('activeStoryId')
      if (savedId && storyList.some(s => s.id === savedId)) {
        _setActiveStoryId(savedId)
      } else if (storyList.length > 0 && storyList[0]) {
        _setActiveStoryId(storyList[0].id)
        localStorage.setItem('activeStoryId', storyList[0].id)
      }
    } catch (e) {
      console.error('Unable to load account data:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfileAndStories(user.id)
  }, [user])

  const refreshEntitlements = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('story_entitlements').select('*')
    setEntitlements(indexEntitlements(data as EntitlementType[] | null))
  }, [user])

  // Realtime: el webhook de Stripe (service-role) escribe story_entitlements;
  // refetch al vuelo para que el plan cambie en vivo sin recargar.
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('story_entitlements_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'story_entitlements' },
        () => { void refreshEntitlements() })
      .subscribe()
    // Al volver de Stripe (web o deep link nativo) refrescamos como red de
    // seguridad por si el webhook llega justo después del redirect.
    const onCheckoutReturn = () => { void refreshEntitlements() }
    window.addEventListener('ot:checkout-return', onCheckoutReturn)
    return () => {
      void supabase.removeChannel(channel)
      window.removeEventListener('ot:checkout-return', onCheckoutReturn)
    }
  }, [user, refreshEntitlements])

  const refreshStories = useCallback(async () => {
    if (!user) return
    const { data: memberships } = await supabase
      .from('story_members')
      .select('story_id, stories(*)')
      .eq('user_id', user.id)
    const storyList: StoryType[] = (memberships ?? [])
      .map((m: any) => m.stories)
      .filter(Boolean)
    setStories(storyList)
    if (storyList.length > 0 && storyList[0]) {
      const currentStillValid = storyList.some(s => s.id === activeStoryId)
      if (!currentStillValid) {
        _setActiveStoryId(storyList[0].id)
        localStorage.setItem('activeStoryId', storyList[0].id)
      }
    } else {
      _setActiveStoryId(null)
      localStorage.removeItem('activeStoryId')
    }
  }, [user, activeStoryId])

  const signOut = async () => {
    setSession(null)
    setUser(null)
    _setActiveStoryId(null)
    setStories([])
    setProfile(null)
    setEntitlements({})
    setIsLoading(false)
    localStorage.removeItem('activeStoryId')
    Promise.race([
      supabase.auth.signOut(),
      new Promise(resolve => setTimeout(resolve, 5000)),
    ]).catch(() => {})
  }

  const userHasPaidStory = useMemo(
    () => Object.values(entitlements).some(
      e => e.payer_user_id === user?.id && (e.status === 'active' || e.status === 'trialing'),
    ),
    [entitlements, user],
  )

  const value = useMemo(() => ({
    session, user, activeStoryId, setActiveStoryId,
    stories, profile, isLoading, entitlements, userHasPaidStory,
    signOut, refreshProfile, refreshStories, refreshEntitlements,
  }), [session, user, activeStoryId, stories, profile, isLoading, entitlements, userHasPaidStory,
    signOut, refreshProfile, refreshStories, refreshEntitlements])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
