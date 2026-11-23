/**
 * Android and OxyOS: a glass group is one lens base (`@oxy.so/bloom-lens`) drawn as the glasses
 * inside it, each its own shape where its view is (`LensBase members`, see `lens-group.tsx`):
 * glasses closer than `blend` flow into one another, the glasses of one `.glassUnion()` are one
 * shape, and a `.glassID()` that another glass takes over takes its shape there. Nothing inside
 * draws a lens of its own (`useInLensBase`), and a menu opened from anything in it grows out of
 * the whole group, its glasses with it.
 */
import { useTheme } from '@oxy.so/bloom/theme';

import { regular } from '../glass';
import { getLens } from './lens';
import { LensGroupProvider, useLensGroup } from './lens-group';
import { glassTriggerConfig } from './lens-glass';
import { useRgbPalette } from '../paint';
import type {
  GlassGroupHostProps,
  PlatformGlassGroup,
  SystemGlassGroup,
} from './glass-group-host.types';

function LensGlassGroup({ blend, style, children }: GlassGroupHostProps) {
  const lens = getLens();
  const theme = useTheme();
  const palette = useRgbPalette();
  const [members, registry] = useLensGroup();
  if (!lens) return null;
  const { LensBase } = lens;
  return (
    <LensBase
      colorScheme={theme.isDark ? 'dark' : 'light'}
      config={glassTriggerConfig(regular, undefined, palette)}
      members={members}
      blend={blend}
      style={style}
    >
      <LensGroupProvider value={registry}>{children}</LensGroupProvider>
    </LensBase>
  );
}
LensGlassGroup.displayName = 'BloomLensGlassGroup';

export function getPlatformGlassGroup(): PlatformGlassGroup {
  return getLens() ? LensGlassGroup : null;
}

/** Only iOS draws a group as the system's own glass. */
export const systemGlassGroup: SystemGlassGroup = null;
