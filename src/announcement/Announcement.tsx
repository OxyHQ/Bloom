import React, { memo, useMemo } from 'react';
import { Animated, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { resolveButtonRamps } from '../button/shared';
import { Button, CloseButton } from '../button';
import { Text } from '../typography';
import { RiShieldStarFill } from '../icons/remix/RiShieldStarFill';
import { EASE_IN_OUT, useCardMotion, type CardMotionPose } from '../notification/use-card-motion';
import type { WebCssStyle } from '../styles/web-view-style';
import type { AnnouncementProps } from './types';

/**
 * `Announcement`: a compact announcement / onboarding card sized for a
 * sidebar slot. Not an `Admonition` — that is an inline status callout; this is
 * a dismissible promo card with an optional CTA.
 *
 *   card         column, gap 12, padding 12, radius 12, 1px border/button/default,
 *                surface, NO shadow
 *   content      column, gap 4
 *     icon       20px, foreground/icon/secondary
 *     close      CloseButton xs, absolute top 12 right 12 (of the card)
 *     text       column, gap 2
 *       title    body-medium, text/primary
 *       desc     body-2-medium, text/secondary
 *   action       Button secondary / small, full width
 *
 * Height with everything: 12 + 20 + 4 + (20 + 2 + 36) + 12 + 32 + 12 = 150.
 *
 * Dismissal is self-managed: exit is fade + scale to 0.85 + 6px blur over 250ms
 * ease-in-out, then unmount, then `onClose`. `introDelay` opts into the matching
 * entrance (also rising 15px). The blur is web-only; reduced motion skips both.
 */

const INTRO: CardMotionPose = { opacity: 0, translateY: 15, scale: 0.85, blur: 6, duration: 250 };
const EXIT: CardMotionPose = { opacity: 0, translateY: 0, scale: 0.85, blur: 6, duration: 250 };

const GEOMETRY = {
  padding: 12,
  gap: 12,
  radius: 12,
  contentGap: 4,
  icon: 20,
  textGap: 2,
} as const;

function AnnouncementComponent({
  title,
  description,
  icon: Icon = RiShieldStarFill,
  actionLabel,
  onAction,
  dismissible = false,
  onClose,
  closeLabel = 'Dismiss',
  introDelay,
  style,
  testID,
}: AnnouncementProps) {
  const theme = useTheme();
  const paint = useMemo(() => {
    const { neutral: n } = resolveButtonRamps(theme);
    const dark = theme.isDark;
    return {
      surface: dark ? n[800] : theme.colors.card,
      border: dark ? n[700] : n[200],
      icon: n[500],
      title: theme.colors.text,
      description: n[500],
    };
  }, [theme]);
  const motion = useCardMotion({
    intro: INTRO,
    introDelay,
    exit: EXIT,
    exitEasing: EASE_IN_OUT,
    onExited: onClose,
  });

  if (motion.gone) return null;

  const cardStyle: WebCssStyle = {
    position: 'relative',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: GEOMETRY.gap,
    padding: GEOMETRY.padding,
    borderRadius: GEOMETRY.radius,
    borderWidth: 1,
    borderColor: paint.border,
    backgroundColor: paint.surface,
  };

  return (
    <Animated.View testID={testID} style={[cardStyle, motion.style, style]}>
      <View style={{ width: '100%', alignItems: 'flex-start', gap: GEOMETRY.contentGap }}>
        <Icon width={GEOMETRY.icon} height={GEOMETRY.icon} fill={paint.icon} />
        {dismissible ? (
          <CloseButton
            size="xs"
            accessibilityLabel={closeLabel}
            onPress={motion.dismiss}
            // Inside the content column, whose box starts at the card's 12px
            // padding — so top/right 0 here IS the `top-3 right-3` of the
            // card, while the button keeps the natural DOM (and tab) order.
            style={{ position: 'absolute', top: 0, right: 0 }}
          />
        ) : null}
        <View style={{ width: '100%', alignItems: 'flex-start', gap: GEOMETRY.textGap }}>
          <Text variant="body-medium" style={{ width: '100%', color: paint.title }}>
            {title}
          </Text>
          {description ? (
            <Text variant="body-2-medium" style={{ width: '100%', color: paint.description }}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>

      {actionLabel ? (
        <Button variant="secondary" size="small" onPress={onAction} fullWidth style={{ width: '100%' }}>
          {actionLabel}
        </Button>
      ) : null}
    </Animated.View>
  );
}

export const Announcement = memo(AnnouncementComponent);
Announcement.displayName = 'Announcement';
