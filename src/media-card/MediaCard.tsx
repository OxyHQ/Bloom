import React, { memo, useCallback, useMemo, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { PlayButton } from '../media-controls';
import { Box as SkeletonBox, Circle as SkeletonCircle } from '../skeleton';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { TypeScaleVariant } from '../typography/scale';
import { Artwork, CardLink, CardMenu, hasMenu, useMediaCardCss } from './parts';
import {
  composeName,
  IS_WEB,
  ROW_ARTWORK,
  ROW_PADDING,
  ROW_RADIUS,
  resolveMediaCardPaint,
  resolvePlayVisibility,
  squareRadius,
  TEXT_GAP,
  TILE_ARTWORK,
  TILE_PADDING,
  TILE_RADIUS,
} from './shared';
import type { MediaCardLayout, MediaCardProps, MediaCardSize } from './types';

/**
 * The anatomy every music card shares.
 *
 *   tile   padding 12, radius 16 wash; the cover (200 / 160 / 120 square,
 *          radius 8 — 6 at small), 12 below it the text: an optional eyebrow
 *          (caption), the title (body-semibold; body-2-semibold at small),
 *          the subtitle and meta lines (body-2-regular, text-secondary).
 *          The play button (accent, 48; 32 at small) sits 8 in from the
 *          cover's bottom-right. "More options" trails the title.
 *   row    padding 8, radius 12 wash; a 56 cover (48 at small), 12 right of it
 *          the text, then `trailing`, then "More options". The play button
 *          (inverse, 32) is centred on the cover.
 *
 * Hover (web) paints the wash — text over background at 6% — and reveals the
 * play button (fade + an 8px rise) and the menu trigger; keyboard focus inside
 * the card reveals them too. Colour and opacity only, never scale. Reduced
 * motion drops the rise and the transition. Native draws the menu trigger
 * always and the play button only while it is `playing`/`loading`/`current`
 * (or with `playButton="always"`); a long press opens the menu.
 *
 * The press target is a link laid UNDER the content — see `CardLink`.
 */

export const TITLE_VARIANT: Record<MediaCardSize, TypeScaleVariant> = {
  large: 'body-semibold',
  medium: 'body-semibold',
  small: 'body-2-semibold',
};
export const SUBTITLE_VARIANT: Record<MediaCardSize, TypeScaleVariant> = {
  large: 'body-2-regular',
  medium: 'body-2-regular',
  small: 'caption-1-regular',
};

export function resolveArtworkBox(
  size: MediaCardSize,
  layout: MediaCardLayout,
  aspectRatio = 1,
  override?: number,
): { width: number; height: number } {
  const side = override ?? (layout === 'row' ? ROW_ARTWORK[size] : TILE_ARTWORK[size]);
  return { width: side, height: Math.round(side / aspectRatio) };
}

// ---------------------------------------------------------------------------
//  Skeleton
// ---------------------------------------------------------------------------

export function MediaCardSkeleton({
  size = 'medium',
  layout = 'tile',
  round = false,
  aspectRatio = 1,
  artworkSize,
  radius,
  style,
  testID,
}: {
  size?: MediaCardSize;
  layout?: MediaCardLayout;
  round?: boolean;
  aspectRatio?: number;
  artworkSize?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const box = resolveArtworkBox(size, layout, aspectRatio, artworkSize);
  const row = layout === 'row';
  const padding = row ? ROW_PADDING : TILE_PADDING;
  const art = round ? (
    <SkeletonCircle size={box.width} />
  ) : (
    <SkeletonBox width={box.width} height={box.height} borderRadius={radius ?? squareRadius(size, layout)} />
  );
  return (
    <View
      aria-busy
      accessibilityLabel="Loading"
      style={[
        {
          flexDirection: row ? 'row' : 'column',
          alignItems: row ? 'center' : 'flex-start',
          paddingLeft: padding,
          paddingRight: padding,
          paddingTop: padding,
          paddingBottom: padding,
          width: row ? undefined : box.width + padding * 2,
        },
        style,
      ]}
      testID={testID}
    >
      {art}
      <View
        style={{
          flex: row ? 1 : undefined,
          alignSelf: 'stretch',
          justifyContent: 'center',
          marginTop: row ? 0 : TEXT_GAP,
          marginLeft: row ? TEXT_GAP : 0,
          gap: 8,
        }}
      >
        <SkeletonBox width={row ? '40%' : '80%'} height={12} borderRadius={4} />
        <SkeletonBox width={row ? '25%' : '55%'} height={10} borderRadius={4} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Card
// ---------------------------------------------------------------------------

function MediaCardComponent(props: MediaCardProps) {
  const {
    title,
    subtitle,
    meta,
    typeLabel,
    eyebrow,
    description,
    artwork,
    artworkVariant,
    artworkColor,
    artworkShape = 'square',
    artworkRadius,
    artworkAspectRatio = 1,
    artworkSize,
    renderArtwork,
    artworkOverlay,
    placeholderIcon,
    titleLeading,
    titleAccessory,
    titleAccessoryLabel,
    titleLines = 1,
    subtitleLines = 1,
    interactiveSubtitle = false,
    trailing,
    footer,
    accessibilityDetail,
    centered = false,
    rowAlign = 'center',
    onPress,
    href,
    onPlay,
    playing = false,
    loading = false,
    current = false,
    playButton = 'auto',
    menuItems,
    menu,
    menuLabel,
    size = 'medium',
    layout = 'tile',
    selected = false,
    skeleton = false,
    accessibilityLabel,
    style,
    testID,
  } = props;
  const theme = useTheme();
  useMediaCardCss();
  const paint = useMemo(() => resolveMediaCardPaint(theme), [theme]);
  const [menuOpen, setMenuOpen] = useState(false);
  const withMenu = hasMenu(menu, menuItems);
  const openMenu = useCallback(() => setMenuOpen(true), []);

  if (skeleton) {
    return (
      <MediaCardSkeleton
        size={size}
        layout={layout}
        round={artworkShape === 'round'}
        aspectRatio={artworkAspectRatio}
        artworkSize={artworkSize}
        radius={artworkRadius}
        style={style}
        testID={testID}
      />
    );
  }

  const row = layout === 'row';
  const round = artworkShape === 'round';
  const box = resolveArtworkBox(size, layout, artworkAspectRatio, artworkSize);
  const radius = artworkRadius ?? squareRadius(size, layout);
  const padding = row ? ROW_PADDING : TILE_PADDING;
  const cardRadius = row ? ROW_RADIUS : TILE_RADIUS;
  const interactive = Boolean(onPress || href);

  const name =
    accessibilityLabel ??
    composeName([
      title,
      titleAccessoryLabel,
      typeLabel,
      typeof subtitle === 'string' ? subtitle : undefined,
      ...(meta ?? []),
      accessibilityDetail,
      current && playing ? 'Now playing' : undefined,
    ]);

  const visibility = resolvePlayVisibility({
    mode: playButton,
    hasOnPlay: Boolean(onPlay),
    playing,
    loading,
    current,
  });

  const play =
    visibility === 'none' ? null : (
      <View
        {...webDataSet(visibility === 'hover' ? { bloomMediaCardReveal: 'hover', bloomMediaCardPlay: '' } : { bloomMediaCardPlay: '' })}
        style={
          row
            ? { position: 'absolute', top: 0, left: 0, width: box.width, height: box.height, alignItems: 'center', justifyContent: 'center' }
            : { position: 'absolute', right: 8, bottom: 8 }
        }
        pointerEvents="box-none"
        testID={testID ? `${testID}-play` : undefined}
      >
        <PlayButton
          playing={playing}
          loading={loading}
          onPress={onPlay}
          subject={title}
          size={row || size === 'small' ? 'small' : 'medium'}
          variant={row ? 'inverse' : 'accent'}
        />
      </View>
    );

  const menuNode = withMenu ? (
    <CardMenu
      items={menuItems}
      menu={menu}
      label={menuLabel}
      subject={title}
      open={menuOpen}
      onOpenChange={setMenuOpen}
      reveal={IS_WEB}
      testID={testID}
    />
  ) : null;

  const artworkNode = (
    <View style={{ position: 'relative', width: box.width, height: box.height, flexShrink: 0, alignSelf: centered && !row ? 'center' : undefined }} pointerEvents="box-none">
      <View pointerEvents="none">
        <Artwork
          source={artwork}
          variant={artworkVariant}
          width={box.width}
          height={box.height}
          round={round}
          radius={radius}
          color={artworkColor}
          icon={placeholderIcon}
          paint={paint}
          testID={testID ? `${testID}-artwork` : undefined}
        >
          {renderArtwork ? renderArtwork(box) : null}
        </Artwork>
        {artworkOverlay}
      </View>
      {play}
    </View>
  );

  const titleVariant: TypeScaleVariant = row ? 'body-medium' : TITLE_VARIANT[size];
  const secondaryVariant: TypeScaleVariant = row ? 'body-2-regular' : SUBTITLE_VARIANT[size];
  const align = centered && !row ? 'center' : undefined;

  const subtitleNode =
    subtitle == null || subtitle === '' ? null : typeof subtitle === 'string' ? (
      <Text
        variant={secondaryVariant}
        numberOfLines={subtitleLines}
        style={{ color: paint.textSecondary, textAlign: align }}
      >
        {subtitle}
      </Text>
    ) : (
      subtitle
    );

  const textBlock = (
    <View style={{ flex: 1, minWidth: 0, gap: 2 }} pointerEvents="box-none">
      <View pointerEvents="none" style={{ gap: 2 }}>
        {eyebrow ? (
          <Text variant="caption-1-medium" numberOfLines={1} style={{ color: paint.textSecondary, textAlign: align }}>
            {eyebrow}
          </Text>
        ) : null}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            justifyContent: align === 'center' ? 'center' : undefined,
            paddingRight: !row && withMenu ? 28 : 0,
          }}
        >
          {titleLeading}
          <Text
            variant={titleVariant}
            numberOfLines={titleLines}
            style={{ flexShrink: 1, color: current ? paint.accent : paint.text, textAlign: align }}
            testID={testID ? `${testID}-title` : undefined}
          >
            {title}
          </Text>
          {titleAccessory}
        </View>
        {!interactiveSubtitle ? subtitleNode : null}
        {meta?.map((line, index) =>
          line ? (
            <Text
              key={`${index}-${line}`}
              variant={secondaryVariant}
              numberOfLines={1}
              style={{ color: paint.textSecondary, textAlign: align }}
            >
              {line}
            </Text>
          ) : null,
        )}
        {description ? (
          <Text variant={secondaryVariant} numberOfLines={2} style={{ color: paint.textSecondary, textAlign: align, marginTop: 2 }}>
            {description}
          </Text>
        ) : null}
      </View>
      {interactiveSubtitle ? subtitleNode : null}
    </View>
  );

  const rootStyle: WebCssStyle = {
    position: 'relative',
    paddingLeft: padding,
    paddingRight: padding,
    paddingTop: padding,
    paddingBottom: padding,
    borderRadius: cardRadius,
    backgroundColor: selected ? paint.selected : undefined,
    '--bloom-media-card-hover': selected ? paint.selectedHover : paint.hover,
    ...(row ? null : { width: box.width + padding * 2 }),
  };

  const webHandlers: Record<string, unknown> =
    IS_WEB && withMenu
      ? {
          onContextMenu: (event: { preventDefault: () => void }) => {
            event.preventDefault();
            setMenuOpen(true);
          },
        }
      : {};

  return (
    <View
      {...webDataSet({
        bloomMediaCard: layout,
        ...(interactive ? { bloomMediaCardHover: '' } : null),
        ...(menuOpen ? { bloomMediaCardMenuOpen: '' } : null),
      })}
      {...webHandlers}
      style={[rootStyle, style]}
      testID={testID}
    >
      <CardLink
        name={name}
        onPress={onPress}
        href={href}
        onLongPress={withMenu && !IS_WEB ? openMenu : undefined}
        selected={selected}
        radius={cardRadius}
        paint={paint}
        testID={testID}
      />
      {row ? (
        <View
          style={{ flexDirection: 'row', alignItems: rowAlign === 'top' ? 'flex-start' : 'center', gap: TEXT_GAP }}
          pointerEvents="box-none"
        >
          {artworkNode}
          <View style={{ flex: 1, minWidth: 0 }} pointerEvents="box-none">
            <View
              style={{ flexDirection: 'row', alignItems: rowAlign === 'top' ? 'flex-start' : 'center', gap: TEXT_GAP }}
              pointerEvents="box-none"
            >
              {textBlock}
              {trailing != null ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }} pointerEvents="box-none">
                  {trailing}
                </View>
              ) : null}
              {menuNode}
            </View>
            {footer != null ? (
              <View style={{ marginTop: 8 }} pointerEvents="box-none">
                {footer}
              </View>
            ) : null}
          </View>
        </View>
      ) : (
        <>
          {artworkNode}
          <View style={{ flexDirection: 'row', marginTop: TEXT_GAP }} pointerEvents="box-none">
            {textBlock}
            {menuNode ? (
              <View style={{ position: 'absolute', top: eyebrow ? 10 : -6, right: -8 }} pointerEvents="box-none">
                {menuNode}
              </View>
            ) : null}
          </View>
          {footer != null ? (
            <View style={{ marginTop: 8 }} pointerEvents="box-none">
              {footer}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

/**
 * The shared card. The typed cards (`SongCard`, `AlbumCard` …) are this with
 * their own lines, cover and name; use it directly for anything else.
 */
export const MediaCard = memo(MediaCardComponent);
MediaCard.displayName = 'MediaCard';
