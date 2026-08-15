import React, { memo } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';

import { Card } from '../card';
import { borderRadius } from '../styles/tokens';
import { Avatar } from '../avatar';
import { AvatarGroup } from '../avatar-group';
import { DotGridMeter } from '../dot-grid-meter';
import { StatBar } from '../stat-bar';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import type { ThemeColors } from '../theme/types';
import type { AvatarRingConfig } from '../avatar/types';
import type {
  ProfileCardMetric,
  ProfileCardProps,
  ProfileCardVariant,
} from './types';

const WIDGET_WIDTH = 240;
const CARD_PADDING = 18;
const AVATAR_SIZE = 54;
const FOOTER_AVATAR_SIZE = 30;

/**
 * Vivid per-variant accent, drawn from the theme's semantic tokens so it tracks
 * the active Bloom preset. Every accent stays overridable per-prop.
 */
function variantAccent(variant: ProfileCardVariant, colors: ThemeColors): string {
  switch (variant) {
    case 'wallet':
      return colors.success;
    case 'shopping':
      return colors.warning;
    case 'social':
      return colors.primary;
    case 'stat':
    default:
      return colors.info;
  }
}

function AvatarWithBadge({
  source,
  name,
  ring,
  badge,
  haloColor,
}: {
  source?: string | null;
  name?: string;
  ring: AvatarRingConfig;
  badge?: React.ReactNode;
  haloColor: string;
}) {
  return (
    <View style={styles.avatarWrap}>
      <Avatar source={source ?? undefined} name={name} size={AVATAR_SIZE} ring={ring} />
      {badge != null && (
        <View style={[styles.badgeHalo, { backgroundColor: haloColor }]}>{badge}</View>
      )}
    </View>
  );
}

function MetricSection({
  metric,
  accent,
  labelColor,
}: {
  metric: ProfileCardMetric;
  accent: string;
  labelColor: string;
}) {
  switch (metric.kind) {
    case 'dots':
      return (
        <View style={styles.section}>
          {metric.label != null && (
            <Text style={[styles.sectionLabel, { color: labelColor }]} numberOfLines={1}>
              {metric.label}
            </Text>
          )}
          <DotGridMeter
            filled={metric.filled}
            total={metric.total}
            columns={metric.total}
            dotSize={9}
            gap={6}
            filledColor={metric.filledColor ?? accent}
          />
        </View>
      );
    case 'progress':
      return (
        <StatBar
          variant="progress"
          label={metric.label}
          value={metric.value}
          max={metric.max}
          minLabel={metric.minLabel}
          maxLabel={metric.maxLabel}
          icon={metric.icon}
          fillColor={metric.fillColor ?? accent}
        />
      );
    case 'split':
      return (
        <StatBar
          variant="split"
          label={metric.label}
          percent={metric.percent}
          leftValue={metric.leftValue}
          rightValue={metric.rightValue}
          fillColor={metric.fillColor ?? accent}
        />
      );
    case 'custom':
    default:
      return <>{metric.node}</>;
  }
}

/**
 * A composed profile "widget" card — the Apple-Watch-style stat card. Fully
 * app-agnostic: it takes pre-formatted strings, colors, and `ReactNode` icons
 * (no domain/currency logic). Built on {@link Card}, {@link Avatar} (ring +
 * badge), {@link DotGridMeter}/{@link StatBar}, and an {@link AvatarGroup}
 * facepile (overlapping stack).
 *
 * Theme-driven (Bloom's `useTheme()` reads the same NativeWind token pipeline
 * that backs the `--*` vars): the surface is the theme's `background` — the
 * darkest token, a near-black in dark mode — with a hairline `border` so it
 * separates on any page, and the metric tracks read from `backgroundSecondary`,
 * a step lighter, so they always show. `variant` picks a vivid semantic accent
 * (success/warning/info/primary), overridable per-prop.
 */
const ProfileCardComponent: React.FC<ProfileCardProps> = ({
  layout = 'widget',
  variant = 'stat',
  avatar,
  value,
  subtitle,
  headlineIcon,
  metric,
  footer,
  onPress,
  style,
  testID,
}) => {
  const { colors } = useTheme();
  const accent = variantAccent(variant, colors);
  const isWide = layout === 'wide';

  // Consumer ring wins for color; default to the accent, always with a small
  // gap so the ring reads as a distinct halo (as in the reference).
  const ring: AvatarRingConfig = { colors: accent, width: 2, gap: 2, ...avatar.ring };

  // Chrome (border, rung) is `Card`'s. The background is deliberately NOT the
  // `card` role: this widget sits ON a card surface in the reference, so it
  // takes the page background to read as a cut-out rather than a stacked card.
  const surfaceStyle: ViewStyle = {
    width: isWide ? '100%' : WIDGET_WIDTH,
    padding: CARD_PADDING,
    backgroundColor: colors.background,
    borderCurve: 'continuous',
  };

  const headline = (
    <>
      <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
      {subtitle != null && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </>
  );

  const metricNode =
    metric != null ? (
      <MetricSection metric={metric} accent={accent} labelColor={colors.textSecondary} />
    ) : null;

  const footerNode =
    footer != null ? (
      <View style={styles.section}>
        {footer.label != null && (
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]} numberOfLines={1}>
            {footer.label}
          </Text>
        )}
        <AvatarGroup
          layout="stack"
          items={footer.items}
          size={FOOTER_AVATAR_SIZE}
          max={footer.max ?? 4}
          showInitials
        />
      </View>
    ) : null;

  return (
    <Card
      variant="outlined"
      radius="radius-28"
      onPress={onPress}
      style={[surfaceStyle, style]}
      testID={testID}
    >
      <View style={styles.body}>
        {isWide ? (
          <View style={styles.headerRowWide}>
            <AvatarWithBadge
              source={avatar.source}
              name={avatar.name}
              ring={ring}
              badge={avatar.badge}
              haloColor={colors.background}
            />
            <View style={styles.wideValueRow}>
              <View style={styles.headlineColumn}>{headline}</View>
              {headlineIcon != null && <View style={styles.wideIcon}>{headlineIcon}</View>}
            </View>
          </View>
        ) : (
          <View style={styles.headerRow}>
            <AvatarWithBadge
              source={avatar.source}
              name={avatar.name}
              ring={ring}
              badge={avatar.badge}
              haloColor={colors.background}
            />
            <View style={styles.headlineColumn}>{headline}</View>
          </View>
        )}

        {metricNode}
        {footerNode}
      </View>

      {!isWide && headlineIcon != null && <View style={styles.floatingIcon}>{headlineIcon}</View>}
    </Card>
  );
};

const styles = StyleSheet.create({
  body: { gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRowWide: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headlineColumn: { flex: 1, minWidth: 0 },
  wideValueRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  wideIcon: { marginLeft: 8 },
  value: { fontSize: 27, fontWeight: '800', letterSpacing: -0.6, fontVariant: ['tabular-nums'] },
  subtitle: { marginTop: 2, fontSize: 13, fontWeight: '500', fontVariant: ['tabular-nums'] },
  section: { gap: 10 },
  sectionLabel: { fontSize: 13, fontWeight: '500' },
  avatarWrap: { position: 'relative' },
  badgeHalo: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    padding: 2,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingIcon: { position: 'absolute', top: CARD_PADDING, right: CARD_PADDING },
});

export const ProfileCard = memo(ProfileCardComponent);
ProfileCard.displayName = 'ProfileCard';
