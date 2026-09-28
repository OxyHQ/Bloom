import React from 'react';
import { Image as NativeImage, StyleSheet } from 'react-native';
import Svg, { ClipPath, Defs, Image as SvgImage, Path } from 'react-native-svg';
import { resolve } from './resolve';
import { assertSize, assertImageSource } from './validation';
import { useSvgId } from './use-svg-id';
import type { ImageProps } from './types';

/** Clips an image on every platform. SVG cannot clip arbitrary React Native views. */
export function Image({
  shape = 'circle',
  source,
  size,
  alt,
  onError,
}: ImageProps) {
  const clipId = useSvgId('shape-image');
  assertSize(size);
  assertImageSource(source);
  const outline = resolve(shape);
  if (!outline)
    return (
      <NativeImage
        source={source}
        accessibilityLabel={alt}
        accessible={alt ? true : undefined}
        onError={onError}
        resizeMode="cover"
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  return (
    <>
      {/* SVG has no portable onError; this hidden native image observes the same source. */}
      {onError && (
        <NativeImage
          source={source}
          accessible={false}
          aria-hidden
          importantForAccessibility="no-hide-descendants"
          style={styles.detector}
          onError={onError}
        />
      )}
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${outline.viewBox} ${outline.viewBox}`}
        accessible={Boolean(alt)}
        accessibilityRole={alt ? 'image' : undefined}
        accessibilityLabel={alt}
        aria-label={alt}
        aria-hidden={!alt}
      >
        <Defs>
          <ClipPath id={clipId}>
            <Path d={outline.d} />
          </ClipPath>
        </Defs>
        <SvgImage
          href={source}
          width={outline.viewBox}
          height={outline.viewBox}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
      </Svg>
    </>
  );
}
const styles = StyleSheet.create({
  detector: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
