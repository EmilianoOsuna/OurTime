import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from '../context/AuthContext'
import { enableNativePushNotifications, getNativePushTarget, isNative, showNativeNotificationTest, syncNativePushToken } from './native'
import { savePushSubscription } from './pushSubscriptions'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - base64.length % 4) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from(raw, c => c.charCodeAt(0))
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
    const existing = await reg.pushManager.getSubscription()
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
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
  url = '/'
) {
  const { data, error } = await supabase.functions.invoke('send-push', {
    body: { story_id: storyId, sender_id: senderId, title, body, url },
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
  const { data, error } = await supabase.functions.invoke('sync-google-calendar', {
    body: { plan_id: planId },
  })
  if (error) {
    const response = (error as { context?: Response }).context
    if (response) {
      const payload = await response.clone().json().catch(() => null)
      throw new Error(payload?.detail || payload?.error || error.message)
    }
    throw error
  }
  if (data?.error) throw new Error(data.detail || data.error)
  return data
}

export async function testGoogleCalendarConnection() {
  const { data, error } = await supabase.functions.invoke('sync-google-calendar', {
    body: { test_connection: true },
  })
  if (error) {
    const response = (error as { context?: Response }).context
    if (response) {
      const payload = await response.clone().json().catch(() => null)
      throw new Error(payload?.detail || payload?.error || error.message)
    }
    throw error
  }
  if (data?.error) throw new Error(data.detail || data.error)
  return data
}
