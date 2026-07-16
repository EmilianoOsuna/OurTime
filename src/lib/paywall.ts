import { paywallEnabled } from './stripe'
import { supabase } from './supabase'

export type PaywallReason =
  | 'stories' | 'plans' | 'photos' | 'calendar' | 'members' | 'roles' | 'generic'

/** Copys del paywall suave según el límite que se alcanzó. */
export const PAYWALL_COPY: Record<PaywallReason, { eyebrow: string; title: string }> = {
  stories:  { eyebrow: 'Historias ilimitadas', title: 'Crea todas las Historias que quieran' },
  plans:    { eyebrow: 'Momentos ilimitados',  title: 'Sigan planeando sin límites' },
  photos:   { eyebrow: 'Fotos ilimitadas',     title: 'Guarden todos sus recuerdos' },
  calendar: { eyebrow: 'Google Calendar',      title: 'Sincroniza sus planes con el calendario' },
  members:  { eyebrow: 'Plan Familia',         title: 'Inviten hasta 6 personas a su Historia' },
  roles:    { eyebrow: 'Plan Familia',         title: 'Roles y permisos por miembro' },
  generic:  { eyebrow: 'OurTime Premium',      title: 'Desbloquea todo su espacio' },
}

/**
 * Abre el paywall suave desde cualquier página/sheet. AppShell escucha este
 * evento y muestra el overlay. No-op si el feature flag está apagado.
 * Devuelve `true` si se disparó (para que el llamador aborte la acción gateada).
 */
export function openPaywall(reason: PaywallReason = 'generic'): boolean {
  if (!paywallEnabled) return false
  window.dispatchEvent(new CustomEvent('ot:open-paywall', { detail: { reason } }))
  return true
}

/**
 * Gate por conteo: cuenta filas de una tabla en la Historia y, si alcanza el
 * límite, abre el paywall. Devuelve `true` si BLOQUEA (el llamador debe abortar).
 * No-op (devuelve false) si el flag está apagado o el límite es Infinity.
 */
export async function enforceCountGate(opts: {
  storyId: string
  table: 'plans' | 'memories'
  limit: number
  reason: PaywallReason
  topLevelOnly?: boolean
}): Promise<boolean> {
  if (!paywallEnabled || opts.limit === Infinity) return false
  let query = supabase.from(opts.table)
    .select('id', { count: 'exact', head: true })
    .eq('story_id', opts.storyId)
  if (opts.table === 'plans' && opts.topLevelOnly) query = query.is('parent_plan_id', null)
  const { count } = await query
  if ((count ?? 0) >= opts.limit) {
    openPaywall(opts.reason)
    return true
  }
  return false
}
