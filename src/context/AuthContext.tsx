import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { StoryType } from '../lib/supabase'

export type ProfileType = {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  anniversary_date: string | null
  birthday: string | null
  nickname: string | null
}

type AuthContextType = {
  session: Session | null
  user: User | null
  activeStoryId: string | null
  setActiveStoryId: (id: string | null) => void
  stories: StoryType[]
  profile: ProfileType | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshStories: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  activeStoryId: null,
  setActiveStoryId: () => {},
  stories: [],
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  refreshStories: async () => {},
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [activeStoryId, _setActiveStoryId] = useState<string | null>(null)
  const [stories, setStories] = useState<StoryType[]>([])
  const [profile, setProfile] = useState<ProfileType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const fetchedRef = useRef(false)

  const setActiveStoryId = useCallback((id: string | null) => {
    _setActiveStoryId(id)
    if (id) localStorage.setItem('activeStoryId', id)
    else localStorage.removeItem('activeStoryId')
  }, [])

  useEffect(() => {
    console.log('[DIAG] AuthProvider mounted, isLoading=true')

    const timeout = setTimeout(() => {
      console.log('[DIAG] ⏰ 30s safety timeout fired! fetchedRef.current=', fetchedRef.current)
      if (!fetchedRef.current) {
        fetchedRef.current = true
        setIsLoading(false)
      }
    }, 30000)

    const fetchWithTimeout = <T,>(promise: Promise<T>, ms: number) => {
      const timer = setTimeout(() => {
        console.log('[DIAG] ⏰ fetchWithTimeout fired after', ms, 'ms — keeping session, only stopping loading')
        setIsLoading(false)
      }, ms)
      return promise.finally(() => clearTimeout(timer))
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout)
      console.log('[DIAG] getSession() resolved. session=', session ? `found (user=${session.user.id})` : 'null')
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchedRef.current = true
        setIsLoading(true)
        console.log('[DIAG] session found, fetching profile+stories...')
        fetchWithTimeout(fetchProfileAndStories(session.user.id), 15000)
      } else {
        console.log('[DIAG] no session, setting isLoading=false')
        setIsLoading(false)
      }
    }, (err) => {
      clearTimeout(timeout)
      console.log('[DIAG] getSession() rejected:', err)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[DIAG] onAuthStateChange: event="${event}", session=`, session ? 'exists' : 'null')
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          if (fetchedRef.current && (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
            console.log('[DIAG] ignoring redundant event:', event)
            return
          }
          console.log('[DIAG] processing auth event, fetching profile+stories...')
          fetchedRef.current = true
          setIsLoading(true)
          fetchWithTimeout(fetchProfileAndStories(session.user.id), 8000)
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session.provider_token) {
            supabase.from('user_secrets').upsert({
              user_id: session.user.id,
              name: 'google_calendar_token',
              value: session.provider_token,
            }, { onConflict: 'user_id,name' }).then(undefined, console.error)
            const updates: Record<string, unknown> = {
              google_calendar_enabled: true,
            }
            const googleAvatar = session.user.user_metadata?.avatar_url as string | undefined
                               ?? session.user.user_metadata?.picture as string | undefined
            if (googleAvatar) {
              const { data: existing } = await supabase
                .from('profiles').select('avatar_url').eq('id', session.user.id).single()
              if (!existing?.avatar_url) updates.avatar_url = googleAvatar
            }
            supabase.from('profiles').update(updates).eq('id', session.user.id).then(undefined, console.error)
          }
        } else {
          _setActiveStoryId(null)
          setStories([])
          setProfile(null)
          setIsLoading(false)
        }
      }
    )

    return () => { clearTimeout(timeout); subscription.unsubscribe() }
  }, [])

  const fetchProfileAndStories = async (userId: string) => {
    console.log('[DIAG] fetchProfileAndStories start, userId=', userId)
    try {
      const [{ data: profileData }, { data: memberships }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('story_members')
          .select('story_id, stories(*)')
          .eq('user_id', userId),
      ])

      console.log('[DIAG] fetchProfileAndStories results: profile=', profileData ? 'found' : 'null', 'stories=', memberships?.length ?? 0)

      if (profileData) setProfile(profileData as ProfileType)

      const storyList: StoryType[] = (memberships ?? [])
        .map((m: any) => m.stories)
        .filter(Boolean)
      setStories(storyList)

      const savedId = localStorage.getItem('activeStoryId')
      if (savedId && storyList.some(s => s.id === savedId)) {
        _setActiveStoryId(savedId)
      } else if (storyList.length > 0 && storyList[0]) {
        _setActiveStoryId(storyList[0].id)
        localStorage.setItem('activeStoryId', storyList[0].id)
      }
    } catch (e) {
      console.error('[DIAG] fetchProfileAndStories error:', e)
    } finally {
      console.log('[DIAG] fetchProfileAndStories complete, isLoading=false')
      setIsLoading(false)
    }
  }

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfileAndStories(user.id)
  }, [user])

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
    console.log('[DIAG] signOut called')
    setSession(null)
    setUser(null)
    _setActiveStoryId(null)
    setStories([])
    setProfile(null)
    setIsLoading(false)
    localStorage.removeItem('activeStoryId')
    Promise.race([
      supabase.auth.signOut(),
      new Promise(resolve => setTimeout(resolve, 5000)),
    ]).catch(() => {})
  }

  const value = useMemo(() => ({
    session, user, activeStoryId, setActiveStoryId,
    stories, profile, isLoading, signOut, refreshProfile, refreshStories,
  }), [session, user, activeStoryId, stories, profile, isLoading, signOut, refreshProfile, refreshStories])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
