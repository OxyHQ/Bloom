import React, { isValidElement, memo, useMemo } from 'react';
import { Image, Pressable, View } from 'react-native';

import { Avatar } from '../avatar';
import { Button } from '../button';
import { MENU_SHADOW } from '../floating/menu-palette';
import { useControllableState } from '../hooks/use-controllable-state';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiCheckLine, RiHome4Line, RiPhoneLine, RiStarFill, RiTimeLine } from '../icons/remix';
import { useImageResolver } from '../image-resolver/context';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { HOST_CARD_AVATAR_SIZE } from './constants';
import {
  IS_WEB,
  LISTING_DETAILS_CSS,
  LISTING_DETAILS_STYLE_ID,
  resolveImageUri,
  resolveListingPalette,
} from './shared';
import type { ContactCardProps, ContactRole, ListingIcon } from './types';

/**
 * The person or business behind a listing — a host, a landlord, an agent or an
 * agency: a profile card, then the details, the response time, the active
 * listings, and the contact actions. `HostCard` is this card with
 * `role="host"`.
 *
 *   card       radius 20, card surface (dark neutral-900), 1px neutral-200
 *              (dark neutral-800) border, dropdown shadow, padding 24 / 20,
 *              max width 420; hover (when pressable) steps the surface to
 *              neutral-100 (dark neutral-800)
 *   identity   avatar 104 (square-cornered for an agency) with a verified
 *              check badge (primary disc, card ring), name title-1-semibold,
 *              label body-2-semibold + 14 icon — the role label when no
 *              `label` is given (none for a host)
 *   stats      a column on the right, 1px hairlines between rows;
 *              value title-3-semibold (+ 12 star), label caption-1-medium
 *              text-secondary
 *   agency     logo tile 40 (radius 10, hairline border, contained) + the
 *              agency name in body-semibold
 *   rows       icon 20 + body-regular rows, 12 apart: `details`, then the
 *              response time (clock) and the active listings (home; a link
 *              when `onPressListings` is set)
 *   response   body-regular text-secondary lines
 *   actions    medium Buttons, 8 apart, wrapping: Message (secondary for a
 *              host, primary otherwise), Call (secondary, phone icon), and
 *              "Show phone" (secondary, phone icon) which, once pressed, shows
 *              the number in its place — a button calling `onCall` when that
 *              is set, plain selectable text otherwise
 */

const DEFAULT_ROLE_LABELS: Record<ContactRole, string | undefined> = {
  host: undefined,
  landlord: 'Landlord',
  agent: 'Agent',
  agency: 'Agency',
};

const LOGO_SIZE = 40;

function defaultActiveListingsLabel(count: number): string {
  return count === 1 ? '1 active listing' : `${count} active listings`;
}

function ContactCardComponent({
  role = 'host',
  roleLabel,
  name,
  avatar,
  verified = false,
  verifiedLabel = 'Verified',
  label: labelProp,
  labelIcon: LabelIcon,
  stats,
  details,
  responseLines,
  agency,
  logo,
  responseTime,
  activeListings,
  activeListingsLabel = defaultActiveListingsLabel,
  onPressListings,
  phone,
  phoneRevealed: phoneRevealedProp,
  onPhoneRevealedChange,
  showPhoneLabel = 'Show phone',
  onCall,
  callLabel = 'Call',
  onMessage,
  messageLabel,
  onPressProfile,
  avatarVariant = 'medium',
  style,
  testID,
}: ContactCardProps) {
  const theme = useTheme();
  useInteractiveWebCss(LISTING_DETAILS_STYLE_ID, LISTING_DETAILS_CSS);
  const palette = useMemo(() => resolveListingPalette(theme), [theme]);
  const resolver = useImageResolver();
  const { state: hovered, onIn, onOut } = useInteractionState();
  const [phoneRevealed, setPhoneRevealed] = useControllableState({
    value: phoneRevealedProp,
    defaultValue: false,
    onChange: onPhoneRevealedChange,
  });

  const label = labelProp ?? roleLabel ?? DEFAULT_ROLE_LABELS[role];
  const isAgency = role === 'agency';
  const logoSource = typeof logo === 'string' ? logo : undefined;
  const avatarSource = avatar ?? (isAgency ? logoSource : undefined);

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
          source={avatarSource}
          variant={avatarVariant}
          size={HOST_CARD_AVATAR_SIZE}
          name={name}
          shape={isAgency ? 'square' : undefined}
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
          <Text variant="body-2-semibold" style={{ color: palette.text }} testID={testID ? `${testID}-label` : undefined}>
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
      {...webDataSet({ bloomListingPress: '' })}
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

  // The agency row: a role="agency" card already draws the logo as its avatar.
  const logoUri = resolveImageUri(logoSource, resolver, 'thumb');
  const logoNode = isValidElement(logo) ? logo : logoUri ? (
    <Image
      source={{ uri: logoUri }}
      resizeMode="contain"
      accessible={false}
      importantForAccessibility="no"
      style={{ width: LOGO_SIZE - 10, height: LOGO_SIZE - 10 }}
    />
  ) : null;
  const agencyRow =
    agency && !(isAgency && !avatar) ? (
      <View
        accessible
        accessibilityLabel={agency}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
        testID={testID ? `${testID}-agency` : undefined}
      >
        {logoNode ? (
          <View
            style={{
              width: LOGO_SIZE,
              height: LOGO_SIZE,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: palette.cardBorder,
              backgroundColor: palette.card,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            testID={testID ? `${testID}-logo` : undefined}
          >
            {logoNode}
          </View>
        ) : null}
        <Text variant="body-semibold" numberOfLines={1} style={{ flex: 1, minWidth: 0, color: palette.text }}>
          {agency}
        </Text>
      </View>
    ) : null;

  const rows: { icon: ListingIcon; text: string; onPress?: () => void; id: string }[] = [
    ...(details ?? []).map((d, i) => ({ icon: d.icon, text: d.text, id: `detail-${i}` })),
    ...(responseTime ? [{ icon: RiTimeLine, text: responseTime, id: 'response-time' }] : []),
    ...(activeListings != null
      ? [{ icon: RiHome4Line, text: activeListingsLabel(activeListings), onPress: onPressListings, id: 'listings' }]
      : []),
  ];

  const linkStyle: WebCssStyle = { alignSelf: 'flex-start', borderRadius: 4, '--bloom-listing-ring': palette.ring };

  const revealPhone = () => {
    if (!phoneRevealed) setPhoneRevealed(true);
    else onCall?.();
  };

  const actions =
    onMessage || onCall || phone ? (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} testID={testID ? `${testID}-actions` : undefined}>
        {onMessage ? (
          <Button
            variant={role === 'host' ? 'secondary' : 'primary'}
            onPress={onMessage}
            testID={testID ? `${testID}-message` : undefined}
          >
            {messageLabel ?? (role === 'host' ? 'Message host' : 'Message')}
          </Button>
        ) : null}
        {onCall ? (
          <Button variant="secondary" leadingIcon={RiPhoneLine} onPress={onCall} testID={testID ? `${testID}-call` : undefined}>
            {callLabel}
          </Button>
        ) : null}
        {phone ? (
          <View {...(IS_WEB ? { 'aria-live': 'polite' } : { accessibilityLiveRegion: 'polite' as const })}>
            {phoneRevealed && !onCall ? (
              // Revealed with nothing to call: the number is text, not a dead button.
              <View
                style={{ height: 36, flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 8, paddingRight: 8 }}
                testID={testID ? `${testID}-phone` : undefined}
              >
                <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                  <RiPhoneLine width={20} height={20} fill={palette.text} />
                </View>
                <Text variant="body-semibold" selectable style={{ color: palette.text, fontVariant: ['tabular-nums'] }}>
                  {phone}
                </Text>
              </View>
            ) : (
              <Button
                variant="secondary"
                leadingIcon={RiPhoneLine}
                onPress={revealPhone}
                textStyle={phoneRevealed ? { fontVariant: ['tabular-nums'] } : undefined}
                testID={testID ? `${testID}-phone` : undefined}
              >
                {phoneRevealed ? phone : showPhoneLabel}
              </Button>
            )}
          </View>
        ) : null}
      </View>
    ) : null;

  return (
    <View style={[{ width: '100%', gap: 24 }, style]} testID={testID}>
      {card}
      {agencyRow}
      {rows.length > 0 ? (
        <View role="list" style={{ gap: 12 }}>
          {rows.map(({ icon: Icon, text, onPress, id }) => {
            const content = (
              <>
                <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                  <Icon width={20} height={20} fill={palette.text} />
                </View>
                <Text
                  variant="body-regular"
                  style={[
                    { flex: 1, minWidth: 0, color: palette.text },
                    onPress ? { textDecorationLine: 'underline' } : null,
                  ]}
                >
                  {text}
                </Text>
              </>
            );
            const rowStyle = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 };
            return (
              <View key={id} role="listitem" testID={testID ? `${testID}-${id}` : undefined}>
                {onPress ? (
                  <Pressable
                    {...webDataSet({ bloomListingPress: '' })}
                    accessibilityRole="link"
                    accessibilityLabel={text}
                    onPress={onPress}
                    style={[rowStyle, linkStyle]}
                  >
                    {content}
                  </Pressable>
                ) : (
                  <View style={rowStyle}>{content}</View>
                )}
              </View>
            );
          })}
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
      {actions}
    </View>
  );
}

export const ContactCard = memo(ContactCardComponent);
ContactCard.displayName = 'ContactCard';
