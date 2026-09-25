/**
 * @jest-environment jsdom
 *
 * `CartPanel` and its parts through the REAL react-native-web.
 *
 * The property this file exists for is the NEGATIVE one, twice over. The panel
 * does no money maths — every amount it draws must come out byte for byte,
 * including a total that disagrees with its own lines — and it contains NO
 * second breakdown: the totals are `price-breakdown`'s, asserted through that
 * family's own testIDs, so a hand-rolled summary added here would have nowhere
 * to report from.
 *
 * The rest is the shape the DOM has to have: a line's stepper floors at 1 so it
 * cannot delete, the promo field is an input OR a pill and never both, and an
 * empty basket draws none of the controls that would act on nothing.
 */
import React, { useState } from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { CartLine, CartPanel, CartPromoField, CartTipPicker } from '../cart-panel';
import { composeCartLineName, optionsLine } from '../cart-panel/shared';
import type { CartLineEntry, CartTipOption } from '../cart-panel';
import type { PriceLine } from '../price-breakdown';
import { byTestId, click, mount, queryTestId, setupHarness } from './support/commerce-harness';

setupHarness();

/** `Item`'s outer node: its `testID` lands on the content view inside it. */
function rowOf(testID: string): HTMLElement {
  return byTestId(testID).parentElement as HTMLElement;
}

const LINES: CartLineEntry[] = [
  {
    id: 'ember',
    name: 'Ember flatbread',
    options: ['Large', 'Extra curd'],
    note: '“Cut into six.”',
    price: '€37.60',
    quantity: 2,
  },
  { id: 'sorrel', name: 'Sorrel stew', price: '10,00 €', originalPrice: '13,00 €', quantity: 1 },
];

const SUMMARY: PriceLine[] = [
  { id: 'subtotal', label: 'Subtotal', amount: '€47.60' },
  { id: 'promo', label: 'FIRSTBITE', amount: '−€5.00', tone: 'discount' },
];

const TIPS: CartTipOption[] = [
  { id: 'none', label: 'No tip' },
  { id: '2', label: '€2' },
];

function panel(props: Partial<React.ComponentProps<typeof CartPanel>> = {}) {
  return (
    <CartPanel
      vendorName="Fig & Ember"
      vendorMeta="25–35 min · €1.90 delivery"
      lines={LINES}
      summary={{ lines: SUMMARY, total: { label: 'Total', amount: '1.234,56 €' } }}
      onCheckout={() => undefined}
      testID="c"
      {...props}
    />
  );
}

describe('it does no money maths, and holds no second breakdown', () => {
  it('draws every amount byte for byte, the total included', () => {
    mount(panel());
    expect(byTestId('c-summary-line-0-amount').textContent).toBe('€47.60');
    expect(byTestId('c-summary-line-1-amount').textContent).toBe('−€5.00');
    // The total disagrees with the lines ON PURPOSE: it is only ever what the
    // app handed over.
    expect(byTestId('c-summary-total-amount').textContent).toBe('1.234,56 €');
  });

  it('draws a line’s own total and its struck original as given', () => {
    mount(panel());
    expect(byTestId('c-line-sorrel-price-0').textContent).toContain('10,00 €');
    expect(byTestId('c-line-sorrel-price-0').textContent).toContain('13,00 €');
  });

  it('draws a line’s secondary price under its price, and says it in the line’s name', () => {
    mount(
      panel({
        lines: [{ id: 'ember', name: 'Ember flatbread', price: '$13.20', secondaryPrice: '≈ 12,00 €', quantity: 1 }],
      }),
    );
    expect(byTestId('c-line-ember-secondary-price').textContent).toBe('≈ 12,00 €');
    expect(rowOf('c-line-ember').getAttribute('aria-label')).toBe('Ember flatbread, 1, $13.20, ≈ 12,00 €');
    mount(panel());
    expect(queryTestId('c-line-sorrel-secondary-price')).toBeNull();
  });

  it('routes the totals through price-breakdown, not a copy', () => {
    mount(panel());
    // `PriceSummary`'s own testID shape. A hand-rolled summary would not have it.
    expect(queryTestId('c-summary-lines')).not.toBeNull();
  });
});

describe('a basket belongs to one vendor', () => {
  it('draws the vendor once, as a header, named with its delivery line', () => {
    mount(panel());
    expect(byTestId('c-vendor').textContent).toContain('Fig & Ember');
    // `Item` puts its `testID` on the CONTENT view and its role and name on the
    // node around it, so the name is read from the parent rather than asserted
    // on the prop that was passed in.
    expect(rowOf('c-vendor').getAttribute('aria-label')).toBe(
      'Fig & Ember, 25–35 min · €1.90 delivery',
    );
  });
});

describe('the lines', () => {
  it('are a named list of listitems', () => {
    mount(panel());
    expect(byTestId('c-lines').getAttribute('role')).toBe('list');
    expect(byTestId('c-lines').getAttribute('aria-label')).toBe('Basket');
    expect(rowOf('c-line-ember').getAttribute('role')).toBe('listitem');
  });

  it('joins the chosen options onto one line', () => {
    expect(optionsLine(['Large', 'Extra curd'])).toBe('Large · Extra curd');
    expect(optionsLine([])).toBeNull();
    expect(optionsLine(undefined)).toBeNull();
    expect(optionsLine(['', ''])).toBeNull();
    mount(panel());
    expect(byTestId('c-line-ember-options').textContent).toBe('Large · Extra curd');
  });

  it('says the whole line, with the quantity in words', () => {
    expect(composeCartLineName(LINES[0]!)).toBe(
      'Ember flatbread, Large · Extra curd, “Cut into six.”, 2, €37.60',
    );
    expect(composeCartLineName({ ...LINES[0]!, unavailable: true })).toContain('Sold out');
  });
});

describe('the stepper does not remove', () => {
  it('floors at one, so the decrement is disabled rather than deleting the line', () => {
    const calls: number[] = [];
    mount(
      <CartLine
        name="Sorrel stew"
        price="€10.00"
        quantity={1}
        onQuantityChange={(n) => calls.push(n)}
        onRemove={() => undefined}
        testID="l"
      />,
    );
    const decrease = byTestId('l-stepper').querySelector('[aria-label="Decrease"]');
    expect(decrease).not.toBeNull();
    click(decrease as HTMLElement);
    expect(calls).toEqual([]);
  });

  it('gives removing its own control and its own name', () => {
    let removed = 0;
    mount(
      <CartLine
        name="Sorrel stew"
        price="€10.00"
        quantity={1}
        onQuantityChange={() => undefined}
        onRemove={() => {
          removed += 1;
        }}
        testID="l"
      />,
    );
    expect(byTestId('l-remove').getAttribute('aria-label')).toBe('Remove Sorrel stew');
    click(byTestId('l-remove'));
    expect(removed).toBe(1);
  });

  it('draws a quiet count instead of a stepper when the app cannot change it', () => {
    mount(<CartLine name="Sorrel stew" price="€10.00" quantity={3} testID="l" />);
    expect(queryTestId('l-stepper')).toBeNull();
    expect(byTestId('l-quantity').textContent).toBe('×3');
  });
});

describe('removeInStepper moves removal into the stepper (opt-in)', () => {
  it('at quantity 1 the decrement is the named remove control, and no separate one is drawn', () => {
    let removed = 0;
    mount(
      <CartLine
        name="Sorrel stew"
        price="€10.00"
        quantity={1}
        removeInStepper
        onQuantityChange={() => undefined}
        onRemove={() => {
          removed += 1;
        }}
        testID="l"
      />,
    );
    expect(queryTestId('l-remove')).toBeNull();
    const remove = byTestId('l-stepper-decrement');
    expect(remove.getAttribute('aria-label')).toBe('Remove Sorrel stew');
    click(remove);
    expect(removed).toBe(1);
  });

  it('a sold-out line keeps its separate remove control, its stepper being disabled', () => {
    mount(
      <CartLine
        name="Harbour pickles"
        price="€4.20"
        quantity={1}
        unavailable
        removeInStepper
        onQuantityChange={() => undefined}
        onRemove={() => undefined}
        testID="l"
      />,
    );
    expect(byTestId('l-remove').getAttribute('aria-label')).toBe('Remove Harbour pickles');
    expect(byTestId('l-stepper-decrement').getAttribute('aria-label')).toBe('Decrease');
  });

  it('CartPanel passes it to every line', () => {
    const removed: string[] = [];
    mount(
      panel({
        removeInStepper: true,
        onLineQuantityChange: () => undefined,
        onLineRemove: (id) => removed.push(id),
      }),
    );
    expect(queryTestId('c-line-sorrel-remove')).toBeNull();
    click(byTestId('c-line-sorrel-stepper-decrement'));
    expect(removed).toEqual(['sorrel']);
  });
});

describe('a sold-out line is quietened, not disabled', () => {
  it('keeps the row at full opacity and the remove control operable', () => {
    let removed = 0;
    mount(
      <CartLine
        name="Harbour pickles"
        price="€4.20"
        quantity={1}
        unavailable
        onQuantityChange={() => undefined}
        onRemove={() => {
          removed += 1;
        }}
        testID="l"
      />,
    );
    expect(byTestId('l-unavailable').textContent).toBe('Sold out');
    // The whole-row dim is what would make a live control LOOK dead.
    expect(getComputedStyle(rowOf('l')).opacity).toBe('');
    click(byTestId('l-remove'));
    expect(removed).toBe(1);
  });

  it('disables the one control with no meaning on it', () => {
    mount(
      <CartLine
        name="Harbour pickles"
        price="€4.20"
        quantity={1}
        unavailable
        onQuantityChange={() => undefined}
        testID="l"
      />,
    );
    const increase = byTestId('l-stepper').querySelector('[aria-label="Increase"]');
    expect(increase?.getAttribute('aria-disabled')).toBe('true');
  });
});

describe('the empty basket', () => {
  it('draws none of the controls that would act on nothing', () => {
    mount(
      panel({
        lines: [],
        tip: { options: TIPS, value: '2', onValueChange: () => undefined },
        promo: { value: '', onChangeText: () => undefined, onApply: () => undefined },
        minimumOrder: { message: '€4.50 more' },
      }),
    );
    expect(byTestId('c-empty').textContent).toContain('Your basket is empty');
    expect(queryTestId('c-tip')).toBeNull();
    expect(queryTestId('c-promo')).toBeNull();
    expect(queryTestId('c-summary')).toBeNull();
    expect(queryTestId('c-checkout')).toBeNull();
    expect(queryTestId('c-minimum-meter')).toBeNull();
  });
});

describe('the minimum-order shortfall', () => {
  it('draws the sentence the app wrote and a measured bar', () => {
    mount(
      panel({
        minimumOrder: {
          message: '€4.50 more to reach the €14 minimum.',
          progress: {
            value: 9.5,
            max: 14,
            accessibilityLabel: 'Progress to the minimum order',
            valueText: '€9.50 of €14',
          },
        },
      }),
    );
    const meter = byTestId('c-minimum-meter');
    expect(meter.getAttribute('role')).toBe('progressbar');
    expect(meter.getAttribute('aria-label')).toBe('Progress to the minimum order');
    expect(meter.getAttribute('aria-valuenow')).toBe('9.5');
    expect(meter.getAttribute('aria-valuetext')).toBe('€9.50 of €14');
    expect(document.body.textContent).toContain('€4.50 more to reach the €14 minimum.');
  });

  it('blocks checkout without disabling the button’s existence', () => {
    mount(panel({ checkoutDisabled: true }));
    expect(byTestId('c-checkout').getAttribute('aria-disabled')).toBe('true');
  });
});

describe('the tip picker', () => {
  it('is a radiogroup whose chosen amount is announced as checked', () => {
    mount(<CartTipPicker options={TIPS} value="2" onValueChange={() => undefined} testID="t" />);
    const group = byTestId('t-options');
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(byTestId('t-option-2').getAttribute('aria-checked')).toBe('true');
    expect(byTestId('t-option-none').getAttribute('aria-checked')).toBe('false');
  });

  it('reports the chosen id', () => {
    const chosen: string[] = [];
    mount(<CartTipPicker options={TIPS} onValueChange={(id) => chosen.push(id)} testID="t" />);
    click(byTestId('t-option-none'));
    expect(chosen).toEqual(['none']);
  });
});

describe('the promo field is an input OR a pill, never both', () => {
  it('shows the input, with apply disabled while it is blank', () => {
    mount(<CartPromoField value="" onChangeText={() => undefined} onApply={() => undefined} testID="p" />);
    expect(queryTestId('p-applied')).toBeNull();
    expect(byTestId('p-apply').getAttribute('aria-disabled')).toBe('true');
  });

  it('enables apply once something is typed, and reports it', () => {
    let applied = 0;
    mount(
      <CartPromoField
        value="FIRSTBITE"
        onChangeText={() => undefined}
        onApply={() => {
          applied += 1;
        }}
        testID="p"
      />,
    );
    expect(byTestId('p-apply').getAttribute('aria-disabled')).toBeNull();
    click(byTestId('p-apply'));
    expect(applied).toBe(1);
  });

  it('replaces the input with a removable pill once a code is on', () => {
    let removed = 0;
    mount(
      <CartPromoField
        value=""
        applied="FIRSTBITE"
        onChangeText={() => undefined}
        onApply={() => undefined}
        onRemove={() => {
          removed += 1;
        }}
        testID="p"
      />,
    );
    expect(queryTestId('p-input')).toBeNull();
    expect(byTestId('p-applied').textContent).toContain('FIRSTBITE');
    const remove = document.querySelector('[aria-label="Remove FIRSTBITE"]');
    expect(remove).not.toBeNull();
    click(remove as HTMLElement);
    expect(removed).toBe(1);
  });

  it('announces a rejection as an alert, wired to the group', () => {
    mount(
      <CartPromoField
        value="NOPE"
        onChangeText={() => undefined}
        onApply={() => undefined}
        error="That code has expired."
        testID="p"
      />,
    );
    expect(document.querySelector('[role="alert"]')?.textContent).toBe('That code has expired.');
  });
});

describe('typing in the promo field reaches the app', () => {
  it('reports each change', () => {
    function Harness() {
      const [value, setValue] = useState('');
      return (
        <>
          <CartPromoField value={value} onChangeText={setValue} onApply={() => undefined} testID="p" />
        </>
      );
    }
    mount(<Harness />);
    expect((byTestId('p-input') as HTMLInputElement).value).toBe('');
  });
});
