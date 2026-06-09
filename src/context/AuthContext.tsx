import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
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

  const setActiveStoryId = useCallback((id: string | null) => {
    _setActiveStoryId(id)
    if (id) localStorage.setItem('activeStoryId', id)
    else localStorage.removeItem('activeStoryId')
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfileAndStories(session.user.id)
      else setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          // Reset isLoading before fetching so AppInner doesn't see stale empty stories
          setIsLoading(true)
          fetchProfileAndStories(session.user.id)
          // Save Google provider_token if this was a Calendar OAuth redirect
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session.provider_token) {
            const updates: Record<string, unknown> = {
              google_calendar_token: session.provider_token,
              google_calendar_enabled: true,
            }
            // If Google provides an avatar and user has none, use Google's (never overwrite custom)
            const googleAvatar = session.user.user_metadata?.avatar_url as string | undefined
                               ?? session.user.user_metadata?.picture as string | undefined
            if (googleAvatar) {
              const { data: existing } = await supabase
                .from('profiles').select('avatar_url').eq('id', session.user.id).single()
              if (!existing?.avatar_url) updates.avatar_url = googleAvatar
            }
            supabase.from('profiles').update(updates).eq('id', session.user.id).then(() => {})
          }
        } else {
          _setActiveStoryId(null)
          setStories([])
          setProfile(null)
          setIsLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
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
      } else if (storyList.length > 0) {
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
    if (storyList.length > 0) {
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
