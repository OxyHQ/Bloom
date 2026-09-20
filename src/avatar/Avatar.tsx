import { useContext } from 'react';
import { BloomAppearanceContext } from '../appearance/context';
import React, { memo, useMemo, useRef, useState } from 'react';
import { View, Image, StyleSheet, Pressable, Platform } from 'react-native';
import type { TextStyle } from 'react-native';
import Svg, { ClipPath, Defs, Image as SvgImage, Path } from 'react-native-svg';

import { useTheme } from '../theme/use-theme';
import { useInteractionState } from '../hooks/use-interaction-state';
import { useImageResolver } from '../image-resolver/context';
import { Z_INDEX } from '../styles/z-index';
import { useAvatarPlaceholder } from './context';
import { LiveBadge } from './LiveBadge';
import { AvatarRing, getRingOuterSize } from './AvatarRing';
import { resolveAvatarShape } from './resolve-shape';
import { Text } from '../typography';
import type { WebCssStyle } from '../styles/web-view-style';
import {
  avatarInitialsType,
  avatarTintForName,
  getInitial,
  resolveAvatarSize,
  resolveAvatarTint,
} from './initials';
import type { AvatarProps, AvatarRingConfig, AvatarShapePath } from './types';

/**
 * `transition-[width,height,font-size] duration-200 ease` — web only;
 * native has no style transitions and a size change there is a relayout.
 */
const SIZE_TRANSITION: WebCssStyle =
  Platform.OS === 'web'
    ? { transitionProperty: 'width, height, font-size', transitionDuration: '200ms', transitionTimingFunction: 'ease' }
    : {};

// Built-in default avatar image — used when no source, fallbackSource, or placeholderIcon is provided.
// Sourced from a TypeScript module that exports an inlined base64 data URI, so no
// `.jpg` asset import (and no ambient `*.jpg` module declaration) is required for
// consumers compiling Bloom's source files directly.
import DEFAULT_AVATAR_IMAGE from './default-avatar';

let clipIdCounter = 0;

/**
 * Renders the avatar image clipped to an arbitrary outline.
 *
 * The path and the SVG viewport share one coordinate space, so a 0–1 squircle
 * and a 0–100 named shape both work without rewriting their numbers: the
 * viewport is declared at the path's own scale and the whole thing is drawn at
 * `size` pixels.
 */
function ClippedImage({
  uri,
  fallbackSource,
  size,
  shape,
  fallbackColor,
  placeholderIcon,
  text,
  textColor,
  onError,
}: {
  uri?: string;
  fallbackSource?: AvatarProps['fallbackSource'];
  size: number;
  shape: AvatarShapePath;
  fallbackColor: string;
  placeholderIcon?: React.ReactNode;
  text?: string;
  textColor: string;
  onError: () => void;
}) {
  const clipId = useMemo(() => `bloom-sqc${clipIdCounter++}`, []);

  const href = uri ? { uri } : fallbackSource;
  if (!href) {
    return (
      <CircleFallback
        size={size}
        fallbackColor={fallbackColor}
        icon={placeholderIcon}
        text={text}
        textColor={textColor}
      />
    );
  }

  const span = shape.viewBox ?? 1;

  return (
    <>
      {/* Hidden RN Image for error detection on remote URIs */}
      {uri && (
        <Image
          source={{ uri }}
          style={styles.errorDetector}
          onError={onError}
        />
      )}
      <Svg width={size} height={size} viewBox={`0 0 ${span} ${span}`}>
        <Defs>
          <ClipPath id={clipId}>
            <Path d={shape.d} />
          </ClipPath>
        </Defs>
        <SvgImage
          href={href}
          width={span}
          height={span}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
      </Svg>
    </>
  );
}

function CircleFallback({
  size,
  fallbackColor,
  icon,
  text,
  textColor,
}: {
  size: number;
  fallbackColor: string;
  icon?: React.ReactNode;
  text?: string;
  textColor: string;
}) {
  const radius = size / 2;
  const initialStyle: TextStyle = {
    ...avatarInitialsType(size),
    color: textColor,
    textAlign: 'center',
    includeFontPadding: false,
  };
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: fallbackColor,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {icon ?? (text ? (
        <Text allowFontScaling={false} numberOfLines={1} style={initialStyle}>
          {text}
        </Text>
      ) : (
        <Image
          source={DEFAULT_AVATAR_IMAGE}
          resizeMode="cover"
          style={{ width: size, height: size, borderRadius: radius }}
        />
      ))}
    </View>
  );
}

const AvatarComponent: React.FC<AvatarProps> = ({
  source,
  uri,
  variant = 'thumb',
  fallbackSource,
  size: sizeProp,
  color,
  initials,
  alt,
  verified = false,
  verifiedIcon,
  shape = 'circle',
  style,
  imageStyle,
  placeholderColor,
  placeholderIcon,
  name,
  onPress,
  live = false,
  hideLiveBadge = false,
  liveLabel = 'LIVE',
  liveColor,
  ring,
  testID,
}) => {
  const [errored, setErrored] = useState(false);
  // The press dip goes through the shared interaction hook rather than
  // `TouchableOpacity`'s `activeOpacity` — one mechanism across the library, and
  // the one the reduced-motion / pointer-type guards live behind.
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
  const theme = useTheme();
  const placeholderConfig = useAvatarPlaceholder();
  const scope = useContext(BloomAppearanceContext);
  const size = resolveAvatarSize(sizeProp ?? scope.size);
  const radius = size / 2;
  // `null` means "a circle", which is drawn with borderRadius and never reaches
  // the SVG renderer. Memoised so an inline `shape={{ d: … }}` object literal
  // does not produce a new clip descriptor on every render.
  const clipShape = useMemo(() => resolveAvatarShape(shape), [shape]);
  const hasName = typeof name === 'string' && name.trim().length > 0;
  const hasInitials = typeof initials === 'string' && initials.trim().length > 0;
  // The fallback text: explicit `initials` > the first letter of `name`.
  const fallbackText = hasInitials ? initials.trim() : hasName ? getInitial(name) : undefined;
  // The tint: explicit `color` > deterministic from `name` > neutral.
  const tint = useMemo(
    () => resolveAvatarTint(theme, color ?? (hasName && !hasInitials ? avatarTintForName(name) : 'neutral')),
    [theme, color, hasName, hasInitials, name],
  );
  // Priority: explicit placeholderColor > the tint. A caller's own colour gets
  // a white letter (Bloom cannot know its contrast) unless a tint is also named.
  const fallbackColor = placeholderColor || tint.background;
  const fallbackTextColor = placeholderColor && !color ? '#FFFFFF' : tint.foreground;
  // With fallback text we render it instead of invoking the default
  // placeholder-context icon. Explicit placeholderIcon still wins.
  const resolvedPlaceholderIcon =
    placeholderIcon ?? (fallbackText ? undefined : placeholderConfig?.icon?.(size * 0.6));

  // Reset error state when source/uri/variant changes (e.g., list item
  // recycling, async URL resolution replacing an initial file ID, or a
  // different rendition being requested).
  // Pattern from https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const prevSourceRef = useRef(source);
  const prevUriRef = useRef(uri);
  const prevVariantRef = useRef(variant);
  if (
    prevSourceRef.current !== source ||
    prevUriRef.current !== uri ||
    prevVariantRef.current !== variant
  ) {
    prevSourceRef.current = source;
    prevUriRef.current = uri;
    prevVariantRef.current = variant;
    if (errored) {
      setErrored(false);
    }
  }

  const imageResolver = useImageResolver();

  // Resolve source prop: string → uri, object → ImageSourcePropType.
  // HTTP/data URLs pass through directly. Non-URL strings (e.g. Oxy file
  // IDs) are resolved via the app-provided ImageResolver if available, with the
  // requested `variant` forwarded so the resolver (the single URL chokepoint)
  // can build the right rendition. `variant` defaults to `'thumb'` (see prop
  // default) so a bare-id avatar never accidentally requests the full-size
  // original; callers wanting the full image pass an explicit variant.
  const resolvedUri = useMemo(() => {
    if (typeof source === 'string') {
      if (source.startsWith('http://') || source.startsWith('https://') || source.startsWith('data:')) {
        return source;
      }
      return imageResolver?.(source, variant);
    }
    return uri;
  }, [source, uri, variant, imageResolver]);

  const resolvedImageSource = useMemo(() => {
    if (source != null && typeof source !== 'string') return source;
    return undefined;
  }, [source]);

  const effectiveUri = errored ? undefined : resolvedUri;

  const imageSource = useMemo(() => {
    if (effectiveUri) return { uri: effectiveUri };
    if (resolvedImageSource) return resolvedImageSource;
    return fallbackSource;
  }, [effectiveUri, resolvedImageSource, fallbackSource]);

  // Resolve a SINGLE ring config shared by `live` and the public `ring` prop.
  // An explicit `ring` wins for geometry and colors; otherwise `live` derives a
  // solid theme-`negative` ring (modeled on Bluesky's live indicator). The
  // "LIVE" badge stays independently controlled by `live` / `hideLiveBadge` and
  // uses the theme `negative` color regardless of the ring's colors.
  const liveBadgeColor = liveColor ?? theme.colors.negative;
  const resolvedRing: AvatarRingConfig | undefined = ring
    ? ring
    : live
      ? { colors: liveBadgeColor, width: size > 16 ? 2 : 1, gap: 0 }
      : undefined;
  const ringWidth = resolvedRing?.width ?? (size > 16 ? 2 : 1);
  const ringGap = resolvedRing?.gap ?? 0;
  // When gap > 0 the ring sits outside the avatar and the footprint grows so the
  // avatar can be centered inside; gap 0 overlays the edge (footprint unchanged).
  const outer = resolvedRing ? getRingOuterSize(size, ringWidth, ringGap) : size;
  const showLiveBadge = live && size > 16 && !hideLiveBadge;

  const ringElement = resolvedRing ? (
    <AvatarRing
      size={size}
      shape={clipShape}
      colors={resolvedRing.colors}
      width={ringWidth}
      gap={ringGap}
      gradientDirection={resolvedRing.gradientDirection ?? 'diagonal'}
    />
  ) : null;

  // The avatar box holds the image and the badges (which hug the avatar). When
  // gap > 0 this box is centered inside the larger container; when gap is 0 it
  // fills the container exactly.
  const avatarBox = (
    <View style={[styles.avatarBox, { width: size, height: size }]}>
      {clipShape ? (
        <ClippedImage
          uri={effectiveUri}
          fallbackSource={fallbackSource}
          size={size}
          shape={clipShape}
          fallbackColor={fallbackColor}
          placeholderIcon={resolvedPlaceholderIcon}
          text={fallbackText}
          textColor={fallbackTextColor}
          onError={() => setErrored(true)}
        />
      ) : (
        <View
          style={[
            styles.imageContainer,
            SIZE_TRANSITION,
            { width: size, height: size, borderRadius: radius },
          ]}
        >
          {imageSource ? (
            <Image
              source={imageSource}
              accessibilityLabel={alt}
              accessible={alt ? true : undefined}
              onError={() => setErrored(true)}
              resizeMode="cover"
              style={[StyleSheet.absoluteFill, { borderRadius: radius }, imageStyle]}
            />
          ) : (
            <CircleFallback
              size={size}
              fallbackColor={fallbackColor}
              icon={resolvedPlaceholderIcon}
              text={fallbackText}
              textColor={fallbackTextColor}
            />
          )}
        </View>
      )}

      {/* Overlay ring (gap 0) overlays the avatar edge, above the image but
          below the badges. */}
      {ringGap === 0 ? ringElement : null}

      {verified && verifiedIcon && (
        <View
          style={[
            styles.verifiedBadge,
            {
              width: size * 0.36,
              height: size * 0.36,
            },
          ]}
        >
          {verifiedIcon}
        </View>
      )}

      {showLiveBadge && (
        <LiveBadge
          variant={size > 32 ? 'small' : 'tiny'}
          label={liveLabel}
          backgroundColor={liveBadgeColor}
          textColor={theme.colors.negativeForeground}
        />
      )}
    </View>
  );

  const content = (
    <View style={[styles.container, { width: outer, height: outer }, style]} testID={testID}>
      {/* Outside ring (gap > 0) sits on the reserved perimeter, behind the
          avatar box so the avatar and its badges paint on top. */}
      {ringGap > 0 ? ringElement : null}
      {avatarBox}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={alt ?? (hasName ? name : undefined)}
        style={pressed ? styles.pressed : undefined}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  container: {
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBox: {
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: Z_INDEX.raised,
  },
  errorDetector: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});

export const Avatar = memo(AvatarComponent);
Avatar.displayName = 'Avatar';
