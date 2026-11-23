import { LinkPreviewCard } from '@oxy.so/bloom/link-preview';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const open = () => {};
const PREVIEW = {
  url: 'https://example.com/notes/tides',
  title: 'Reading the tides',
  description: 'Why the water comes in twice a day, and why some days it barely moves.',
  siteName: 'Example Notes',
  author: 'Ana Ruiz',
};
const COVER = 'https://example.com/tides.jpg';
const COVERS = [
  { uri: 'https://example.com/tides-320.jpg', width: 320 },
  { uri: 'https://example.com/tides-640.jpg', width: 640 },
];

export const LINK_PREVIEW_CASES: readonly ParityCase[] = [
  {
    name: 'a link preview',
    language: () => toElement(L.LinkPreview(PREVIEW)),
    bloom: () => <LinkPreviewCard {...PREVIEW} />,
  },
  {
    name: 'a bare link',
    language: () => toElement(L.LinkPreview({ url: 'https://example.com' })),
    bloom: () => <LinkPreviewCard url="https://example.com" />,
  },
  {
    name: 'a link preview with its cover, pressed by the app',
    language: () => toElement(L.LinkPreview({ ...PREVIEW, image: COVER }).onPress(open)),
    bloom: () => <LinkPreviewCard {...PREVIEW} image={COVER} onPress={open} />,
  },
  {
    name: 'a link preview filling a fixed-height row',
    language: () =>
      toElement(
        L.LinkPreview({ ...PREVIEW, image: COVERS })
          .coverFill()
          .frame({ width: '320', height: '200' }),
      ),
    bloom: () => (
      <LinkPreviewCard {...PREVIEW} image={COVERS} coverFill style={{ width: 320, height: 200 }} />
    ),
  },
];
