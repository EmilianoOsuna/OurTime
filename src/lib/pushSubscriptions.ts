import { supabase } from './supabase'

export type PushSubscriptionRecord = {
  endpoint?: string
  expirationTime?: number | null
  keys?: { p256dh?: string; auth?: string }
  platform?: string
  token?: string
  installationId?: string
}

function isPushSubscription(value: unknown): value is PushSubscriptionRecord {
  if (!value || typeof value !== 'object') return false
  const item = value as PushSubscriptionRecord
  return Boolean(item.endpoint || (item.platform && item.token))
}

export function normalizePushSubscriptions(value: unknown): PushSubscriptionRecord[] {
  const values = Array.isArray(value) ? value : [value]
  return values.filter(isPushSubscription)
}

function subscriptionKey(item: PushSubscriptionRecord): string {
  if (item.endpoint) return `web:${item.endpoint}`
  if (item.installationId) return `${item.platform}:${item.installationId}`
  return `${item.platform}:${item.token}`
}

export async function savePushSubscription(userId: string, next: PushSubscriptionRecord): Promise<void> {
  const { data, error: readError } = await supabase
    .from('profiles')
    .select('push_subscription')
    .eq('id', userId)
    .single()
  if (readError) throw readError

  const nextKey = subscriptionKey(next)
  const subscriptions = normalizePushSubscriptions(data?.push_subscription)
    .filter(item => subscriptionKey(item) !== nextKey)
  subscriptions.push(next)

  const { error } = await supabase
    .from('profiles')
    .update({ push_subscription: subscriptions.slice(-10) as never })
    .eq('id', userId)
  if (error) throw error
}
