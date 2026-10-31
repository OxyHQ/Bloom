import { Platform } from 'react-native';
export { NativeAvatar } from './NativeAvatar';
export { isRuntimeCompatible } from './runtime';
export { AVATAR_RUNTIME_REVISION } from '../lib/runtime-revision.cjs';
export const isAvailable = Platform.OS === 'android';

export const ABI_VERSION = 1;
