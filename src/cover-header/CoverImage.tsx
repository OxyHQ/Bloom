import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { BloomImage, type BloomImageLoadInfo } from '../image';
import { CENTER_POSITION, clampPosition, coverGeometry, coverSourceIdentity } from './geometry';
import type { CoverImageProps } from './types';

/** One crop renderer for cover bands, compact previews and galleries. */
export function CoverImage({
  source,
  sourceKey: explicitSourceKey,
  position = CENTER_POSITION,
  contentFit = 'cover',
  style,
  accessibilityLabel,
  testID,
  onGeometryChange,
}: CoverImageProps) {
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  // Associate dimensions with their source, so a changed URL cannot borrow the previous crop.
  const sourceKey = coverSourceIdentity(source, explicitSourceKey);
  const [loaded, setLoaded] = useState<{ key: string; size: BloomImageLoadInfo } | null>(null);
  const natural = loaded?.key === sourceKey ? loaded.size : null;
  const geometry = box && natural ? coverGeometry(box, natural, contentFit) : null;
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox((prev) => (prev?.width === width && prev.height === height ? prev : { width, height }));
  }, []);
  const onLoad = useCallback(
    (size: BloomImageLoadInfo) => {
      if (size.width > 0 && size.height > 0) setLoaded({ key: sourceKey, size });
    },
    [sourceKey],
  );
  const width = geometry?.width;
  const height = geometry?.height;
  const overflowX = geometry?.overflowX;
  const overflowY = geometry?.overflowY;
  useEffect(() => {
    onGeometryChange?.(
      width === undefined ||
        height === undefined ||
        overflowX === undefined ||
        overflowY === undefined
        ? null
        : { width, height, overflowX, overflowY },
    );
  }, [width, height, overflowX, overflowY, onGeometryChange]);
  const crop = clampPosition(position);
  return (
    <View
      style={[{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }, style]}
      onLayout={onLayout}
      testID={testID ? `${testID}-frame` : undefined}
    >
      <BloomImage
        source={source}
        onLoad={onLoad}
        accessibilityIgnoresInvertColors
        accessibilityLabel={accessibilityLabel}
        aria-hidden={accessibilityLabel ? undefined : true}
        contentFit={contentFit}
        testID={testID}
        style={
          geometry && box
            ? {
                position: 'absolute',
                width: geometry.width,
                height: geometry.height,
                left: (box.width - geometry.width) * (contentFit === 'contain' ? 0.5 : crop.x),
                top: (box.height - geometry.height) * (contentFit === 'contain' ? 0.5 : crop.y),
              }
            : StyleSheet.absoluteFill
        }
      />
    </View>
  );
}
