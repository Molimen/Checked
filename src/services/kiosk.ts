import { NativeModules, Platform } from 'react-native';

const { KioskModule } = NativeModules;

export const Kiosk = {
  enable: (): Promise<boolean> =>
    Platform.OS === 'android' ? KioskModule.enable() : Promise.resolve(false),
  disable: (): Promise<boolean> =>
    Platform.OS === 'android' ? KioskModule.disable() : Promise.resolve(false),
  isEnabled: (): Promise<boolean> =>
    Platform.OS === 'android' ? KioskModule.isEnabled() : Promise.resolve(false),
};