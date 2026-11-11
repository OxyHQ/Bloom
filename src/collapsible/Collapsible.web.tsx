import React, { memo } from 'react';
import { CollapsibleFrame } from './CollapsibleFrame.web';
import { DEFAULT_COLLAPSIBLE_TRANSITION, useAppearingOpen } from './use-collapsible-motion';
import type { CollapsibleProps } from './types';

export const Collapsible = memo(function Collapsible({
  transition = DEFAULT_COLLAPSIBLE_TRANSITION,
  appear = false,
  ...props
}: CollapsibleProps) {
  const open = useAppearingOpen(props.open, appear);
  return <CollapsibleFrame {...props} open={open} appear={appear} transition={transition} />;
});
