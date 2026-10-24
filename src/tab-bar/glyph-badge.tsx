import type { ReactNode } from 'react';
import { Badge } from '../badge';

/**
 * An item's count over its glyph's corner. Both crossfade layers draw it, in
 * the same place, so it stays put while the highlight moves. Flat, not on the
 * surface material: the layers crossfade with `opacity`, which would make them
 * the material's backdrop root and its blur would vanish mid-fade.
 */
export function withGlyphBadge(glyph: ReactNode, badge: number | undefined): ReactNode {
  return badge ? (
    <Badge content={badge} max={99} size="sm" material="flat">
      {glyph}
    </Badge>
  ) : (
    glyph
  );
}
