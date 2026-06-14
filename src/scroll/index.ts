/**
 * Native variant of the scroll-restoration primitive — a deliberate no-op.
 *
 * React Navigation's native-stack keeps every screen mounted while it is in the
 * stack, so a list's scroll position survives a push/pop for free. There is
 * nothing to save or restore. We still ship the full API surface (provider +
 * hook) so consumers write one set of call sites that compile and run on every
 * platform; on native the provider just renders its children and the hook does
 * nothing.
 *
 * Web bundlers select `./index.web` via the `"browser"` export condition in
 * `package.json`; native bundlers fall through to this file.
 */
import type { ReactElement } from 'react';
import type {
  ScrollRestorationProviderProps,
  ScrollRestorationTarget,
  UseScrollRestorationOptions,
} from './types';

export type {
  ScrollableHandle,
  ScrollRestorationProviderProps,
  ScrollRestorationTarget,
  UseScrollRestorationOptions,
} from './types';

/**
 * No-op provider. Renders children unchanged — native scroll persistence is
 * handled by the navigator, so no per-route state is kept.
 */
export function ScrollRestorationProvider({
  children,
}: ScrollRestorationProviderProps): ReactElement {
  return children as ReactElement;
}

/**
 * No-op hook. Accepts the same arguments as the web implementation so call
 * sites are identical across platforms.
 */
export function useScrollRestoration(
  _target: ScrollRestorationTarget,
  _options?: UseScrollRestorationOptions,
): void {
  // Intentionally empty: native-stack already preserves scroll position.
}
