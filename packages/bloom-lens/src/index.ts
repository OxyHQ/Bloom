/**
 * `@oxy.so/bloom-lens`: the lens engine (`android/`, the upstream app's Kotlin with
 * `patches/bloom.patch`) and the upstream app's menu component (`src/menu`, verbatim with
 * `patches/menu/bloom.patch`), which Bloom's menus and lens controls adapt to. Android 13+ only;
 * Bloom resolves this module lazily and keeps its own material where it is absent.
 */
export { Menu } from './menu';
export type {
  IMenuHandle,
  TMenuConfig,
  TMenuRect,
  TMenuSelectEvent,
  TMenuTriggerConfig,
} from './menu';
export { lensRows, type LensRow } from './rows';
