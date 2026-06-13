import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.masslaundry.pos',
  appName: 'Mass Laundry',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
