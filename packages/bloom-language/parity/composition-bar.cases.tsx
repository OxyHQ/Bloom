import { CompositionBar } from '@oxy.so/bloom/composition-bar';
import { withAlpha } from '@oxy.so/bloom/theme';

import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const set = () => {};
const readout = (points: number, percent: number) => `${points} points, ${percent}%`;
const SEGMENTS: readonly L.CompositionSegment[] = [
  { key: 'content', name: 'Content', amount: 320, tint: 'success' },
  { key: 'social', name: 'Social', amount: 180, tint: 'info' },
  { key: 'trust', name: 'Trust', amount: 96, tint: 'warning/70' },
  { key: 'physical', name: 'Physical', amount: 44, tint: 'error' },
];
const HINT = 'Tap a segment to see its share';

export const COMPOSITION_BAR_CASES: readonly ParityCase[] = [
  ...[null, 'social'].map((selected) => ({
    name: selected === null ? 'a composition bar' : `a composition bar, ${selected} chosen`,
    language: () => toElement(L.CompositionBar(SEGMENTS, [selected, set], HINT)),
    bloom: () => (
      <Themed>
        {(c) => (
          <CompositionBar
            categories={[
              { key: 'content', name: 'Content', amount: 320, color: c.success },
              { key: 'social', name: 'Social', amount: 180, color: c.info },
              { key: 'trust', name: 'Trust', amount: 96, color: withAlpha(c.warning, 0.7) },
              { key: 'physical', name: 'Physical', amount: 44, color: c.error },
            ]}
            selectedKey={selected}
            onSelect={set}
            hintLabel={HINT}
          />
        )}
      </Themed>
    ),
  })),
  {
    name: 'a composition bar read out in its own words, padded',
    language: () =>
      toElement(
        L.CompositionBar(SEGMENTS.slice(0, 2), ['content', set], HINT)
          .readoutFormat(readout)
          .padding('lg')
          .testID('standing'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <CompositionBar
            categories={[
              { key: 'content', name: 'Content', amount: 320, color: c.success },
              { key: 'social', name: 'Social', amount: 180, color: c.info },
            ]}
            selectedKey="content"
            onSelect={set}
            hintLabel={HINT}
            formatReadout={readout}
            style={{ paddingTop: 16, paddingBottom: 16, paddingStart: 16, paddingEnd: 16 }}
            testID="standing"
          />
        )}
      </Themed>
    ),
  },
];
