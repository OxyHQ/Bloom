import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../button';
import { IconCircle } from '../icon-circle';
import { RiNotification3Line } from '../icons/remix/RiNotification3Line';
import { useMessages } from '../locale/messages';
import type { SurfaceControls } from '../surfaces';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { NOTIFICATIONS_MESSAGES } from './messages';
import type { NotificationPermissionCopy, NotificationPermissionAdapter } from './types';
import type { BloomIconComponent } from '../icons/icon-component';

export interface NotificationPermissionSheetProps extends NotificationPermissionCopy {
  /** The surface's own controls, from `present((surface) => …)`. */
  surface: Pick<SurfaceControls, 'dismiss'>;
  permission: NotificationPermissionAdapter;
  onGranted?: () => void;
  onDenied?: () => void;
  onDismissed?: () => void;
  icon?: BloomIconComponent;
}

/**
 * The content of the permission sheet: a bell, why, "Enable" and "Not now".
 * Presented by {@link NotificationPermissionGate}; exported for an app that
 * wants to present it from its own trigger (a settings row).
 */
export function NotificationPermissionSheet({
  surface,
  permission,
  onGranted,
  onDenied,
  onDismissed,
  icon = RiNotification3Line,
  title,
  body,
  enableLabel,
  laterLabel,
}: NotificationPermissionSheetProps) {
  const { messages } = useMessages(NOTIFICATIONS_MESSAGES);
  const { colors } = useTheme();
  const [requesting, setRequesting] = useState(false);

  const enable = async () => {
    setRequesting(true);
    let status: Awaited<ReturnType<NotificationPermissionAdapter['request']>> = 'denied';
    try {
      status = await permission.request();
    } catch {
      // A failed request is a refusal as far as the app can tell.
    } finally {
      setRequesting(false);
      surface.dismiss(status);
    }
    if (status === 'granted') onGranted?.();
    else onDenied?.();
  };

  return (
    <View style={styles.content}>
      <IconCircle icon={icon} />
      <View style={styles.copy}>
        <Text variant="title-3-semibold" accessibilityRole="header" style={styles.centered}>
          {title ?? messages.permissionTitle}
        </Text>
        <Text variant="body-regular" style={[styles.centered, { color: colors.textSecondary }]}>
          {body ?? messages.permissionBody}
        </Text>
      </View>
      <View style={styles.actions}>
        <Button size="lg" loading={requesting} onPress={() => void enable()}>
          {enableLabel ?? messages.enable}
        </Button>
        <Button
          size="lg"
          tone="neutral"
          appearance="outline"
          disabled={requesting}
          onPress={() => {
            surface.dismiss('later');
            onDismissed?.();
          }}
        >
          {laterLabel ?? messages.later}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // The surface pads the sheet; this adds air under the drag handle.
  content: { alignItems: 'center', gap: 20, paddingTop: 8, paddingBottom: 4 },
  copy: { gap: 6 },
  centered: { textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: 10 },
});
