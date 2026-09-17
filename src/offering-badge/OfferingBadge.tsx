import React, { memo } from 'react';

import { Badge } from '../badge';
import { OFFERING_BADGE_RUNG, OFFERING_ICONS, OFFERING_LABELS, OFFERING_TONES } from './shared';
import type { OfferingBadgeProps } from './types';

/**
 * A small pill naming how a home is offered: for rent, for sale, as a vacation
 * rental, or for a swap.
 *
 * It is a PRESET over `Badge`'s label rungs, not a badge of its own: the
 * geometry, the paint, the icon slot and the over-a-photo fill are all
 * `Badge`'s (`label-small` = 20 tall, `label-medium` = 24). What lives here is
 * the housing vocabulary — which word, which glyph and which FIXED tone each
 * offering takes (`shared.ts`).
 *
 * It is text, not a control: no role, and the icon is hidden from assistive
 * technology, so it reads as its label.
 */
function OfferingBadgeComponent({
  offering,
  label,
  icon = true,
  size = 'medium',
  variant = 'tinted',
  style,
  testID,
}: OfferingBadgeProps) {
  const Icon = icon === true ? OFFERING_ICONS[offering] : icon === false ? undefined : icon;

  return (
    <Badge
      content={label ?? OFFERING_LABELS[offering]}
      icon={Icon}
      size={OFFERING_BADGE_RUNG[size]}
      color={OFFERING_TONES[offering]}
      variant={variant === 'onMedia' ? 'onMedia' : 'subtle'}
      style={style}
      testID={testID}
    />
  );
}

export const OfferingBadge = memo(OfferingBadgeComponent);
OfferingBadge.displayName = 'OfferingBadge';
