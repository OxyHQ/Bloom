/**
 * Android and OxyOS: the lens draws the glass, as one lens base (`@oxy.so/bloom-lens`, the upstream
 * app's glass trigger): a control, or a group of them, is one base, and a menu opened from inside it
 * grows out of the whole of it. It frosts, refracts and tints what is behind the view, and springs
 * under the finger on the UI thread, unless the glass says it is not interactive
 * (`regular.interactive(false)`: the engine's jelly is off).
 *
 * The lens belongs to the fixed layer (a header, a bar, a floating button): the window draws it,
 * so it does not follow a scroll view's overscroll stretch, and each one is drawn every frame
 * (Bloom measured 60 at once at 21% janky frames on a Pixel 8a while scrolling).
 */
import { View } from 'react-native';
import { useTheme } from '@oxy.so/bloom/theme';

import { glassTriggerConfig } from './lens-glass';
import { withSurface } from '../paint';
import { getLens } from './lens';
import { LensGroupGlass, useInLensGroup } from './lens-group';
import type { GlassHostProps, PlatformGlass } from './glass-host.types';

function LensGlass({
  glass,
  radius,
  fallbackTint,
  fill,
  surface,
  member,
  style,
  children,
}: GlassHostProps) {
  const lens = getLens();
  const theme = useTheme();
  const inBase = lens?.useInLensBase() ?? false;
  const inGroup = useInLensGroup();
  if (!lens) return null;
  // In a glass group the group draws this glass as one of its shapes, where this view is.
  if (inGroup) {
    return (
      <LensGroupGlass member={member} radius={radius} style={style}>
        {children}
      </LensGroupGlass>
    );
  }
  // Inside any other base (a group of controls) the base draws the one lens: no glass on glass.
  if (inBase) return <View style={style}>{children}</View>;
  const { LensBase } = lens;
  const config = glassTriggerConfig(glass, fallbackTint, withSurface(theme.colors, surface), fill);
  return (
    <LensBase
      colorScheme={theme.isDark ? 'dark' : 'light'}
      cornerRadius={radius}
      config={glass.interactiveSaid === false ? { ...config, jelly: 0 } : config}
      style={style}
    >
      {children}
    </LensBase>
  );
}
LensGlass.displayName = 'BloomLensGlass';

export function getPlatformGlass(): PlatformGlass {
  return getLens() ? LensGlass : null;
}
