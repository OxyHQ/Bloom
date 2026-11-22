/**
 * Android and OxyOS: a glass group is one lens base (`@oxy.so/bloom-lens`), as
 * a button group, a header's action group and the bottom bar are. The base
 * draws one lens over the whole group, nothing inside it draws a lens of its
 * own (`useInLensBase`), and a menu opened from anything in it grows out of
 * the whole group. The engine blends no separate shapes at rest, so `blend`
 * is not read here.
 */
import { useTheme } from '@oxy.so/bloom/theme';

import { regular } from '../glass';
import { getLens } from './lens';
import { glassTriggerConfig } from './lens-glass';
import type {
  GlassGroupHostProps,
  PlatformGlassGroup,
  SystemGlassGroup,
} from './glass-group-host.types';

function LensGlassGroup({ style, children }: GlassGroupHostProps) {
  const lens = getLens();
  const theme = useTheme();
  if (!lens) return null;
  const { LensBase } = lens;
  return (
    <LensBase
      colorScheme={theme.isDark ? 'dark' : 'light'}
      config={glassTriggerConfig(regular, undefined, theme.colors)}
      style={style}
    >
      {children}
    </LensBase>
  );
}
LensGlassGroup.displayName = 'BloomLensGlassGroup';

export function getPlatformGlassGroup(): PlatformGlassGroup {
  return getLens() ? LensGlassGroup : null;
}

/** Only iOS draws a group as the system's own glass. */
export const systemGlassGroup: SystemGlassGroup = null;
