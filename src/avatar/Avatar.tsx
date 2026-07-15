import React, { memo, useMemo, useRef, useState } from 'react';
import { View, Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { TextStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { useImageResolver } from '../image-resolver/context';
import { Z_INDEX } from '../styles/z-index';
import { useAvatarPlaceholder } from './placeholder-context';
import { LiveBadge } from './LiveBadge';
import { AvatarRing, getRingOuterSize } from './AvatarRing';
import { getSvgModule } from './svg-module';
import { SQUIRCLE_PATH } from './squircle-path';
import type { AvatarProps, AvatarRingConfig } from './types';

// Google Contacts-inspired palette used to pick a deterministic background
// color for name-based placeholder avatars.
const NAME_AVATAR_COLORS = [
  '#D93025', '#E8710A', '#F9AB00', '#1E8E3E', '#12B5CB',
  '#1A73E8', '#7627BB', '#C5221F', '#0B8043', '#A142F4',
] as const;

function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const firstCodePoint = [...trimmed][0] ?? '?';
  return firstCodePoint.toUpperCase();
}

function getNameColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % NAME_AVATAR_COLORS.length;
  // Palette has a fixed, non-empty length, so this lookup always succeeds.
  return NAME_AVATAR_COLORS[index] ?? NAME_AVATAR_COLORS[0];
}

// Built-in default avatar image — used when no source, fallbackSource, or placeholderIcon is provided.
// Sourced from a TypeScript module that exports an inlined base64 data URI, so no
// `.jpg` asset import (and no ambient `*.jpg` module declaration) is required for
// consumers compiling Bloom's source files directly.
import DEFAULT_AVATAR_IMAGE from './default-avatar';

let clipIdCounter = 0;

function SquircleImage({
  uri,
  fallbackSource,
  size,
  fallbackColor,
  placeholderIcon,
  name,
  onError,
}: {
  uri?: string;
  fallbackSource?: AvatarProps['fallbackSource'];
  size: number;
  fallbackColor: string;
  placeholderIcon?: React.ReactNode;
  name?: string;
  onError: () => void;
}) {
  const clipId = useMemo(() => `bloom-sqc${clipIdCounter++}`, []);
  const svg = getSvgModule();
  if (!svg) {
    // Fallback to a circle if react-native-svg is not installed. The ring (if
    // any) is drawn separately by AvatarRing, which also degrades to a circle.
    return (
      <CircleFallback size={size} fallbackColor={fallbackColor} icon={placeholderIcon} name={name} />
    );
  }

  const { default: Svg, Defs, ClipPath, Path, Image: SvgImage } = svg;

  const href = uri ? { uri } : fallbackSource;
  if (!href) {
    return (
      <CircleFallback size={size} fallbackColor={fallbackColor} icon={placeholderIcon} name={name} />
    );
  }

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
      <Svg width={size} height={size} viewBox="0 0 1 1">
        <Defs>
          <ClipPath id={clipId}>
            <Path d={SQUIRCLE_PATH} />
          </ClipPath>
        </Defs>
        <SvgImage
          href={href}
          width={1}
          height={1}
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
  name,
}: {
  size: number;
  fallbackColor: string;
  icon?: React.ReactNode;
  name?: string;
}) {
  const radius = size / 2;
  // If a name is provided (and no custom icon was supplied), render a
  // centered initial in white instead of the default avatar image.
  const hasName = typeof name === 'string' && name.trim().length > 0;
  const initialStyle: TextStyle = {
    color: '#FFFFFF',
    fontSize: Math.round(size * 0.42),
    fontWeight: '600',
    lineHeight: Math.round(size * 0.48),
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
      {icon ?? (hasName ? (
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={initialStyle}
        >
          {getInitial(name)}
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
  size = 40,
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
  const theme = useTheme();
  const placeholderConfig = useAvatarPlaceholder();
  const radius = size / 2;
  const hasName = typeof name === 'string' && name.trim().length > 0;
  // Priority: explicit placeholderColor > deterministic color from name > theme default.
  const fallbackColor =
    placeholderColor || (hasName ? getNameColor(name) : theme.colors.backgroundTertiary);
  // When a name is provided, we render an initial instead of invoking the
  // default placeholder-context icon. Explicit placeholderIcon still wins.
  const resolvedPlaceholderIcon =
    placeholderIcon ?? (hasName ? undefined : placeholderConfig?.icon?.(size * 0.6));

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
      shape={shape}
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
      {shape === 'squircle' ? (
        <SquircleImage
          uri={effectiveUri}
          fallbackSource={fallbackSource}
          size={size}
          fallbackColor={fallbackColor}
          placeholderIcon={resolvedPlaceholderIcon}
          name={name}
          onError={() => setErrored(true)}
        />
      ) : (
        <View style={[styles.imageContainer, { width: size, height: size, borderRadius: radius }]}>
          {imageSource ? (
            <Image
              source={imageSource}
              onError={() => setErrored(true)}
              resizeMode="cover"
              style={[StyleSheet.absoluteFill, { borderRadius: radius }, imageStyle]}
            />
          ) : (
            <CircleFallback
              size={size}
              fallbackColor={fallbackColor}
              icon={resolvedPlaceholderIcon}
              name={name}
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
    return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
  }

  return content;
};

const styles = StyleSheet.create({
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
