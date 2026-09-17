import React, { useMemo, type ReactNode } from 'react';
import { Image, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { Avatar } from '../avatar';
import { Button } from '../button';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiHeart3Fill } from '../icons/remix/RiHeart3Fill';
import { RiMusic2Line } from '../icons/remix/RiMusic2Line';
import { useImageResolver } from '../image-resolver/context';
import { useContainerWidth } from '../hooks/use-container-width';
import { Meter } from '../stat-bar';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { TypeScaleVariant } from '../typography/scale';
import { gradientStyle, MEDIA_HEADER_CSS, MEDIA_HEADER_STYLE_ID, MEDIA_HEADER_WIDE_MIN_WIDTH, resolveLikedGradient, resolveMediaHeaderPaint, type MediaHeaderPaint } from './shared';
import { clamp01 } from '../styles/clamp';
import { isImageUrl as isUrl } from '../image-resolver';
import { webDataSet as webData } from '../styles/web-data';
import type { MediaHeaderPerson, MediaImageSource } from './types';

/** The family's paint for an artwork colour, plus its web sheet. */
export function useMediaHeaderPaint(artworkColor?: string | null): MediaHeaderPaint {
  const theme = useTheme();
  useInteractiveWebCss(MEDIA_HEADER_STYLE_ID, MEDIA_HEADER_CSS);
  return useMemo(() => resolveMediaHeaderPaint(theme, artworkColor), [theme, artworkColor]);
}

/** A URL passes through; an id goes through the ImageResolver. */
export function useImageUri(source: MediaImageSource | undefined, variant?: string): string | undefined {
  const resolver = useImageResolver();
  if (!source) return undefined;
  return isUrl(source) ? source : (resolver?.(source, variant) ?? undefined);
}

// ---------------------------------------------------------------------------
//  Cover
// ---------------------------------------------------------------------------

export type CoverShape = 'square' | 'round' | 'book';

export function Cover({
  source,
  size,
  shape = 'square',
  radius = 6,
  liked = false,
  shadow = true,
  paint,
  testID,
  children,
}: {
  source?: MediaImageSource;
  /** Width. `book` is 2:3, so its height is `size * 1.5`. */
  size: number;
  shape?: CoverShape;
  radius?: number;
  liked?: boolean;
  shadow?: boolean;
  paint: MediaHeaderPaint;
  testID?: string;
  children?: ReactNode;
}) {
  const theme = useTheme();
  const uri = useImageUri(source, 'medium');
  const height = shape === 'book' ? Math.round(size * 1.5) : size;
  const r = shape === 'round' ? size / 2 : radius;
  const frame: WebCssStyle = {
    width: size,
    height,
    borderRadius: r,
    backgroundColor: paint.placeholder,
    boxShadow: shadow ? paint.coverShadow : undefined,
  };
  const clip: ViewStyle = {
    width: size,
    height,
    borderRadius: r,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  };
  let inner: ReactNode;
  if (liked) {
    const [from, to] = resolveLikedGradient(theme);
    const glyph = Math.round(size * 0.36);
    inner = (
      <View style={[clip, gradientStyle([from, to], 135)]}>
        <RiHeart3Fill width={glyph} height={glyph} fill="#ffffff" />
      </View>
    );
  } else if (uri) {
    inner = (
      <View style={clip}>
        <Image source={{ uri }} style={{ width: size, height }} resizeMode="cover" />
      </View>
    );
  } else {
    const glyph = Math.round(size * 0.3);
    inner = (
      <View style={clip}>
        <RiMusic2Line width={glyph} height={glyph} fill={paint.placeholderGlyph} />
      </View>
    );
  }
  return (
    <View style={frame} testID={testID} importantForAccessibility="no-hide-descendants">
      {inner}
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Frame: the band, its fade and the responsive cover + text layout
// ---------------------------------------------------------------------------

export interface FrameLayout {
  wide: boolean;
  /** The container width, or a desktop guess before the first layout. */
  width: number;
  /** Width left for the text column. */
  textWidth: number;
}

export function MediaHeaderFrame({
  paint,
  cover,
  coverWidth,
  children,
  actions,
  centerCoverOnNarrow = true,
  actionsFade,
  backdrop,
  style,
  testID,
}: {
  paint: MediaHeaderPaint;
  cover?: (layout: FrameLayout) => ReactNode;
  /** Cover width at a layout, to size the text column. */
  coverWidth?: (wide: boolean) => number;
  children: (layout: FrameLayout) => ReactNode;
  actions?: ReactNode;
  centerCoverOnNarrow?: boolean;
  /** The actions area's gradient. Default: the band's bottom colour into the page. */
  actionsFade?: readonly string[];
  /** Drawn behind the band's content, absolutely filled (a banner image). */
  backdrop?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { width: measured, onLayout } = useContainerWidth();
  const width = measured ?? 1024;
  const wide = width >= MEDIA_HEADER_WIDE_MIN_WIDTH;
  const padX = wide ? 24 : 16;
  const gap = wide ? 24 : 16;
  const coverW = cover ? (coverWidth?.(wide) ?? 0) : 0;
  const textWidth = Math.max(120, width - padX * 2 - (wide && cover ? coverW + gap : 0));
  const layout: FrameLayout = { wide, width, textWidth };

  const bandStyle: ViewStyle = {
    paddingLeft: padX,
    paddingRight: padX,
    paddingTop: wide ? 72 : 24,
    paddingBottom: 24,
    gap,
    flexDirection: wide ? 'row' : 'column',
    alignItems: wide ? 'flex-end' : 'stretch',
  };

  return (
    <View onLayout={onLayout} style={[{ backgroundColor: paint.background }, style]} testID={testID}>
      <View style={[bandStyle, gradientStyle([paint.bandTop, paint.bandBottom])]}>
        {backdrop}
        {cover ? (
          <View style={{ alignItems: !wide && centerCoverOnNarrow ? 'center' : 'flex-start' }}>
            {cover(layout)}
          </View>
        ) : null}
        <View style={{ flex: wide ? 1 : undefined, minWidth: 0, gap: 4 }}>{children(layout)}</View>
      </View>
      {actions ? (
        <View
          style={[
            {
              paddingLeft: padX,
              paddingRight: padX,
              paddingTop: 16,
              paddingBottom: 24,
            },
            gradientStyle(actionsFade ?? [paint.bandBottom, paint.background]),
          ]}
        >
          {actions}
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Text pieces
// ---------------------------------------------------------------------------

export function HeaderTitle({
  children,
  variant,
  color,
  level = 1,
  numberOfLines,
  testID,
}: {
  children: string;
  variant: TypeScaleVariant;
  color: string;
  level?: number;
  numberOfLines?: number;
  testID?: string;
}) {
  return (
    <Text
      variant={variant}
      role="heading"
      aria-level={level}
      numberOfLines={numberOfLines}
      style={{ color }}
      testID={testID}
      {...webData({ bloomMediaHeaderTitle: variant })}
    >
      {children}
    </Text>
  );
}

export function Dot({ color }: { color: string }) {
  return (
    <Text
      variant="body-medium"
      importantForAccessibility="no"
      accessibilityElementsHidden
      aria-hidden
      style={{ color }}
    >
      •
    </Text>
  );
}

/**
 * A name that is a link when it has a handler, plain text otherwise.
 *
 * `Button variant="link" underline="hover"` — the underline-on-hover this drew
 * by hand before `underline` existed. The COLOUR stays the caller's: it is
 * contrast-picked against the band's artwork, so it overrides the palette's
 * foreground through `textStyle` rather than taking a tone. `--bloom-btn-ring`
 * is the web fork's focus-ring custom property, which is how the band hands it
 * a ring that reads over its own colours.
 */
export function InlineLink({
  label,
  onPress,
  color,
  variant = 'body-semibold',
  ring,
  testID,
}: {
  label: string;
  onPress?: () => void;
  color: string;
  variant?: TypeScaleVariant;
  ring: string;
  testID?: string;
}) {
  if (!onPress) {
    return (
      <Text variant={variant} style={{ color }} testID={testID}>
        {label}
      </Text>
    );
  }
  const style: WebCssStyle = { '--bloom-btn-ring': ring };
  return (
    <Button
      variant="link"
      underline="hover"
      size="small"
      textVariant={variant}
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      style={style}
      textStyle={{ color }}
      testID={testID}
    >
      {label}
    </Button>
  );
}

/**
 * The line under a title: people (up to three avatars, overlapped), then the
 * given segments, joined by bullets. Wraps.
 */
export function MetaLine({
  people,
  segments,
  color,
  mutedColor,
  ring,
  testID,
}: {
  people?: readonly MediaHeaderPerson[];
  segments: readonly (string | undefined | null | false)[];
  color: string;
  mutedColor: string;
  ring: string;
  testID?: string;
}) {
  const parts = segments.filter((s): s is string => typeof s === 'string' && s.length > 0);
  const withAvatars = (people ?? []).filter((p) => p.avatar).slice(0, 3);
  return (
    <View
      style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 4, rowGap: 2 }}
      testID={testID}
    >
      {withAvatars.length > 0 ? (
        <View style={{ flexDirection: 'row', marginRight: 4 }}>
          {withAvatars.map((person, i) => (
            <Avatar
              key={`${person.name}-${i}`}
              source={person.avatar}
              name={person.name}
              size={24}
              style={i > 0 ? { marginLeft: -6 } : undefined}
            />
          ))}
        </View>
      ) : null}
      {(people ?? []).map((person, i) => (
        <React.Fragment key={`${person.name}-${i}`}>
          {i > 0 ? <Dot color={color} /> : null}
          <InlineLink label={person.name} onPress={person.onPress} color={color} ring={ring} />
        </React.Fragment>
      ))}
      {parts.map((part, i) => (
        // The bullet travels with its segment, so a wrap never strands it at a line end.
        <View key={`${part}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
          {i > 0 || (people?.length ?? 0) > 0 ? <Dot color={mutedColor} /> : null}
          <Text variant="body-medium" style={{ color: mutedColor }}>
            {part}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** A thin determinate `Meter`. */
export function ProgressBar({
  value,
  label,
  fill,
  rail,
  width,
  testID,
}: {
  value: number;
  label: string;
  fill: string;
  rail: string;
  width?: number;
  testID?: string;
}) {
  const pct = Math.round(clamp01(value) * 100);
  return (
    <Meter
      value={pct}
      max={100}
      height={4}
      width={width}
      fill={fill}
      track={rail}
      accessibilityLabel={label}
      valueText={`${pct}%`}
      testID={testID}
    />
  );
}

/** Text clamped to `lines`, with a "Show more" toggle that carries `aria-expanded`. */
export function ClampedText({
  children,
  lines,
  color,
  linkColor,
  ring,
  showMoreLabel = 'Show more',
  showLessLabel = 'Show less',
  testID,
}: {
  children: string;
  lines: number;
  color: string;
  linkColor: string;
  ring: string;
  showMoreLabel?: string;
  showLessLabel?: string;
  testID?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const { state: hovered, onIn, onOut } = useInteractionState();
  // Only offer the toggle when the text can plausibly overflow: ~ 60 characters a line.
  const canOverflow = children.length > lines * 60;
  const toggleStyle: WebCssStyle = { alignSelf: 'flex-start', borderRadius: 4, '--bloom-media-header-ring': ring };
  return (
    <View style={{ gap: 4 }} testID={testID}>
      <Text variant="body-regular" numberOfLines={expanded ? undefined : lines} style={{ color }}>
        {children}
      </Text>
      {canOverflow ? (
        <Pressable
          {...webData({ bloomMediaHeaderPress: '' })}
          role="button"
          accessibilityLabel={expanded ? showLessLabel : showMoreLabel}
          aria-expanded={expanded}
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((e) => !e)}
          onHoverIn={onIn}
          onHoverOut={onOut}
          style={toggleStyle}
        >
          <Text
            variant="body-semibold"
            style={{ color: linkColor, textDecorationLine: hovered ? 'underline' : 'none' }}
          >
            {expanded ? showLessLabel : showMoreLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
