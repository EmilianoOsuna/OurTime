import { useEffect } from 'react'
import { supabase } from './supabase'
import { useAuth } from '../context/AuthContext'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - base64.length % 4) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

export function usePushNotifications() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user || !VAPID_PUBLIC_KEY) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    const subscribe = async () => {
      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const reg = await navigator.serviceWorker.ready
        const existing = await reg.pushManager.getSubscription()
        const sub = existing ?? await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        })

        await supabase.from('profiles')
          .update({ push_subscription: JSON.parse(JSON.stringify(sub)) })
          .eq('id', user.id)
      } catch (e) {
        console.warn('Push subscription:', e)
      }
    }

    // Delay to avoid blocking first render
    const t = setTimeout(subscribe, 3000)
    return () => clearTimeout(t)
  }, [user?.id])
}

export async function sendPushToStoryMembers(
  storyId: string,
  senderId: string,
  title: string,
  body: string
) {
  await supabase.functions.invoke('send-push', {
    body: { story_id: storyId, sender_id: senderId, title, body },
  })
}
