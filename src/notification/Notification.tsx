import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Avatar } from '../avatar';
import { Button, CloseButton } from '../button';
import { Text } from '../typography';
import { RiCheckboxCircleFill } from '../icons/remix/RiCheckboxCircleFill';
import { RiErrorWarningFill } from '../icons/remix/RiErrorWarningFill';
import { RiInformationFill } from '../icons/remix/RiInformationFill';
import { RiNotification3Fill } from '../icons/remix/RiNotification3Fill';
import { RiAlertFill } from '../icons/remix/RiAlertFill';
import type { WebCssStyle } from '../styles/web-view-style';
import {
  NOTIFICATION_GEOMETRY as G,
  NOTIFICATION_MOTION,
  resolveNotificationPaint,
  type NotificationPaint,
} from './shared';
import { EASE_OUT, useCardMotion } from './use-card-motion';
import type {
  NotificationAvatar,
  NotificationIconComponent,
  NotificationProps,
  NotificationStatus,
} from './types';

/**
 * `Notification`: geometry is fixed to the pixel (see `shared.ts`); colours
 * come from Bloom's theme through the button ramp recipe.
 *
 * A self-contained card: it owns its dismissal (exit animation, then unmount,
 * then `onDismiss`), its optional auto-dismiss countdown and its optional
 * entrance. For a STACK of transient notifications use `toast` — the toast
 * engine renders this same card and owns viewport placement, stacking, swipe
 * and timers, which is why Bloom ships no `NotificationViewport`.
 */

export const NOTIFICATION_STATUS_ICON: Record<NotificationStatus, NotificationIconComponent> = {
  neutral: RiNotification3Fill,
  information: RiInformationFill,
  success: RiCheckboxCircleFill,
  warning: RiAlertFill,
  error: RiErrorWarningFill,
};

/** The 40px status disc with its 20px glyph. Shared with the toast renderer. */
export function NotificationStatusVisual({
  status,
  icon,
  paint,
  children,
}: {
  status: NotificationStatus;
  icon?: NotificationIconComponent;
  paint: NotificationPaint;
  /** Replaces the glyph (e.g. a spinner) while keeping the disc. */
  children?: React.ReactNode;
}) {
  const Icon = icon ?? NOTIFICATION_STATUS_ICON[status];
  const tone = paint.status[status];
  return (
    <View
      style={{
        width: G.visual,
        height: G.visual,
        borderRadius: G.visual / 2,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tone.background,
      }}
    >
      {children ?? <Icon width={G.icon} height={G.icon} fill={tone.foreground} />}
    </View>
  );
}

function NotificationAvatarVisual({
  avatar: { presence, ...avatar },
  paint,
}: {
  avatar: NotificationAvatar;
  paint: NotificationPaint;
}) {
  return (
    <View style={{ position: 'relative', flexShrink: 0 }}>
      <Avatar {...avatar} size={G.visual} />
      {presence ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: G.presence,
            height: G.presence,
            borderRadius: G.presence / 2,
            borderWidth: G.presenceBorder,
            borderColor: paint.surface,
            backgroundColor: paint.presence[presence],
          }}
        />
      ) : null}
    </View>
  );
}

/** The card chrome, shared with the toast renderer. */
export function notificationCardStyle(paint: NotificationPaint): WebCssStyle {
  return {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: G.gap,
    overflow: 'hidden',
    paddingTop: G.padding,
    paddingBottom: G.padding,
    paddingLeft: G.padding,
    paddingRight: G.paddingRight,
    borderRadius: G.radius,
    borderWidth: 1,
    borderColor: paint.border,
    backgroundColor: paint.surface,
    boxShadow: paint.shadow,
  };
}

const CLOSE_POSITION: ViewStyle = { position: 'absolute', top: G.closeInset, right: G.closeInset };

function Countdown({ duration, delay, color }: { duration: number; delay: number; color: string }) {
  const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 0,
      duration,
      delay,
      easing: Easing.linear,
      // `width` cannot ride the native driver.
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, duration, delay]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: 'absolute',
        left: 0,
        bottom: 0,
        height: G.countdown,
        backgroundColor: color,
        width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
      }}
    />
  );
}

function NotificationComponent({
  title,
  description,
  timestamp,
  status = 'neutral',
  icon,
  avatar,
  actions,
  dismissible = true,
  closeLabel = 'Dismiss notification',
  onDismiss,
  autoDismissDuration,
  introDelay,
  role,
  style,
  testID,
}: NotificationProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveNotificationPaint(theme), [theme]);
  const motion = useCardMotion({
    intro: NOTIFICATION_MOTION.intro,
    introDelay,
    exit: NOTIFICATION_MOTION.exit,
    exitEasing: EASE_OUT,
    onExited: onDismiss,
  });
  const { dismiss } = motion;
  const introDelayMs = (introDelay ?? 0) * 1000;
  const hasCountdown = autoDismissDuration !== undefined && autoDismissDuration > 0;

  useEffect(() => {
    if (!hasCountdown) return;
    const timer = setTimeout(dismiss, (autoDismissDuration ?? 0) + introDelayMs);
    return () => clearTimeout(timer);
  }, [hasCountdown, autoDismissDuration, introDelayMs, dismiss]);

  if (motion.gone) return null;

  return (
    <Animated.View
      role={role ?? (status === 'error' ? 'alert' : 'status')}
      testID={testID}
      style={[
        notificationCardStyle(paint),
        // A title on its own centres against the 40px visual instead of hugging
        // its top and leaving an empty band where a description would sit.
        !description && !actions?.length ? { alignItems: 'center' } : null,
        motion.style,
        style,
      ]}
    >
      {avatar ? (
        <NotificationAvatarVisual avatar={avatar} paint={paint} />
      ) : (
        <NotificationStatusVisual status={status} icon={icon} paint={paint} />
      )}

      <View style={{ flex: 1, minWidth: 0, gap: G.contentGap }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            columnGap: G.headerGapX,
            rowGap: G.headerGapY,
            minWidth: 0,
          }}
        >
          <Text variant="body-medium" style={{ color: paint.title, flexShrink: 1 }}>
            {title}
          </Text>
          {timestamp ? (
            <Text variant="body-regular" style={{ color: paint.timestamp }}>
              {timestamp}
            </Text>
          ) : null}
        </View>
        {description ? (
          <Text variant="body-regular" style={{ color: paint.description }}>
            {description}
          </Text>
        ) : null}
        {actions?.length ? (
          <View
            style={{
              marginTop: G.actionsMarginTop,
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: G.actionsGap,
            }}
          >
            {actions.map((action, index) => (
              <Button
                key={index}
                size="small"
                variant={action.variant ?? (index === 0 ? 'secondary' : 'primary')}
                onPress={action.onPress}
              >
                {action.label}
              </Button>
            ))}
          </View>
        ) : null}
      </View>

      {dismissible ? (
        <CloseButton
          size="xs"
          accessibilityLabel={closeLabel}
          onPress={dismiss}
          style={[
            CLOSE_POSITION,
            // Title-only: the ✕ centres on the 40px visual like the title does.
            !description && !actions?.length ? { top: G.padding + (G.visual - 20) / 2 } : null,
          ]}
        />
      ) : null}

      {hasCountdown ? (
        <Countdown duration={autoDismissDuration ?? 0} delay={introDelayMs} color={paint.countdown} />
      ) : null}
    </Animated.View>
  );
}

export const Notification = memo(NotificationComponent);
Notification.displayName = 'Notification';
