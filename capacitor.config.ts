import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gestocom.ci',
  appName: 'GESTOCOM CI',
  webDir: 'dist',
  backgroundColor: '#1a1a2e',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#1a1a2e',
    backgroundColorDark: '#0f0f23',
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    backgroundColor: '#1a1a2e',
    preferredContentMode: 'mobile',
    backgroundColorDark: '#0f0f23',
  },
  plugins: {
    SQLite: {
      // jeep-sqlite web fallback is auto-detected
    },
    SplashScreen: {
      launchShowDuration: 1500,
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
