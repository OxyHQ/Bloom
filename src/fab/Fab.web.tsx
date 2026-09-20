import { memo } from 'react';
import { Button } from '../button/index.web';
import { useBloomAppearance } from '../appearance/context';
import type { FabProps } from './types';

const DIAMETERS = { xs: 40, sm: 48, md: 56, lg: 64 } as const;

/** Static action primitive; Screen and BottomBar own placement. */
export const Fab = memo(function Fab({ label, icon, size, tone, appearance = 'solid', style, ...props }: FabProps) {
  const resolved = useBloomAppearance({ size, tone }, { size: 'md', tone: 'action' });
  const diameter = DIAMETERS[resolved.size];
  return <Button {...props} {...resolved} appearance={appearance} icon={label ? undefined : icon} leadingIcon={label ? icon : undefined} accessibilityLabel={props.accessibilityLabel ?? label} style={[{ height: diameter, minHeight: diameter, ...(label ? { paddingLeft: 20, paddingRight: 20 } : { width: diameter }) }, style]}>
    {label}
  </Button>;
});
Fab.displayName = 'Fab';
