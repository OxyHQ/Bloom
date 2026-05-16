/**
 * Whether the running React Native target supports `Animated`'s native
 * driver. On real native (`Platform.OS === 'ios' | 'android'`) it does,
 * and animations can run on the UI thread off the JS thread. On
 * `react-native-web` there is no native driver — opting in logs a
 * runtime warning every time, with no performance benefit.
 *
 * Use this constant instead of hardcoding `useNativeDriver: true` so
 * Bloom components animate smoothly on every platform and stay silent in
 * web consoles.
 *
 * Resolved once at module load.
 */
import { Platform } from 'react-native';

export const SUPPORTS_NATIVE_DRIVER = Platform.OS !== 'web';
