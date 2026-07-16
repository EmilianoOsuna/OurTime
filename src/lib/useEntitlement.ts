import { useAuth } from '../context/AuthContext'
import type { EntitlementType, PlanTier } from './supabase'

/**
 * Límites de producto por tier. Centralizados aquí para que los gates no
 * tengan números mágicos dispersos. `Infinity` = sin límite.
 *
 * Nota: `stories` es un límite POR-USUARIO (no por-Historia). La regla real es
 * "gratis = 1 Historia; si eres pagador en cualquier Historia → ilimitadas".
 * Ese caso se resuelve con `canCreateStory()` más abajo, no con este número.
 */
export type PlanLimits = {
  plans: number
  photos: number
  members: number
  googleCalendar: boolean
  roles: boolean
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: { plans: 50, photos: 100, members: 2, googleCalendar: false, roles: false },
  duo: { plans: Infinity, photos: Infinity, members: 2, googleCalendar: true, roles: false },
  familia: { plans: Infinity, photos: Infinity, members: 6, googleCalendar: true, roles: true },
}

/** Un status cuenta como "de pago activo" solo en estos estados. */
export function isActiveStatus(status: EntitlementType['status'] | undefined): boolean {
  return status === 'active' || status === 'trialing'
}

/**
 * Tier efectivo de una Historia: el plan pagado solo aplica si la suscripción
 * está activa/trialing; en cualquier otro caso (past_due, canceled, inactive,
 * sin fila) cae a 'free'.
 */
export function effectivePlan(ent: EntitlementType | null | undefined): PlanTier {
  if (ent && isActiveStatus(ent.status)) return ent.plan
  return 'free'
}

/**
 * ¿El usuario puede crear otra Historia? Gratis permite 1; si ya tiene ≥1 y no
 * es pagador activo en ninguna Historia, se topa (Paywall).
 */
export function canCreateStory(currentStoryCount: number, hasPaidStory: boolean): boolean {
  return currentStoryCount < 1 || hasPaidStory
}

export type Entitlement = {
  plan: PlanTier
  status: EntitlementType['status']
  isPro: boolean
  limits: PlanLimits
  /** true cuando la suscripción se cancelará al final del periodo actual. */
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null
}

/**
 * Entitlement efectivo de una Historia (por defecto la activa). Lee del mapa
 * `entitlements` que `AuthContext` mantiene vía fetch + realtime.
 */
export function useEntitlement(storyId?: string | null): Entitlement {
  const { entitlements, activeStoryId, userHasPaidStory } = useAuth()
  void userHasPaidStory
  const id = storyId ?? activeStoryId
  const ent = id ? entitlements[id] : undefined
  const plan = effectivePlan(ent)
  return {
    plan,
    status: ent?.status ?? 'inactive',
    isPro: plan !== 'free',
    limits: PLAN_LIMITS[plan],
    cancelAtPeriodEnd: ent?.cancel_at_period_end ?? false,
    currentPeriodEnd: ent?.current_period_end ?? null,
  }
}
