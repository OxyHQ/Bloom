import { memo } from 'react';
import { Button } from '../button/index.web';
import { LensMaterialProvider } from '../floating/lens/lens-material';
import { useFabProps } from './use-fab-props';
import type { FabProps } from './types';

export const Fab = memo(function Fab(props: FabProps) {
  // A FAB floats: its region is the floating layer, so the window draws its lens.
  return (
    <LensMaterialProvider value="lens">
      <Button {...useFabProps(props)} />
    </LensMaterialProvider>
  );
});
Fab.displayName = 'Fab';
