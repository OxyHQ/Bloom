import { StickySection, Toolbar } from '@oxy.so/bloom/layout';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

export const TOOLBAR_CASES: ParityCase[] = [
  {
    name: 'a toolbar: tools, actions and an accessory row',
    language: () =>
      toElement(
        L.Toolbar(L.Text('bold'), L.Text('italic'))
          .trailing(L.Text('share'))
          .accessory(L.Text('fonts'))
          .testID('tools'),
      ),
    bloom: () => (
      <Toolbar actions={<Text>share</Text>} accessory={<Text>fonts</Text>} testID="tools">
        <Text>bold</Text>
        <Text>italic</Text>
      </Toolbar>
    ),
  },
  ...ENUMS.controlSize.map((size) => ({
    name: `a ${size} toolbar`,
    language: () => toElement(L.Toolbar(L.Text('bold')).size(size)),
    bloom: () => (
      <Toolbar size={size}>
        <Text>bold</Text>
      </Toolbar>
    ),
  })),
  {
    name: 'a sticky section',
    language: () => toElement(L.StickySection(L.Text('Today')).testID('day')),
    bloom: () => (
      <StickySection testID="day">
        <Text>Today</Text>
      </StickySection>
    ),
  },
];
