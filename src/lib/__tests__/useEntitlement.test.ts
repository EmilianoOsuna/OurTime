import { describe, it, expect } from 'vitest'
import { PLAN_LIMITS, effectivePlan, isActiveStatus, canCreateStory } from '../useEntitlement'
import type { EntitlementType } from '../supabase'

function ent(partial: Partial<EntitlementType>): EntitlementType {
  return {
    story_id: 's1', plan: 'free', status: 'inactive', payer_user_id: null,
    stripe_customer_id: null, stripe_subscription_id: null, current_period_end: null,
    cancel_at_period_end: false, updated_at: '2026-07-15T00:00:00Z', ...partial,
  }
}

describe('PLAN_LIMITS', () => {
  it('free tier caps momentos, fotos y miembros; sin gcal ni roles', () => {
    expect(PLAN_LIMITS.free).toEqual({ plans: 50, photos: 100, members: 2, googleCalendar: false, roles: false })
  })
  it('duo levanta momentos/fotos y habilita gcal, mantiene 2 miembros sin roles', () => {
    expect(PLAN_LIMITS.duo.plans).toBe(Infinity)
    expect(PLAN_LIMITS.duo.photos).toBe(Infinity)
    expect(PLAN_LIMITS.duo.members).toBe(2)
    expect(PLAN_LIMITS.duo.googleCalendar).toBe(true)
    expect(PLAN_LIMITS.duo.roles).toBe(false)
  })
  it('familia habilita 6 miembros y roles', () => {
    expect(PLAN_LIMITS.familia.members).toBe(6)
    expect(PLAN_LIMITS.familia.roles).toBe(true)
  })
})

describe('isActiveStatus', () => {
  it('active y trialing cuentan como activos', () => {
    expect(isActiveStatus('active')).toBe(true)
    expect(isActiveStatus('trialing')).toBe(true)
  })
  it('los demás estados no', () => {
    for (const s of ['past_due', 'canceled', 'inactive', undefined] as const) {
      expect(isActiveStatus(s)).toBe(false)
    }
  })
})

describe('effectivePlan', () => {
  it('sin fila → free', () => {
    expect(effectivePlan(null)).toBe('free')
    expect(effectivePlan(undefined)).toBe('free')
  })
  it('plan pagado solo aplica si el status está activo', () => {
    expect(effectivePlan(ent({ plan: 'duo', status: 'active' }))).toBe('duo')
    expect(effectivePlan(ent({ plan: 'familia', status: 'trialing' }))).toBe('familia')
  })
  it('past_due / canceled / inactive caen a free aunque el plan sea de pago', () => {
    expect(effectivePlan(ent({ plan: 'duo', status: 'past_due' }))).toBe('free')
    expect(effectivePlan(ent({ plan: 'familia', status: 'canceled' }))).toBe('free')
    expect(effectivePlan(ent({ plan: 'duo', status: 'inactive' }))).toBe('free')
  })
})

describe('canCreateStory', () => {
  it('gratis permite la primera Historia', () => {
    expect(canCreateStory(0, false)).toBe(true)
  })
  it('gratis se topa en la segunda si no es pagador', () => {
    expect(canCreateStory(1, false)).toBe(false)
    expect(canCreateStory(3, false)).toBe(false)
  })
  it('un pagador activo puede crear Historias ilimitadas', () => {
    expect(canCreateStory(1, true)).toBe(true)
    expect(canCreateStory(9, true)).toBe(true)
  })
})
