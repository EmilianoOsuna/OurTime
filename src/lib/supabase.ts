import { createClient } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'
import { capacitorStorageAdapter } from './capacitorStorageAdapter'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase Credentials Missing: Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.")
}

const isNative = Capacitor.isNativePlatform()

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      ...(isNative ? { storage: capacitorStorageAdapter } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: !isNative,
      flowType: 'pkce',
    },
  }
)

export const nativeRedirectUrl = 'ourtime://callback'

export type StoryType = {
  id: string
  name: string
  category: 'pareja' | 'amigos' | 'familia' | 'otro'
  cover_url: string | null
  cover_position_x: number
  cover_position_y: number
  invite_code: string
  created_by: string
  created_at: string
  budget: number | null
  budget_period: 'mensual' | 'semanal' | null
  start_date: string | null
  origin_place: string | null
  theme_color?: string | null
}

export type StoryMemberType = {
  id: string
  story_id: string
  user_id: string
  role: string
  joined_at: string
}

export type PlanType = {
  id: string
  story_id: string
  title: string
  description: string | null
  plan_date: string
  type: 'cine' | 'cena' | 'viaje' | 'salida' | 'otro' | 'cafe' | 'regalo' | 'noche' | 'musica' | 'ruta'
  status: 'pendiente' | 'completado' | 'cancelado'
  cover_url: string | null
  parent_plan_id: string | null
  place: string | null
  budget_amount: number | null
  actual_amount: number | null
  created_at: string
  cover_position_x?: number
  cover_position_y?: number
}

export type MemoryType = {
  id: string
  story_id: string
  plan_id: string | null
  album_id: string | null
  image_url: string
  position_x: number
  position_y: number
  caption: string | null
  created_at: string
}

export type AlbumType = {
  id: string
  story_id: string
  name: string
  cover_memory_id: string | null
  created_at: string
}

export type MessageType = {
  id: string
  story_id: string
  sender_id: string | null
  text: string
  created_at: string
  read_at: string | null
  role: 'user' | 'ai'
}

export type TransactionType = {
  id: string
  story_id: string
  plan_id: string | null
  user_id: string | null
  amount: number
  type: 'ingreso' | 'gasto'
  category: string | null
  transaction_date: string
  description: string | null
  created_at: string
}

export type NotificationType = {
  id: string
  story_id: string
  type: string
  actor_id: string | null
  title: string
  body: string | null
  read: boolean
  created_at: string
}

export type PlanTier = 'free' | 'duo' | 'familia'

export type EntitlementType = {
  story_id: string
  plan: PlanTier
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive'
  payer_user_id: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  updated_at: string
}

export type PersonDisplay = {
  name: string
  initial: string
  color: string
  avatar_url?: string | null
  accessory?: string | null
}

export function imageUrl(url: string | null | undefined, _width?: number): string | null { // eslint-disable-line @typescript-eslint/no-unused-vars
  return url || null
}

export function buildPerson(
  p: { full_name?: string | null; avatar_url?: string | null; accessory?: string | null } | null | undefined,
  isMe: boolean
): PersonDisplay {
  return {
    name: p?.full_name || (isMe ? 'Tú' : 'Compañero'),
    initial: (p?.full_name?.[0] || (isMe ? 'T' : 'C')).toUpperCase(),
    color: isMe ? '#0474BA' : '#F17720',
    avatar_url: p?.avatar_url,
    accessory: p?.accessory,
  }
}
