import React, { memo, useMemo, useRef, useState } from 'react';
import { View, Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { TextStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { useImageResolver } from '../image-resolver/context';
import { lazyRequire } from '../utils/lazy-require';
import { useAvatarPlaceholder } from './placeholder-context';
import type { AvatarProps } from './types';

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

// Squircle clip path normalized to 0–1 coordinate space (viewBox="0 0 1 1").
const SQUIRCLE_PATH =
  'M0 0.5 L0.00122 0.31674 L0.00489 0.25123 L0.01103 0.20331 L0.01969 0.16478 L0.03097 0.13257 L0.04495 0.10518 L0.0618 0.08177 L0.08177 0.0618 L0.10518 0.04495 L0.13257 0.03097 L0.16478 0.01969 L0.20331 0.01103 L0.25123 0.00489 L0.31674 0.00122 L0.5 0' +
  ' L0.68895 0.0014 L0.7564 0.00561 L0.80559 0.01267 L0.84499 0.02264 L0.87771 0.03564 L0.9053 0.05181 L0.92862 0.07138 L0.94819 0.0947 L0.96436 0.12228 L0.97736 0.15501 L0.98733 0.19441 L0.99439 0.2436 L0.9986 0.31105 L1 0.5' +
  ' L0.9986 0.68895 L0.99439 0.7564 L0.98733 0.80559 L0.97736 0.84499 L0.96436 0.87771 L0.94819 0.9053 L0.92862 0.92862 L0.9053 0.94819 L0.87771 0.96436 L0.84499 0.97736 L0.80559 0.98733 L0.7564 0.99439 L0.68895 0.9986 L0.5 1' +
  ' L0.31105 0.9986 L0.2436 0.99439 L0.19441 0.98733 L0.15501 0.97736 L0.12228 0.96436 L0.0947 0.94819 L0.07138 0.92862 L0.05181 0.9053 L0.03564 0.87771 L0.02264 0.84499 L0.01267 0.80559 L0.00561 0.7564 L0.0014 0.68895 L0 0.5Z';

let clipIdCounter = 0;

// Lazy-loaded SVG components for squircle shape.
// Returns null if react-native-svg is not installed.
type SvgModuleType = typeof import('react-native-svg');
const getSvgModule = lazyRequire<SvgModuleType>('react-native-svg');

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
  const svg = getSvgModule();
  if (!svg) {
    // Fallback to circle if react-native-svg is not installed
    return <CircleFallback size={size} fallbackColor={fallbackColor} icon={placeholderIcon} name={name} />;
  }

  const { default: Svg, Defs, ClipPath, Path, Image: SvgImage } = svg;
  const clipId = useMemo(() => `bloom-sqc${clipIdCounter++}`, []);

  const href = uri ? { uri } : fallbackSource;
  if (!href) {
    return <CircleFallback size={size} fallbackColor={fallbackColor} icon={placeholderIcon} name={name} />;
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

  // Reset error state when source changes (e.g., list item recycling
  // or async URL resolution replacing an initial file ID).
  // Pattern from https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const prevSourceRef = useRef(source);
  const prevUriRef = useRef(uri);
  if (prevSourceRef.current !== source || prevUriRef.current !== uri) {
    prevSourceRef.current = source;
    prevUriRef.current = uri;
    if (errored) {
      setErrored(false);
    }
  }

  const imageResolver = useImageResolver();

  // Resolve source prop: string → uri, object → ImageSourcePropType.
  // HTTP/data URLs pass through directly. Non-URL strings (e.g. file
  // IDs) are resolved via the app-provided ImageResolver if available.
  const resolvedUri = useMemo(() => {
    if (typeof source === 'string') {
      if (source.startsWith('http://') || source.startsWith('https://') || source.startsWith('data:')) {
        return source;
      }
      return imageResolver?.(source);
    }
    return uri;
  }, [source, uri, imageResolver]);

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

  const content = (
    <View style={[styles.container, { width: size, height: size }, style]} testID={testID}>
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
              style={[StyleSheet.absoluteFillObject, { borderRadius: radius }, imageStyle]}
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
    zIndex: 1,
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
