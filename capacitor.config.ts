import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ourtime.app',
  appName: 'Our Time',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#fdf8f5',
      androidSplashResourceName: 'splash',
      androidScaleType: 'FIT_CENTER',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      // El webview corre bajo la barra y el header accent la pinta;
      // los iconos se ajustan en runtime según la tinta del acento (AppShell).
      overlaysWebView: true,
      style: 'LIGHT',
    },
    SocialLogin: {
      providers: {
        google: true,
      },
    },
  },
};

export default config;
