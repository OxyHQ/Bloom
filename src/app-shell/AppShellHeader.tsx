import React, { memo } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { Button } from '../button';
import { RiCloseLine, RiMenuLine } from '../icons/remix';
import { BREAKPOINTS } from '../styles/breakpoints';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { AppShellHeaderProps } from './types';

/**
 * The starter shell's header: a breadcrumb trail
 * over the title row.
 *
 *   header     column, gap 8
 *   title row  wraps, items bottom-aligned, space-between, gap 8
 *   left       gap 6: a medium icon button (hamburger, below `lg` only) and the
 *              title — title-2-medium, px4, no wrap, text-primary
 *   actions    wrap, right-aligned, gap 10
 */
const AppShellHeaderComponent: React.FC<AppShellHeaderProps> = ({
  title,
  breadcrumb,
  actions,
  onMenuPress,
  menuOpen = false,
  showMenu: showMenuProp,
  style,
  testID,
}) => {
  const theme = useTheme();
  // Standalone, the header has no shell to ask, so it falls back to the window
  // being narrower than `lg`. Inside an `AppShell` it is TOLD, from the shell's
  // own measured width and `navFrom` — the header must not second-guess a
  // decision the shell already made against a different number.
  const { width } = useWindowDimensions();
  const showMenu = onMenuPress != null && (showMenuProp ?? width < BREAKPOINTS.lg);

  return (
    <View role="banner" testID={testID} style={[{ width: '100%', gap: 8 }, style]}>
      {breadcrumb}
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <View style={{ minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {showMenu ? (
            <Button
              variant="secondary"
              size="medium"
              iconOnly
              leadingIcon={menuOpen ? RiCloseLine : RiMenuLine}
              accessibilityLabel="Open navigation"
              aria-expanded={menuOpen}
              onPress={onMenuPress}
              testID={testID ? `${testID}-menu` : undefined}
            />
          ) : null}
          {title != null ? (
            <Text
              role="heading"
              aria-level={1}
              variant="title-2-medium"
              numberOfLines={1}
              style={{ paddingLeft: 4, paddingRight: 4, color: theme.colors.text }}
            >
              {title}
            </Text>
          ) : null}
        </View>
        {actions ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
            }}
          >
            {actions}
          </View>
        ) : null}
      </View>
    </View>
  );
};

export const AppShellHeader = memo(AppShellHeaderComponent);
AppShellHeader.displayName = 'AppShellHeader';
