/**
 * Android and OxyOS: the lens engine draws the glass (the same native view as
 * a lens menu's trigger, with no rows). It frosts, refracts and tints what is
 * behind the view, and springs under the finger on the UI thread.
 *
 * The lens belongs to the fixed layer (a header, a bar, a floating button):
 * the window draws it, so it does not follow a scroll view's overscroll
 * stretch, and each one is drawn every frame (Bloom measured 60 at once at 21%
 * janky frames on a Pixel 8a while scrolling).
 */
import { useTheme } from '@oxy.so/bloom/theme';

import { glassTriggerConfig } from './lens-glass';
import { getNativeLens, type LensNativeItem } from './lens';
import type { GlassHostProps, PlatformGlass } from './glass-host.types';

const NO_ITEMS: LensNativeItem[] = [];

function LensGlass({ glass, radius, fallbackTint, fill, style, children }: GlassHostProps) {
  const NativeLens = getNativeLens();
  const theme = useTheme();
  if (!NativeLens) return null;
  return (
    <NativeLens
      items={NO_ITEMS}
      lens
      colorScheme={theme.isDark ? 'dark' : 'light'}
      cornerRadius={radius}
      triggerConfig={glassTriggerConfig(glass, fallbackTint, theme.colors, fill)}
      style={style}
    >
      {children}
    </NativeLens>
  );
}
LensGlass.displayName = 'BloomLensGlass';

export function getPlatformGlass(): PlatformGlass {
  return getNativeLens() ? LensGlass : null;
}
