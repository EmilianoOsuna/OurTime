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
    // Clear malformed sessions (missing required fields) — not expired ones
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (!k?.startsWith('sb-') || k.endsWith('-user')) continue
      try {
        const raw = localStorage.getItem(k)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (!parsed?.access_token || !parsed?.refresh_token || !parsed?.expires_at) {
            localStorage.removeItem(k)
            localStorage.removeItem(k + '-user')
          }
        }
      } catch {
        localStorage.removeItem(k)
        localStorage.removeItem(k + '-user')
      }
    }

    const timeout = setTimeout(() => {
      // Safety net: if nothing resolved in 10s, clear stale session so next load is clean
      if (!fetchedRef.current) {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i)
          if (k?.startsWith('sb-')) { localStorage.removeItem(k); localStorage.removeItem(k + '-user') }
        }
        fetchedRef.current = true
      }
      setIsLoading(false)
    }, 10000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout)
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchedRef.current = true
        setIsLoading(true)
        fetchProfileAndStories(session.user.id)
      } else {
        setIsLoading(false)
      }
    }, () => {
      clearTimeout(timeout)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          // Only block initial replay; always allow fresh SIGNED_IN after timeout
          if (fetchedRef.current && (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) return
          fetchedRef.current = true
          setIsLoading(true)
          fetchProfileAndStories(session.user.id)
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
    try {
      const [{ data: profileData }, { data: memberships }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('story_members')
          .select('story_id, stories(*)')
          .eq('user_id', userId),
      ])

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
      console.error(e)
    } finally {
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
    // Clear state immediately so UI responds without waiting for network
    setSession(null)
    setUser(null)
    _setActiveStoryId(null)
    setStories([])
    setProfile(null)
    setIsLoading(false)
    localStorage.removeItem('activeStoryId')
    // Fire-and-forget with 5s timeout (clears server-side session)
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
