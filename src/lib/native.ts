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
  App.addListener('backButton', () => {
    const handled = onBackPress?.() ?? false
    if (!handled) App.exitApp()
  })
  App.addListener('appUrlOpen', async (data) => {
    if (data.url.startsWith(nativeRedirectUrl)) {
      const url = new URL(data.url)
      const code = url.searchParams.get('code')
      if (code) await supabase.auth.exchangeCodeForSession(code)
    }
  })
}

export async function registerPushNotifications(): Promise<void> {
  if (!isNative) return
  const perm = await PushNotifications.requestPermissions()
  if (perm.receive === 'granted') {
    await PushNotifications.register()
  }
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
