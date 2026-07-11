import React, { memo } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';

import { Card } from '../card';
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
const CARD_PADDING = 16;
const CARD_RADIUS = 24;
const AVATAR_SIZE = 52;
const FOOTER_AVATAR_SIZE = 28;

interface VariantAccents {
  ring: string;
  fill: string;
  dots: string;
}

function variantAccents(variant: ProfileCardVariant, colors: ThemeColors): VariantAccents {
  switch (variant) {
    case 'wallet':
      return { ring: colors.success, fill: colors.primary, dots: colors.success };
    case 'shopping':
      return { ring: colors.info, fill: colors.info, dots: colors.info };
    case 'social':
      return { ring: colors.primary, fill: colors.primary, dots: colors.primary };
    case 'stat':
    default:
      return { ring: colors.primary, fill: colors.primary, dots: colors.primary };
  }
}

function AvatarWithBadge({
  source,
  name,
  ring,
  badge,
}: {
  source?: string | null;
  name?: string;
  ring: AvatarRingConfig;
  badge?: React.ReactNode;
}) {
  return (
    <View style={styles.avatarWrap}>
      <Avatar source={source ?? undefined} name={name} size={AVATAR_SIZE} ring={ring} />
      {badge != null && (
        <View
          style={[
            styles.badge,
            { width: Math.round(AVATAR_SIZE * 0.34), height: Math.round(AVATAR_SIZE * 0.34) },
          ]}
        >
          {badge}
        </View>
      )}
    </View>
  );
}

function MetricSection({
  metric,
  accents,
  labelColor,
}: {
  metric: ProfileCardMetric;
  accents: VariantAccents;
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
            filledColor={metric.filledColor ?? accents.dots}
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
          fillColor={metric.fillColor ?? accents.fill}
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
          fillColor={metric.fillColor ?? accents.fill}
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
 * badge), {@link DotGridMeter}/{@link StatBar}, and a {@link AvatarGroup} row.
 *
 * `variant` only picks sensible accent defaults (ring + metric fill); every
 * accent stays overridable via the individual props.
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
  const accents = variantAccents(variant, colors);
  const isWide = layout === 'wide';

  const ring: AvatarRingConfig = avatar.ring ?? { colors: accents.ring, width: 2, gap: 2 };

  const surfaceStyle: ViewStyle = {
    width: isWide ? '100%' : WIDGET_WIDTH,
    padding: CARD_PADDING,
    borderRadius: CARD_RADIUS,
    borderCurve: 'continuous',
  };

  const headline = (
    <>
      <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
      {subtitle != null && (
        <Text style={[styles.subtitle, { color: colors.textTertiary }]} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </>
  );

  const metricNode =
    metric != null ? (
      <MetricSection metric={metric} accents={accents} labelColor={colors.textTertiary} />
    ) : null;

  const footerNode =
    footer != null ? (
      <View style={styles.section}>
        {footer.label != null && (
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]} numberOfLines={1}>
            {footer.label}
          </Text>
        )}
        <AvatarGroup
          layout="row"
          items={footer.items}
          size={FOOTER_AVATAR_SIZE}
          max={footer.max ?? 4}
        />
      </View>
    ) : null;

  return (
    <Card
      variant="filled"
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
  body: {
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRowWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headlineColumn: {
    flex: 1,
    minWidth: 0,
  },
  wideValueRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wideIcon: {
    marginLeft: 8,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  avatarWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingIcon: {
    position: 'absolute',
    top: CARD_PADDING,
    right: CARD_PADDING,
  },
});

export const ProfileCard = memo(ProfileCardComponent);
ProfileCard.displayName = 'ProfileCard';
