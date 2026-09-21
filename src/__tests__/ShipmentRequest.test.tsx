/**
 * @jest-environment jsdom
 *
 * `shipment-request` through the REAL react-native-web, plus the three pure
 * decisions the pickers are built on.
 *
 * What this file is FOR:
 *
 *   - `sanitizeWeight` is where a typed unit and a European comma stop being
 *     part of the value. Every boundary it has is walked here, because "the
 *     field keeps digits" is a claim a render test can only sample.
 *   - A SWITCH DRAWS NO TEXT. The caption beside it is a sibling on both
 *     platforms, so the announced name of every extra is measured in full —
 *     the defect this guards is a fleet of toggles that all say "switch, off".
 *   - The FORM's only decision is which sections exist and in what order, and
 *     the emitted headings are the only place that is observable.
 *
 * jsdom lays nothing out, so the photo grid's `ResizeObserver` is stood in for
 * — without it the section renders but reports no width.
 */
import React, { useState } from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(window as unknown as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver;

import {
  SHIPMENT_ACCESS_OPTIONS,
  SHIPMENT_LOAD_KINDS,
  SHIPMENT_LOAD_SIZES,
  ShipmentLoadPicker,
  ShipmentOptionsList,
  ShipmentRequestForm,
  isShipmentLoadComplete,
  sanitizeWeight,
  toggleShipmentExtra,
} from '../shipment-request';
import type { ShipmentExtra, ShipmentLoad } from '../shipment-request';
import {
  allByRole,
  byTestId,
  click,
  mount,
  queryTestId,
  root$,
  setupHarness,
} from './support/commerce-harness';

setupHarness();

const noop = () => undefined;

const EMPTY: ShipmentLoad = { kind: null, size: null, weight: '', quantity: 1 };
const SOFA: ShipmentLoad = { kind: 'furniture', size: 'large', weight: '60', quantity: 1 };

const EXTRAS: ShipmentExtra[] = [
  { key: 'loading', title: 'Help loading', description: 'Two people at both ends.', price: '+€9.00' },
  { key: 'insurance', title: 'Insurance', price: '+€4.50' },
  { key: 'assembly', title: 'Disassembly', disabled: true },
];

// ---------------------------------------------------------------------------
//  The pure decisions
// ---------------------------------------------------------------------------

describe('the weight field keeps a NUMBER, not a sentence', () => {
  it('strips the unit and anything else that is not a digit', () => {
    expect(sanitizeWeight('18 kg')).toBe('18');
    expect(sanitizeWeight('about 18kg-ish')).toBe('18');
    expect(sanitizeWeight('')).toBe('');
    expect(sanitizeWeight('kg')).toBe('');
  });

  it('accepts a comma and emits a dot, because half of Europe types one', () => {
    expect(sanitizeWeight('18,5')).toBe('18.5');
    expect(sanitizeWeight('18,5 kg')).toBe('18.5');
  });

  it('keeps ONE separator, wherever the extra ones were typed', () => {
    expect(sanitizeWeight('1.2.3')).toBe('1.23');
    expect(sanitizeWeight('1,2.3')).toBe('1.23');
    expect(sanitizeWeight('18.')).toBe('18.');
  });

  it('turns a leading separator into a leading zero', () => {
    expect(sanitizeWeight('.5')).toBe('0.5');
    expect(sanitizeWeight(',5')).toBe('0.5');
  });
});

describe('the form’s own completeness question', () => {
  it('needs a kind, a size, a positive weight and at least one item', () => {
    expect(isShipmentLoadComplete(SOFA)).toBe(true);
    expect(isShipmentLoadComplete(EMPTY)).toBe(false);
    expect(isShipmentLoadComplete({ ...SOFA, kind: null })).toBe(false);
    expect(isShipmentLoadComplete({ ...SOFA, size: null })).toBe(false);
    expect(isShipmentLoadComplete({ ...SOFA, weight: '0' })).toBe(false);
    expect(isShipmentLoadComplete({ ...SOFA, weight: '   ' })).toBe(false);
    expect(isShipmentLoadComplete({ ...SOFA, quantity: 0 })).toBe(false);
  });
});

describe('an extra is reported in the OPTIONS’ order, not the tap order', () => {
  it('adds, removes, and keeps the order stable', () => {
    expect(toggleShipmentExtra(EXTRAS, [], 'insurance')).toEqual(['insurance']);
    expect(toggleShipmentExtra(EXTRAS, ['insurance'], 'loading')).toEqual(['loading', 'insurance']);
    expect(toggleShipmentExtra(EXTRAS, ['loading', 'insurance'], 'loading')).toEqual(['insurance']);
  });

  it('drops a key no option owns any more', () => {
    expect(toggleShipmentExtra(EXTRAS, ['gone', 'loading'], 'insurance')).toEqual([
      'loading',
      'insurance',
    ]);
  });
});

// ---------------------------------------------------------------------------
//  The load picker
// ---------------------------------------------------------------------------

function LoadHarness({
  initial = EMPTY,
  onChange,
  ...rest
}: {
  initial?: ShipmentLoad;
  onChange?: (load: ShipmentLoad) => void;
  notes?: boolean;
  errors?: Record<string, string>;
}) {
  const [load, setLoad] = useState<ShipmentLoad>(initial);
  return (
    <ShipmentLoadPicker
      value={load}
      onValueChange={(next) => {
        setLoad(next);
        onChange?.(next);
      }}
      testID="load"
      {...rest}
    />
  );
}

describe('the kind is one answer with a sentence on each option', () => {
  it('is a radiogroup of radios named with the sentence they carry', () => {
    mount(<LoadHarness initial={SOFA} />);
    expect(byTestId('load-kind').getAttribute('role')).toBe('radiogroup');
    expect(byTestId('load-kind-furniture-control').getAttribute('aria-checked')).toBe('true');
    expect(byTestId('load-kind-parcel-control').getAttribute('aria-checked')).toBe('false');
    expect(byTestId('load-kind-parcel-control').getAttribute('aria-label')).toBe(
      'Parcel, A box or a bag one person can carry.',
    );
  });

  it('reports the WHOLE load, with everything else untouched', () => {
    const seen: ShipmentLoad[] = [];
    mount(<LoadHarness initial={SOFA} onChange={(load) => seen.push(load)} />);
    click(byTestId('load-kind-pallet-control'));
    expect(seen).toEqual([{ ...SOFA, kind: 'pallet' }]);
  });

  it('says nothing when the kind already chosen is pressed again', () => {
    const seen: ShipmentLoad[] = [];
    mount(<LoadHarness initial={SOFA} onChange={(load) => seen.push(load)} />);
    click(byTestId('load-kind-furniture-control'));
    expect(seen).toEqual([]);
  });
});

describe('the size draws ONE sentence — the chosen rung’s', () => {
  it('draws no detail while nothing is chosen', () => {
    mount(<LoadHarness />);
    expect(queryTestId('load-size-detail')).toBeNull();
  });

  it('draws the chosen rung’s sentence and no other', () => {
    mount(<LoadHarness initial={SOFA} />);
    const detail = byTestId('load-size-detail').textContent ?? '';
    expect(detail).toBe(SHIPMENT_LOAD_SIZES.find((size) => size.value === 'large')?.detail);
    expect(root$().textContent).not.toContain('Up to a shoebox');
  });

  it('names each segment with its own sentence, since the letter alone says nothing', () => {
    mount(<LoadHarness />);
    expect(byTestId('load-size-small').getAttribute('aria-label')).toBe(
      'S, Up to a shoebox — 35 × 25 × 20 cm.',
    );
  });
});

describe('the weight field', () => {
  it('draws its unit beside the input and keeps it OUT of the value', () => {
    const seen: ShipmentLoad[] = [];
    mount(<LoadHarness onChange={(load) => seen.push(load)} />);
    const input = byTestId('load-weight') as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )?.set;
    setter?.call(input, '18,5 kg');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(seen[seen.length - 1]?.weight).toBe('18.5');
  });

  it('marks the input invalid when the app passed a message for it', () => {
    mount(<LoadHarness errors={{ weight: 'A rough weight is enough.' }} />);
    expect(byTestId('load-weight').getAttribute('aria-invalid')).toBe('true');
    expect(root$().textContent).toContain('A rough weight is enough.');
  });

  it('draws each message under its OWN control', () => {
    mount(
      <LoadHarness
        errors={{ kind: 'Tell us what we are moving.', size: 'Pick a size.' }}
      />,
    );
    expect(root$().textContent).toContain('Tell us what we are moving.');
    expect(root$().textContent).toContain('Pick a size.');
  });
});

describe('the notes field is opt-in', () => {
  it('is absent by default and present when asked for', () => {
    mount(<LoadHarness />);
    expect(queryTestId('load-notes')).toBeNull();
    mount(<LoadHarness notes />);
    expect(queryTestId('load-notes')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
//  The options list
// ---------------------------------------------------------------------------

describe('an extra is a SWITCH, and a switch draws no text', () => {
  it('names every switch with its title, its description and its price', () => {
    mount(
      <ShipmentOptionsList extras={EXTRAS} selectedExtras={['loading']} onExtrasChange={noop} testID="o" />,
    );
    expect(byTestId('o-extra-loading').getAttribute('aria-label')).toBe(
      'Help loading, Two people at both ends., +€9.00',
    );
    expect(byTestId('o-extra-insurance').getAttribute('aria-label')).toBe('Insurance, +€4.50');
  });

  it('spells the state the way web reads it', () => {
    mount(
      <ShipmentOptionsList extras={EXTRAS} selectedExtras={['loading']} onExtrasChange={noop} testID="o" />,
    );
    expect(byTestId('o-extra-loading').getAttribute('role')).toBe('switch');
    expect(byTestId('o-extra-loading').getAttribute('aria-checked')).toBe('true');
    expect(byTestId('o-extra-insurance').getAttribute('aria-checked')).toBe('false');
    expect(byTestId('o-extra-assembly').getAttribute('aria-disabled')).toBe('true');
  });

  it('reports the next selection in the options’ order', () => {
    const seen: string[][] = [];
    mount(
      <ShipmentOptionsList
        extras={EXTRAS}
        selectedExtras={['insurance']}
        onExtrasChange={(keys) => seen.push(keys)}
        testID="o"
      />,
    );
    click(byTestId('o-extra-loading'));
    expect(seen).toEqual([['loading', 'insurance']]);
  });
});

describe('access and the collection window are single choices', () => {
  it('draws each as a radiogroup of radios', () => {
    mount(
      <ShipmentOptionsList
        accessOptions={SHIPMENT_ACCESS_OPTIONS}
        access="stairs"
        onAccessChange={noop}
        windows={[{ id: 'asap', label: 'As soon as possible' }]}
        window="asap"
        onWindowChange={noop}
        testID="o"
      />,
    );
    expect(byTestId('o-access').getAttribute('role')).toBe('radiogroup');
    expect(byTestId('o-access').getAttribute('aria-label')).toBe('Access at both ends');
    expect(byTestId('o-access-stairs').getAttribute('aria-checked')).toBe('true');
    expect(byTestId('o-access-lift').getAttribute('aria-checked')).toBe('false');
    expect(byTestId('o-window-asap').getAttribute('aria-checked')).toBe('true');
  });

  it('names a priced chip with its price, and draws it too', () => {
    mount(
      <ShipmentOptionsList
        windows={[{ id: 'weekend', label: 'This weekend', price: '+€6.00' }]}
        window={null}
        onWindowChange={noop}
        testID="o"
      />,
    );
    expect(byTestId('o-window-weekend').getAttribute('aria-label')).toBe('This weekend, +€6.00');
    expect(byTestId('o-window-weekend').textContent).toBe('This weekend · +€6.00');
  });

  it('draws only the groups it was given props for', () => {
    mount(<ShipmentOptionsList extras={EXTRAS} selectedExtras={[]} onExtrasChange={noop} testID="o" />);
    expect(queryTestId('o-access')).toBeNull();
    expect(queryTestId('o-window')).toBeNull();
    expect(queryTestId('o-extras')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
//  The form
// ---------------------------------------------------------------------------

const ROUTE = {
  stops: [
    { id: 'a', title: 'Vellmar Passage 9' },
    { id: 'b', title: 'Ashgrove Depot, Unit 4' },
  ],
};

function headings(): string[] {
  return allByRole('heading')
    .map((node) => node.textContent ?? '')
    .filter((text) => text !== '');
}

describe('the form’s only decision is which sections exist, and in what order', () => {
  it('draws the route and the load and nothing else by default', () => {
    mount(<ShipmentRequestForm route={ROUTE} load={SOFA} onLoadChange={noop} testID="f" />);
    expect(headings().slice(0, 2)).toEqual(['Where it goes', 'The load']);
    expect(queryTestId('f-section-photos')).toBeNull();
    expect(queryTestId('f-section-options')).toBeNull();
    expect(queryTestId('f-section-price')).toBeNull();
  });

  it('adds each optional section only when its props arrive, in the fixed order', () => {
    mount(
      <ShipmentRequestForm
        route={ROUTE}
        load={SOFA}
        onLoadChange={noop}
        photos={{ photos: [], onReorder: noop }}
        options={{ extras: EXTRAS, selectedExtras: [], onExtrasChange: noop }}
        price={{ lines: [{ label: 'Delivery', amount: '€26.00' }] }}
        testID="f"
      />,
    );
    expect(headings().slice(0, 5)).toEqual([
      'Where it goes',
      'The load',
      'Photos',
      'Options',
      'Price',
    ]);
  });

  it('draws the route through `RouteStops` rather than a second one of its own', () => {
    mount(<ShipmentRequestForm route={ROUTE} load={SOFA} onLoadChange={noop} testID="f" />);
    expect(byTestId('f-route-0-item').getAttribute('aria-label')).toContain('Origin');
    expect(byTestId('f-route-1-item').getAttribute('aria-label')).toContain('Destination');
  });

  it('gives the LAST section no rule under it, and every earlier one one', () => {
    mount(
      <ShipmentRequestForm
        route={ROUTE}
        load={SOFA}
        onLoadChange={noop}
        options={{ extras: EXTRAS, selectedExtras: [], onExtrasChange: noop }}
        testID="f"
      />,
    );
    const rule = (key: string) =>
      byTestId(`f-section-${key}`).style.getPropertyValue('border-bottom-width');
    expect(rule('route')).toBe('1px');
    expect(rule('load')).toBe('1px');
    expect(rule('options')).toBe('0px');
  });

  it('draws the footer under the last section', () => {
    mount(
      <ShipmentRequestForm
        route={ROUTE}
        load={SOFA}
        onLoadChange={noop}
        footer={<span>Ask for quotes</span>}
        testID="f"
      />,
    );
    expect(byTestId('f-footer').textContent).toBe('Ask for quotes');
  });

  it('reaches every control with its own `disabled`', () => {
    mount(
      <ShipmentRequestForm
        route={ROUTE}
        load={SOFA}
        onLoadChange={noop}
        options={{ extras: EXTRAS, selectedExtras: [], onExtrasChange: noop }}
        disabled
        testID="f"
      />,
    );
    expect(byTestId('f-load-kind-parcel-control').getAttribute('aria-disabled')).toBe('true');
    expect(byTestId('f-options-extra-loading').getAttribute('aria-disabled')).toBe('true');
  });
});

describe('the built-in option sets', () => {
  it('ships five kinds and four size rungs, each with the copy it needs', () => {
    expect(SHIPMENT_LOAD_KINDS.map((kind) => kind.value)).toEqual([
      'envelope',
      'parcel',
      'furniture',
      'pallet',
      'food',
    ]);
    expect(SHIPMENT_LOAD_KINDS.every((kind) => kind.description !== undefined)).toBe(true);
    expect(SHIPMENT_LOAD_SIZES.map((size) => size.value)).toEqual([
      'small',
      'medium',
      'large',
      'extraLarge',
    ]);
    expect(SHIPMENT_LOAD_SIZES.every((size) => size.detail !== undefined)).toBe(true);
  });
});
