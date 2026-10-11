import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageLoadEventData,
  type ImageSourcePropType,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
} from 'react-native';

/** `object-fit: cover` with an `object-position`: the image sized to cover the box, offset by the fractions. */
export function CoverImage({
  source,
  position,
  testID,
}: {
  source: string | ImageSourcePropType;
  position: { x: number; y: number };
  testID?: string;
}) {
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const resolved: ImageSourcePropType = typeof source === 'string' ? { uri: source } : source;

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox((prev) =>
      prev && prev.width === width && prev.height === height ? prev : { width, height },
    );
  }, []);
  const onLoad = useCallback((event: NativeSyntheticEvent<ImageLoadEventData>) => {
    const s = event.nativeEvent?.source;
    if (s && s.width > 0 && s.height > 0) setNatural({ width: s.width, height: s.height });
  }, []);

  const frame = useMemo(() => {
    if (!box || !natural) return null;
    const scale = Math.max(box.width / natural.width, box.height / natural.height);
    const width = natural.width * scale;
    const height = natural.height * scale;
    return {
      width,
      height,
      left: (box.width - width) * position.x,
      top: (box.height - height) * position.y,
    };
  }, [box, natural, position.x, position.y]);

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={onLayout}
      testID={testID ? `${testID}-frame` : undefined}
    >
      <Image
        testID={testID}
        source={resolved}
        onLoad={onLoad}
        accessibilityIgnoresInvertColors
        aria-hidden
        resizeMode="cover"
        style={
          frame
            ? {
                position: 'absolute',
                left: frame.left,
                top: frame.top,
                width: frame.width,
                height: frame.height,
              }
            : StyleSheet.absoluteFill
        }
      />
    </View>
  );
}
