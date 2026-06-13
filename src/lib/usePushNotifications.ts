import { useCallback, useEffect, useState } from 'react'
import { CapacitorHttp } from '@capacitor/core'
import { supabase } from './supabase'
import { useAuth } from '../context/AuthContext'
import { enableNativePushNotifications, getNativePushTarget, isNative, showNativeNotificationTest, syncNativePushToken } from './native'
import { savePushSubscription } from './pushSubscriptions'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

async function invokeCalendarFunction(body: Record<string, unknown>) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase no está configurado.')
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.')

  const url = `${SUPABASE_URL}/functions/v1/sync-google-calendar`
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }

  let status: number
  let payload: any
  try {
    if (isNative) {
      const response = await CapacitorHttp.post({
        url,
        headers,
        data: body,
        connectTimeout: 15_000,
        readTimeout: 30_000,
      })
      status = response.status
      payload = response.data
    } else {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      status = response.status
      const text = await response.text()
      payload = text ? JSON.parse(text) : null
    }
  } catch (error) {
    throw new Error(`No se pudo conectar con Supabase: ${error instanceof Error ? error.message : String(error)}`)
  }

  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload) } catch { /* Keep the server text for the error below. */ }
  }
  if (status < 200 || status >= 300 || payload?.error) {
    const detail = typeof payload === 'string' ? payload : payload?.detail || payload?.error
    throw new Error(detail || `Google Calendar respondió ${status}.`)
  }
  return payload
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - base64.length % 4) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

function sameApplicationServerKey(subscription: PushSubscription, expected: Uint8Array): boolean {
  const current = subscription.options.applicationServerKey
  if (!current) return false
  const bytes = new Uint8Array(current)
  return bytes.length === expected.length && bytes.every((value, index) => value === expected[index])
}

export function usePushNotifications() {
  const { user } = useAuth()
  const [enabled, setEnabled] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [loading, setLoading] = useState(false)

  const subscribeWeb = useCallback(async (requestPermission: boolean) => {
    if (!user || !VAPID_PUBLIC_KEY || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported')
      return false
    }

    let nextPermission = Notification.permission
    if (requestPermission && nextPermission === 'default') nextPermission = await Notification.requestPermission()
    setPermission(nextPermission)
    if (nextPermission !== 'granted') return false

    const reg = await navigator.serviceWorker.ready
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    let existing = await reg.pushManager.getSubscription()
    if (existing && !sameApplicationServerKey(existing, applicationServerKey)) {
      await existing.unsubscribe()
      existing = null
    }
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource,
    })
    await savePushSubscription(user.id, JSON.parse(JSON.stringify(sub)))
    setEnabled(true)
    return true
  }, [user])

  useEffect(() => {
    if (!user) return
    if (isNative) {
      void syncNativePushToken().then(setEnabled).catch(console.error)
      return
    }
    if (!('Notification' in window)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission)
    if (Notification.permission === 'granted') void subscribeWeb(false).catch(console.error)
  }, [user, subscribeWeb])

  const enable = useCallback(async () => {
    if (!user) return false
    setLoading(true)
    try {
      if (isNative) {
        const registered = await enableNativePushNotifications()
        setPermission(registered ? 'granted' : 'denied')
        if (!registered) return false
        // FCM returns the token asynchronously through the registration listener.
        setEnabled(true)
        return true
      }
      return await subscribeWeb(true)
    } finally {
      setLoading(false)
    }
  }, [user, subscribeWeb])

  return { enabled, permission, loading, enable }
}

export async function sendPushToStoryMembers(
  storyId: string,
  senderId: string,
  title: string,
  body: string,
  url = '/',
  metadata: { event_type?: string; target_id?: string } = {},
) {
  const { data, error } = await supabase.functions.invoke('send-push', {
    body: { story_id: storyId, sender_id: senderId, title, body, url, ...metadata },
  })
  if (error) throw error
  if (data?.failed?.length) throw new Error(data.failed.join('\n'))
  return data
}

export async function sendTestPushNotification() {
  let testTarget: { platform: string; installationId?: string; endpoint?: string } | null = null
  if (isNative) {
    await showNativeNotificationTest()
    testTarget = await getNativePushTarget()
  } else if ('serviceWorker' in navigator && 'PushManager' in window) {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) testTarget = { platform: 'web', endpoint: subscription.endpoint }
    await registration.showNotification('Prueba local de OurTime', {
      body: 'El navegador permite mostrar notificaciones en esta PWA.',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: `ourtime-local-test-${Date.now()}`,
    })
  }
  if (!testTarget) throw new Error('Este dispositivo todavía no tiene una suscripción registrada.')

  const { data, error } = await supabase.functions.invoke('send-push', {
    body: {
      test_self: true,
      test_target: testTarget,
      title: 'OurTime está listo',
      body: 'Las notificaciones funcionan correctamente en este dispositivo.',
      url: '/',
    },
  })
  if (error) throw error
  if (!data || data.sent !== 1) {
    const detail = data?.failed?.join('\n') || 'Este dispositivo todavía no tiene una suscripción registrada.'
    throw new Error(detail)
  }
  return data
}

export async function syncPlanToGoogleCalendar(planId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase.from('profiles')
    .select('google_calendar_enabled')
    .eq('id', user.id)
    .single()
  if (!profile?.google_calendar_enabled) return null
  return invokeCalendarFunction({ plan_id: planId, action: 'sync' })
}

export async function deletePlanFromGoogleCalendar(planId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase.from('profiles')
    .select('google_calendar_enabled')
    .eq('id', user.id)
    .single()
  if (!profile?.google_calendar_enabled) return null
  return invokeCalendarFunction({ plan_id: planId, action: 'delete' })
}

export async function testGoogleCalendarConnection() {
  return invokeCalendarFunction({ test_connection: true })
}
