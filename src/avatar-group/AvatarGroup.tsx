import React, { memo } from 'react';

import { AvatarGroupBase } from './AvatarGroupBase';
import type { AvatarGroupProps } from './types';

/**
 * Native `AvatarGroup` — {@link Avatar}s arranged as a horizontal facepile
 * (`stack`), an adjacent `row`, or a 2D magnetic `cluster`, with a trailing
 * `+N` overflow chip. See `layout` in {@link AvatarGroupProps}.
 *
 * Hover behavior is web-only; on native the `hoverCard` / `renderItemAction`
 * props are accepted for API parity but intentionally do nothing (no hover on
 * touch devices). The web fork (`AvatarGroup.web.tsx`) wires up the hover card.
 */
const AvatarGroupComponent: React.FC<AvatarGroupProps> = (props) => {
  return <AvatarGroupBase {...props} />;
};

export const AvatarGroup = memo(AvatarGroupComponent);
AvatarGroup.displayName = 'AvatarGroup';
