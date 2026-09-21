import React, { memo, useMemo } from 'react';
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from 'react-native';

import { Badge } from '../badge';
import { Chip } from '../chip';
import { useImageResolver } from '../image-resolver/context';
import { FavoriteButton } from '../listing-card/FavoriteButton';
import { ListingFacts, ListingLocationLine } from '../listing-card/parts';
import {
  COMPACT_PHOTO_RADIUS,
  COMPACT_PHOTO_SIZE,
  IS_WEB,
  resolvePhoto,
} from '../listing-card/shared';
import { Rating } from '../rating';
import { Box as SkeletonBox } from '../skeleton';
import { BREAKPOINTS } from '../styles/breakpoints';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import { useSurfaceFill } from '../styles/surface-levels';
import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TABULAR } from '../chart-cards/primitives/ChartHeader';
import { PLACE_CARD_GEOMETRY, PLACE_OPEN_TONE } from './constants';
import { PlaceActions } from './PlaceActions';
import { composePlaceName, openLabelFor, resolvePlaceCardPaint, type PlaceCardPaint } from './shared';
import type { PlaceCardProps } from './types';

/**
 * A place on the map — the result you scroll past, and the header of the sheet
 * you open. ONE component, two densities.
 *
 *   row      a 112 square thumbnail (radius 12) with the heart over its corner,
 *            12 right of it the text: the badge slot, the name (body-semibold)
 *            with `Rating` beside it, the category, the open/closed `Badge`
 *            with the hours line, the address with its pin and the facts row.
 *            This is `listing-card`'s compact geometry, part for part.
 *   detail   a 165 cover across the top of a hairline card (radius 24), then
 *            the name (title-2-medium) with `Rating`, the category and the
 *            open/closed `Badge`, the hours and the address; then the FIGURE
 *            block — a quiet label over a tabular title-1 reading with a `Chip`
 *            after it — the stat tiles, and the actions. This is
 *            `ai-profile-card`'s register: cover, title-weight name, quiet
 *            label over a figure, labelled secondary actions.
 *
 * WHAT THIS FAMILY DRAWS ITSELF: nothing that already exists. The stars are
 * `Rating`, the open/closed pill is `Badge` on a tone, the distance chip is
 * `Chip`, the address line and the facts row are `listing-card`'s own parts
 * (`ListingLocationLine`, `ListingFacts`), the heart is `FavoriteButton`, the
 * actions are `Button`s through `PlaceActions`, and every colour is read off
 * the surface the card was dropped on. What is left is the arrangement.
 *
 * THE ROW IS A LINK AND THE CONTROLS ARE ITS SIBLINGS. The thumbnail and the
 * text sit inside one pressable (a real `<a href>` on web); the heart and the
 * actions are laid over and under it from OUTSIDE. A button inside an anchor is
 * invalid HTML and makes the heart's press open the place.
 *
 * The REVIEWS are not here. `place-reviews` already draws the summary, the
 * cards and the write-a-review prompt; a sheet renders `PlaceReviewSummary`
 * under this header rather than this header growing a second one.
 */

const TEXT_GAP = 12;
const G = PLACE_CARD_GEOMETRY;

const PLACE_CARD_STYLE_ID = 'bloom-place-card-web-css';
const PLACE_CARD_CSS = interactiveWebCss({
  selector: '[data-bloom-place-card-link]',
  varPrefix: 'bloom-place-card',
  reset: 'none',
  base: 'text-decoration: none; color: inherit;',
  transition: 'none',
  outlineOffset: 4,
  disabled: { opacity: null },
  extraRules: `[data-bloom-place-card-link]:focus-visible {
  border-radius: ${COMPACT_PHOTO_RADIUS + 4}px;
}`,
});

// ---------------------------------------------------------------------------
//  Parts both densities draw
// ---------------------------------------------------------------------------

/** The open/closed pill. `Badge` on the state's tone — no second pill exists. */
function OpenStateBadge({
  label,
  state,
  size,
  testID,
}: {
  label: string;
  state: NonNullable<PlaceCardProps['openState']>;
  size: 'label-small' | 'label-medium';
  testID?: string;
}) {
  return (
    <Badge content={label} variant="subtle" color={PLACE_OPEN_TONE[state]} size={size} testID={testID} />
  );
}

/** The name and the rating on one line — the rating never pushes the name out. */
function NameLine({
  props,
  paint,
  variant,
  ratingSize,
}: {
  props: PlaceCardProps;
  paint: PlaceCardPaint;
  variant: 'body-semibold' | 'title-2-medium';
  ratingSize: 'small' | 'medium';
}) {
  const { name, rating, reviewCount, newLabel, testID } = props;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text
        variant={variant}
        numberOfLines={1}
        style={{ flex: 1, minWidth: 0, color: paint.text }}
        testID={testID ? `${testID}-name` : undefined}
      >
        {name}
      </Text>
      {rating !== undefined ? (
        <Rating
          size={ratingSize}
          value={rating}
          count={reviewCount}
          newLabel={newLabel}
          style={{ flexShrink: 0 }}
          testID={testID ? `${testID}-rating` : undefined}
        />
      ) : null}
    </View>
  );
}

/**
 * The category and the state pill on one line, the hours under it.
 *
 * The two are separate lines because the pill is a WORD ("Open") and the hours
 * are a SENTENCE ("Open until 20:00"): pushed onto one line the sentence
 * truncates first and leaves the pill saying half of what the app knows.
 */
function StateLines({
  props,
  paint,
  categoryVariant,
  hoursVariant,
  badgeSize,
}: {
  props: PlaceCardProps;
  paint: PlaceCardPaint;
  categoryVariant: 'body-2-regular' | 'headline-medium';
  hoursVariant: 'body-2-regular' | 'body-regular';
  badgeSize: 'label-small' | 'label-medium';
}) {
  const { category, openState, openLabel, hours, testID } = props;
  const state = openLabelFor(openState, openLabel);
  if (!category && !state && !hours) return null;
  return (
    <>
      {category || state ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 }}>
          {category ? (
            <Text
              variant={categoryVariant}
              numberOfLines={1}
              style={{ flexShrink: 1, minWidth: 0, color: paint.textSecondary }}
              testID={testID ? `${testID}-category` : undefined}
            >
              {category}
            </Text>
          ) : null}
          {state && openState ? (
            // The pill keeps its whole word and the CATEGORY is what yields:
            // "Closing s…" beside "Coffee shop …" is two truncations for one
            // line's worth of overflow, and the state is the shorter fact.
            <View style={{ flexShrink: 0 }}>
              <OpenStateBadge
                label={state}
                state={openState}
                size={badgeSize}
                testID={testID ? `${testID}-state` : undefined}
              />
            </View>
          ) : null}
        </View>
      ) : null}
      {hours ? (
        <Text
          variant={hoursVariant}
          numberOfLines={1}
          style={{ color: paint.textSecondary }}
          testID={testID ? `${testID}-hours` : undefined}
        >
          {hours}
        </Text>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
//  Skeleton
// ---------------------------------------------------------------------------

function PlaceCardSkeleton({
  density,
  style,
  testID,
}: Pick<PlaceCardProps, 'style' | 'testID'> & { density: 'row' | 'detail' }) {
  if (density === 'row') {
    return (
      <View
        aria-busy
        accessibilityLabel="Loading"
        style={[{ flexDirection: 'row', alignItems: 'flex-start' }, style]}
        testID={testID}
      >
        <SkeletonBox
          width={COMPACT_PHOTO_SIZE}
          height={COMPACT_PHOTO_SIZE}
          borderRadius={COMPACT_PHOTO_RADIUS}
          style={{ flexShrink: 0 }}
        />
        <View style={{ flex: 1, marginLeft: TEXT_GAP, gap: 8 }}>
          <SkeletonBox width="60%" height={14} borderRadius={4} />
          <SkeletonBox width="40%" height={12} borderRadius={4} />
          <SkeletonBox width="50%" height={12} borderRadius={4} />
          <SkeletonBox width="35%" height={12} borderRadius={4} />
        </View>
      </View>
    );
  }
  return (
    <View aria-busy accessibilityLabel="Loading" style={style} testID={testID}>
      <SkeletonBox width="100%" height={G.cover} borderRadius={G.radius} />
      <View style={{ gap: 8, paddingTop: G.padding }}>
        <SkeletonBox width="55%" height={20} borderRadius={4} />
        <SkeletonBox width="35%" height={14} borderRadius={4} />
        <SkeletonBox width="45%" height={26} borderRadius={4} style={{ marginTop: 8 }} />
        <SkeletonBox width="100%" height={34} borderRadius={G.tileRadius} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Row
// ---------------------------------------------------------------------------

function PlaceRow({ props, paint }: { props: PlaceCardProps; paint: PlaceCardPaint }) {
  const {
    photo,
    photoVariant,
    badge,
    address,
    facts,
    actions,
    favorite = false,
    onFavoriteChange,
    saveLabel,
    removeLabel,
    onPress,
    href,
    accessibilityLabel,
    style,
    testID,
  } = props;
  const resolver = useImageResolver();
  const uri = photo ? resolvePhoto(photo, resolver, photoVariant) : undefined;
  const name = accessibilityLabel ?? composePlaceName(props);

  const handlePress = (event: GestureResponderEvent) => {
    if (onPress) {
      if (IS_WEB && href) event.preventDefault();
      onPress();
      return;
    }
    if (!IS_WEB && href) void Linking.openURL(href).catch(() => undefined);
  };

  const linkStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'flex-start',
    '--bloom-place-card-ring': paint.ring,
  };

  return (
    <View style={[{ position: 'relative' }, style]} testID={testID}>
      <Pressable
        {...webDataSet({ bloomPlaceCardLink: '' })}
        {...(IS_WEB && href ? { href } : null)}
        role={href ? 'link' : onPress ? 'button' : undefined}
        accessibilityLabel={name}
        onPress={onPress || (!IS_WEB && href) ? handlePress : undefined}
        style={linkStyle}
        testID={testID ? `${testID}-link` : undefined}
      >
        <View
          style={{
            width: COMPACT_PHOTO_SIZE,
            height: COMPACT_PHOTO_SIZE,
            flexShrink: 0,
            borderRadius: COMPACT_PHOTO_RADIUS,
            overflow: 'hidden',
            backgroundColor: paint.photoPlaceholder,
          }}
          testID={testID ? `${testID}-photo` : undefined}
        >
          {uri ? (
            <Image
              source={{ uri }}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
              style={StyleSheet.absoluteFill}
            />
          ) : null}
        </View>

        <View style={{ flex: 1, minWidth: 0, marginLeft: TEXT_GAP, gap: 2 }}>
          {badge != null && badge !== '' ? (
            <View
              style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}
              testID={testID ? `${testID}-slot` : undefined}
            >
              {typeof badge === 'string' ? (
                <Badge content={badge} variant="subtle" color="default" size="label-small" />
              ) : (
                badge
              )}
            </View>
          ) : null}
          <NameLine props={props} paint={paint} variant="body-semibold" ratingSize="small" />
          <StateLines
            props={props}
            paint={paint}
            categoryVariant="body-2-regular"
            hoursVariant="body-2-regular"
            badgeSize="label-small"
          />
          {address ? (
            <ListingLocationLine
              text={address}
              size="small"
              color={paint.textSecondary}
              testID={testID ? `${testID}-address` : undefined}
            />
          ) : null}
          {facts && facts.length > 0 ? (
            <ListingFacts
              facts={facts}
              size="small"
              color={paint.textSecondary}
              style={{ marginTop: 2 }}
              testID={testID ? `${testID}-facts` : undefined}
            />
          ) : null}
        </View>
      </Pressable>

      {onFavoriteChange ? (
        <View style={{ position: 'absolute', top: 2, left: COMPACT_PHOTO_SIZE - 34 }}>
          <FavoriteButton
            favorite={favorite}
            size={20}
            onFavoriteChange={onFavoriteChange}
            saveLabel={saveLabel}
            removeLabel={removeLabel}
            testID={testID ? `${testID}-favorite` : undefined}
          />
        </View>
      ) : null}

      {actions && actions.length > 0 ? (
        <PlaceActions
          actions={actions}
          accessibilityLabel={`${props.name} actions`}
          style={{ marginTop: TEXT_GAP }}
          testID={testID ? `${testID}-actions` : undefined}
        />
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Detail header
// ---------------------------------------------------------------------------

/** Two per row below `sm`, one row of equal tiles from there. */
function tileRows(count: number, wide: boolean): number[][] {
  if (wide) return [Array.from({ length: count }, (_unused, index) => index)];
  const rows: number[][] = [];
  for (let i = 0; i < count; i += 2) rows.push(i + 1 < count ? [i, i + 1] : [i]);
  return rows;
}

function PlaceDetail({ props, paint }: { props: PlaceCardProps; paint: PlaceCardPaint }) {
  const {
    photo,
    photoVariant,
    badge,
    address,
    facts,
    figure,
    figureLabel,
    figureDetail,
    stats,
    actions,
    favorite = false,
    onFavoriteChange,
    saveLabel,
    removeLabel,
    style,
    testID,
  } = props;
  const resolver = useImageResolver();
  const { width: viewport } = useWindowDimensions();
  const wide = viewport >= BREAKPOINTS.sm;
  const uri = photo ? resolvePhoto(photo, resolver, photoVariant) : undefined;

  return (
    <View
      testID={testID}
      style={[
        {
          position: 'relative',
          width: '100%',
          minWidth: 0,
          overflow: 'hidden',
          borderRadius: G.radius,
          borderWidth: 1,
          borderColor: paint.border,
        },
        style,
      ]}
    >
      <View
        testID={testID ? `${testID}-photo` : undefined}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: G.cover,
          overflow: 'hidden',
          borderTopLeftRadius: G.radius - 1,
          borderTopRightRadius: G.radius - 1,
          backgroundColor: paint.photoPlaceholder,
        }}
      >
        {uri ? (
          <Image
            source={{ uri }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
            aria-hidden
            style={StyleSheet.absoluteFill}
          />
        ) : null}
      </View>

      {onFavoriteChange ? (
        <View style={{ position: 'absolute', top: 8, right: 8 }}>
          <FavoriteButton
            favorite={favorite}
            onFavoriteChange={onFavoriteChange}
            saveLabel={saveLabel}
            removeLabel={removeLabel}
            testID={testID ? `${testID}-favorite` : undefined}
          />
        </View>
      ) : null}

      <View
        testID={testID ? `${testID}-content` : undefined}
        style={{
          position: 'relative',
          width: '100%',
          gap: G.blockGap,
          paddingTop: G.cover + G.padding,
          paddingBottom: G.padding,
          paddingLeft: G.padding,
          paddingRight: G.padding,
        }}
      >
        <View style={{ gap: 4 }}>
          {badge != null && badge !== '' ? (
            <View
              style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 2 }}
              testID={testID ? `${testID}-slot` : undefined}
            >
              {typeof badge === 'string' ? (
                <Badge content={badge} variant="subtle" color="default" size="label-medium" />
              ) : (
                badge
              )}
            </View>
          ) : null}
          <NameLine props={props} paint={paint} variant="title-2-medium" ratingSize="medium" />
          <StateLines
            props={props}
            paint={paint}
            categoryVariant="headline-medium"
            hoursVariant="body-regular"
            badgeSize="label-medium"
          />
          {address ? (
            <ListingLocationLine
              text={address}
              size="medium"
              color={paint.textSecondary}
              testID={testID ? `${testID}-address` : undefined}
            />
          ) : null}
        </View>

        {figure || (stats && stats.length > 0) ? (
          <View style={{ width: '100%', gap: 8 }}>
            {figure ? (
              <View style={{ gap: 2 }}>
                {figureLabel ? (
                  <Text
                    variant="body-medium"
                    numberOfLines={1}
                    style={{ color: paint.textSecondary }}
                    testID={testID ? `${testID}-figure-label` : undefined}
                  >
                    {figureLabel}
                  </Text>
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text
                    variant="title-1-medium"
                    numberOfLines={1}
                    style={[{ color: paint.text }, TABULAR]}
                    testID={testID ? `${testID}-figure` : undefined}
                  >
                    {figure}
                  </Text>
                  {figureDetail ? (
                    <Chip size="medium" testID={testID ? `${testID}-figure-detail` : undefined}>
                      {figureDetail}
                    </Chip>
                  ) : null}
                </View>
              </View>
            ) : null}

            {stats && stats.length > 0 ? (
              <View style={{ gap: 8 }} testID={testID ? `${testID}-stats` : undefined}>
                {tileRows(stats.length, wide).map((row) => (
                  <View key={row[0]} style={{ flexDirection: 'row', alignItems: 'stretch', gap: 8 }}>
                    {row.map((index) => {
                      const stat = stats[index]!;
                      return (
                        <View
                          key={`${index}-${stat.label}`}
                          testID={testID ? `${testID}-stat-${index}` : undefined}
                          style={[styles.tile, { backgroundColor: paint.tile }]}
                        >
                          <Text variant="body-medium" numberOfLines={1} style={{ width: '100%', color: paint.text }}>
                            {stat.value}
                          </Text>
                          <Text
                            variant="body-2-medium"
                            numberOfLines={1}
                            style={{ width: '100%', color: paint.textSecondary }}
                          >
                            {stat.label}
                          </Text>
                        </View>
                      );
                    })}
                    {/* An odd tile keeps its half of the two-column grid. */}
                    {!wide && row.length === 1 ? <View style={styles.tileSpacer} /> : null}
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {facts && facts.length > 0 ? (
          <ListingFacts
            facts={facts}
            size="medium"
            color={paint.textSecondary}
            testID={testID ? `${testID}-facts` : undefined}
          />
        ) : null}

        {actions && actions.length > 0 ? (
          <PlaceActions
            actions={actions}
            accessibilityLabel={`${props.name} actions`}
            testID={testID ? `${testID}-actions` : undefined}
          />
        ) : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------

function PlaceCardComponent(props: PlaceCardProps) {
  const { density = 'row', loading = false, style, testID } = props;
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolvePlaceCardPaint(theme, surface), [theme, surface]);
  useInteractiveWebCss(PLACE_CARD_STYLE_ID, PLACE_CARD_CSS);

  if (loading) return <PlaceCardSkeleton density={density} style={style} testID={testID} />;
  return density === 'detail' ? (
    <PlaceDetail props={props} paint={paint} />
  ) : (
    <PlaceRow props={props} paint={paint} />
  );
}

export const PlaceCard = memo(PlaceCardComponent);
PlaceCard.displayName = 'PlaceCard';

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    alignItems: 'flex-start',
    borderRadius: G.tileRadius,
    padding: G.tilePadding,
  },
  tileSpacer: { flex: 1, flexBasis: 0, minWidth: 0 },
});
