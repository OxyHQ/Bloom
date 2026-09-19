import React, { memo } from 'react';

import { Button } from '../button';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiMenuLine } from '../icons/remix/RiMenuLine';
import { useAppShell } from './context';
import type { AppShellMenuButtonProps } from './types';

/**
 * The hamburger that opens `AppShell`'s drawer, for a page that draws its own
 * header. Renders nothing while the sidebar sits in flow, so it can stay in the
 * markup at every width. A medium secondary icon button — the same one
 * `AppShellHeader` shows — swapping to a close glyph while the drawer is open.
 */
const AppShellMenuButtonComponent: React.FC<AppShellMenuButtonProps> = ({
  accessibilityLabel = 'Open navigation',
  style,
  testID,
}) => {
  const shell = useAppShell();
  if (!shell.drawerAvailable) return null;
  return (
    <Button
      variant="secondary"
      size="medium"
      iconOnly
      leadingIcon={shell.drawerOpen ? RiCloseLine : RiMenuLine}
      accessibilityLabel={accessibilityLabel}
      aria-expanded={shell.drawerOpen}
      onPress={shell.toggleDrawer}
      style={style}
      testID={testID}
    />
  );
};

export const AppShellMenuButton = memo(AppShellMenuButtonComponent);
AppShellMenuButton.displayName = 'AppShellMenuButton';
