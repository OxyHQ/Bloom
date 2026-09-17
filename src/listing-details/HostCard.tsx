import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '../avatar';
import { Button } from '../button';
import { MENU_SHADOW } from '../floating/menu-palette';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiCheckLine, RiStarFill } from '../icons/remix';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { HOST_CARD_AVATAR_SIZE } from './constants';
import {
  LISTING_DETAILS_CSS,
  LISTING_DETAILS_STYLE_ID,
  resolveListingPalette,
  webData,
} from './shared';
import type { HostCardProps } from './types';

/**
 * The host of a listing: a profile card, then details and a message button.
 *
 *   card       radius 20, card surface (dark neutral-900), 1px neutral-200
 *              (dark neutral-800) border, dropdown shadow, padding 24 / 20,
 *              max width 420; hover (when pressable) steps the surface to
 *              neutral-100 (dark neutral-800)
 *   identity   avatar 104 with a verified check badge (primary disc, card
 *              ring), name title-1-semibold, label body-2-semibold + 14 icon
 *   stats      a column on the right, 1px hairlines between rows;
 *              value headline-semibold (+ 12 star), label caption-1-medium
 *              text-secondary
 *   details    icon 20 + body-regular rows, 12 apart
 *   response   body-regular text-secondary lines
 *   message    a medium secondary Button
 */
function HostCardComponent({
  name,
  avatar,
  verified = false,
  verifiedLabel = 'Verified',
  label,
  labelIcon: LabelIcon,
  stats,
  details,
  responseLines,
  onMessage,
  messageLabel = 'Message host',
  onPressProfile,
  avatarVariant = 'medium',
  style,
  testID,
}: HostCardProps) {
  const theme = useTheme();
  useInteractiveWebCss(LISTING_DETAILS_STYLE_ID, LISTING_DETAILS_CSS);
  const palette = useMemo(() => resolveListingPalette(theme), [theme]);
  const { state: hovered, onIn, onOut } = useInteractionState();

  const badgeSize = Math.round(HOST_CARD_AVATAR_SIZE * 0.3);
  const badge = verified ? (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={verifiedLabel}
      testID={testID ? `${testID}-verified` : undefined}
      style={{
        width: badgeSize,
        height: badgeSize,
        borderRadius: badgeSize / 2,
        borderWidth: 3,
        borderColor: palette.card,
        backgroundColor: palette.badge,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <RiCheckLine width={16} height={16} fill={palette.badgeForeground} />
    </View>
  ) : null;

  const identity = (
    <View style={{ flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      <View style={{ marginBottom: 8 }}>
        <Avatar
          source={avatar}
          variant={avatarVariant}
          size={HOST_CARD_AVATAR_SIZE}
          name={name}
          verified={verified}
          verifiedIcon={badge}
        />
      </View>
      <Text
        variant="title-1-semibold"
        numberOfLines={2}
        style={{ color: palette.text, textAlign: 'center' }}
        testID={testID ? `${testID}-name` : undefined}
      >
        {name}
      </Text>
      {label ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {LabelIcon ? <LabelIcon width={14} height={14} fill={palette.text} /> : null}
          <Text variant="body-2-semibold" style={{ color: palette.text }}>
            {label}
          </Text>
        </View>
      ) : null}
    </View>
  );

  const statsColumn =
    stats && stats.length > 0 ? (
      <View style={{ width: 112 }} testID={testID ? `${testID}-stats` : undefined}>
        {stats.map((stat, index) => (
          <View
            key={`${stat.label}-${index}`}
            testID={testID ? `${testID}-stat-${index}` : undefined}
            style={{
              paddingTop: index === 0 ? 0 : 12,
              paddingBottom: index === stats.length - 1 ? 0 : 12,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: palette.hairline,
              gap: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text variant="title-3-semibold" style={{ color: palette.text, fontVariant: ['tabular-nums'] }}>
                {stat.value}
              </Text>
              {stat.star ? <RiStarFill width={12} height={12} fill={palette.text} /> : null}
            </View>
            <Text variant="caption-1-medium" style={{ color: palette.textSecondary }}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    ) : null;

  const cardStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    width: '100%',
    maxWidth: 420,
    paddingTop: 24,
    paddingBottom: 24,
    paddingLeft: 20,
    paddingRight: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: onPressProfile && hovered ? palette.hover : palette.card,
    boxShadow: theme.isDark ? MENU_SHADOW.dark : MENU_SHADOW.light,
    '--bloom-listing-ring': palette.ring,
  };

  const statsName = (stats ?? []).map((s) => `${s.value} ${s.label}`).join(', ');
  const cardName = [name, label, verified ? verifiedLabel : undefined, statsName]
    .filter(Boolean)
    .join(', ');

  const card = onPressProfile ? (
    <Pressable
      {...webData({ bloomListingPress: '' })}
      accessibilityRole="button"
      accessibilityLabel={cardName}
      onPress={onPressProfile}
      onHoverIn={onIn}
      onHoverOut={onOut}
      style={cardStyle}
      testID={testID ? `${testID}-card` : undefined}
    >
      {identity}
      {statsColumn}
    </Pressable>
  ) : (
    <View style={cardStyle} testID={testID ? `${testID}-card` : undefined}>
      {identity}
      {statsColumn}
    </View>
  );

  return (
    <View style={[{ width: '100%', gap: 24 }, style]} testID={testID}>
      {card}
      {details && details.length > 0 ? (
        <View role="list" style={{ gap: 12 }}>
          {details.map(({ icon: Icon, text }, index) => (
            <View
              key={`${text}-${index}`}
              role="listitem"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                <Icon width={20} height={20} fill={palette.text} />
              </View>
              <Text variant="body-regular" style={{ flex: 1, minWidth: 0, color: palette.text }}>
                {text}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {responseLines && responseLines.length > 0 ? (
        <View style={{ gap: 4 }}>
          {responseLines.map((line, index) => (
            <Text key={`${line}-${index}`} variant="body-regular" style={{ color: palette.textSecondary }}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}
      {onMessage ? (
        <View style={{ flexDirection: 'row' }}>
          <Button variant="secondary" onPress={onMessage} testID={testID ? `${testID}-message` : undefined}>
            {messageLabel}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

export const HostCard = memo(HostCardComponent);
HostCard.displayName = 'HostCard';

