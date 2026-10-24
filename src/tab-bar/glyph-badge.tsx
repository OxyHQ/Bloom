import type { ReactNode } from 'react';
import { Badge } from '../badge';

/**
 * An item's count over its glyph's corner. Both crossfade layers draw it, in
 * the same place, so it stays put while the highlight moves.
 */
export function withGlyphBadge(glyph: ReactNode, badge: number | undefined): ReactNode {
  return badge ? (
    <Badge content={badge} max={99} size="sm">
      {glyph}
    </Badge>
  ) : (
    glyph
  );
}
