import { memo } from 'react';
import { Button } from '../button/index.web';
import { useFabProps } from './use-fab-props';
import type { FabProps } from './types';

export const Fab = memo(function Fab(props: FabProps) {
  return <Button {...useFabProps(props)} />;
});
Fab.displayName = 'Fab';
