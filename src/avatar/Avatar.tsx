import React, { memo, useMemo, useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';

import { useTheme } from '../theme/use-theme';
import type { AvatarProps } from './types';

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
let svgModule: SvgModuleType | null = null;
let svgModuleResolved = false;

function getSvgModule(): SvgModuleType | null {
  if (!svgModuleResolved) {
    svgModuleResolved = true;
    try {
      svgModule = require('react-native-svg');
    } catch {
      svgModule = null;
    }
  }
  return svgModule;
}

function SquircleImage({
  uri,
  fallbackSource,
  size,
  fallbackColor,
  onError,
}: {
  uri?: string;
  fallbackSource?: AvatarProps['fallbackSource'];
  size: number;
  fallbackColor: string;
  onError: () => void;
}) {
  const svg = getSvgModule();
  if (!svg) {
    // Fallback to circle if react-native-svg is not installed
    return <CircleFallback size={size} fallbackColor={fallbackColor} />;
  }

  const { default: Svg, Defs, ClipPath, Path, Image: SvgImage } = svg;
  const clipId = useMemo(() => `bloom-sqc${clipIdCounter++}`, []);

  const href = uri ? { uri } : fallbackSource;
  if (!href) {
    return <CircleFallback size={size} fallbackColor={fallbackColor} />;
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

function CircleFallback({ size, fallbackColor }: { size: number; fallbackColor: string }) {
  const radius = size / 2;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: fallbackColor,
      }}
    />
  );
}

const AvatarComponent: React.FC<AvatarProps> = ({
  uri,
  fallbackSource,
  size = 40,
  verified = false,
  verifiedIcon,
  shape = 'circle',
  style,
  imageStyle,
  onPress,
  testID,
}) => {
  const [errored, setErrored] = useState(false);
  const theme = useTheme();
  const radius = size / 2;
  const effectiveUri = errored ? undefined : uri;
  const fallbackColor = theme.colors.backgroundTertiary;

  const imageSource = useMemo(() => {
    if (effectiveUri) return { uri: effectiveUri };
    return fallbackSource;
  }, [effectiveUri, fallbackSource]);

  const content = (
    <View style={[styles.container, { width: size, height: size }, style]} testID={testID}>
      {shape === 'squircle' ? (
        <SquircleImage
          uri={effectiveUri}
          fallbackSource={fallbackSource}
          size={size}
          fallbackColor={fallbackColor}
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
            <CircleFallback size={size} fallbackColor={fallbackColor} />
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
