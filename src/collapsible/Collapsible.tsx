import React, { memo } from 'react';
import { CollapsibleFrame } from './CollapsibleFrame';
import {
  DEFAULT_COLLAPSIBLE_TRANSITION,
  useCollapsibleMotion,
} from './use-collapsible-motion';
import type { CollapsibleProps } from './types';

export const Collapsible = memo(function Collapsible({
  transition = DEFAULT_COLLAPSIBLE_TRANSITION,
  ...props
}: CollapsibleProps) {
  const motion = useCollapsibleMotion(props.open, transition);
  return <CollapsibleFrame {...props} {...motion} />;
});
