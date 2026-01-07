import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.narcisomanjate.superagentemng',
  appName: 'Super Agente MNG',
  webDir: 'dist',
  server: {
    url: 'https://narcisomanjate-jpg.github.io/super-agente-mng-nice',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2200,
      launchAutoHide: true,
      backgroundColor: '#667eea',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
      showSpinner: true,
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen'
    }
  }
};

export default config;