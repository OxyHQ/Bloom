/**
 * `@oxy.so/bloom-lens`: the lens engine (`android/`, the upstream app's Kotlin with
 * `patches/bloom.patch`), the upstream app's menu component (`src/menu`, verbatim with
 * `patches/menu/bloom.patch`), and the lens base Bloom's controls and menus share (`base.tsx`).
 * Android 13+ only; Bloom resolves this module lazily and keeps its own material where it is absent.
 */
export { Menu } from './menu';
export type { IMenuHandle, TMenuConfig, TMenuRect, TMenuTriggerConfig } from './menu';
export type { LensRow } from './rows';
export {
  LensBase,
  LensBaseContext,
  useInLensBase,
  useLensBaseMenu,
  type LensBaseProps,
  type LensMenu,
  type LensMenuHandle,
} from './base';
