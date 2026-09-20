import React, { memo, useEffect, useMemo } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { Avatar } from '../avatar';
import { Button } from '../button';
import { Chip } from '../chip';
import { RiArrowLeftLine, RiArrowRightLine } from '../icons/remix';
import { ChevronDownSmall } from '../sidebar/parts';
import { resolveDashboardSurfaces } from '../stat-cards/tones';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { RecentHire, RecentHiresCardProps } from './types';

/**
 * The "Recent hires" card:
 *
 *   card        329 tall, radius 16, padding 8, background-secondary
 *   header      padding 8 8 0 (pt-2 px-2), space-between, top-aligned
 *               label body-medium text-secondary → 2 → count title-1-medium
 *               team switcher: body-medium text-primary + 16px chevron
 *               (text-secondary), gap 6, px 2, radius 10
 *   grid        11 under the header, 2 × 2, gap 8, the rows share what is left
 *   person      radius 10, padding 10, background-inner, shadow-card,
 *               space-between: avatar 36 + (name body-medium / joined
 *               body-2-medium text-secondary, both truncating), gap 8; then
 *               the role chip — caption, full width, centred,
 *               background-recent-hire-role, text-secondary
 *   pagination  8 under the grid: two small secondary buttons, gap 8, each
 *               half the width (arrow-left leading / arrow-right trailing)
 *
 *   surface/inset/role use card / backgroundSecondary / backgroundTertiary;
 *   secondary labels use the authored textSecondary role in both modes.
 */

const IS_WEB = Platform.OS === 'web';
const CARD_HEIGHT = 329;

const STYLE_ID = 'bloom-recent-hires-card-web-css';
const TEAM_SELECTOR = '[data-bloom-recent-hires-team]';
const RECENT_HIRES_CSS = `${TEAM_SELECTOR} { cursor: pointer; outline: none; }
${TEAM_SELECTOR}:focus-visible { box-shadow: 0 0 0 2px var(--bloom-recent-hires-ring, currentColor); }`;

type WebDataSet = { dataSet?: Record<string, string> };

interface RecentHiresPalette {
  surface: string;
  inner: string;
  role: string;
  text: string;
  textSecondary: string;
  cardShadow: string;
  ring: string;
}

export function resolveRecentHiresPalette(theme: Theme): RecentHiresPalette {
  const surfaces = resolveDashboardSurfaces(theme);
  return {
    surface: surfaces.secondary,
    inner: surfaces.inner,
    role: theme.colors.backgroundTertiary,
    text: surfaces.text,
    textSecondary: surfaces.textSecondary,
    cardShadow: surfaces.cardShadow,
    ring: surfaces.focusRing,
  };
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function HireCard({
  hire,
  palette,
  testID,
}: {
  hire: RecentHire;
  palette: RecentHiresPalette;
  testID?: string;
}) {
  const photo = hire.avatar != null;
  return (
    <View
      testID={testID}
      style={[
        {
          flex: 1,
          minWidth: 0,
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          borderRadius: 10,
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 10,
          paddingRight: 10,
          backgroundColor: palette.inner,
        },
        { boxShadow: palette.cardShadow } as WebCssStyle,
      ]}
    >
      <View style={{ width: '100%', minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Avatar
          size="lg"
          source={photo ? hire.avatar : undefined}
          alt={hire.name}
          initials={photo ? undefined : (hire.initials ?? initialsOf(hire.name))}
          color={hire.avatarColor}
        />
        <View style={{ flex: 1, minWidth: 0, justifyContent: 'center', alignItems: 'flex-start' }}>
          <Text variant="body-medium" numberOfLines={1} style={{ width: '100%', color: palette.text }}>
            {hire.name}
          </Text>
          <Text variant="body-2-medium" numberOfLines={1} style={{ width: '100%', color: palette.textSecondary }}>
            {hire.joined}
          </Text>
        </View>
      </View>
      <Chip
        size="sm"
        style={{ alignSelf: 'stretch', justifyContent: 'center', backgroundColor: palette.role }}
        textStyle={{ color: palette.textSecondary }}
        testID={testID ? `${testID}-role` : undefined}
      >
        {hire.role}
      </Chip>
    </View>
  );
}

const RecentHiresCardComponent: React.FC<RecentHiresCardProps> = ({
  hires,
  title = 'Recent hires',
  count,
  teamLabel,
  onTeamPress,
  teamAccessibilityLabel,
  previousLabel = 'Previous',
  nextLabel = 'Next',
  onPreviousPress,
  onNextPress,
  previousDisabled,
  nextDisabled,
  height = CARD_HEIGHT,
  style,
  testID,
}) => {
  const theme = useTheme();
  const palette = useMemo(() => resolveRecentHiresPalette(theme), [theme]);

  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(STYLE_ID, RECENT_HIRES_CSS);
  }, []);

  // `grid-cols-2 grid-rows-2`: two rows of two, sharing the height left over.
  const rows = [hires.slice(0, 2), hires.slice(2, 4)].filter((row) => row.length > 0);
  const teamHook: WebDataSet = IS_WEB ? { dataSet: { bloomRecentHiresTeam: '' } } : {};

  return (
    <View
      testID={testID}
      style={[
        {
          height: height === 'auto' ? undefined : height,
          minWidth: 0,
          borderRadius: 16,
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 8,
          paddingRight: 8,
          backgroundColor: palette.surface,
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          paddingTop: 8,
          paddingLeft: 8,
          paddingRight: 8,
        }}
      >
        <View style={{ minWidth: 0, flexShrink: 1, gap: 2 }}>
          <Text variant="body-medium" style={{ color: palette.textSecondary }}>
            {title}
          </Text>
          <Text variant="title-1-medium" numberOfLines={1} style={{ color: palette.text }} testID={testID ? `${testID}-count` : undefined}>
            {count}
          </Text>
        </View>
        {teamLabel != null ? (
          <Pressable
            {...teamHook}
            role="button"
            accessibilityLabel={teamAccessibilityLabel ?? teamLabel}
            onPress={onTeamPress}
            testID={testID ? `${testID}-team` : undefined}
            style={
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                borderRadius: 10,
                paddingLeft: 2,
                paddingRight: 2,
                '--bloom-recent-hires-ring': palette.ring,
              } as WebCssStyle
            }
          >
            <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
              {teamLabel}
            </Text>
            <ChevronDownSmall color={palette.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <View style={{ marginTop: 11, flex: height === 'auto' ? undefined : 1, minHeight: 0, gap: 8 }}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={{ flex: height === 'auto' ? undefined : 1, minHeight: 0, flexDirection: 'row', gap: 8 }}>
            {row.map((hire, index) => (
              <HireCard
                key={hire.id ?? hire.name}
                hire={hire}
                palette={palette}
                testID={testID ? `${testID}-hire-${rowIndex * 2 + index}` : undefined}
              />
            ))}
            {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
          </View>
        ))}
      </View>

      <View style={{ marginTop: 8, width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Button size="sm" leadingIcon={RiArrowLeftLine} onPress={onPreviousPress} disabled={previousDisabled} style={{ flex: 1 }} testID={testID ? `${testID}-previous` : undefined} appearance="subtle" tone="neutral">
          {previousLabel}
        </Button>
        <Button size="sm" trailingIcon={RiArrowRightLine} onPress={onNextPress} disabled={nextDisabled} style={{ flex: 1 }} testID={testID ? `${testID}-next` : undefined} appearance="subtle" tone="neutral">
          {nextLabel}
        </Button>
      </View>
    </View>
  );
};

export const RecentHiresCard = memo(RecentHiresCardComponent);
RecentHiresCard.displayName = 'RecentHiresCard';
