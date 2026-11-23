import { useState } from 'react';
import { BloomImage } from '@oxy.so/bloom/image';
import {
  DEFAULT_ASPECT_RATIO,
  getAspectRatio,
  setAspectRatio,
} from '@oxy.so/bloom/image-aspect-ratio-cache';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

/** A photo whose shape a thumbnail already recorded, and one nobody has measured. */
const KNOWN = 'https://example.com/known.jpg';
const UNKNOWN = 'https://example.com/unknown.jpg';
setAspectRatio(KNOWN, 16 / 9);

/** What a feed row writes: the cache's ratio, Bloom's default until the image loads, recorded on load. */
function useRatio(uri: string) {
  const [ratio, setRatio] = useState(() => getAspectRatio(uri) ?? DEFAULT_ASPECT_RATIO);
  const record = ({ width, height }: { width: number; height: number }) => {
    if (width <= 0 || height <= 0) return;
    setAspectRatio(uri, width / height);
    setRatio(width / height);
  };
  return [ratio, record] as const;
}

const LanguagePhoto = L.view(({ uri }: { uri: string }) => {
  const [ratio, record] = useRatio(uri);
  return L.Image(uri).frame({ width: '320' }).aspectRatio(ratio).onLoad(record);
});

function BloomPhoto({ uri }: { uri: string }) {
  const [ratio, record] = useRatio(uri);
  return <BloomImage source={uri} style={{ width: 320, aspectRatio: ratio }} onLoad={record} />;
}

export const IMAGE_ASPECT_RATIO_CASES: readonly ParityCase[] = [
  {
    name: 'an image whose ratio the cache knows',
    language: () => toElement(LanguagePhoto({ uri: KNOWN })),
    bloom: () => <BloomPhoto uri={KNOWN} />,
  },
  {
    name: 'an image at the default ratio until it loads',
    language: () => toElement(LanguagePhoto({ uri: UNKNOWN })),
    bloom: () => <BloomPhoto uri={UNKNOWN} />,
  },
];
