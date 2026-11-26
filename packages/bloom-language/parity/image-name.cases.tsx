import * as RN from 'react-native';
import { BloomImage } from '@oxy.so/bloom/image';

import * as L from '../src/__tests__/support/language.generated';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const COVER = 'https://example.com/cover.jpg';

/**
 * An image's name. `Image(source, alt)` is Bloom's `alt`, which expo-image and
 * React Native's own Image read as `accessibilityLabel` (natively, `alt` also
 * makes the image an accessibility element); on the web Bloom's image is
 * react-native-web's Image, which writes the name as its `aria-label` and its
 * `<img alt>`, as React Native's Image with an `accessibilityLabel` does.
 */
export const IMAGE_NAME_CASES: readonly ParityCase[] = [
  {
    name: 'an image named by its alt and React Native’s Image with its label',
    language: () => toElement(L.Image(COVER, 'Cover').frame({ width: '120', height: '120' })),
    bloom: () =>
      RN.Platform.OS === 'web' ? (
        <RN.Image
          source={{ uri: COVER }}
          resizeMode="cover"
          accessibilityLabel="Cover"
          style={{ width: 120, height: 120 }}
        />
      ) : (
        <BloomImage source={COVER} alt="Cover" style={{ width: 120, height: 120 }} />
      ),
  },
  {
    name: 'an image named by .label() and Bloom’s image with its label',
    language: () => toElement(L.Image(COVER).label('Cover').frame({ width: '120', height: '120' })),
    bloom: () => (
      <BloomImage source={COVER} accessibilityLabel="Cover" style={{ width: 120, height: 120 }} />
    ),
  },
];
