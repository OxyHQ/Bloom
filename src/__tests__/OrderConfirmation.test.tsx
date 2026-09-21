/**
 * @jest-environment jsdom
 *
 * `OrderConfirmation` through the REAL react-native-web.
 *
 * Four properties, each of them the reason a line of this component exists:
 *
 *   - it IS an `EmptyState`. The mark, the heading, the line, the block and the
 *     two actions come from that family, so this asserts through ITS nodes —
 *     a second centred column added here would have nowhere to report from;
 *   - the tracking strip is `order-status`'s `OrderStatusBar`, asserted through
 *     that family's own testIDs, for the same reason;
 *   - the default mark is STATIC and visible with no imperative kick, which is
 *     why it is not `AnimatedCheck` (invisible until a ref plays it);
 *   - nothing is computed: the reference, the amounts and the times come out
 *     byte for byte.
 */
import React from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { RiBikeLine } from '../icons/remix/RiBikeLine';
import { OrderConfirmation } from '../order-confirmation';
import { ORDER_CONFIRMATION_TITLE } from '../order-confirmation/constants';
import {
  byTestId,
  click,
  mount,
  queryTestId,
  root$,
  setupHarness,
} from './support/commerce-harness';

setupHarness();

const TID = 'done';

function confirmation(props: Partial<React.ComponentProps<typeof OrderConfirmation>> = {}) {
  return (
    <OrderConfirmation
      description="We have sent the receipt to your inbox."
      reference="A-4821"
      facts={[
        { label: 'Arrives', value: 'Friday 24, 17:00 – 19:00' },
        { label: 'Total', value: '€49.62' },
      ]}
      testID={TID}
      {...props}
    />
  );
}

describe('it is an EmptyState, not a second centred column', () => {
  it('reports through that family’s own nodes', () => {
    mount(confirmation());
    expect(byTestId(`${TID}-title`).textContent).toBe(ORDER_CONFIRMATION_TITLE);
    expect(byTestId(`${TID}-description`).textContent).toBe(
      'We have sent the receipt to your inbox.',
    );
    expect(queryTestId(`${TID}-content`)).not.toBeNull();
    expect(byTestId(`${TID}-title`).getAttribute('role')).toBe('heading');
  });

  it('is one named group, and the name carries the reference', () => {
    mount(confirmation());
    const group = byTestId(TID);
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe(
      'Your order is placed. Order number A-4821. We have sent the receipt to your inbox.',
    );
  });

  it('draws the two actions, in order, and fires them', () => {
    const pressed: string[] = [];
    mount(
      confirmation({
        action: { label: 'Track order', onPress: () => pressed.push('track') },
        secondaryAction: { label: 'Get help', onPress: () => pressed.push('help') },
      }),
    );
    const buttons = Array.from(root$().querySelectorAll('[role="button"]')) as HTMLElement[];
    expect(buttons.map((b) => b.textContent)).toEqual(['Track order', 'Get help']);
    click(buttons[0]!);
    click(buttons[1]!);
    expect(pressed).toEqual(['track', 'help']);
  });
});

describe('the mark', () => {
  it('is drawn, statically, with no imperative kick', () => {
    mount(confirmation());
    const mark = byTestId(`${TID}-mark`);
    // A disc with a glyph in it. `AnimatedCheck` would render an <svg> whose
    // stroke is fully dashed away until somebody calls `play()`; this is a
    // painted disc, so it has a background colour of its own.
    const disc = mark.firstElementChild as HTMLElement;
    const fill = getComputedStyle(disc).backgroundColor;
    expect(fill).not.toBe('');
    expect(fill).not.toBe('rgba(0, 0, 0, 0)');
    expect(disc.querySelector('svg')).not.toBeNull();
  });

  it('can be replaced, and removed', () => {
    mount(confirmation({ mark: <div data-testid="brand" /> }));
    expect(queryTestId('brand')).not.toBeNull();
    mount(confirmation({ mark: null }));
    expect(queryTestId(`${TID}-mark`)).toBeNull();
  });
});

describe('the receipt', () => {
  it('draws the reference under its caption, named as one thing', () => {
    mount(confirmation());
    const chip = byTestId(`${TID}-reference`);
    expect(chip.textContent).toBe('A-4821');
    expect(chip.getAttribute('aria-label')).toBe('Order number A-4821');
    // The caption is uppercased by CSS, not by the string — so the announced
    // and copied text stays "Order number".
    const caption = byTestId(`${TID}-reference-label`);
    expect(caption.textContent).toBe('Order number');
    expect(getComputedStyle(caption).textTransform).toBe('uppercase');
  });

  it('draws the reference exactly as given, prefix and all', () => {
    mount(confirmation({ reference: '#A-4821-BCN-2026' }));
    expect(byTestId(`${TID}-reference`).textContent).toBe('#A-4821-BCN-2026');
  });

  it('takes the tracking strip from `order-status` and draws no second one', () => {
    mount(
      confirmation({
        status: { status: 'Being prepared', eta: 'Arrives 17:35', icon: RiBikeLine },
      }),
    );
    // `OrderStatusBar`'s own testIDs. A hand-rolled strip would not have them.
    expect(byTestId(`${TID}-status-status`).textContent).toBe('Being prepared');
    expect(byTestId(`${TID}-status-eta`).textContent).toBe('Arrives 17:35');
  });

  it('draws the facts as label and value, byte for byte', () => {
    mount(confirmation());
    const facts = byTestId(`${TID}-facts`);
    expect(facts.textContent).toContain('Arrives');
    expect(facts.textContent).toContain('Friday 24, 17:00 – 19:00');
    expect(facts.textContent).toContain('€49.62');
  });

  it('draws the address with `address`’s own row', () => {
    mount(
      confirmation({
        address: { title: 'Home', subtitle: 'Carrer de l’Om 14', kind: 'saved', meta: '1.2 km' },
      }),
    );
    const row = byTestId(`${TID}-address`);
    expect(row.textContent).toContain('Home');
    expect(row.textContent).toContain('Carrer de l’Om 14');
    expect(byTestId(`${TID}-address-meta`).textContent).toBe('1.2 km');
  });

  it('draws `items` under its caption, untouched', () => {
    mount(confirmation({ items: <div data-testid="lines" /> }));
    expect(byTestId(`${TID}-items`).querySelector('[data-testid="lines"]')).not.toBeNull();
    expect(byTestId(`${TID}-items-label`).textContent).toBe('What you ordered');
  });

  it('draws no body block at all when there is nothing to put in it', () => {
    mount(
      <OrderConfirmation
        reference={undefined}
        facts={undefined}
        description="Done."
        testID={TID}
      />,
    );
    expect(queryTestId(`${TID}-content`)).toBeNull();
  });
});
