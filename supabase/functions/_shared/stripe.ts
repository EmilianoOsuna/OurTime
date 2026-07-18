import Stripe from 'npm:stripe@16'
import { createClient } from 'npm:@supabase/supabase-js@2'

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
}

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

/** Cliente con service-role: usado por el webhook (bypassa RLS). */
export function serviceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

/**
 * Cliente con el JWT del usuario reenviado, para resolver `getUser()` y
 * respetar RLS (patrón usado en connect-google-calendar).
 */
export function userClient(authHeader: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
}

export type PlanTier = 'free' | 'duo' | 'familia'
export type Interval = 'month' | 'year'

/** price_id de Stripe por plan+intervalo (configurados vía supabase secrets). */
export function priceIdFor(plan: PlanTier, interval: Interval): string {
  const map: Record<string, string | undefined> = {
    'duo:month': Deno.env.get('STRIPE_PRICE_DUO_MONTHLY'),
    'duo:year': Deno.env.get('STRIPE_PRICE_DUO_YEARLY'),
    'familia:month': Deno.env.get('STRIPE_PRICE_FAMILIA_MONTHLY'),
    'familia:year': Deno.env.get('STRIPE_PRICE_FAMILIA_YEARLY'),
  }
  const priceId = map[`${plan}:${interval}`]
  if (!priceId) throw new Error(`No hay price configurado para ${plan}/${interval}`)
  return priceId
}

/** Reverso: dado un price_id de un evento de Stripe, deduce el plan. */
export function planForPrice(priceId: string | null | undefined): PlanTier {
  if (!priceId) return 'free'
  if (
    priceId === Deno.env.get('STRIPE_PRICE_FAMILIA_MONTHLY') ||
    priceId === Deno.env.get('STRIPE_PRICE_FAMILIA_YEARLY')
  ) return 'familia'
  if (
    priceId === Deno.env.get('STRIPE_PRICE_DUO_MONTHLY') ||
    priceId === Deno.env.get('STRIPE_PRICE_DUO_YEARLY')
  ) return 'duo'
  return 'free'
}

/** Mapea el status de una suscripción de Stripe a la columna `status`. */
export function mapStatus(s: Stripe.Subscription.Status): string {
  switch (s) {
    case 'active': return 'active'
    case 'trialing': return 'trialing'
    case 'past_due':
    case 'unpaid': return 'past_due'
    case 'canceled':
    case 'incomplete_expired': return 'canceled'
    default: return 'inactive'
  }
}
