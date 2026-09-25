/**
 * @jest-environment jsdom
 *
 * `CheckoutSummary`, its row and its confirm control, through the REAL
 * react-native-web.
 *
 * Three properties, all of them negative or invisible to a prop-level test:
 *
 *   - the ROW is the trigger. Its accessible name is "<label>: <value>" and
 *     what the press does is a HINT, so a reader moving through the summary
 *     hears the decisions rather than "Change" five times. A row with nothing
 *     to open is not a button and draws no chevron.
 *   - there is NO money maths and NO second breakdown. The totals report
 *     through `price-breakdown`'s own testIDs, so a hand-rolled summary added
 *     here would have nowhere to report from — and a total that disagrees with
 *     its own lines comes out byte for byte.
 *   - the confirm control cannot place two orders, including from two presses
 *     in ONE tick, which is the window `busy` alone cannot close because it
 *     only arrives on the next commit.
 */
import React, { useState } from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { CheckoutConfirm, CheckoutSummary, CheckoutSummaryRow, checkoutRowName } from '../checkout-summary';
import { CHECKOUT_ROW_HINT, CHECKOUT_ROW_PLACEHOLDER } from '../checkout-summary/constants';
import type { PriceLine } from '../price-breakdown';
import {
  byTestId,
  click,
  mount,
  queryTestId,
  root$,
  setupHarness,
} from './support/commerce-harness';

setupHarness();

const TID = 'checkout';

/** `Item`'s outer node: its `testID` lands on the content view inside it. */
function rowOf(testID: string): HTMLElement {
  return byTestId(testID).parentElement as HTMLElement;
}

const LINES: PriceLine[] = [
  { id: 'subtotal', label: 'Subtotal', amount: '€51.80' },
  { id: 'promo', label: 'SPRING10', amount: '−€5.18', tone: 'discount' },
];

function summary(props: Partial<React.ComponentProps<typeof CheckoutSummary>> = {}) {
  return (
    <CheckoutSummary
      address={{
        title: 'Home',
        subtitle: 'Carrer de l’Om 14, 2nd floor',
        kind: 'saved',
        onPress: () => {},
      }}
      delivery={{ label: 'Delivery window', value: 'Friday 24, 17:00 – 19:00', onPress: () => {} }}
      note={{ label: 'Note for the shop', value: '“Leave it with the concierge.”' }}
      price={{ lines: LINES, total: { label: 'Total', amount: '€49.62' } }}
      testID={TID}
      {...props}
    />
  );
}

describe('a row is the summary and the trigger', () => {
  it('announces the decision, not what the press does', () => {
    mount(summary());
    const row = rowOf(`${TID}-delivery`);
    expect(row.getAttribute('aria-label')).toBe('Delivery window: Friday 24, 17:00 – 19:00');
    expect(row.getAttribute('role')).toBe('button');
  });

  it('RECORDS the hint gap: `accessibilityHint` reaches native only', () => {
    // react-native-web has no `accessibilityHint` — not a wrong mapping, no
    // mapping at all — so on web the affordance is the `button` role and the
    // chevron, and the hint is native's alone. Pinned rather than hidden: the
    // day this becomes an `aria-describedby`, this assertion goes red and
    // somebody reads the sentence above before deleting it.
    mount(summary());
    const row = rowOf(`${TID}-delivery`);
    expect(row.getAttribute('aria-describedby')).toBeNull();
    expect(root$().textContent).not.toContain(CHECKOUT_ROW_HINT);
  });

  it('draws the label above the value, both of them', () => {
    mount(summary());
    expect(byTestId(`${TID}-delivery-label`).textContent).toBe('Delivery window');
    expect(byTestId(`${TID}-delivery-value`).textContent).toBe('Friday 24, 17:00 – 19:00');
  });

  it('falls back to the placeholder, and says so in the name too', () => {
    mount(
      summary({
        delivery: { label: 'Delivery window', onPress: () => {} },
      }),
    );
    expect(byTestId(`${TID}-delivery-value`).textContent).toBe(CHECKOUT_ROW_PLACEHOLDER);
    expect(rowOf(`${TID}-delivery`).getAttribute('aria-label')).toBe(
      `Delivery window: ${CHECKOUT_ROW_PLACEHOLDER}`,
    );
    expect(checkoutRowName('Delivery window', undefined)).toBe('Delivery window');
  });

  it('is NOT a button, and draws no chevron, when there is nothing to open', () => {
    mount(summary());
    // `note` has no `onPress` in the fixture.
    const note = rowOf(`${TID}-note`);
    expect(note.getAttribute('role')).not.toBe('button');
    // The chevron is the row's only trailing glyph.
    expect(byTestId(`${TID}-note`).querySelectorAll('svg').length).toBe(
      byTestId(`${TID}-delivery`).querySelectorAll('svg').length - 1,
    );
  });

  it('opens the thing that changes it', () => {
    let opened = 0;
    mount(
      summary({
        delivery: { label: 'Delivery window', value: 'Friday', onPress: () => (opened += 1) },
      }),
    );
    click(rowOf(`${TID}-delivery`));
    expect(opened).toBe(1);
  });
});

describe('the address row is `AddressRow`, not a second one', () => {
  it('draws the address family’s own title and subtitle inside the row', () => {
    mount(summary());
    const address = byTestId(`${TID}-address-row`);
    expect(address.textContent).toContain('Home');
    expect(address.textContent).toContain('Carrer de l’Om 14, 2nd floor');
  });

  it('suppresses the nested row’s own tile — the summary row drew the gutter', () => {
    mount(summary());
    // The tile is `AddressRow`'s, and it is the node it gives a `-tile` testID.
    expect(queryTestId(`${TID}-address-row-tile`)).toBeNull();
    // The summary row's own tile is there.
    expect(queryTestId(`${TID}-address-tile`)).not.toBeNull();
  });

  it('takes `Item`’s padding back off the nested row, on both axes', () => {
    mount(summary());
    const nested = getComputedStyle(byTestId(`${TID}-address-row`));
    expect(nested.paddingLeft).toBe('0px');
    expect(nested.paddingRight).toBe('0px');
    expect(nested.paddingTop).toBe('0px');
    expect(nested.paddingBottom).toBe('0px');
  });

  it('names the row with the label and the whole address', () => {
    mount(summary());
    expect(rowOf(`${TID}-address`).getAttribute('aria-label')).toBe(
      'Deliver to: Home, Carrer de l’Om 14, 2nd floor',
    );
  });
});

describe('the payment row is a slot', () => {
  it('renders whatever was handed to it, untouched', () => {
    mount(summary({ payment: <div data-testid="payment-family" /> }));
    expect(queryTestId('payment-family')).not.toBeNull();
  });

  it('draws nothing at all when there is none', () => {
    mount(summary());
    expect(queryTestId('payment-family')).toBeNull();
  });
});

describe('there is no money maths and no second breakdown', () => {
  it('draws every amount byte for byte, including a total that disagrees', () => {
    mount(
      summary({
        price: { lines: LINES, total: { label: 'Total', amount: '€1,000,000.00' } },
      }),
    );
    expect(byTestId(`${TID}-price-total-amount`).textContent).toBe('€1,000,000.00');
    expect(root$().textContent).toContain('€51.80');
    expect(root$().textContent).toContain('−€5.18');
  });

  it('reports the totals through `price-breakdown`’s own nodes', () => {
    mount(summary());
    // If this family grew a summary of its own these would not exist.
    expect(queryTestId(`${TID}-price-lines`)).not.toBeNull();
    expect(byTestId(`${TID}-price-total-label`).textContent).toBe('Total');
  });

  it('draws no totals block when there is no price', () => {
    mount(summary({ price: undefined }));
    expect(queryTestId(`${TID}-price-lines`)).toBeNull();
  });
});

describe('the group', () => {
  it('is one named group with the rows inside it', () => {
    mount(summary({ title: 'Review your order' }));
    const group = byTestId(`${TID}-group`);
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Review your order');
    expect(group.contains(byTestId(`${TID}-delivery`))).toBe(true);
  });

  it('falls back to a name when the heading is suppressed', () => {
    mount(summary({ title: null }));
    expect(byTestId(`${TID}-group`).getAttribute('aria-label')).toBe('Order summary');
    expect(queryTestId(`${TID}-title`)).toBeNull();
  });
});

describe('the confirm control', () => {
  it('carries the amount on the button, after the label', () => {
    mount(<CheckoutConfirm amount="€49.62" onConfirm={() => {}} testID="confirm" />);
    const button = byTestId('confirm-button');
    expect(button.textContent).toBe('Place order · €49.62');
    expect(button.getAttribute('aria-label')).toBe('Place order · €49.62');
  });

  it('draws a secondary amount under the button, leaving the button one amount', () => {
    mount(<CheckoutConfirm amount="$53.90" secondaryAmount="≈ 49,62 €" onConfirm={() => {}} testID="confirm" />);
    expect(byTestId('confirm-button').textContent).toBe('Place order · $53.90');
    expect(byTestId('confirm-secondary-amount').textContent).toBe('≈ 49,62 €');
    mount(<CheckoutConfirm amount="$53.90" onConfirm={() => {}} testID="confirm" />);
    expect(queryTestId('confirm-secondary-amount')).toBeNull();
  });

  it('refuses a SECOND press in the same tick, before `busy` can arrive', () => {
    let placed = 0;
    mount(<CheckoutConfirm onConfirm={() => (placed += 1)} testID="confirm" />);
    const button = byTestId('confirm-button');
    // Two presses with no render between them: the app's `busy` cannot have
    // reached the component yet, which is the whole window this closes.
    button.click();
    button.click();
    expect(placed).toBe(1);
  });

  it('drops every press while the app says it is busy, and renames itself', () => {
    let placed = 0;
    mount(<CheckoutConfirm busy onConfirm={() => (placed += 1)} testID="confirm" />);
    const button = byTestId('confirm-button');
    click(button);
    click(button);
    expect(placed).toBe(0);
    expect(button.getAttribute('aria-label')).toBe('Placing your order');
  });

  it('is pressable again once the app has answered', () => {
    function Harness() {
      const [busy, setBusy] = useState(false);
      const [placed, setPlaced] = useState(0);
      return (
        <>
          <CheckoutConfirm
            busy={busy}
            onConfirm={() => {
              setPlaced((n) => n + 1);
              setBusy(true);
            }}
            testID="confirm"
          />
          <button type="button" data-testid="finish" onClick={() => setBusy(false)} />
          <span data-testid="count">{placed}</span>
        </>
      );
    }
    mount(<Harness />);
    click(byTestId('confirm-button'));
    expect(byTestId('count').textContent).toBe('1');
    click(byTestId('confirm-button'));
    expect(byTestId('count').textContent).toBe('1');
    click(byTestId('finish'));
    click(byTestId('confirm-button'));
    expect(byTestId('count').textContent).toBe('2');
  });

  it('does not fire at all while disabled', () => {
    let placed = 0;
    mount(<CheckoutConfirm disabled onConfirm={() => (placed += 1)} testID="confirm" />);
    click(byTestId('confirm-button'));
    expect(placed).toBe(0);
  });

  it('draws the terms line under the button, and nothing when there is none', () => {
    mount(<CheckoutConfirm terms="You agree to the terms." testID="confirm" />);
    expect(byTestId('confirm-terms').textContent).toBe('You agree to the terms.');
    mount(<CheckoutConfirm testID="confirm" />);
    expect(queryTestId('confirm-terms')).toBeNull();
  });
});

describe('the row on its own', () => {
  it('can be given a leading node of its own, and `null` draws none', () => {
    mount(
      <CheckoutSummaryRow label="Pay with" value="Card 4417" leading={null} testID="row" />,
    );
    expect(queryTestId('row-tile')).toBeNull();
  });
});
