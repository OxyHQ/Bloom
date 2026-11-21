import { Stepper, StepperRow } from '@oxy.so/bloom/stepper';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const set = () => {};
const guests = (value: number) => `${value} guests`;

export const STEPPER_CASES: readonly ParityCase[] = [
  {
    name: 'a stepper',
    language: () => toElement(L.Stepper([2, set]).label('Guests')),
    bloom: () => <Stepper value={2} onValueChange={set} accessibilityLabel="Guests" />,
  },
  ...ENUMS.stepperSize.flatMap((size) =>
    ENUMS.stepperStyle.map((style) => ({
      name: `a ${size} ${style} stepper`,
      language: () => toElement(L.Stepper([1, set]).size(size).style(style).label('Rooms')),
      bloom: () => (
        <Stepper
          value={1}
          onValueChange={set}
          size={size}
          appearance={style}
          accessibilityLabel="Rooms"
        />
      ),
    })),
  ),
  {
    name: 'a bounded stepper of twos, formatted, removable, words of its own',
    language: () =>
      toElement(
        L.Stepper([0, set])
          .bounds(0, 10)
          .step(2)
          .valueFormat(guests)
          .onRemove(set)
          .labels({ decrement: 'Less', increment: 'More', remove: 'Remove' })
          .label('Guests')
          .testID('guests'),
      ),
    bloom: () => (
      <Stepper
        value={0}
        onValueChange={set}
        min={0}
        max={10}
        step={2}
        formatValue={guests}
        onRemove={set}
        decrementLabel="Less"
        incrementLabel="More"
        removeLabel="Remove"
        accessibilityLabel="Guests"
        testID="guests"
      />
    ),
  },
  {
    name: 'a disabled stepper',
    language: () => toElement(L.Stepper([3, set]).disabled().label('Beds')),
    bloom: () => <Stepper value={3} onValueChange={set} disabled accessibilityLabel="Beds" />,
  },
  {
    name: 'a stepper row',
    language: () => toElement(L.StepperRow([1, set], 'Adults').supporting('Ages 13 or above')),
    bloom: () => (
      <StepperRow value={1} onValueChange={set} title="Adults" description="Ages 13 or above" />
    ),
  },
  {
    name: 'a stepper row of views, a divider, small and outlined',
    language: () =>
      toElement(
        L.StepperRow([0, set], L.Text('Pets').weight('semibold'))
          .supporting(L.Text('Service animals welcome'))
          .dividers()
          .size('sm')
          .style('outline')
          .bounds(0, 2),
      ),
    bloom: () => (
      <StepperRow
        value={0}
        onValueChange={set}
        title={<Text style={{ fontWeight: '600' }}>Pets</Text>}
        description={<Text>Service animals welcome</Text>}
        divider
        size="sm"
        appearance="outline"
        min={0}
        max={2}
      />
    ),
  },
];
