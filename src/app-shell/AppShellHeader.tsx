import React, { memo } from 'react';
import { useWindowWidthClass } from '../hooks/use-width-class';

import { Button } from '../button';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiMenuLine } from '../icons/remix/RiMenuLine';
import { BREAKPOINTS } from '../styles/breakpoints';
import { PageHeader } from '../page-header';
import { useMessages } from '../locale/messages';
import { APP_SHELL_MESSAGES } from './messages';
import type { AppShellHeaderProps } from './types';

/** Shell navigation data mapped to the shared PageHeader renderer. */
const AppShellHeaderComponent: React.FC<AppShellHeaderProps> = ({
  title,
  breadcrumb,
  actions,
  onMenuPress,
  menuOpen = false,
  showMenu: showMenuProp,
  menuLabel: menuLabelProp,
  style,
  testID,
}) => {
  const { messages } = useMessages(APP_SHELL_MESSAGES);
  const menuLabel = menuLabelProp ?? messages.openNavigation;
  // Standalone, the header has no shell to ask, so it falls back to the window
  // being narrower than `lg`. Inside an `AppShell` it is TOLD, from the shell's
  // own measured width and `navFrom` — the header must not second-guess a
  // decision the shell already made against a different number.
  const width = useWindowWidthClass(MENU_WIDTHS);
  const showMenu = onMenuPress != null && (showMenuProp ?? width < BREAKPOINTS.lg);

  return (
    <PageHeader
      title={title}
      titleVariant="title-2-medium"
      overline={breadcrumb}
      onBack={null}
      leading={
        showMenu ? (
          <Button
            icon={menuOpen ? RiCloseLine : RiMenuLine}
            accessibilityLabel={menuLabel}
            aria-expanded={menuOpen}
            onPress={onMenuPress}
            testID={testID ? `${testID}-menu` : undefined}
            appearance="outline"
            tone="neutral"
          />
        ) : undefined
      }
      actions={actions}
      style={style}
      testID={testID}
    />
  );
};

/** The window's width decides the menu button at `lg` only. */
const MENU_WIDTHS = [BREAKPOINTS.lg];

export const AppShellHeader = memo(AppShellHeaderComponent);
AppShellHeader.displayName = 'AppShellHeader';
