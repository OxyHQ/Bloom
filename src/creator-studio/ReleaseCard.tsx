import React, { memo, useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { mixColor, resolveButtonRamps } from '../button/shared';
import { Button } from '../button';
import { Chip } from '../chip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiAlbumLine } from '../icons/remix/RiAlbumLine';
import { RiErrorWarningLine } from '../icons/remix/RiErrorWarningLine';
import { RiMoreFill } from '../icons/remix/RiMoreFill';
import { useImageResolver } from '../image-resolver/context';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  CARD_RADIUS,
  COVER_RADIUS,
  CREATOR_STUDIO_CSS,
  CREATOR_STUDIO_STYLE_ID,
  isImageUrl,
  pressDataSet,
  RELEASE_STATUS_LABELS,
  RELEASE_STATUS_TONES,
  RELEASE_TYPE_LABELS,
  releaseStatusNeedsReason,
  resolveCreatorStudioPaint,
} from './shared';
import type { ReleaseCardLabels, ReleaseCardProps, ReleaseStatusBadgeProps } from './types';

/**
 * `ReleaseStatusBadge`: a release's distribution status as a `Chip` — the
 * tone per status is `RELEASE_STATUS_TONES` (draft default, in review warning,
 * scheduled info, live success, rejected error, taken down error outlined).
 */
export function ReleaseStatusBadge({ status, label, size = 'small', testID }: ReleaseStatusBadgeProps) {
  const { tone, fill } = RELEASE_STATUS_TONES[status];
  return (
    <Chip size={size} color={tone} variant={fill} testID={testID}>
      {label ?? RELEASE_STATUS_LABELS[status]}
    </Chip>
  );
}

export const RELEASE_CARD_LABELS: ReleaseCardLabels = {
  types: RELEASE_TYPE_LABELS,
  statuses: RELEASE_STATUS_LABELS,
  tracks: (count) => `${count} ${count === 1 ? 'track' : 'tracks'}`,
  actions: (title) => `More actions for ${title}`,
};

/**
 * `ReleaseCard`: one release in the catalog.
 *
 *   card     radius 16, padding 12 (longhands), background-secondary; hovering
 *            the pressable part deepens it (neutral-200 at 50% / neutral-800)
 *   grid     square cover (radius 12) → 12 → title `body-medium` + artist
 *            `body-2-regular` → meta `caption-1-regular` text-tertiary
 *            ("Single · 14 Mar 2026 · 4 tracks") → 10 → status badge and the
 *            "⋯" menu button on one row
 *   row      64px cover, the same text column, badge and menu on the right
 *   reason   rejected / taken down with a `statusReason`: an error-tinted note
 *            (radius 10, 16px warning glyph, `body-2-regular`) under the rest
 *
 * `onPress` makes the cover and text ONE pressable named by the title; the menu
 * button is its sibling, never nested inside it.
 */
function ReleaseCardComponent({
  release,
  layout = 'grid',
  onPress,
  actions = [],
  labels: labelOverrides,
  style,
  testID,
}: ReleaseCardProps) {
  const theme = useTheme();
  useInteractiveWebCss(CREATOR_STUDIO_STYLE_ID, CREATOR_STUDIO_CSS);
  const paint = useMemo(() => resolveCreatorStudioPaint(theme), [theme]);
  const hoverSurface = useMemo(() => {
    const { neutral: n } = resolveButtonRamps(theme);
    return theme.isDark ? n[800] : mixColor(paint.surface, n[200], 0.5);
  }, [theme, paint.surface]);
  const labels = { ...RELEASE_CARD_LABELS, ...labelOverrides };
  const { state: hovered, onIn, onOut } = useInteractionState();
  const resolver = useImageResolver();

  const uri = release.artwork
    ? isImageUrl(release.artwork)
      ? release.artwork
      : resolver?.(release.artwork, 'cover')
    : undefined;
  const row = layout === 'row';
  const meta = [labels.types[release.type], release.releaseDate, labels.tracks(release.trackCount)].join(' · ');
  const reason = releaseStatusNeedsReason(release.status) ? release.statusReason : undefined;

  const cover = (
    <View
      testID={testID ? `${testID}-cover` : undefined}
      style={[row ? styles.rowCover : styles.gridCover, { backgroundColor: paint.placeholder }]}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.coverImage} accessibilityIgnoresInvertColors />
      ) : (
        <RiAlbumLine width={row ? 24 : 40} height={row ? 24 : 40} fill={paint.placeholderIcon} />
      )}
    </View>
  );

  const text = (
    <View style={styles.text}>
      <Text variant="body-medium" numberOfLines={1} style={{ color: paint.text }}>
        {release.title}
      </Text>
      {release.artist ? (
        <Text variant="body-2-regular" numberOfLines={1} style={{ color: paint.textSecondary }}>
          {release.artist}
        </Text>
      ) : null}
      <Text variant="caption-1-regular" numberOfLines={1} style={{ color: paint.textTertiary, marginTop: 2 }}>
        {meta}
      </Text>
    </View>
  );

  const main = (
    <>
      {cover}
      {text}
    </>
  );

  const ringStyle: WebCssStyle = { '--bloom-studio-ring': paint.accent };
  const pressable = onPress ? (
    <Pressable
      {...pressDataSet()}
      accessibilityRole="button"
      accessibilityLabel={release.title}
      onPress={onPress}
      onHoverIn={onIn}
      onHoverOut={onOut}
      testID={testID ? `${testID}-open` : undefined}
      style={[row ? styles.rowMain : styles.gridMain, ringStyle, { borderRadius: COVER_RADIUS }]}
    >
      {main}
    </Pressable>
  ) : (
    <View style={row ? styles.rowMain : styles.gridMain}>{main}</View>
  );

  const menu =
    actions.length > 0 ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild label={labels.actions(release.title)}>
          <Button
            variant="secondary"
            size="small"
            iconOnly
            leadingIcon={RiMoreFill}
            accessibilityLabel={labels.actions(release.title)}
            testID={testID ? `${testID}-actions` : undefined}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent minWidth={180}>
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <DropdownMenuItem
                key={action.label}
                onPress={action.onPress}
                disabled={action.disabled}
                variant={action.destructive ? 'destructive' : 'default'}
                leading={Icon ? <Icon width={16} height={16} fill={action.destructive ? paint.error : paint.textSecondary} /> : undefined}
              >
                {action.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null;

  const badge = (
    <ReleaseStatusBadge
      status={release.status}
      label={labels.statuses[release.status]}
      testID={testID ? `${testID}-status` : undefined}
    />
  );

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        { backgroundColor: hovered ? hoverSurface : paint.surface },
        style,
      ]}
    >
      {row ? (
        <View style={styles.rowLayout}>
          {pressable}
          <View style={styles.rowAside}>
            {badge}
            {menu}
          </View>
        </View>
      ) : (
        <>
          {pressable}
          <View style={styles.gridFooter}>
            {badge}
            {menu}
          </View>
        </>
      )}
      {reason ? (
        <View
          testID={testID ? `${testID}-reason` : undefined}
          style={[styles.reason, { backgroundColor: paint.errorSurface }]}
        >
          <RiErrorWarningLine width={16} height={16} fill={paint.error} />
          <Text variant="body-2-regular" style={[styles.reasonText, { color: paint.error }]}>
            {reason}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export const ReleaseCard = memo(ReleaseCardComponent);
ReleaseCard.displayName = 'ReleaseCard';

const styles = StyleSheet.create({
  card: {
    borderRadius: CARD_RADIUS,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 12,
    gap: 10,
    minWidth: 0,
  },
  gridMain: { gap: 12, minWidth: 0 },
  gridCover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: COVER_RADIUS,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCover: {
    width: 64,
    height: 64,
    borderRadius: COVER_RADIUS,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  coverImage: { width: '100%', height: '100%' },
  text: { minWidth: 0, flexShrink: 1, gap: 2 },
  gridFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 32,
  },
  rowLayout: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowAside: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  reason: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 10,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
  },
  reasonText: { flex: 1, minWidth: 0 },
});
