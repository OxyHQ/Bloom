import { lazyRequire } from '../utils/lazy-require';

type SvgModuleType = typeof import('react-native-svg');

/**
 * Lazily loads `react-native-svg`, returning `null` when it is not installed
 * (e.g. a web bundle that does not ship the optional peer). Shared by the
 * squircle avatar image clip in `Avatar.tsx` and the `AvatarRing` so there is a
 * single loader rather than one per call site.
 */
export const getSvgModule = lazyRequire<SvgModuleType>('react-native-svg');
