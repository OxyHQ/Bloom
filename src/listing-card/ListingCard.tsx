import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewStyle,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { Button } from '../button';
import { RiArrowLeftSLine, RiArrowRightSLine } from '../icons/remix';
import { useImageResolver } from '../image-resolver/context';
import { formatRatingValue } from '../rating/Rating';
import { Rating } from '../rating';
import { Box as SkeletonBox } from '../skeleton';
import { borderRadius } from '../styles/tokens';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { FavoriteButton } from './FavoriteButton';
import {
  DOT_INACTIVE_OPACITY,
  DOT_SIZE,
  dotWindow,
  HORIZONTAL_PHOTO_WIDTH,
  IS_WEB,
  LISTING_CARD_CSS,
  LISTING_CARD_STYLE_ID,
  PHOTO_ASPECT_RATIO,
  PHOTO_RADIUS,
  resolveListingCardPaint,
  resolvePhoto,
  webData,
  type ListingCardPaint,
} from './shared';
import type { ListingCardLayout, ListingCardProps } from './types';

/**
 * A stay in a results grid.
 *
 *   vertical     photo 20:19, radius 16; 12 below it, the text block
 *   horizontal   photo 40% wide, square, radius 16; 12 right of it, the text
 *   photo        a paged track — swipe, trackpad, or (web, on hover) the round
 *                prev/next arrows; up to 5 dots at the bottom, the edge dots
 *                shrinking while more photos lie beyond; the badge top-left,
 *                the heart top-right
 *   text         title body-semibold + `Rating` right-aligned; subtitle and
 *                dates body-regular text-secondary; the price line — an
 *                optional struck original price, the price body-semibold and
 *                the unit body-regular; a total line under it
 *
 * THE CARD IS A LINK AND THE CONTROLS ARE ITS SIBLINGS, NOT ITS CHILDREN. The
 * photo and the text sit inside one pressable (a real `<a href>` on web), and
 * the badge, heart, arrows and dots sit in an overlay laid over the photo from
 * OUTSIDE it. A button inside an anchor is invalid HTML and makes the heart's
 * press open the stay; as a sibling the heart is its own tab stop and its own
 * target. The track stays inside the link so a tap on the photo opens the stay
 * and a swipe on native still pages it.
 *
 * The overlay repeats the photo's geometry (the same width share and aspect
 * ratio) rather than measuring it, so it is right on the first frame.
 */

const TEXT_GAP = 12;

// ---------------------------------------------------------------------------
//  Photo track
// ---------------------------------------------------------------------------

function photoBoxStyle(layout: ListingCardLayout): ViewStyle {
  return layout === 'horizontal'
    ? { width: HORIZONTAL_PHOTO_WIDTH, aspectRatio: 1 }
    : { width: '100%', aspectRatio: PHOTO_ASPECT_RATIO };
}

interface PhotoTrackProps {
  photos: ReadonlyArray<string>;
  variant?: string;
  layout: ListingCardLayout;
  paint: ListingCardPaint;
  scrollRef: React.RefObject<ScrollView | null>;
  width: number;
  onWidth: (width: number) => void;
  onIndex: (index: number) => void;
  /** Photos past this index are not mounted yet. */
  mountedThrough: number;
  testID?: string;
}

function PhotoTrack({
  photos,
  variant,
  layout,
  paint,
  scrollRef,
  width,
  onWidth,
  onIndex,
  mountedThrough,
  testID,
}: PhotoTrackProps) {
  const resolver = useImageResolver();

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width <= 0) return;
    onIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <View
      onLayout={(event: LayoutChangeEvent) => onWidth(event.nativeEvent.layout.width)}
      style={[
        photoBoxStyle(layout),
        {
          flexShrink: 0,
          borderRadius: PHOTO_RADIUS,
          overflow: 'hidden',
          backgroundColor: paint.photoPlaceholder,
        },
      ]}
      testID={testID ? `${testID}-photo` : undefined}
    >
      {width > 0 ? (
        <ScrollView
          ref={scrollRef}
          {...webData({ bloomListingCardTrack: '' })}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          disableIntervalMomentum
          style={{ width: '100%', height: '100%' }}
        >
          {photos.map((photo, index) => {
            const uri = index <= mountedThrough ? resolvePhoto(photo, resolver, variant) : undefined;
            return (
              <View
                key={`${index}-${photo}`}
                {...webData({ bloomListingCardSlide: '' })}
                style={{ width, height: '100%' }}
              >
                {uri ? (
                  <Image
                    source={{ uri }}
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Overlay parts
// ---------------------------------------------------------------------------

function Dots({ count, active, paint }: { count: number; active: number; paint: ListingCardPaint }) {
  const slots = dotWindow(count, active);
  if (slots.length === 0) return null;
  return (
    <View
      pointerEvents="none"
      aria-hidden
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 10,
        height: DOT_SIZE,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
      }}
    >
      {slots.map((slot) => (
        <View
          key={slot.index}
          {...webData({ bloomListingCardDot: slot.active ? 'active' : '' })}
          style={{
            width: slot.size,
            height: slot.size,
            borderRadius: borderRadius.full,
            backgroundColor: paint.onMedia,
            opacity: slot.active ? 1 : DOT_INACTIVE_OPACITY,
          }}
        />
      ))}
    </View>
  );
}

function BadgePill({ label, paint }: { label: string; paint: ListingCardPaint }) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        maxWidth: '100%',
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 4,
        paddingBottom: 4,
        borderRadius: borderRadius.full,
        backgroundColor: paint.surface,
        boxShadow: paint.surfaceShadow,
      }}
    >
      <Text variant="body-2-semibold" numberOfLines={1} style={{ color: paint.surfaceText }}>
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Text
// ---------------------------------------------------------------------------

function composeName(props: ListingCardProps): string {
  const parts: string[] = [props.title];
  if (typeof props.badge === 'string' && props.badge) parts.push(props.badge);
  if (props.rating !== undefined) {
    const rated = props.rating !== null && props.rating !== '';
    if (rated) {
      const count =
        props.reviewCount != null && props.reviewCount !== '' ? `, ${props.reviewCount} reviews` : '';
      parts.push(`Rated ${formatRatingValue(props.rating as number | string)} out of 5${count}`);
    } else {
      parts.push(props.newLabel ?? 'New');
    }
  }
  if (props.subtitle) parts.push(props.subtitle);
  if (props.dates) parts.push(props.dates);
  if (props.price) {
    const unit = props.priceUnit ? ` ${props.priceUnit}` : '';
    const original = props.originalPrice ? `, originally ${props.originalPrice}` : '';
    parts.push(`${props.price}${unit}${original}`);
  }
  if (props.total) parts.push(props.total);
  return parts.join(', ');
}

function Details(props: ListingCardProps & { paint: ListingCardPaint; horizontal: boolean }) {
  const { title, subtitle, dates, rating, reviewCount, newLabel, price, priceUnit, originalPrice, total, paint } =
    props;
  const secondary = { color: paint.textSecondary };
  return (
    <View
      style={{
        flex: props.horizontal ? 1 : undefined,
        minWidth: 0,
        alignSelf: props.horizontal ? 'center' : 'stretch',
        marginTop: props.horizontal ? 0 : TEXT_GAP,
        marginLeft: props.horizontal ? TEXT_GAP : 0,
        gap: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text variant="body-semibold" numberOfLines={1} style={{ flex: 1, minWidth: 0, color: paint.text }}>
          {title}
        </Text>
        {rating !== undefined ? (
          <Rating value={rating} count={reviewCount} newLabel={newLabel} style={{ flexShrink: 0 }} />
        ) : null}
      </View>
      {subtitle ? (
        <Text variant="body-regular" numberOfLines={1} style={secondary}>
          {subtitle}
        </Text>
      ) : null}
      {dates ? (
        <Text variant="body-regular" numberOfLines={1} style={secondary}>
          {dates}
        </Text>
      ) : null}
      {price ? (
        <Text variant="body-regular" numberOfLines={1} style={{ marginTop: 4, color: paint.text }}>
          {originalPrice ? (
            <Text variant="body-regular" style={{ ...secondary, textDecorationLine: 'line-through' }}>
              {originalPrice}
            </Text>
          ) : null}
          {originalPrice ? ' ' : null}
          <Text variant="body-semibold" style={{ color: paint.text }}>
            {price}
          </Text>
          {priceUnit ? ` ${priceUnit}` : null}
        </Text>
      ) : null}
      {total ? (
        <Text
          variant={price ? 'body-regular' : 'body-semibold'}
          numberOfLines={1}
          style={price ? secondary : { marginTop: 4, color: paint.text }}
        >
          {total}
        </Text>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Skeleton
// ---------------------------------------------------------------------------

function ListingCardSkeleton({
  layout,
  style,
  testID,
}: Pick<ListingCardProps, 'style' | 'testID'> & { layout: ListingCardLayout }) {
  const horizontal = layout === 'horizontal';
  return (
    <View
      aria-busy
      accessibilityLabel="Loading"
      style={[{ flexDirection: horizontal ? 'row' : 'column', alignItems: 'flex-start' }, style]}
      testID={testID}
    >
      <SkeletonBox
        borderRadius={PHOTO_RADIUS}
        style={[photoBoxStyle(layout), { flexShrink: 0 }]}
      />
      <View
        style={{
          flex: horizontal ? 1 : undefined,
          alignSelf: horizontal ? 'center' : 'stretch',
          marginTop: horizontal ? 0 : TEXT_GAP,
          marginLeft: horizontal ? TEXT_GAP : 0,
          gap: 8,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <SkeletonBox width="60%" height={14} borderRadius={4} />
          <SkeletonBox width={40} height={14} borderRadius={4} />
        </View>
        <SkeletonBox width="45%" height={12} borderRadius={4} />
        <SkeletonBox width="35%" height={12} borderRadius={4} />
        <SkeletonBox width="30%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Card
// ---------------------------------------------------------------------------

function ListingCardComponent(props: ListingCardProps) {
  const {
    photos,
    photoVariant,
    badge,
    favorite = false,
    onFavoriteChange,
    onPress,
    href,
    loading = false,
    layout = 'vertical',
    accessibilityLabel,
    previousPhotoLabel = 'Previous photo',
    nextPhotoLabel = 'Next photo',
    saveLabel,
    removeLabel,
    onPhotoIndexChange,
    style,
    testID,
  } = props;
  const theme = useTheme();
  useInteractiveWebCss(LISTING_CARD_STYLE_ID, LISTING_CARD_CSS);
  const paint = useMemo(() => resolveListingCardPaint(theme), [theme]);
  const reducedMotion = useReducedMotion();

  const scrollRef = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(0);
  const [mountedThrough, setMountedThrough] = useState(1);
  const count = photos.length;

  const onPhotoIndexChangeRef = useRef(onPhotoIndexChange);
  onPhotoIndexChangeRef.current = onPhotoIndexChange;

  const activeRef = useRef(0);
  /** The page a button press is scrolling to; scroll reports in between are not a new index. */
  const pendingRef = useRef<{ index: number; until: number } | null>(null);

  const onIndex = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(next, count - 1));
      setMountedThrough((through) => Math.max(through, clamped + 1));
      if (clamped === activeRef.current) return;
      activeRef.current = clamped;
      setActive(clamped);
      onPhotoIndexChangeRef.current?.(clamped);
    },
    [count],
  );

  const onScrollIndex = useCallback(
    (next: number) => {
      const pending = pendingRef.current;
      if (pending) {
        if (next !== pending.index && Date.now() < pending.until) return;
        pendingRef.current = null;
      }
      onIndex(next);
    },
    [onIndex],
  );

  // A shorter photo list must not leave the index past its end.
  useEffect(() => {
    if (count > 0 && active > count - 1) onIndex(count - 1);
  }, [active, count, onIndex]);

  const goTo = (index: number) => {
    const target = Math.max(0, Math.min(index, count - 1));
    setMountedThrough((through) => Math.max(through, target + 1));
    // A smooth scroll reports every offset on its way; the index moves to the
    // target now, so a second press during the animation moves on from it.
    pendingRef.current = reducedMotion ? null : { index: target, until: Date.now() + 700 };
    onIndex(target);
    scrollRef.current?.scrollTo({ x: target * width, animated: !reducedMotion });
  };

  if (loading) return <ListingCardSkeleton layout={layout} style={style} testID={testID} />;

  const horizontal = layout === 'horizontal';
  const name = accessibilityLabel ?? composeName(props);

  const linkStyle: WebCssStyle = {
    flexDirection: horizontal ? 'row' : 'column',
    alignItems: 'flex-start',
    '--bloom-listing-card-ring': paint.ring,
  };

  const handlePress = (event: GestureResponderEvent) => {
    if (onPress) {
      if (IS_WEB && href) event.preventDefault();
      onPress();
      return;
    }
    if (!IS_WEB && href) void Linking.openURL(href).catch(() => undefined);
  };

  const overlayStyle: ViewStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    ...(horizontal ? {} : { right: 0 }),
    ...photoBoxStyle(layout),
  };

  return (
    <View
      {...webData({ bloomListingCard: layout })}
      style={[{ position: 'relative' }, style]}
      testID={testID}
    >
      <Pressable
        {...webData({ bloomListingCardLink: '' })}
        {...(IS_WEB && href ? { href } : null)}
        role={href ? 'link' : onPress ? 'button' : undefined}
        accessibilityLabel={name}
        onPress={onPress || (!IS_WEB && href) ? handlePress : undefined}
        style={linkStyle}
        testID={testID ? `${testID}-link` : undefined}
      >
        <PhotoTrack
          photos={photos}
          variant={photoVariant}
          layout={layout}
          paint={paint}
          scrollRef={scrollRef}
          width={width}
          onWidth={setWidth}
          onIndex={onScrollIndex}
          mountedThrough={mountedThrough}
          testID={testID}
        />
        <Details {...props} paint={paint} horizontal={horizontal} />
      </Pressable>

      <View pointerEvents="box-none" style={overlayStyle}>
        <Dots count={count} active={active} paint={paint} />

        {badge != null && badge !== '' ? (
          <View
            pointerEvents="none"
            style={{ position: 'absolute', top: 12, left: 12, right: 56 }}
            testID={testID ? `${testID}-badge` : undefined}
          >
            {typeof badge === 'string' ? <BadgePill label={badge} paint={paint} /> : badge}
          </View>
        ) : null}

        {onFavoriteChange ? (
          <View style={{ position: 'absolute', top: 6, right: 6 }}>
            <FavoriteButton
              favorite={favorite}
              onFavoriteChange={onFavoriteChange}
              saveLabel={saveLabel}
              removeLabel={removeLabel}
              testID={testID ? `${testID}-favorite` : undefined}
            />
          </View>
        ) : null}

        {IS_WEB && count > 1 && width > 0 ? (
          <>
            {active > 0 ? (
              <View
                {...webData({ bloomListingCardArrow: 'previous' })}
                style={{ position: 'absolute', left: 8, top: '50%', marginTop: -16 }}
              >
                <Button
                  variant="secondary"
                  size="small"
                  iconOnly
                  leadingIcon={RiArrowLeftSLine}
                  accessibilityLabel={previousPhotoLabel}
                  onPress={() => goTo(active - 1)}
                  testID={testID ? `${testID}-previous` : undefined}
                />
              </View>
            ) : null}
            {active < count - 1 ? (
              <View
                {...webData({ bloomListingCardArrow: 'next' })}
                style={{ position: 'absolute', right: 8, top: '50%', marginTop: -16 }}
              >
                <Button
                  variant="secondary"
                  size="small"
                  iconOnly
                  leadingIcon={RiArrowRightSLine}
                  accessibilityLabel={nextPhotoLabel}
                  onPress={() => goTo(active + 1)}
                  testID={testID ? `${testID}-next` : undefined}
                />
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    </View>
  );
}

export const ListingCard = memo(ListingCardComponent);
ListingCard.displayName = 'ListingCard';
