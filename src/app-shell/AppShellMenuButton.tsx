import React, { memo } from 'react';
import type { ViewStyle } from 'react-native';

import { Button } from '../button';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiMenuLine } from '../icons/remix/RiMenuLine';
import { useMessages } from '../locale/messages';
import { useAppShell, useAppShellDrawerDisplay } from './context';
import { APP_SHELL_MESSAGES } from './messages';
import type { AppShellMenuButtonProps } from './types';

/**
 * The hamburger that opens `AppShell`'s drawer, for a page that draws its own
 * header. Hides while the sidebar sits in flow; compositor CSS preserves its
 * markup and correct visibility from the server-rendered first frame. A medium secondary icon button — the same one
 * `AppShellHeader` shows — swapping to a close glyph while the drawer is open.
 */
const AppShellMenuButtonComponent: React.FC<AppShellMenuButtonProps> = ({
  accessibilityLabel: accessibilityLabelProp,
  style,
  testID,
}) => {
  const { messages } = useMessages(APP_SHELL_MESSAGES);
  const accessibilityLabel = accessibilityLabelProp ?? messages.openNavigation;
  const shell = useAppShell();
  const drawerDisplay = useAppShellDrawerDisplay();
  if (!shell.drawerAvailable && !drawerDisplay) return null;
  return (
    <Button
      size="md"
      iconOnly
      leadingIcon={shell.drawerOpen ? RiCloseLine : RiMenuLine}
      accessibilityLabel={accessibilityLabel}
      aria-expanded={shell.drawerOpen}
      onPress={shell.toggleDrawer}
      style={[
        style,
        drawerDisplay ? { display: drawerDisplay as ViewStyle['display'] } : undefined,
      ]}
      testID={testID}
      tone="neutral"
      appearance="outline"
    />
  );
};

export const AppShellMenuButton = memo(AppShellMenuButtonComponent);
AppShellMenuButton.displayName = 'AppShellMenuButton';
