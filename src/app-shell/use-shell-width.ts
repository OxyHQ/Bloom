import type { LayoutChangeEvent } from 'react-native';
import { useWindowDimensions } from 'react-native';

import { useContainerWidth } from '../hooks/use-container-width';

/**
 * The width `AppShell` lays itself out from: its OWN measured box, falling back
 * to the window until the first layout arrives.
 *
 * The shell is usually the page, so the two agree — but not always. A shell
 * mounted in a preview pane, in one half of a split view, or inside a desktop
 * app's own chrome is narrower than the window, and a window-width decision
 * puts three columns into a 480px box. Measuring the shell is the only reading
 * that is right in both cases.
 *
 * The fallback is the window rather than `0` on purpose: the first paint would
 * otherwise be a phone layout for every shell, and the correction would be a
 * visible reflow on every page load. A shell that spans the page therefore
 * renders correctly on frame one, and only an embedded one pays a single
 * layout pass.
 *
 * (`useContainerWidth` lives in `listing-details/` today. If it moves to
 * `src/hooks/use-container-width.ts` this import is the only line to change.)
 */
export function useShellWidth(): { width: number; onLayout: (event: LayoutChangeEvent) => void } {
  const { width: windowWidth } = useWindowDimensions();
  const { width: measured, onLayout } = useContainerWidth();
  return { width: measured ?? windowWidth, onLayout };
}
