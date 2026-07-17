import { Capacitor } from '@capacitor/core'
import { supabase } from './supabase'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Geolocation } from '@capacitor/geolocation'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Preferences } from '@capacitor/preferences'
import { Device } from '@capacitor/device'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Share } from '@capacitor/share'
import { PushNotifications } from '@capacitor/push-notifications'
import { LocalNotifications } from '@capacitor/local-notifications'
import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Clipboard } from '@capacitor/clipboard'
import { Dialog } from '@capacitor/dialog'
import { Network } from '@capacitor/network'
import { Toast } from '@capacitor/toast'
import { ScreenOrientation } from '@capacitor/screen-orientation'
import { savePushSubscription } from './pushSubscriptions'
import { SocialLogin } from '@capgo/capacitor-social-login'

export const isNative = Capacitor.isNativePlatform()
export const isWeb = !isNative

let onBackPress: (() => boolean) | null = null
const PUSH_TOKEN_KEY = 'ourtime_push_token'
let pushListenersReady = false
let registrationWaiter: ((registered: boolean) => void) | null = null
let pendingNavigationUrl: string | null = null

function dispatchNavigation(url: string | undefined) {
  if (!url) return
  pendingNavigationUrl = url
  window.dispatchEvent(new CustomEvent('ourtime:navigate', { detail: { url } }))
}

export function consumeNativeNavigationUrl(): string | null {
  const url = pendingNavigationUrl
  pendingNavigationUrl = null
  return url
}

export function setBackHandler(handler: () => boolean) {
  onBackPress = handler
}

export async function setupNativeApp() {
  if (!isNative) return

  // Initialize Native Google Sign-In with Web Client ID from environment variables
  const webClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (webClientId) {
    SocialLogin.initialize({
      google: {
        webClientId,
        mode: 'online',
      },
    }).catch((err) => {
      console.error('[DIAG] Failed to initialize SocialLogin:', err)
    })
  } else {
    console.warn('[DIAG] VITE_GOOGLE_CLIENT_ID is missing from environment variables.')
  }

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations().catch(() => [])
    await Promise.all(registrations.map(registration => registration.unregister()))
  }
  if ('caches' in window) {
    const cacheNames = await caches.keys().catch(() => [])
    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
  }
  setTimeout(() => SplashScreen.hide(), 500)
  setupPushListeners().catch(console.error)
  App.addListener('appStateChange', ({ isActive }) => {
    console.log(`[DIAG] appStateChange: isActive=${isActive}`)
    if (isActive) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('[DIAG] appStateChange getSession:', session ? `session found (user=${session.user.id})` : 'no session')
      })
    }
  })
  App.addListener('backButton', () => {
    const handled = onBackPress?.() ?? false
    if (!handled) App.exitApp()
  })
  App.addListener('appUrlOpen', async (data) => {
    const rawUrl = data.url
    console.log('[DIAG] appUrlOpen fired, url=', rawUrl)

    if (rawUrl.includes('code=') || rawUrl.includes('access_token')) {
      const url = new URL(rawUrl)
      console.log('[DIAG] appUrlOpen: found code= or access_token in URL')

      const code = url.searchParams.get('code')
      if (code) {
        console.log('[DIAG] appUrlOpen: calling exchangeCodeForSession with code=', code.slice(0, 20) + '...')
        const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code)
        console.log('[DIAG] exchangeCodeForSession result: error=', error ?? 'none', 'session=', authData?.session ? 'obtained' : 'null')
        // If this was a Google Calendar linkIdentity, save the provider_token immediately
        if (!error && authData?.session?.provider_token && authData.session.user) {
          await supabase.from('user_secrets').upsert({
            user_id: authData.session.user.id,
            name: 'google_calendar_token',
            value: authData.session.provider_token,
          }, { onConflict: 'user_id,name' })
          if (authData.session.provider_refresh_token) {
            await supabase.from('user_secrets').upsert({
              user_id: authData.session.user.id,
              name: 'google_calendar_refresh_token',
              value: authData.session.provider_refresh_token,
            }, { onConflict: 'user_id,name' })
          }
          await supabase.from('user_secrets').upsert({
            user_id: authData.session.user.id,
            name: 'google_calendar_token_expires_at',
            value: String(Date.now() + 50 * 60 * 1000),
          }, { onConflict: 'user_id,name' })
          const updates: Record<string, unknown> = {
            google_calendar_enabled: true,
          }
          const googleAvatar = authData.session.user.user_metadata?.avatar_url as string | undefined
                            ?? authData.session.user.user_metadata?.picture as string | undefined
          if (googleAvatar) {
            const { data: existing } = await supabase
              .from('profiles').select('avatar_url').eq('id', authData.session.user.id).single()
            if (!existing?.avatar_url) updates.avatar_url = googleAvatar
          }
          supabase.from('profiles').update(updates).eq('id', authData.session.user.id).then(undefined, console.error)
        }
        await Browser.close().catch(() => {})
        return
      }

      // Implicit flow fallback — tokens in hash fragment
      const hash = rawUrl.includes('#') ? rawUrl.split('#')[1] : ''
      if (hash) {
        const params = new URLSearchParams(hash)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        if (accessToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken ?? '' })
        }
      }
    }

    // Regreso de Stripe Checkout / Billing Portal: cerrar el navegador in-app
    // y pedir un refresh de entitlements (además del flip por realtime).
    if (rawUrl.includes('checkout=') || rawUrl.includes('portal=')) {
      await Browser.close().catch(() => {})
      const status = rawUrl.includes('checkout=cancel') ? 'cancel' : 'success'
      window.dispatchEvent(new CustomEvent('ot:checkout-return', { detail: { status } }))
      return
    }

    dispatchNavigation(rawUrl)
  })
  App.getLaunchUrl().then(result => {
    const url = result?.url
    if (url && !url.includes('code=') && !url.includes('access_token')) dispatchNavigation(url)
  }).catch(console.error)
}

async function savePushToken(token: string): Promise<void> {
  await Preferences.set({ key: PUSH_TOKEN_KEY, value: token })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { identifier: installationId } = await Device.getId()
  await savePushSubscription(user.id, { platform: Capacitor.getPlatform(), token, installationId })
}

async function setupPushListeners(): Promise<void> {
  if (!isNative || pushListenersReady) return
  pushListenersReady = true
  if (!isNative) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PN: any = PushNotifications
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PN.addListener('registration', async ({ value }: any) => {
    try {
      await savePushToken(value)
      registrationWaiter?.(true)
    } catch (error) {
      console.error(error)
      registrationWaiter?.(false)
    } finally {
      registrationWaiter = null
    }
  })

  PN.addListener('registrationError', (error: unknown) => {
    console.error('Push registration error:', error)
    registrationWaiter?.(false)
    registrationWaiter = null
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PN.addListener('pushNotificationReceived', (notification: any) => {
    console.log('Push received:', notification)
    if (Capacitor.getPlatform() !== 'android') return
    void LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Date.now() % 2_147_483_647),
        title: notification.title ?? 'OurTime',
        body: notification.body ?? '',
        channelId: 'ourtime_messages',
        extra: notification.data ?? {},
      }],
    }).catch(console.error)
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PN.addListener('pushNotificationActionPerformed', (action: any) => {
    console.log('Push action:', action)
    dispatchNavigation(action.notification?.data?.url ?? action.notification?.data?.link)
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  LocalNotifications.addListener('localNotificationActionPerformed', (action: any) => {
    dispatchNavigation(action.notification?.extra?.url ?? action.notification?.extra?.link)
  })
}

export async function syncNativePushToken(): Promise<boolean> {
  if (!isNative) return false
  await setupPushListeners()
  const { value: token } = await Preferences.get({ key: PUSH_TOKEN_KEY })
  if (!token) return false
  await savePushToken(token)
  return true
}

export async function getNativePushTarget(): Promise<{ platform: string; installationId: string } | null> {
  if (!isNative) return null
  const { value: token } = await Preferences.get({ key: PUSH_TOKEN_KEY })
  if (!token) return null
  const { identifier: installationId } = await Device.getId()
  return { platform: Capacitor.getPlatform(), installationId }
}

export async function showNativeNotificationTest(): Promise<void> {
  if (!isNative) return
  const current = await LocalNotifications.checkPermissions()
  const permission = current.display === 'prompt'
    ? await LocalNotifications.requestPermissions()
    : current
  if (permission.display !== 'granted') {
    throw new Error('Android tiene bloqueadas las notificaciones de OurTime. Actívalas en Ajustes > Apps > Our Time > Notificaciones.')
  }
  if (Capacitor.getPlatform() === 'android') {
    await LocalNotifications.createChannel({
      id: 'ourtime_messages',
      name: 'Actividad de OurTime',
      description: 'Mensajes, momentos y actividad de tus historias',
      importance: 5,
      visibility: 1,
      vibration: true,
    })
  }
  await LocalNotifications.schedule({
    notifications: [{
      id: Math.floor(Date.now() % 2_147_483_647),
      title: 'Prueba local de OurTime',
      body: 'Android permite mostrar notificaciones en este dispositivo.',
      channelId: 'ourtime_messages',
    }],
  })
}

export async function enableNativePushNotifications(): Promise<boolean> {
  if (!isNative) return false
  await setupPushListeners()
  const permission = await PushNotifications.requestPermissions()
  if (permission.receive !== 'granted') return false
  const displayPermission = await LocalNotifications.requestPermissions()
  if (displayPermission.display !== 'granted') return false
  if (Capacitor.getPlatform() === 'android') {
    await PushNotifications.createChannel({
      id: 'ourtime_messages',
      name: 'Actividad de OurTime',
      description: 'Mensajes, momentos y actividad de tus historias',
      importance: 4,
      visibility: 1,
      vibration: true,
    })
  }
  const registered = new Promise<boolean>(resolve => {
    registrationWaiter = resolve
    setTimeout(() => {
      if (!registrationWaiter) return
      registrationWaiter = null
      resolve(false)
    }, 15_000)
  })
  await PushNotifications.register()
  return registered
}

let cachedLocation: { lat: number; lng: number } | null = null
let lastLocationTime = 0

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const status = await Geolocation.checkPermissions()
    if (status.location !== 'granted') {
      const request = await Geolocation.requestPermissions()
      return request.location === 'granted'
    }
    return true
  } catch (e) {
    console.warn('Geolocation permission error:', e)
    return false
  }
}

export async function getCachedLocation(): Promise<{ lat: number; lng: number } | null> {
  const now = Date.now()
  if (cachedLocation && (now - lastLocationTime) < 300000) {
    return cachedLocation
  }
  
  try {
    const status = await Geolocation.checkPermissions()
    if (status.location !== 'granted') return cachedLocation

    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 4000 })
    cachedLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    lastLocationTime = now
  } catch (e) {
    console.warn('Failed to get location:', e)
  }
  return cachedLocation
}

export {
  Capacitor,
  Camera,
  CameraResultType,
  CameraSource,
  Geolocation,
  Filesystem,
  Directory,
  Preferences,
  Device,
  SplashScreen,
  StatusBar,
  Style,
  Haptics,
  ImpactStyle,
  Share,
  PushNotifications,
  LocalNotifications,
  App,
  Browser,
  Clipboard,
  Dialog,
  Network,
  Toast,
  ScreenOrientation,
}
