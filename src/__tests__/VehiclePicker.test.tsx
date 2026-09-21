/**
 * @jest-environment jsdom
 *
 * `VehiclePicker` through the REAL react-native-web.
 *
 * What this file is FOR: a vehicle card says four things on screen — the name,
 * the capacity, the price and, on a blocked one, the reason it is blocked — and
 * three of those four are drawn in lines no name computation would ever reach.
 * So the announced name of every card is measured here in full, and so is the
 * rule that a disabled option still SAYS WHY, because "the reason is shown" is
 * a claim a prop-level test would pass by simply passing `unavailableReason`.
 */
import React, { useState } from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { VEHICLE_OPTIONS, VehiclePicker, vehicleOptionName } from '../vehicle-picker';
import type { VehicleKind, VehicleOption } from '../vehicle-picker';
import { allByRole, byTestId, click, mount, queryTestId, setupHarness } from './support/commerce-harness';

setupHarness();

const noop = () => undefined;

const PRICED: VehicleOption<VehicleKind>[] = [
  {
    value: 'bike',
    label: 'Cargo bike',
    capacity: 'Up to 25 kg',
    fits: ['Documents', 'A small box'],
    priceFrom: '€6.40',
  },
  {
    value: 'van',
    label: 'Van',
    capacity: 'Up to 800 kg',
    fits: ['A sofa'],
    priceFrom: '€28.00',
  },
];

const BLOCKED: VehicleOption<VehicleKind>[] = [
  {
    ...PRICED[0]!,
    disabled: true,
    unavailableReason: 'The load is 60 kg and a cargo bike takes 25.',
  },
  PRICED[1]!,
];

/** A card's announced name, read from the control that actually carries it. */
function names(options: readonly VehicleOption<VehicleKind>[], testID = 'v'): string[] {
  return options.map(
    (option) => byTestId(`${testID}-${option.value}-control`).getAttribute('aria-label') ?? '',
  );
}

function Picker({
  options = PRICED,
  initial = null,
  onPick,
  ...rest
}: {
  options?: VehicleOption<VehicleKind>[];
  initial?: VehicleKind | null;
  onPick?: (value: VehicleKind) => void;
  disabled?: boolean;
  title?: string;
  description?: string;
}) {
  const [value, setValue] = useState<VehicleKind | null>(initial);
  return (
    <VehiclePicker
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onPick?.(next);
      }}
      options={options}
      testID="v"
      {...rest}
    />
  );
}

describe('every card announces what it draws on four separate lines', () => {
  it('joins the name, the capacity and the price-from with its label', () => {
    mount(<Picker />);
    expect(names(PRICED)).toEqual([
      'Cargo bike, Up to 25 kg, From €6.40',
      'Van, Up to 800 kg, From €28.00',
    ]);
  });

  it('adds the reason a blocked option is blocked', () => {
    mount(<Picker options={BLOCKED} />);
    expect(names(BLOCKED)[0]).toBe(
      'Cargo bike, Up to 25 kg, From €6.40, The load is 60 kg and a cargo bike takes 25.',
    );
  });

  it('falls back to the unavailable label when the caller wrote no reason', () => {
    mount(<Picker options={[{ ...PRICED[0]!, disabled: true }, PRICED[1]!]} />);
    expect(names(PRICED)[0]).toBe(
      'Cargo bike, Up to 25 kg, From €6.40, Not available for this load',
    );
  });

  it('takes every word from `labels`', () => {
    const ui = (
      <VehiclePicker
        value={null}
        onValueChange={noop}
        options={[{ ...PRICED[0]!, disabled: true }]}
        labels={{ from: 'Desde', unavailable: 'No disponible' }}
        testID="v"
      />
    );
    mount(ui);
    expect(byTestId('v-bike-control').getAttribute('aria-label')).toBe(
      'Cargo bike, Up to 25 kg, Desde €6.40, No disponible',
    );
  });

  it('omits the price from the name when the option carries none', () => {
    expect(vehicleOptionName({ label: 'Van', capacity: 'Up to 800 kg' }, { from: 'From' })).toBe(
      'Van, Up to 800 kg',
    );
    expect(
      vehicleOptionName({ label: 'Van', capacity: 'Up to 800 kg', priceFrom: '' }, { from: 'From' }),
    ).toBe('Van, Up to 800 kg');
  });
});

describe('one answer, spelled the way both platforms read it', () => {
  it('is a radiogroup of radios, with the chosen one checked', () => {
    mount(<Picker initial="van" />);
    const group = allByRole('radiogroup');
    expect(group).toHaveLength(1);
    expect(group[0]?.getAttribute('aria-label')).toBe('Vehicle');
    expect(byTestId('v-bike-control').getAttribute('aria-checked')).toBe('false');
    expect(byTestId('v-van-control').getAttribute('aria-checked')).toBe('true');
  });

  it('names the group from `accessibilityLabel`', () => {
    mount(
      <VehiclePicker value={null} onValueChange={noop} options={PRICED} accessibilityLabel="Vehicle for this job" />,
    );
    expect(allByRole('radiogroup')[0]?.getAttribute('aria-label')).toBe('Vehicle for this job');
  });

  it('reports a new choice and stays silent on the one already chosen', () => {
    const picked: VehicleKind[] = [];
    mount(<Picker initial="bike" onPick={(value) => picked.push(value)} />);
    click(byTestId('v-bike-control'));
    expect(picked).toEqual([]);
    click(byTestId('v-van-control'));
    expect(picked).toEqual(['van']);
  });
});

describe('a blocked option is stopped AND explains itself', () => {
  it('marks it disabled and refuses the press', () => {
    const picked: VehicleKind[] = [];
    mount(<Picker options={BLOCKED} onPick={(value) => picked.push(value)} />);
    expect(byTestId('v-bike-control').getAttribute('aria-disabled')).toBe('true');
    click(byTestId('v-bike-control'));
    expect(picked).toEqual([]);
  });

  it('draws the reason as its own line under the detail', () => {
    mount(<Picker options={BLOCKED} />);
    expect(byTestId('v-bike-reason').textContent).toContain(
      'The load is 60 kg and a cargo bike takes 25.',
    );
    expect(queryTestId('v-van-reason')).toBeNull();
  });

  it('stops every card when the PICKER is disabled, whatever each one says', () => {
    const picked: VehicleKind[] = [];
    mount(<Picker disabled onPick={(value) => picked.push(value)} />);
    for (const option of PRICED) {
      expect(byTestId(`v-${option.value}-control`).getAttribute('aria-disabled')).toBe('true');
      click(byTestId(`v-${option.value}-control`));
    }
    expect(picked).toEqual([]);
  });
});

describe('the detail is drawn at rest, not behind the selection', () => {
  it('draws the fits chips and the price on an UNCHOSEN card', () => {
    mount(<Picker />);
    expect(byTestId('v-bike-fits').textContent).toBe('DocumentsA small box');
    expect(byTestId('v-bike-price').textContent).toContain('€6.40');
    expect(byTestId('v-van-price').textContent).toContain('€28.00');
  });

  it('draws no detail block for an option with no chips, price or reason', () => {
    mount(
      <VehiclePicker
        value={null}
        onValueChange={noop}
        options={[{ value: 'van', label: 'Van', capacity: 'Up to 800 kg' }]}
        testID="v"
      />,
    );
    expect(queryTestId('v-van-fits')).toBeNull();
    expect(queryTestId('v-van-price')).toBeNull();
    expect(queryTestId('v-van-reason')).toBeNull();
  });

  it('names the fits row per option', () => {
    mount(<Picker />);
    expect(byTestId('v-bike-fits').getAttribute('aria-label')).toBe('What fits in a Cargo bike');
  });
});

describe('the heading is optional and the picker is not', () => {
  it('draws a heading only when one is given', () => {
    mount(<Picker />);
    expect(queryTestId('v-title')).toBeNull();
    mount(<Picker title="Which vehicle?" description="Smallest that fits." />);
    expect(byTestId('v-title').textContent).toBe('Which vehicle?');
  });
});

describe('the built-in ladder', () => {
  it('ships five vehicles, smallest first, with no invented prices', () => {
    expect(VEHICLE_OPTIONS.map((option) => option.value)).toEqual([
      'bike',
      'car',
      'van',
      'boxTruck',
      'refrigerated',
    ]);
    expect(VEHICLE_OPTIONS.every((option) => option.priceFrom === undefined)).toBe(true);
    expect(VEHICLE_OPTIONS.every((option) => option.capacity !== '')).toBe(true);
  });
});
