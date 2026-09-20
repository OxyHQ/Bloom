import React, { memo, useMemo, useState } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiNotificationLine } from '../icons/remix';
import { NotificationCenter } from '../notification-center';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { borderRadius } from '../styles/tokens';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { NotificationBellProps } from './types';

/**
 * `NotificationBell`: the header's bell with the unread count on the
 * glyph, and the notification center in a popover under it.
 *
 *   trigger   medium secondary icon button (36), RiNotificationLine 20
 *   count     16px red-600 disc at top 2 / left 18, 1.5px ring in the button's
 *             own surface (so it reads punched out), 10/16 bold white; the ring
 *             drops away while the button is hovered or pressed
 *   popover   bottom-end, 8px off, 440 wide, no chrome of its own — the center
 *             (max 430) is the card
 */
const NotificationBellComponent: React.FC<NotificationBellProps> = ({
  notifications = [],
  unreadCount,
  onAction,
  onMarkAllRead,
  defaultTab,
  width = 440,
  accessibilityLabel = 'Notifications',
  testID,
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const { state: hovered, onIn, onOut } = useInteractionState();
  const unread = unreadCount ?? notifications.filter((item) => item.unread).length;
  const palette = useMemo(() => {
    return {
      badge: theme.colors.error,
      badgeForeground: theme.colors.errorForeground,
      // `border-background-primary-default`: the secondary button's own fill.
      ring: theme.colors.card,
    };
  }, [theme]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <View
        style={{ position: 'relative', flexDirection: 'row' }}
        // Hover is read on the wrapper (the `group`).
        {...({ onPointerEnter: onIn, onPointerLeave: onOut })}
      >
        <PopoverTrigger asChild label={accessibilityLabel}>
          <Button size="md" icon={RiNotificationLine} accessibilityLabel={accessibilityLabel} testID={testID} appearance="plain" tone="neutral" />
        </PopoverTrigger>
        {unread > 0 ? (
          <View
            pointerEvents="none"
            testID={testID ? `${testID}-count` : undefined}
            style={{
              position: 'absolute',
              top: 2,
              left: 18,
              width: 16,
              height: 16,
              borderRadius: borderRadius.full,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: hovered ? 0 : 1.5,
              borderColor: palette.ring,
              backgroundColor: palette.badge,
            }}
          >
            <Text style={{ width: 16, textAlign: 'center', fontSize: 10, lineHeight: 16, fontWeight: '700', color: palette.badgeForeground }}>
              {unread}
            </Text>
          </View>
        ) : null}
      </View>
      <PopoverContent
        label={accessibilityLabel}
        side="bottom"
        align="end"
        sideOffset={8}
        style={{
          width,
          maxWidth: '100%',
          padding: 0,
          borderWidth: 0,
          borderRadius: 24,
          backgroundColor: 'transparent',
          boxShadow: 'none',
          overflow: 'visible',
        }}
      >
        <NotificationCenter
          notifications={notifications}
          defaultTab={defaultTab}
          onAction={onAction}
          onMarkAllRead={onMarkAllRead}
        />
      </PopoverContent>
    </Popover>
  );
};

export const NotificationBell = memo(NotificationBellComponent);
NotificationBell.displayName = 'NotificationBell';
