import { RangeSlider, Slider } from '@oxy.so/bloom/slider';
import { withAlpha } from '@oxy.so/bloom/theme';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const set = () => {};
const percent = (value: number) => `${Math.round(value * 100)}%`;
const price = (value: number, index: number) => `${index ? 'max' : 'min'} €${value}`;

const sliders: ParityCase[] = [
  {
    name: 'a slider',
    language: () => toElement(L.Slider([0.4, set]).label('Volume')),
    bloom: () => <Slider value={0.4} onValueChange={set} accessibilityLabel="Volume" />,
  },
  {
    name: 'a slider with a visible label',
    language: () => toElement(L.Slider([0.4, set], 'Volume')),
    bloom: () => <Slider value={0.4} onValueChange={set} label="Volume" />,
  },
  ...ENUMS.controlSize.map((size) => ({
    name: `a ${size} slider`,
    language: () => toElement(L.Slider([30, set], 'Radius').size(size).bounds(0, 100).step(5)),
    bloom: () => (
      <Slider
        value={30}
        onValueChange={set}
        label="Radius"
        size={size}
        min={0}
        max={100}
        step={5}
      />
    ),
  })),
  ...ENUMS.tone.map((tone) => ({
    name: `a ${tone} slider`,
    language: () => toElement(L.Slider([0.7, set], 'Level').tint(tone)),
    bloom: () => <Slider value={0.7} onValueChange={set} label="Level" tone={tone} />,
  })),
  {
    name: 'a slider of its own geometry and colours, committed, formatted, no bubble',
    language: () =>
      toElement(
        L.Slider([0.25, set], 'Opacity')
          .keyboardStep(0.1)
          .thickness('6')
          .thumbSize('xl')
          .fillTint('success')
          .trackTint('muted/20')
          .thumbTint('white')
          .showsValue(false)
          .onCommit(set)
          .valueFormat(percent)
          .testID('opacity'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <Slider
            value={0.25}
            onValueChange={set}
            label="Opacity"
            keyboardStep={0.1}
            trackHeight={6}
            thumbSize={20}
            minimumTrackTintColor={c.success}
            maximumTrackTintColor={withAlpha(c.textSecondary, 0.2)}
            thumbTintColor={c.white}
            showTooltip={false}
            onSlidingComplete={set}
            formatValue={percent}
            testID="opacity"
          />
        )}
      </Themed>
    ),
  },
  {
    name: 'a disabled slider',
    language: () => toElement(L.Slider([0.5, set], 'Locked').disabled()),
    bloom: () => <Slider value={0.5} onValueChange={set} label="Locked" disabled />,
  },
];

const ranges: ParityCase[] = [
  {
    name: 'a range slider',
    language: () => toElement(L.RangeSlider([[20, 80], set], 'Price').bounds(0, 100)),
    bloom: () => (
      <RangeSlider value={[20, 80]} onValueChange={set} label="Price" min={0} max={100} />
    ),
  },
  {
    name: 'a range slider, its thumbs named and formatted, committed, small',
    language: () =>
      toElement(
        L.RangeSlider([[100, 400], set], 'Budget')
          .bounds(0, 500)
          .step(50)
          .size('sm')
          .tint('accent')
          .labels({ lower: 'From', upper: 'To' })
          .valueFormat(price)
          .onCommit(set),
      ),
    bloom: () => (
      <RangeSlider
        value={[100, 400]}
        onValueChange={set}
        label="Budget"
        min={0}
        max={500}
        step={50}
        size="sm"
        tone="accent"
        thumbLabels={['From', 'To']}
        formatValue={price}
        onSlidingComplete={set}
      />
    ),
  },
];

export const SLIDER_CASES: readonly ParityCase[] = [...sliders, ...ranges];
