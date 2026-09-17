import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Badge } from '../badge';
import { Button } from '../button';
import { Chip } from '../chip';
import {
  RiChat3Line,
  RiCheckLine,
  RiGroupLine,
  RiHandHeartLine,
  RiMapPinLine,
  RiShareLine,
  RiShieldCheckFill,
  RiTimeLine,
} from '../icons/remix';
import { HousingCard, HousingToggleButton, useHousingPalette } from '../tenancy/parts';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { EVICTION_STATUS } from './constants';
import type { EvictionReportCardProps } from './types';

/**
 * A published report of an upcoming eviction, so neighbours and support groups
 * can turn up.
 *
 *   card        the housing card, 16 between blocks
 *   top         status `Badge` (scheduled warning, postponed info, suspended
 *               success, cancelled neutral — subtle; executed a solid neutral)
 *               and, on the right, the community-verified mark (14 shield in the
 *               success text colour + caption-1-medium)
 *   when        the date title-2-semibold (a heading), then a 16 clock + time
 *               body-medium and the relative line body-2-semibold in the
 *               status's text colour ("in 3 days")
 *   area        16 pin + the COARSE area body-medium
 *   household   small subtle neutral `Chip`s, 6 apart
 *   description body-regular, clamped to 3 lines
 *   support     16 icons + body-2-medium text-secondary counters
 *   actions     under a hairline: the "I'll be there" pill toggle
 *               (`aria-pressed` + `accessibilityState.selected`), then small
 *               secondary "Share" and "Contact support group" buttons; wraps
 *
 * PRIVACY: the card takes `area`, never an address. Precision is decided
 * upstream; see `docs/eviction.mdx`.
 */
function EvictionReportCardComponent({
  date,
  time,
  relativeLabel,
  status,
  statusLabel,
  area,
  household,
  description,
  numberOfLines = 3,
  attendeesLabel,
  organisationsLabel,
  attending = false,
  onAttendingChange,
  attendLabel = "I'll be there",
  onShare,
  shareLabel = 'Share',
  onContactSupport,
  contactSupportLabel = 'Contact support group',
  verified = false,
  verifiedLabel = 'Community verified',
  headingLevel = 3,
  style,
  testID,
}: EvictionReportCardProps) {
  const theme = useTheme();
  const palette = useHousingPalette();
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const info = EVICTION_STATUS[status];
  const statusText = useMemo(
    () =>
      info.tone === 'default'
        ? palette.textSecondary
        : resolveAccentColors(theme.colors, info.tone, 'outlined').foreground,
    [theme, info.tone, palette.textSecondary],
  );
  const verifiedColor = resolveAccentColors(theme.colors, 'success', 'outlined').foreground;

  const hasSupport = Boolean(attendeesLabel || organisationsLabel);
  const hasActions = Boolean(onAttendingChange || onShare || onContactSupport);

  return (
    <HousingCard style={[{ gap: 16 }, style]} testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Badge
          content={statusLabel ?? info.label}
          color={info.tone}
          variant={info.fill}
          size="medium"
          testID={id('status')}
        />
        {verified ? (
          <View
            accessible
            accessibilityLabel={verifiedLabel}
            testID={id('verified')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 }}
          >
            <RiShieldCheckFill width={14} height={14} fill={verifiedColor} />
            <Text variant="caption-1-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
              {verifiedLabel}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{ gap: 4 }}>
        <Text
          role="heading"
          aria-level={headingLevel}
          variant="title-2-semibold"
          style={{ color: palette.text }}
          testID={id('date')}
        >
          {date}
        </Text>
        {time || relativeLabel ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 2 }}>
            {time ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <RiTimeLine width={16} height={16} fill={palette.textSecondary} />
                <Text variant="body-medium" style={{ color: palette.text }} testID={id('time')}>
                  {time}
                </Text>
              </View>
            ) : null}
            {time && relativeLabel ? (
              <Text
                variant="body-2-regular"
                accessibilityElementsHidden
                importantForAccessibility="no"
                style={{ color: palette.textSecondary }}
              >
                ·
              </Text>
            ) : null}
            {relativeLabel ? (
              <Text variant="body-2-semibold" style={{ color: statusText }} testID={id('relative')}>
                {relativeLabel}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} testID={id('area')}>
        <RiMapPinLine width={16} height={16} fill={palette.textSecondary} />
        <Text variant="body-medium" numberOfLines={2} style={{ color: palette.text, flexShrink: 1 }}>
          {area}
        </Text>
      </View>

      {household && household.length > 0 ? (
        <View role="list" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} testID={id('household')}>
          {household.map((item, index) => (
            <View key={`${item}-${index}`} role="listitem">
              <Chip size="small" variant="subtle" color="default">
                {item}
              </Chip>
            </View>
          ))}
        </View>
      ) : null}

      {description ? (
        <Text
          variant="body-regular"
          numberOfLines={numberOfLines > 0 ? numberOfLines : undefined}
          style={{ color: palette.text }}
          testID={id('description')}
        >
          {description}
        </Text>
      ) : null}

      {hasSupport ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 6 }} testID={id('support')}>
          {attendeesLabel ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <RiGroupLine width={16} height={16} fill={palette.textSecondary} />
              <Text variant="body-2-medium" style={{ color: palette.textSecondary }}>
                {attendeesLabel}
              </Text>
            </View>
          ) : null}
          {organisationsLabel ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <RiHandHeartLine width={16} height={16} fill={palette.textSecondary} />
              <Text variant="body-2-medium" style={{ color: palette.textSecondary }}>
                {organisationsLabel}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {hasActions ? (
        <View
          testID={id('actions')}
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 8,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: palette.hairline,
          }}
        >
          {onAttendingChange ? (
            <HousingToggleButton
              label={attendLabel}
              pressed={attending}
              onPress={() => onAttendingChange(!attending)}
              icon={RiHandHeartLine}
              pressedIcon={RiCheckLine}
              testID={id('attend')}
            />
          ) : null}
          {onShare ? (
            <Button variant="secondary" size="small" leadingIcon={RiShareLine} onPress={onShare} testID={id('share')}>
              {shareLabel}
            </Button>
          ) : null}
          {onContactSupport ? (
            <Button
              variant="secondary"
              size="small"
              leadingIcon={RiChat3Line}
              onPress={onContactSupport}
              testID={id('contact')}
            >
              {contactSupportLabel}
            </Button>
          ) : null}
        </View>
      ) : null}
    </HousingCard>
  );
}

export const EvictionReportCard = memo(EvictionReportCardComponent);
EvictionReportCard.displayName = 'EvictionReportCard';
