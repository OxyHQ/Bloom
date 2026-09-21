/**
 * @jest-environment jsdom
 *
 * `DeliverySlotPicker` and its parts through the REAL react-native-web.
 *
 * What this file is for, and why none of it can be read off the props:
 *
 *   - it is a real `radiogroup` of `radio`s. `aria-checked` is what makes a
 *     chosen window ANNOUNCE as chosen, and a set of pressables drawn with a
 *     highlight passes every prop-level test while saying nothing;
 *   - two groups, because there are two choices — the day, and the window;
 *   - a SOLD-OUT window announces as unavailable and says only "Sold out": the
 *     tier and the capacity of a window nobody can take are facts about a thing
 *     that is not on offer;
 *   - the field's `disabled` reaches the strip and every option and cannot be
 *     undone from inside, which is the direction `field/membership.ts` exists
 *     to stop families getting backwards;
 *   - loading is not empty.
 */
import React from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { DeliverySlotPicker, windowDetail, windowName } from '../delivery-slot';
import { DELIVERY_ASAP_LABEL, DELIVERY_SOLD_OUT_LABEL } from '../delivery-slot/constants';
import { Field } from '../field';
import type { DeliveryDay, DeliveryWindow } from '../delivery-slot';
import {
  allByRole,
  byLabel,
  byTestId,
  click,
  mount,
  queryTestId,
  root$,
  setupHarness,
} from './support/commerce-harness';

setupHarness();

const TID = 'slot';

const DAYS: DeliveryDay[] = [
  { id: 'thu', weekday: 'Thu', day: '23' },
  { id: 'fri', weekday: 'Fri', day: '24' },
  { id: 'sun', weekday: 'Sun', day: '26', disabled: true },
];

const WINDOWS: DeliveryWindow[] = [
  { id: 'w1', label: '08:00 – 10:00', price: 'Free' },
  { id: 'w2', label: '12:00 – 14:00', tier: 'express', price: '+€2.50', capacity: '2 left' },
  { id: 'w3', label: '17:00 – 19:00', capacity: '1 left', soldOut: true },
];

function picker(props: Partial<React.ComponentProps<typeof DeliverySlotPicker>> = {}) {
  return (
    <DeliverySlotPicker
      days={DAYS}
      day="fri"
      onDayChange={() => {}}
      windows={WINDOWS}
      value="w2"
      onValueChange={() => {}}
      testID={TID}
      {...props}
    />
  );
}

/** `Item`'s outer node: its `testID` lands on the content view inside it. */
function optionOf(id: string): HTMLElement {
  return byTestId(`${TID}-${id}`).parentElement as HTMLElement;
}

describe('it is a selection, so it is a radio group', () => {
  it('announces two groups — the day, and the window', () => {
    mount(picker());
    const groups = allByRole('radiogroup');
    expect(groups.map((g) => g.getAttribute('aria-label'))).toEqual(['Day', 'Delivery time']);
  });

  it('gives every window a radio role and the chosen one `aria-checked`', () => {
    mount(picker());
    expect(optionOf('w1').getAttribute('role')).toBe('radio');
    expect(optionOf('w1').getAttribute('aria-checked')).toBe('false');
    expect(optionOf('w2').getAttribute('aria-checked')).toBe('true');
  });

  it('gives every day a radio role and the chosen one `aria-checked`', () => {
    mount(picker());
    const days = allByRole('radio').filter((el) => byTestId(`${TID}-days`).contains(el));
    expect(days.map((d) => d.getAttribute('aria-label'))).toEqual(['Thu 23', 'Fri 24', 'Sun 26']);
    expect(days.map((d) => d.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
  });

  it('reports the chosen window', () => {
    const chosen: string[] = [];
    mount(picker({ onValueChange: (id) => chosen.push(id) }));
    click(optionOf('w1'));
    expect(chosen).toEqual(['w1']);
  });

  it('reports the chosen day', () => {
    const chosen: string[] = [];
    mount(picker({ onDayChange: (id) => chosen.push(id) }));
    const days = allByRole('radio').filter((el) => byTestId(`${TID}-days`).contains(el));
    click(days[0]!);
    expect(chosen).toEqual(['thu']);
  });
});

describe('a sold-out window', () => {
  it('says only that — not the tier, not what is left of it', () => {
    mount(picker());
    expect(byTestId(`${TID}-w3-detail`).textContent).toBe(DELIVERY_SOLD_OUT_LABEL);
    expect(byTestId(`${TID}-w3`).textContent).not.toContain('1 left');
    expect(windowDetail({ id: 'x', label: 'x', soldOut: true, capacity: '1 left', tier: 'express' })).toBe(
      DELIVERY_SOLD_OUT_LABEL,
    );
  });

  it('announces as unavailable rather than being merely drawn pale', () => {
    mount(picker());
    expect(optionOf('w3').getAttribute('aria-disabled')).toBe('true');
    // Still a radio, and still present: it is one of the choices, and hiding it
    // would make a reader wonder where 17:00 went.
    expect(optionOf('w3').getAttribute('role')).toBe('radio');
  });

  it('does not fire', () => {
    const chosen: string[] = [];
    mount(picker({ onValueChange: (id) => chosen.push(id) }));
    click(optionOf('w3'));
    expect(chosen).toEqual([]);
  });

  it('names itself with everything that is true about it', () => {
    mount(picker());
    expect(optionOf('w2').getAttribute('aria-label')).toBe(
      '12:00 – 14:00 · Express · 2 left · +€2.50',
    );
    expect(windowName(WINDOWS[2]!)).toBe('17:00 – 19:00 · Sold out');
  });
});

describe('the amounts and readings are strings', () => {
  it('draws every price byte for byte', () => {
    mount(picker());
    expect(byTestId(`${TID}-w1-price`).textContent).toBe('Free');
    expect(byTestId(`${TID}-w2-price`).textContent).toBe('+€2.50');
  });

  it('draws no price node at all for a window with none', () => {
    mount(picker({ windows: [{ id: 'w1', label: '08:00 – 10:00' }] }));
    expect(queryTestId(`${TID}-w1-price`)).toBeNull();
  });
});

describe('the ASAP option', () => {
  it('is in the SAME group as the windows, at its head', () => {
    mount(picker({ asap: { id: 'asap', eta: '25 – 40 min', price: '+€4.90' } }));
    const group = byTestId(`${TID}-windows`);
    const radios = Array.from(group.querySelectorAll('[role="radio"]')) as HTMLElement[];
    expect(radios[0]!.getAttribute('aria-label')).toContain(DELIVERY_ASAP_LABEL);
    expect(radios.length).toBe(4);
  });

  it('is chosen by the same value', () => {
    mount(picker({ asap: { id: 'asap', eta: '25 – 40 min' }, value: 'asap' }));
    expect(optionOf('asap').getAttribute('aria-checked')).toBe('true');
    expect(optionOf('w2').getAttribute('aria-checked')).toBe('false');
  });
});

describe('the field', () => {
  it('names the window group from its own label, and disables everything', () => {
    mount(picker({ label: 'When it arrives', disabled: true }));
    const group = byLabel('When it arrives');
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(group.getAttribute('aria-disabled')).toBe('true');
    expect(optionOf('w1').getAttribute('aria-disabled')).toBe('true');
  });

  it('is disabled BY an enclosing field, and `disabled={false}` does not undo it', () => {
    // The `||` direction. A `??` here reads exactly as correct — the picker
    // disables itself when told to — and lets every window stay pressable
    // inside a frozen form, which is the failure `field/membership.ts` exists
    // to stop each family reinventing.
    mount(
      <Field label="Delivery" disabled>
        {picker({ disabled: false })}
      </Field>,
    );
    expect(byTestId(`${TID}-windows`).getAttribute('aria-disabled')).toBe('true');
    expect(optionOf('w1').getAttribute('aria-disabled')).toBe('true');
    expect(byTestId(`${TID}-days`).getAttribute('aria-disabled')).toBe('true');
  });

  it('does not fire an option a field froze', () => {
    const chosen: string[] = [];
    mount(
      <Field label="Delivery" disabled>
        {picker({ disabled: false, onValueChange: (id) => chosen.push(id) })}
      </Field>,
    );
    click(optionOf('w1'));
    expect(chosen).toEqual([]);
  });

  it('shows its error, and marks the group invalid', () => {
    mount(picker({ error: 'Pick a window.' }));
    expect(root$().textContent).toContain('Pick a window.');
    expect(byTestId(`${TID}-windows`).getAttribute('aria-invalid')).toBe('true');
  });

  it('renders NO second field inside somebody else’s, and takes their label', () => {
    mount(
      <Field label="Delivery" description="Two hours wide.">
        {picker()}
      </Field>,
    );
    // One label, not two: the enclosing field's.
    expect(root$().textContent).not.toContain('Delivery time');
    expect(byTestId(`${TID}-windows`).getAttribute('aria-label')).toBe('Delivery');
  });
});

describe('loading is not empty', () => {
  it('draws busy placeholders and NO radios', () => {
    mount(picker({ loading: true }));
    const busy = byTestId(`${TID}-loading`);
    expect(busy.getAttribute('aria-busy')).toBe('true');
    expect(queryTestId(`${TID}-windows`)).toBeNull();
    expect(root$().querySelectorAll('[role="radio"]').length).toBe(DAYS.length);
  });

  it('draws the empty block only when there is genuinely nothing', () => {
    mount(picker({ windows: [], asap: undefined }));
    expect(byTestId(`${TID}-empty`).textContent).toContain('No windows left');
    expect(queryTestId(`${TID}-windows`)).toBeNull();
    // The day strip stays: picking another day is the way out.
    expect(queryTestId(`${TID}-days`)).not.toBeNull();
  });

  it('lets a caller replace the empty block entirely', () => {
    mount(picker({ windows: [], asap: undefined, empty: <div data-testid="mine" /> }));
    expect(queryTestId('mine')).not.toBeNull();
    expect(queryTestId(`${TID}-empty`)).toBeNull();
  });
});
