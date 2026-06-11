import { Capacitor } from '@capacitor/core'
import { supabase, nativeRedirectUrl } from './supabase'
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

export const isNative = Capacitor.isNativePlatform()
export const isWeb = !isNative

let onBackPress: (() => boolean) | null = null

export function setBackHandler(handler: () => boolean) {
  onBackPress = handler
}

export async function setupNativeApp() {
  if (!isNative) return
  setTimeout(() => SplashScreen.hide(), 500)
  registerPushNotifications().catch(console.error)
  App.addListener('backButton', () => {
    const handled = onBackPress?.() ?? false
    if (!handled) App.exitApp()
  })
  App.addListener('appUrlOpen', async (data) => {
    if (!data.url.startsWith(nativeRedirectUrl)) return

    const url = new URL(data.url)
    const errorDesc = url.searchParams.get('error_description') || url.searchParams.get('error')
    if (errorDesc) { console.error('OAuth error:', errorDesc); return }

    // PKCE flow — exchange code for session
    const code = url.searchParams.get('code')
    if (code) {
      const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code)
      // If this was a Google Calendar linkIdentity, save the provider_token immediately
      if (!error && authData?.session?.provider_token && authData.session.user) {
        await supabase.from('user_secrets').upsert({
          user_id: authData.session.user.id,
          name: 'google_calendar_token',
          value: authData.session.provider_token,
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
      return
    }

    // Implicit flow fallback — tokens in hash fragment
    const hash = data.url.includes('#') ? data.url.split('#')[1] : ''
    if (hash) {
      const params = new URLSearchParams(hash)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      if (accessToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken ?? '' })
      }
    }
  })
}

export async function registerPushNotifications(): Promise<void> {
  if (!isNative) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PN: any = PushNotifications
  const perm = await PN.requestPermissions()
  if (perm.receive !== 'granted') return

  await PN.register()

  PN.addListener('registration', async ({ value }: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const sub = { platform: Capacitor.getPlatform(), token: value }
    supabase.from('profiles').update({ push_subscription: sub as never })
      .eq('id', user.id).then(undefined, console.error)
  })

  PN.addListener('pushNotificationReceived', (notification: any) => {
    console.log('Push received:', notification)
  })

  PN.addListener('pushNotificationActionPerformed', (action: any) => {
    console.log('Push action:', action)
  })
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
