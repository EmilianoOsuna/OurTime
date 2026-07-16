import { CapacitorHttp } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { supabase } from './supabase'
import { isNative } from './native'
import type { PlanTier } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * URL pública de la PWA. Stripe exige success/cancel_url https, así que en
 * nativo redirigimos a la web y ésta rebota al esquema `ourtime://` (ver App.tsx).
 */
export const APP_URL: string =
  import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')

export type CheckoutInterval = 'month' | 'year'

/** Feature flag: permite desplegar la infra sin activar el cobro todavía. */
export const paywallEnabled = import.meta.env.VITE_PAYWALL_ENABLED === 'true'

async function invokeStripe(fn: string, body: Record<string, unknown>): Promise<{ url: string }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase no está configurado.')
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.')

  const url = `${SUPABASE_URL}/functions/v1/${fn}`
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }

  type StripeResp = { url?: string; error?: string }
  let status: number
  let payload: StripeResp | string | null
  if (isNative) {
    const res = await CapacitorHttp.post({ url, headers, data: body, connectTimeout: 15_000, readTimeout: 30_000 })
    status = res.status
    payload = res.data as StripeResp | string
  } else {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
    status = res.status
    const text = await res.text()
    payload = text ? (JSON.parse(text) as StripeResp) : null
  }
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload) as StripeResp } catch { /* keep text */ }
  }
  const obj: StripeResp = typeof payload === 'object' && payload ? payload : {}
  if (status < 200 || status >= 300 || obj.error || !obj.url) {
    throw new Error(obj.error || `Stripe respondió ${status}.`)
  }
  return { url: obj.url }
}

/**
 * Inicia el checkout de una suscripción para una Historia. En web navega a
 * Stripe Checkout; en nativo lo abre en el navegador in-app y vuelve por deep link.
 */
export async function startCheckout(opts: {
  storyId: string
  plan: Extract<PlanTier, 'duo' | 'familia'>
  interval?: CheckoutInterval
}): Promise<void> {
  // Nativo: la web rebota a ourtime://callback (close_native=1); web: vuelve directo.
  const successUrl = isNative
    ? `${APP_URL}/?checkout=success&close_native=1`
    : `${APP_URL}/?checkout=success`
  const cancelUrl = isNative
    ? `${APP_URL}/?checkout=cancel&close_native=1`
    : `${APP_URL}/?checkout=cancel`

  const { url } = await invokeStripe('create-checkout-session', {
    story_id: opts.storyId,
    plan: opts.plan,
    interval: opts.interval ?? 'month',
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  if (isNative) await Browser.open({ url })
  else window.location.href = url
}

/** Abre el Billing Portal de Stripe para gestionar/cancelar la suscripción. */
export async function openBillingPortal(storyId: string): Promise<void> {
  const returnUrl = isNative ? `${APP_URL}/?portal=return&close_native=1` : `${APP_URL}/?portal=return`
  const { url } = await invokeStripe('create-portal-session', { story_id: storyId, return_url: returnUrl })
  if (isNative) await Browser.open({ url })
  else window.location.href = url
}
