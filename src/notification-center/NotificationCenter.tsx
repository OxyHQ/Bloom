import React, { memo, useCallback, useMemo, useState } from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';

import { Avatar } from '../avatar';
import { Button } from '../button';
import { ACCENT_TABLE, colorRamp, DANGER_TABLE, resolveButtonRamps } from '../button/shared';
import { MENU_SHADOW } from '../floating/menu-palette';
import { useControllableState } from '../hooks/use-controllable-state';
import { RiCheckboxCircleFill } from '../icons/remix/RiCheckboxCircleFill';
import { RiErrorWarningFill } from '../icons/remix/RiErrorWarningFill';
import { RiInformationFill } from '../icons/remix/RiInformationFill';
import { RiNotification3Fill } from '../icons/remix/RiNotification3Fill';
import { RiNotificationOffLine } from '../icons/remix/RiNotificationOffLine';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '../segmented-control';
import { borderRadius } from '../styles/tokens';
import { parseRgba, withAlpha } from '../theme/color-utils';
import { oklchToSrgb, srgbToOklch, srgbToRgbString } from '../theme/color-space';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type {
  NotificationCenterAvatar,
  NotificationCenterAvatarColor,
  NotificationCenterIcon,
  NotificationCenterItem,
  NotificationCenterProps,
  NotificationCenterStatus,
  NotificationCenterTab,
} from './types';

/**
 * The notification center.
 *
 *   section     max-width 430, radius 24, 1px border-button-default,
 *               notification-center-background, shadow-dropdown, clipped
 *   header      p16 / pb6, gap 12: title-3-medium + "N unread" body-regular,
 *               ghost small "Mark all read" (disabled at 0), then a full-width
 *               segmented control whose segments carry a count pill
 *   list        p6 frame → radius 16 background-secondary → max-height 516
 *               scroller p8, cards 8 apart
 *   card        radius 10, background-primary, p12, gap 12: 40px avatar or
 *               status disc (icon 20), title body-medium, timestamp
 *               caption-1-medium tertiary, unread 8px accent-500 dot,
 *               description body-regular secondary, actions mt6 gap8 (small)
 *   empty       min-height 256, radius 16 primary surface, 44px disc
 *
 * Semantic tokens on Bloom's ramps:
 *
 *                                        light            dark
 *   notification-center-background       card             neutral-900
 *   background-secondary                 neutral-100      neutral-900
 *   background-primary                   card             neutral-800
 *   border-button-default                neutral-200      neutral-700
 *   badge-neutral-background             neutral-200      neutral-800
 *   notification-information bg / fg     info-100 / 600   info-800@50% / 300
 *   notification-success bg / fg         success-100/600  success-800@50%/300
 *   notification-error bg / fg           red-100 / 600    red-800@50% / 300
 *
 * Read state is local: an action press or "Mark all read" marks
 * items read in this instance and then tells the host.
 */

const TABS: { id: NotificationCenterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'mentions', label: 'Mentions' },
  { id: 'system', label: 'System' },
];

const STATUS_ICON: Record<NotificationCenterStatus, NotificationCenterIcon> = {
  neutral: RiNotification3Fill,
  information: RiInformationFill,
  success: RiCheckboxCircleFill,
  error: RiErrorWarningFill,
};

interface CenterPalette {
  section: string;
  border: string;
  shadow: string;
  well: string;
  card: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  icon: string;
  countBackground: string;
  unread: string;
  status: Record<NotificationCenterStatus, { background: string; foreground: string }>;
  avatar: Record<NotificationCenterAvatarColor, { background: string; foreground: string }>;
}

/**
 * Tailwind `pink-500` sits 95.1° of OKLCH hue past `blue-500`; the pink
 * avatar keeps that distance from the theme's accent, so a blue preset gives
 * that pink and any other preset rotates with it.
 */
const PINK_HUE_OFFSET = 354.308 - 259.815;

function rotateHue(color: string, degrees: number): string {
  const rgba = parseRgba(color);
  if (!rgba) return color;
  const { l, c, h } = srgbToOklch(rgba);
  return srgbToRgbString(oklchToSrgb({ l, c, h: (((h + degrees) % 360) + 360) % 360 }));
}

export function resolveNotificationCenterPalette(theme: Theme): CenterPalette {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const info = colorRamp(theme.colors.info, ACCENT_TABLE);
  const success = colorRamp(theme.colors.success, ACCENT_TABLE);
  const error = colorRamp(theme.colors.negative, DANGER_TABLE);
  const pink = colorRamp(rotateHue(theme.colors.primary, PINK_HUE_OFFSET), ACCENT_TABLE);
  const dark = theme.isDark;
  const disc = (ramp: typeof info) =>
    dark
      ? { background: withAlpha(ramp[800], 0.5), foreground: ramp[300] }
      : { background: ramp[100], foreground: ramp[600] };
  return {
    section: dark ? n[900] : theme.colors.card,
    border: dark ? n[700] : n[200],
    shadow: dark ? MENU_SHADOW.dark : MENU_SHADOW.light,
    well: dark ? n[900] : n[100],
    card: dark ? n[800] : theme.colors.card,
    text: theme.colors.text,
    textSecondary: n[500],
    textTertiary: dark ? n[600] : n[400],
    icon: n[500],
    countBackground: dark ? n[800] : n[200],
    unread: accent[500],
    status: {
      neutral: { background: dark ? n[800] : n[200], foreground: n[500] },
      information: disc(info),
      success: disc(success),
      error: disc(error),
    },
    // Avatar tints: neutral bg avatar-neutral (300 / primary surface),
    // blue 300/900, lime 200/700, pink 200/500.
    avatar: {
      neutral: { background: dark ? n[800] : n[300], foreground: n[500] },
      blue: { background: accent[300], foreground: accent[900] },
      lime: { background: success[200], foreground: success[700] },
      pink: { background: pink[200], foreground: pink[500] },
    },
  };
}

function NotificationVisual({
  item,
  palette,
}: {
  item: NotificationCenterItem;
  palette: CenterPalette;
}) {
  if (item.avatar) return <PersonAvatar avatar={item.avatar} palette={palette} />;
  const status = item.status ?? 'neutral';
  const Icon = item.icon ?? STATUS_ICON[status];
  const tone = palette.status[status];
  return (
    <View
      testID={`notification-${item.id}-disc`}
      style={{
        width: 40,
        height: 40,
        flexShrink: 0,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tone.background,
      }}
    >
      <Icon width={20} height={20} fill={tone.foreground} />
    </View>
  );
}

/** `Avatar size="lg" className="size-10"`: 40px, 18/24 semibold initials. */
function PersonAvatar({ avatar, palette }: { avatar: NotificationCenterAvatar; palette: CenterPalette }) {
  const tint = palette.avatar[avatar.color ?? 'neutral'];
  if (avatar.source) {
    return <Avatar source={avatar.source} size={40} style={{ flexShrink: 0 }} />;
  }
  return (
    <View
      accessibilityLabel={avatar.name}
      style={{
        width: 40,
        height: 40,
        flexShrink: 0,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: tint.background,
      }}
    >
      <Text style={{ fontSize: 18, lineHeight: 24, fontWeight: '600', color: tint.foreground }}>
        {avatar.initials ?? ''}
      </Text>
    </View>
  );
}

function CountPill({ count, palette }: { count: number; palette: CenterPalette }) {
  return (
    <View
      style={{
        minWidth: 20,
        paddingLeft: 4,
        paddingRight: 4,
        paddingTop: 1,
        paddingBottom: 1,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.countBackground,
      }}
    >
      <Text variant="caption-1-medium" style={{ color: palette.textSecondary, textAlign: 'center' }}>
        {count}
      </Text>
    </View>
  );
}

const NotificationCenterComponent: React.FC<NotificationCenterProps> = ({
  notifications = [],
  defaultTab = 'all',
  tab,
  onTabChange,
  onAction,
  onMarkAllRead,
  title = 'Notifications',
  emptyMessage = 'You’re all caught up.',
  emptyDescription = 'New activity will appear here when it arrives.',
  style,
  testID,
}) => {
  const theme = useTheme();
  const palette = useMemo(() => resolveNotificationCenterPalette(theme), [theme]);
  const [activeTab, setTab] = useControllableState<NotificationCenterTab>({
    value: tab,
    defaultValue: defaultTab,
    onChange: onTabChange,
  });
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());

  const isUnread = useCallback(
    (item: NotificationCenterItem) => item.unread === true && !readIds.has(item.id),
    [readIds],
  );
  const unreadCount = notifications.filter(isUnread).length;

  const counts = useMemo(
    () => ({
      all: notifications.length,
      mentions: notifications.filter((item) => item.category === 'mentions').length,
      system: notifications.filter((item) => item.category === 'system').length,
    }),
    [notifications],
  );

  const visible = useMemo(
    () => (activeTab === 'all' ? notifications : notifications.filter((item) => item.category === activeTab)),
    [activeTab, notifications],
  );

  const markAllRead = () => {
    setReadIds(new Set(notifications.filter((item) => item.unread).map((item) => item.id)));
    onMarkAllRead?.();
  };

  const sectionStyle: ViewStyle = {
    width: '100%',
    maxWidth: 430,
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.section,
    boxShadow: palette.shadow,
  };

  const scrollStyle: ViewStyle = { maxHeight: 516, backgroundColor: palette.well };

  return (
    <View
      role="region"
      accessibilityLabel={title}
      testID={testID}
      style={[sectionStyle, style]}
    >
      <View style={{ gap: 12, paddingTop: 16, paddingLeft: 16, paddingRight: 16, paddingBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <View style={{ flexShrink: 1, minWidth: 0, gap: 2 }}>
            <Text role="heading" aria-level={2} variant="title-3-medium" style={{ color: palette.text }}>
              {title}
            </Text>
            <Text variant="body-regular" style={{ color: palette.textSecondary }}>
              {unreadCount === 0 ? 'No unread notifications' : `${unreadCount} unread`}
            </Text>
          </View>
          <Button variant="ghost" size="small" onPress={markAllRead} disabled={unreadCount === 0}>
            Mark all read
          </Button>
        </View>

        <SegmentedControl
          label="Notification category"
          type="tabs"
          value={activeTab}
          onChange={setTab}
          style={{ alignSelf: 'stretch', width: '100%' }}
        >
          {TABS.map(({ id, label }) => (
            <SegmentedControlItem key={id} value={id} testID={testID ? `${testID}-tab-${id}` : undefined}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <SegmentedControlItemText>{label}</SegmentedControlItemText>
                <CountPill count={counts[id]} palette={palette} />
              </View>
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </View>

      <View style={{ padding: 6, backgroundColor: palette.section }}>
        <View style={{ overflow: 'hidden', borderRadius: 16, backgroundColor: palette.well }}>
          <ScrollView style={scrollStyle} contentContainerStyle={{ padding: 8 }}>
            {visible.length === 0 ? (
              <View
                testID={testID ? `${testID}-empty` : undefined}
                style={{
                  minHeight: 256,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  borderRadius: 16,
                  paddingLeft: 24,
                  paddingRight: 24,
                  backgroundColor: palette.card,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: borderRadius.full,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: palette.well,
                  }}
                >
                  <RiNotificationOffLine width={20} height={20} fill={palette.icon} />
                </View>
                <Text variant="body-medium" style={{ color: palette.text, textAlign: 'center' }}>
                  {emptyMessage}
                </Text>
                <Text
                  variant="body-regular"
                  style={{ color: palette.textSecondary, textAlign: 'center', maxWidth: 256 }}
                >
                  {emptyDescription}
                </Text>
              </View>
            ) : (
              <View role="list" style={{ gap: 8 }}>
                {visible.map((item) => {
                  const unread = isUnread(item);
                  return (
                    <View
                      key={item.id}
                      role="listitem"
                      testID={`notification-${item.id}`}
                      style={{
                        flexDirection: 'row',
                        gap: 12,
                        borderRadius: 10,
                        padding: 12,
                        backgroundColor: palette.card,
                      }}
                    >
                      <NotificationVisual item={item} palette={palette} />
                      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 12,
                          }}
                        >
                          <Text variant="body-medium" style={{ flexShrink: 1, minWidth: 0, color: palette.text }}>
                            {item.title}
                          </Text>
                          <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text variant="caption-1-medium" numberOfLines={1} style={{ color: palette.textTertiary }}>
                              {item.timestamp}
                            </Text>
                            {unread ? (
                              <View
                                accessibilityLabel="Unread"
                                testID={`notification-${item.id}-unread`}
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: borderRadius.full,
                                  backgroundColor: palette.unread,
                                }}
                              />
                            ) : null}
                          </View>
                        </View>
                        <Text variant="body-regular" style={{ color: palette.textSecondary }}>
                          {item.description}
                        </Text>
                        {item.actions?.length ? (
                          <View
                            style={{
                              marginTop: 6,
                              flexDirection: 'row',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            {item.actions.map((action) => (
                              <Button
                                key={action.id}
                                size="small"
                                variant={action.variant ?? 'secondary'}
                                onPress={() => {
                                  setReadIds((current) => new Set(current).add(item.id));
                                  onAction?.(item.id, action.id);
                                }}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export const NotificationCenter = memo(NotificationCenterComponent);
NotificationCenter.displayName = 'NotificationCenter';
