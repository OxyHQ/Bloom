import { ColorSwatchPicker } from '@oxy.so/bloom/color-swatch-picker';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const set = () => {};
const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'];
const NAMES = { '#ef4444': 'Red', '#3b82f6': 'Blue' };

export const COLOR_SWATCH_PICKER_CASES: readonly ParityCase[] = [
  {
    name: 'a swatch row, one chosen',
    language: () => toElement(L.ColorSwatchPicker('Brand colour', ['#10b981', set], COLORS)),
    bloom: () => (
      <ColorSwatchPicker label="Brand colour" value="#10b981" onValueChange={set} colors={COLORS} />
    ),
  },
  {
    name: 'named swatches',
    language: () =>
      toElement(L.ColorSwatchPicker('Tag colour', ['#ef4444', set], COLORS).labels(NAMES)),
    bloom: () => (
      <ColorSwatchPicker
        label="Tag colour"
        value="#ef4444"
        onValueChange={set}
        colors={COLORS}
        names={NAMES}
      />
    ),
  },
  ...(['2xl', '3xl', '5xl'] as const).map((size) => ({
    name: `${size} swatches`,
    language: () =>
      toElement(L.ColorSwatchPicker('Label colour', ['#3b82f6', set], COLORS).size(size)),
    bloom: () => (
      <ColorSwatchPicker
        label="Label colour"
        value="#3b82f6"
        onValueChange={set}
        colors={COLORS}
        size={{ '2xl': 24, '3xl': 32, '5xl': 60 }[size]}
      />
    ),
  })),
  {
    name: 'a disabled row with a box of its own',
    language: () =>
      toElement(
        L.ColorSwatchPicker('Brand colour', ['#f59e0b', set], COLORS)
          .disabled()
          .padding('sm')
          .testID('swatches'),
      ),
    bloom: () => (
      <ColorSwatchPicker
        label="Brand colour"
        value="#f59e0b"
        onValueChange={set}
        colors={COLORS}
        disabled
        testID="swatches"
        style={{ paddingTop: 8, paddingBottom: 8, paddingStart: 8, paddingEnd: 8 }}
      />
    ),
  },
];
