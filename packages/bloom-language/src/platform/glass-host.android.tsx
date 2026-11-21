/**
 * Android and OxyOS: the lens draws the glass, as the upstream app's glass button: its menu
 * trigger with its lens and no rows, the view's own press untouched (`openOnPress={false}`). It
 * frosts, refracts and tints what is behind the view, and springs under the finger on the UI
 * thread.
 *
 * The lens belongs to the fixed layer (a header, a bar, a floating button): the window draws it,
 * so it does not follow a scroll view's overscroll stretch, and each one is drawn every frame
 * (Bloom measured 60 at once at 21% janky frames on a Pixel 8a while scrolling).
 */
import { useTheme } from '@oxy.so/bloom/theme';

import { glassTriggerConfig } from './lens-glass';
import { getLens } from './lens';
import type { GlassHostProps, PlatformGlass } from './glass-host.types';

function LensGlass({ glass, radius, fallbackTint, fill, style, children }: GlassHostProps) {
  const lens = getLens();
  const theme = useTheme();
  if (!lens) return null;
  const { Menu } = lens;
  return (
    <Menu colorScheme={theme.isDark ? 'dark' : 'light'}>
      <Menu.Trigger
        lens
        openOnPress={false}
        cornerRadius={radius}
        config={glassTriggerConfig(glass, fallbackTint, theme.colors, fill)}
        style={style}
      >
        {children}
      </Menu.Trigger>
    </Menu>
  );
}
LensGlass.displayName = 'BloomLensGlass';

export function getPlatformGlass(): PlatformGlass {
  return getLens() ? LensGlass : null;
}
