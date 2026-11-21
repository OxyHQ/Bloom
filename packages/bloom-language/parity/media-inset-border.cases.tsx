import { MediaInsetBorder } from '@oxy.so/bloom/media-inset-border';
import { tokens } from '@oxy.so/bloom/styles';
import { Text } from '@oxy.so/bloom/typography';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

/** The border fills the media box it edges; here the box is its own frame. */
const BOX = { width: 160, height: 96 };
const { borderRadius } = tokens;

export const MEDIA_INSET_BORDER_CASES: readonly ParityCase[] = [
  {
    name: 'a soft border',
    language: () => toElement(L.MediaInsetBorder().frame({ width: '160', height: '96' })),
    bloom: () => <MediaInsetBorder style={BOX} />,
  },
  {
    name: 'an opaque border',
    language: () => toElement(L.MediaInsetBorder().opaque().frame({ width: '160', height: '96' })),
    bloom: () => <MediaInsetBorder opaque style={BOX} />,
  },
  {
    name: 'a border at the media corner',
    language: () =>
      toElement(L.MediaInsetBorder().mediaCorner('lg').frame({ width: '160', height: '96' })),
    bloom: () => <MediaInsetBorder style={[{ borderRadius: borderRadius.lg }, BOX]} />,
  },
  {
    name: 'a border over its content',
    language: () =>
      toElement(L.MediaInsetBorder(L.Text('ALT')).frame({ width: '160', height: '96' })),
    bloom: () => (
      <MediaInsetBorder style={BOX}>
        <Text>ALT</Text>
      </MediaInsetBorder>
    ),
  },
];
