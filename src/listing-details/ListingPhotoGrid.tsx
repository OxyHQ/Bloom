import React, { memo, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Button } from '../button';
import { Carousel, CarouselItem } from '../carousel';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiLayoutGridLine } from '../icons/remix/RiLayoutGridLine';
import { useImageResolver } from '../image-resolver/context';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  LISTING_PHOTO_GRID_BREAKPOINT,
  LISTING_PHOTO_GRID_GAP,
  LISTING_PHOTO_GRID_RADIUS,
} from './constants';
import {
  IS_WEB,
  LISTING_DETAILS_CSS,
  LISTING_DETAILS_STYLE_ID,
  resolveImageUri,
  resolveListingPalette,
  type ListingPalette,
} from './shared';
import type { ListingPhoto, ListingPhotoGridProps } from './types';
import { useContainerWidth } from '../hooks/use-container-width';

/**
 * The photos at the top of a listing page.
 *
 *   grid (≥ 744)   one large photo on the left half, a 2×2 grid on the right,
 *                  8px gaps; the OUTER corners round to 16 (the frame clips,
 *                  so inner corners stay square). A photo darkens slightly on
 *                  hover (web). "Show all photos" — a small secondary Button
 *                  with a grid icon — sits 24px in from the bottom-right.
 *   fewer photos   1 fills the frame; 2 split it; 3 are a large photo plus two
 *                  stacked; 4 are a large photo plus one over two.
 *   carousel       full-bleed, paged (Bloom's `Carousel` without arrows or
 *                  dots), with a "1 / 24" counter pill at the bottom-right.
 *
 * `layout="auto"` picks by the width the grid is laid out at, not the window.
 */

const DEFAULT_GRID_RATIO = 2;
const DEFAULT_CAROUSEL_RATIO = 4 / 3;
const SCRIM_OPACITY = 0.1;

function defaultPhotoLabel(photo: ListingPhoto, position: number, total: number): string {
  return photo.alt ? `${photo.alt}, photo ${position} of ${total}` : `Photo ${position} of ${total}`;
}

interface PhotoTileProps {
  photo: ListingPhoto;
  uri: string | undefined;
  label: string;
  palette: ListingPalette;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function PhotoTile({ photo, uri, label, palette, onPress, style, testID }: PhotoTileProps) {
  const { state: hovered, onIn, onOut } = useInteractionState();
  const image = uri ? (
    <Image
      source={{ uri }}
      resizeMode="cover"
      style={StyleSheet.absoluteFill}
      // The pressable (or the tile) carries the name; the image itself is decoration.
      accessible={false}
      importantForAccessibility="no"
    />
  ) : null;

  if (!onPress) {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={label}
        style={[{ overflow: 'hidden', backgroundColor: palette.tile }, style]}
        testID={testID}
      >
        {image}
      </View>
    );
  }

  const ringStyle: WebCssStyle = { '--bloom-listing-ring': palette.ring };

  return (
    <Pressable
      {...webDataSet({ bloomListingPress: 'inset' })}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onHoverIn={onIn}
      onHoverOut={onOut}
      style={[{ overflow: 'hidden', backgroundColor: palette.tile }, ringStyle, style]}
      testID={testID}
    >
      {image}
      <View
        {...webDataSet({ bloomListingScrim: '' })}
        pointerEvents="none"
        testID={testID ? `${testID}-scrim` : undefined}
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: palette.scrim, opacity: hovered ? SCRIM_OPACITY : 0 },
        ]}
      />
    </Pressable>
  );
}

function ListingPhotoGridComponent({
  photos,
  onPressPhoto,
  onShowAll,
  showAllLabel = 'Show all photos',
  layout = 'auto',
  aspectRatio = DEFAULT_GRID_RATIO,
  carouselAspectRatio = DEFAULT_CAROUSEL_RATIO,
  accessibilityLabel = 'Listing photos',
  formatCounter,
  photoLabel = defaultPhotoLabel,
  imageVariant = 'large',
  style,
  testID,
}: ListingPhotoGridProps) {
  const theme = useTheme();
  useInteractiveWebCss(LISTING_DETAILS_STYLE_ID, LISTING_DETAILS_CSS);
  const palette = useMemo(() => resolveListingPalette(theme), [theme]);
  const resolver = useImageResolver();
  const { width, onLayout } = useContainerWidth();
  const [active, setActive] = useState(0);

  const total = photos.length;
  const resolved: ListingLayout =
    layout !== 'auto'
      ? layout
      : width == null
        ? 'pending'
        : width < LISTING_PHOTO_GRID_BREAKPOINT
          ? 'carousel'
          : 'grid';

  const tile = (index: number, tileStyle: StyleProp<ViewStyle>) => {
    const photo = photos[index];
    if (!photo) return null;
    return (
      <PhotoTile
        key={index}
        photo={photo}
        uri={resolveImageUri(photo.source, resolver, imageVariant)}
        label={photoLabel(photo, index + 1, total)}
        palette={palette}
        onPress={onPressPhoto ? () => onPressPhoto(index) : undefined}
        style={tileStyle}
        testID={testID ? `${testID}-photo-${index}` : undefined}
      />
    );
  };

  let body: React.ReactNode = null;

  if (resolved === 'pending') {
    // Hold the grid's height until the first layout picks one.
    body = <View style={{ width: '100%', aspectRatio }} />;
  } else if (resolved === 'carousel' && total > 0) {
    const counter = formatCounter ? formatCounter(active + 1, total) : `${active + 1} / ${total}`;
    body = (
      <View style={{ width: '100%' }}>
        <Carousel
          accessibilityLabel={accessibilityLabel}
          showArrows={false}
          showDots={false}
          gap={0}
          onIndexChange={setActive}
          testID={testID ? `${testID}-carousel` : undefined}
        >
          {photos.map((photo, index) => (
            <CarouselItem key={`${photo.source}-${index}`} accessibilityLabel={photoLabel(photo, index + 1, total)}>
              {tile(index, { width: '100%', aspectRatio: carouselAspectRatio })}
            </CarouselItem>
          ))}
        </Carousel>
        {total > 1 ? (
          <View
            pointerEvents="none"
            // Each slide already announces "N of M"; the pill is the sighted copy.
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            {...(IS_WEB ? { 'aria-hidden': true } : null)}
            testID={testID ? `${testID}-counter` : undefined}
            style={{
              position: 'absolute',
              right: 12,
              bottom: 12,
              paddingLeft: 10,
              paddingRight: 10,
              paddingTop: 4,
              paddingBottom: 4,
              borderRadius: borderRadius.full,
              backgroundColor: palette.card,
            }}
          >
            <Text variant="caption-1-semibold" style={{ color: palette.text, fontVariant: ['tabular-nums'] }}>
              {counter}
            </Text>
          </View>
        ) : null}
      </View>
    );
  } else if (total > 0) {
    const fill: ViewStyle = { flex: 1, minWidth: 0, minHeight: 0 };
    const column: ViewStyle = { flex: 1, minWidth: 0, gap: LISTING_PHOTO_GRID_GAP };
    const row: ViewStyle = { flex: 1, minHeight: 0, flexDirection: 'row', gap: LISTING_PHOTO_GRID_GAP };

    let right: React.ReactNode = null;
    if (total === 2) {
      right = tile(1, fill);
    } else if (total === 3) {
      right = (
        <View style={column}>
          {tile(1, fill)}
          {tile(2, fill)}
        </View>
      );
    } else if (total === 4) {
      right = (
        <View style={column}>
          {tile(1, fill)}
          <View style={row}>
            {tile(2, fill)}
            {tile(3, fill)}
          </View>
        </View>
      );
    } else if (total >= 5) {
      right = (
        <View style={column}>
          <View style={row}>
            {tile(1, fill)}
            {tile(2, fill)}
          </View>
          <View style={row}>
            {tile(3, fill)}
            {tile(4, fill)}
          </View>
        </View>
      );
    }

    body = (
      <View
        role="group"
        accessibilityLabel={accessibilityLabel}
        testID={testID ? `${testID}-grid` : undefined}
        style={{
          width: '100%',
          aspectRatio,
          flexDirection: 'row',
          gap: LISTING_PHOTO_GRID_GAP,
          borderRadius: LISTING_PHOTO_GRID_RADIUS,
          overflow: 'hidden',
        }}
      >
        {tile(0, fill)}
        {right}
        {onShowAll ? (
          <View style={{ position: 'absolute', right: 24, bottom: 24 }}>
            <Button
              variant="secondary"
              size="small"
              leadingIcon={RiLayoutGridLine}
              onPress={onShowAll}
              testID={testID ? `${testID}-show-all` : undefined}
            >
              {showAllLabel}
            </Button>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View onLayout={onLayout} style={[{ width: '100%' }, style]} testID={testID}>
      {body}
    </View>
  );
}

type ListingLayout = 'pending' | 'grid' | 'carousel';

export const ListingPhotoGrid = memo(ListingPhotoGridComponent);
ListingPhotoGrid.displayName = 'ListingPhotoGrid';
