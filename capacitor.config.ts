import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gestocom.ci',
  appName: 'GESTOCOM CI',
  webDir: 'dist',
  backgroundColor: '#1e40af',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#1e40af',
    backgroundColorDark: '#0f172a',
    captureInput: true,
    webContentsDebuggingEnabled: false,
    overrideUserAgent: undefined,
    appendUserAgent: undefined,
  },
  ios: {
    backgroundColor: '#1e40af',
    preferredContentMode: 'mobile',
    backgroundColorDark: '#0f172a',
  },
  plugins: {
    SQLite: {
      // jeep-sqlite web fallback is auto-detected
    },
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#1e40af',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      launchAutoHide: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1e40af',
      overlaysWebView: true,
    },
    Keyboard: {
      resize: 'body',
      scrollPadding: true,
      style: 'dark',
      resizeOnFullScreen: true,
    },
    App: {
      // Handle back button on Android
    },
  },
};

export default config;
