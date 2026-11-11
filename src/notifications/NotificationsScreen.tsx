import { memo, type ReactElement, useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '../avatar';
import { Button } from '../button';
import { EmptyState } from '../empty-state';
import { IconCircle } from '../icon-circle';
import type { BloomIconComponent } from '../icons/icon-component';
import { RiCheckboxCircleFill } from '../icons/remix/RiCheckboxCircleFill';
import { RiErrorWarningFill } from '../icons/remix/RiErrorWarningFill';
import { RiInformationFill } from '../icons/remix/RiInformationFill';
import { RiNotification3Fill } from '../icons/remix/RiNotification3Fill';
import { RiNotificationOffLine } from '../icons/remix/RiNotificationOffLine';
import { VirtualList } from '../list';
import { Loading } from '../loading';
import { COMMON_MESSAGES } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import { NOTIFICATION_CENTER_MESSAGES } from '../notification-center/messages';
import type { NotificationCenterStatus } from '../notification-center/types';
import { Switch } from '../switch';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { NOTIFICATIONS_MESSAGES } from './messages';
import type {
  NotificationsScreenItem,
  NotificationsScreenProps,
  NotificationsScreenPush,
} from './types';

const STATUS_ICON: Record<NotificationCenterStatus, BloomIconComponent> = {
  neutral: RiNotification3Fill,
  information: RiInformationFill,
  success: RiCheckboxCircleFill,
  error: RiErrorWarningFill,
};

function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationsScreenItem;
  onPress?: (id: string) => void;
}) {
  const { colors } = useTheme();
  const { messages } = useMessages(NOTIFICATION_CENTER_MESSAGES);
  const name =
    item.accessibilityLabel ??
    [item.title, item.description, item.timestamp].filter(Boolean).join(', ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.unread ? `${name}. ${messages.unreadDot}` : name}
      onPress={onPress ? () => onPress(item.id) : undefined}
      disabled={!onPress}
      testID={`notification-${item.id}`}
      style={styles.row}
    >
      {item.avatar ? (
        <Avatar
          size={40}
          source={item.avatar.source}
          name={item.avatar.name}
          initials={item.avatar.initials}
        />
      ) : (
        <IconCircle icon={item.icon ?? STATUS_ICON[item.status ?? 'neutral']} />
      )}
      <View style={styles.body}>
        <View style={styles.titleLine}>
          <Text
            variant={item.unread ? 'body-medium' : 'body-regular'}
            style={styles.title}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {item.timestamp ? (
            <Text variant="caption-1-medium" style={{ color: colors.textTertiary }}>
              {item.timestamp}
            </Text>
          ) : null}
        </View>
        {item.description ? (
          <Text variant="body-regular" style={{ color: colors.textSecondary }} numberOfLines={3}>
            {item.description}
          </Text>
        ) : null}
      </View>
      {item.unread ? (
        <View
          testID={`notification-${item.id}-unread`}
          style={[styles.dot, { backgroundColor: colors.primary }]}
        />
      ) : null}
    </Pressable>
  );
}

function PushRow({ push }: { push: NotificationsScreenPush }) {
  const { colors } = useTheme();
  const { messages } = useMessages(NOTIFICATIONS_MESSAGES);
  const [busy, setBusy] = useState(false);
  const change = async (next: boolean) => {
    setBusy(true);
    try {
      await push.onChange(next);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={styles.pushRow}>
      <View style={styles.body}>
        <Text variant="body-medium">{messages.pushTitle}</Text>
        <Text variant="body-regular" style={{ color: colors.textSecondary }}>
          {push.blocked ? messages.pushBlocked : messages.pushDescription}
        </Text>
      </View>
      <Switch
        checked={push.enabled}
        disabled={push.blocked || busy}
        onCheckedChange={(next) => void change(next)}
        accessibilityLabel={messages.pushTitle}
        testID="notifications-push-switch"
      />
    </View>
  );
}

/**
 * The notifications list of an app, as one body for its page: an optional
 * heading, the push-permission row, "Mark all read", and the rows with their
 * loading, error, empty and next-page states. It owns the layout and the words;
 * the app owns the data and what a press does, so it sits on any source — an
 * Oxy services hook, a React Query list — through props:
 *
 * ```tsx
 * <NotificationsScreen
 *   notifications={data?.map(toItem)}
 *   loading={isLoading}
 *   error={isError}
 *   onRetry={refetch}
 *   onEndReached={hasNextPage ? fetchNextPage : undefined}
 *   onNotificationPress={(id) => { markRead(id); open(id); }}
 *   onMarkAllRead={markAllRead}
 *   push={{ enabled, onChange: setPushEnabled }}
 * />
 * ```
 *
 * Place it inside the app's `Screen` (it scrolls with it, like `VirtualList`).
 * Read state is the caller's: a row is unread while `unread` is true.
 */
export const NotificationsScreen = memo(function NotificationsScreen({
  notifications,
  loading,
  error,
  onRetry,
  refreshing,
  onRefresh,
  onEndReached,
  loadingMore,
  onNotificationPress,
  onMarkAllRead,
  push,
  title,
  emptyTitle,
  emptyDescription,
  header,
  style,
  testID,
}: NotificationsScreenProps) {
  const { colors } = useTheme();
  const { messages } = useMessages(NOTIFICATIONS_MESSAGES);
  const { messages: center } = useMessages(NOTIFICATION_CENTER_MESSAGES);
  const { messages: common } = useMessages(COMMON_MESSAGES);
  const items = notifications ?? [];
  const unreadCount = items.filter((item) => item.unread).length;
  const showMarkAll = onMarkAllRead !== undefined && unreadCount > 0;

  const renderItem = useCallback(
    ({ item }: { item: NotificationsScreenItem }) => (
      <NotificationRow item={item} onPress={onNotificationPress} />
    ),
    [onNotificationPress],
  );

  const headerNode =
    header || title || push || showMarkAll ? (
      <View>
        {header}
        {title || showMarkAll ? (
          <View style={styles.titleBar}>
            {title ? (
              <Text variant="title-3-semibold" accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
            ) : (
              <View style={styles.title} />
            )}
            {showMarkAll ? (
              <Button size="sm" appearance="subtle" tone="accent" onPress={onMarkAllRead}>
                {center.markAllRead}
              </Button>
            ) : null}
          </View>
        ) : null}
        {push ? <PushRow push={push} /> : null}
      </View>
    ) : null;

  let empty: ReactElement;
  if (loading && items.length === 0) {
    empty = (
      <View style={styles.centered}>
        <Loading />
      </View>
    );
  } else if (error && items.length === 0) {
    empty = (
      <EmptyState
        icon={RiErrorWarningFill}
        title={messages.loadError}
        action={onRetry ? { label: common.retry, onPress: onRetry } : undefined}
      />
    );
  } else {
    empty = (
      <EmptyState
        icon={RiNotificationOffLine}
        title={emptyTitle ?? center.emptyMessage}
        description={emptyDescription ?? center.emptyDescription}
      />
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }, style]} testID={testID}>
      <VirtualList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={72}
        ListHeaderComponent={headerNode}
        ListEmptyComponent={empty}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.centered}>
              <Loading />
            </View>
          ) : null
        }
        onEndReached={onEndReached}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  body: { flex: 1, minWidth: 0, gap: 2 },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: { flex: 1, minWidth: 0 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  pushRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 32 },
});
