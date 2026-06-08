import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
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
      (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfileAndStories(session.user.id)
          // Save Google provider_token if this was a Calendar OAuth redirect
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session.provider_token) {
            supabase.from('profiles').update({
              google_calendar_token: session.provider_token,
              google_calendar_enabled: true,
            }).eq('id', session.user.id)
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
    if (storyList.length > 0 && !activeStoryId) {
      _setActiveStoryId(storyList[0].id)
      localStorage.setItem('activeStoryId', storyList[0].id)
    }
  }, [user, activeStoryId])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      session, user, activeStoryId, setActiveStoryId,
      stories, profile, isLoading, signOut, refreshProfile, refreshStories,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
