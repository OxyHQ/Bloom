/**
 * The load boundary for Bloom's own native image view, `BloomImageView`: the first
 * renderer {@link BloomImage} picks on a device. This is the native file; the web and
 * default one, `bloom-image-view.ts`, loads nothing, so a web bundle carries none of this.
 *
 * WHAT it is: the standard library's `extern native "BloomImage"` (the language compiler's
 * `stdlib/Bloom/Image.bloom`), a Fabric component in Kotlin over React Native's own image
 * pipeline, which `bloom build android` links into every Bloom app (ADR 0002, section 7).
 * Its component spec, `BloomImageViewNativeComponent.ts`, and its module spec,
 * `NativeBloomImage.ts`, are generated from that interface (`BLOOM_BLESS=1 cargo test -p
 * bloom_lang --test stdlib image_specs`), never edited.
 *
 * WHY a registry check before the `require`: the component exists only in a build that
 * linked it. `UIManager.hasViewManagerConfig` asks the native component registry, so an
 * Expo build (expo-image), the web and Jest never load the spec at all. WHY a `require`:
 * the spec calls `codegenNativeComponent` when it is evaluated, which only a build that has
 * the component may do.
 */
import type { ComponentType } from 'react';
import { Platform, UIManager } from 'react-native';
import type { BloomImageModuleLike, BloomImageViewProps } from './bloom-image-view-types';

export type { BloomImageModuleLike, BloomImageViewProps } from './bloom-image-view-types';

declare const require: (moduleName: string) => unknown;

/** `undefined` until the first check on a device, then the component or `null`. */
let view: ComponentType<BloomImageViewProps> | null | undefined;
let cacheModule: BloomImageModuleLike | null | undefined;

function linked(): boolean {
  try {
    return UIManager.hasViewManagerConfig?.('BloomImageView') === true;
  } catch {
    return false;
  }
}

/** Bloom's native image view, or `null` on web and in a build that does not link it. */
export function loadBloomImageView(): ComponentType<BloomImageViewProps> | null {
  // Read per call rather than cached on web: a test flips `Platform.OS`.
  if (Platform.OS === 'web' || typeof require === 'undefined') return null;
  if (view !== undefined) return view;
  view = null;
  if (!linked()) return view;
  try {
    const loaded = require('./BloomImageViewNativeComponent') as {
      default?: ComponentType<BloomImageViewProps>;
    };
    view = loaded.default ?? null;
  } catch {
    view = null;
  }
  return view;
}

/** The view's cache module, wherever the view is linked. */
export function loadBloomImageModule(): BloomImageModuleLike | null {
  if (cacheModule !== undefined) return cacheModule;
  if (loadBloomImageView() === null) return null;
  try {
    const loaded = require('./NativeBloomImage') as { default?: BloomImageModuleLike | null };
    cacheModule = loaded.default ?? null;
  } catch {
    cacheModule = null;
  }
  return cacheModule;
}
