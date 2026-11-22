import { ViewportProvider } from '@oxy.so/bloom/viewport';
import { Text } from '@oxy.so/bloom/typography';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

export const VIEWPORT_CASES: readonly ParityCase[] = [
  {
    name: 'a viewport around what it holds',
    language: () => toElement(L.Viewport(L.Text('Reviews'), L.Text('Photos'))),
    bloom: () => (
      <ViewportProvider>
        <Text>Reviews</Text>
        <Text>Photos</Text>
      </ViewportProvider>
    ),
  },
  {
    name: 'a root viewport, nested',
    language: () => toElement(L.Viewport(L.Viewport(L.Text('Dialog')).root())),
    bloom: () => (
      <ViewportProvider>
        <ViewportProvider root>
          <Text>Dialog</Text>
        </ViewportProvider>
      </ViewportProvider>
    ),
  },
];
