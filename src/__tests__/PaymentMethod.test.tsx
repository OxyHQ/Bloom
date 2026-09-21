/**
 * @jest-environment jsdom
 *
 * `PaymentMethodRow`, `PaymentMethodMark` and `PaymentMethodList` through the
 * REAL react-native-web.
 *
 * Four of the family's claims are invisible to a prop-level test and are what
 * most of this file measures:
 *
 *  - the mark draws NO brand artwork of its own: a neutral glyph, and the
 *    scheme's name as TEXT. Passing `image` is the only way a picture gets in.
 *  - the list VARIANT is the announced tree — a `radiogroup` of `radio`s
 *    against a `list` of `listitem`s. Passing the prop is not evidence either
 *    arrived.
 *  - the picker is a `Field` MEMBER: the group takes the field's name, its
 *    described ids and its invalid state, and a disabled field freezes every
 *    row. A `role="radiogroup"` with none of that is the gap this family exists
 *    not to repeat.
 *  - the add row is OUTSIDE the radiogroup, so it is not one of the choices.
 */
import React, { useState } from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Field } from '../field';
import {
  PAYMENT_METHOD_KIND_ICON,
  PAYMENT_METHOD_STATE_TONE,
  PaymentMethodList,
  PaymentMethodMark,
  PaymentMethodRow,
  composePaymentMethodName,
  paymentMethodStateMessage,
  resolvePaymentMethodPaint,
} from '../payment-method';
import type { PaymentMethodEntry } from '../payment-method';
import { AA_TEXT, resolveSurfaceLevel } from '../styles/surface-levels';
import { contrastRatio } from '../styles/color-contrast';
import { resolveAccentColors } from '../theme/accent-colors';
import { buildTheme } from '../theme/build-theme';
import {
  allByRole,
  byLabel,
  byTestId,
  click,
  css,
  mount,
  queryTestId,
  root$,
  setupHarness,
  theme,
} from './support/commerce-harness';

setupHarness();

const METHODS: PaymentMethodEntry[] = [
  { id: 'a', scheme: 'Aurora', masked: '•••• 4417', expiry: 'Expires 09/29', isDefault: true },
  { id: 'b', scheme: 'Meridian', masked: '•••• 0082', expiry: 'Expires 03/27' },
];

describe('PaymentMethodMark', () => {
  it('draws a neutral glyph and the scheme NAME as text — never artwork', () => {
    mount(<PaymentMethodMark scheme="Aurora" testID="mark" />);
    expect(byTestId('mark-scheme').textContent).toBe('Aurora');
    // A glyph is an <svg>. Any <img> here would be a brand logo, which this
    // family refuses to draw.
    expect(byTestId('mark-plate').querySelector('svg')).not.toBeNull();
    expect(root$().querySelector('img')).toBeNull();
  });

  it('draws the plate alone when no scheme is named', () => {
    mount(<PaymentMethodMark testID="mark" />);
    expect(queryTestId('mark-scheme')).toBeNull();
    expect(queryTestId('mark-plate')).not.toBeNull();
  });

  it('lets an app that HAS the rights put its own artwork inside the plate', () => {
    mount(<PaymentMethodMark scheme="Aurora" image={<span data-testid="art">A</span>} testID="mark" />);
    expect(queryTestId('art')).not.toBeNull();
    expect(byTestId('mark-plate').querySelector('svg')).toBeNull();
  });

  it('reads `image` for PRESENCE, so `null` is an empty plate rather than the glyph', () => {
    mount(<PaymentMethodMark image={null} testID="mark" />);
    expect(byTestId('mark-plate').querySelector('svg')).toBeNull();
  });

  it('is wider than it is tall — the ratio is what says "card"', () => {
    mount(<PaymentMethodMark testID="mark" />);
    const plate = byTestId('mark-plate');
    expect(parseFloat(plate.style.width)).toBeGreaterThan(parseFloat(plate.style.height));
  });

  it('paints the plate in the state tone, and neutrally when there is no state', () => {
    mount(<PaymentMethodMark state="declined" testID="mark" />);
    const declined = resolveAccentColors(theme().colors, 'error', 'subtle').background;
    expect(byTestId('mark-plate').style.backgroundColor).toBe(css(declined));

    mount(<PaymentMethodMark testID="mark" />);
    const neutral = resolvePaymentMethodPaint(theme(), theme().colors.background).plate;
    expect(byTestId('mark-plate').style.backgroundColor).toBe(css(neutral));
  });
});

describe('PaymentMethodRow', () => {
  it('names itself from its own text, in reading order, as one utterance', () => {
    mount(
      <PaymentMethodRow
        scheme="Aurora"
        masked="•••• 4417"
        expiry="Expires 09/29"
        isDefault
        onPress={() => undefined}
      />,
    );
    expect(byLabel('Aurora, •••• 4417, Expires 09/29, Default')).not.toBeNull();
  });

  it('lets a caller replace that name', () => {
    mount(
      <PaymentMethodRow
        scheme="Aurora"
        masked="•••• 4417"
        accessibilityLabel="Aurora card ending four four one seven"
        onPress={() => undefined}
      />,
    );
    expect(byLabel('Aurora card ending four four one seven')).not.toBeNull();
    expect(document.querySelector('[aria-label="Aurora, •••• 4417"]')).toBeNull();
  });

  it('draws the mark when leading is OMITTED and nothing when it is null', () => {
    mount(<PaymentMethodRow scheme="Aurora" testID="row" />);
    expect(queryTestId('row-mark-plate')).not.toBeNull();
    mount(<PaymentMethodRow scheme="Aurora" leading={null} testID="row" />);
    expect(queryTestId('row-mark-plate')).toBeNull();
    mount(<PaymentMethodRow scheme="Aurora" leading={<span data-testid="own">M</span>} testID="row" />);
    expect(queryTestId('row-mark-plate')).toBeNull();
    expect(queryTestId('own')).not.toBeNull();
  });

  it('draws the default badge only when it IS the default', () => {
    mount(<PaymentMethodRow scheme="Aurora" isDefault testID="row" />);
    expect(queryTestId('row-default')).not.toBeNull();
    mount(<PaymentMethodRow scheme="Aurora" testID="row" />);
    expect(queryTestId('row-default')).toBeNull();
  });

  it('draws the state line in the state colour, and no line at all when it is fine', () => {
    mount(<PaymentMethodRow scheme="Solstice" state="declined" testID="row" />);
    const declined = resolveAccentColors(theme().colors, 'error', 'outlined').foreground;
    expect(byTestId('row-state').textContent).toBe('Declined');
    expect(byTestId('row-state').style.color).toBe(css(declined));

    mount(<PaymentMethodRow scheme="Solstice" state="expired" stateMessage="Ran out in June" testID="row" />);
    const expired = resolveAccentColors(theme().colors, 'warning', 'outlined').foreground;
    expect(byTestId('row-state').textContent).toBe('Ran out in June');
    expect(byTestId('row-state').style.color).toBe(css(expired));

    mount(<PaymentMethodRow scheme="Solstice" testID="row" />);
    expect(queryTestId('row-state')).toBeNull();
  });

  it('announces `aria-checked` when it is a radio, and nothing when it is a plain row', () => {
    mount(<PaymentMethodRow scheme="Aurora" role="radio" selectable selected onPress={() => undefined} testID="row" />);
    expect(allByRole('radio')[0]?.getAttribute('aria-checked')).toBe('true');
    // The dot is INSIDE the press target: it is not a control of its own.
    expect(allByRole('radio')[0]?.querySelector('[data-testid="row-dot"]')).not.toBeNull();

    mount(<PaymentMethodRow scheme="Aurora" onPress={() => undefined} testID="row" />);
    expect(allByRole('radio')).toHaveLength(0);
  });

  it('draws a trailing action OUTSIDE the pressable row, and inside a row with no press', () => {
    const pressed: string[] = [];
    mount(
      <PaymentMethodRow
        scheme="Aurora"
        onPress={() => pressed.push('row')}
        action={
          <button type="button" data-testid="menu" onClick={() => pressed.push('menu')}>
            More
          </button>
        }
        testID="row"
      />,
    );
    // A button inside a button is invalid HTML, and on web a click on the inner
    // control would also fire the row.
    expect(byLabel('Aurora').querySelector('[data-testid="menu"]')).toBeNull();
    click(byTestId('menu'));
    expect(pressed).toEqual(['menu']);

    mount(<PaymentMethodRow scheme="Aurora" action={<span data-testid="chip">chip</span>} testID="row" />);
    expect(queryTestId('chip')).not.toBeNull();
  });

  it('keeps every kind pointed at a glyph', () => {
    expect(Object.keys(PAYMENT_METHOD_KIND_ICON).sort()).toEqual(['account', 'card', 'cash', 'wallet']);
    for (const Glyph of Object.values(PAYMENT_METHOD_KIND_ICON)) {
      expect(typeof Glyph).not.toBe('undefined');
    }
  });
});

describe('PaymentMethodList', () => {
  it('is a radiogroup of radios when it is a picker', () => {
    mount(
      <PaymentMethodList
        methods={METHODS}
        variant="picker"
        selectedId="b"
        onSelect={() => undefined}
        accessibilityLabel="Pay with"
        testID="list"
      />,
    );
    const group = allByRole('radiogroup');
    expect(group).toHaveLength(1);
    expect(group[0]?.getAttribute('aria-label')).toBe('Pay with');
    const radios = allByRole('radio');
    expect(radios).toHaveLength(2);
    expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'true']);
  });

  it('is a list of listitems when it is not', () => {
    mount(<PaymentMethodList methods={METHODS} accessibilityLabel="Saved" testID="list" />);
    expect(allByRole('radiogroup')).toHaveLength(0);
    expect(allByRole('list')).toHaveLength(1);
    expect(allByRole('listitem')).toHaveLength(2);
  });

  it('reports the chosen id', () => {
    const chosen: string[] = [];
    mount(
      <PaymentMethodList
        methods={METHODS}
        variant="picker"
        selectedId="a"
        onSelect={(id) => chosen.push(id)}
        accessibilityLabel="Pay with"
      />,
    );
    click(allByRole('radio')[1]!);
    expect(chosen).toEqual(['b']);
  });

  it('draws the add row OUTSIDE the radiogroup, so it is not one of the choices', () => {
    mount(
      <PaymentMethodList
        methods={METHODS}
        variant="picker"
        onAdd={() => undefined}
        accessibilityLabel="Pay with"
        testID="list"
      />,
    );
    const add = byLabel('Add a payment method');
    expect(add).not.toBeNull();
    expect(allByRole('radiogroup')[0]?.contains(add)).toBe(false);
  });

  it('takes its name, its described ids and its invalid state from a Field', () => {
    mount(
      // NOT `multiple`: a multiple field describes its own group wrapper instead
      // of publishing ids, so this is the arrangement where the picker carries
      // the description itself.
      <Field label="Pay with" error="Choose one">
        <PaymentMethodList methods={METHODS} variant="picker" onSelect={() => undefined} testID="list" />
      </Field>,
    );
    const group = allByRole('radiogroup')[0]!;
    expect(group.getAttribute('aria-label')).toBe('Pay with');
    expect(group.getAttribute('aria-invalid')).toBe('true');
    const describedBy = group.getAttribute('aria-describedby');
    expect(describedBy).not.toBeNull();
    expect(document.getElementById(describedBy!)?.textContent).toBe('Choose one');
  });

  it('is frozen by a disabled Field, and a row cannot re-enable itself', () => {
    mount(
      <Field label="Pay with" multiple disabled>
        <PaymentMethodList methods={METHODS} variant="picker" disabled={false} onSelect={() => undefined} testID="list" />
      </Field>,
    );
    expect(allByRole('radiogroup')[0]?.getAttribute('aria-disabled')).toBe('true');
    // The rows are `div`s carrying `role="radio"`, so react-native-web spells
      // their inertness `aria-disabled` rather than the `disabled` attribute.
    for (const radio of allByRole('radio')) {
      expect(radio.getAttribute('aria-disabled')).toBe('true');
    }
  });

  it('falls back to its own name only OUTSIDE a field', () => {
    mount(<PaymentMethodList methods={METHODS} variant="picker" onSelect={() => undefined} testID="list" />);
    expect(allByRole('radiogroup')[0]?.getAttribute('aria-label')).toBe('Payment methods');
  });

  it('announces the loading state as busy, and draws the add row under an empty one', () => {
    mount(<PaymentMethodList methods={[]} loading loadingRows={2} testID="list" />);
    expect(byTestId('list').getAttribute('aria-busy')).toBe('true');
    expect(queryTestId('list-placeholder-1')).not.toBeNull();

    mount(<PaymentMethodList methods={[]} onAdd={() => undefined} emptyTitle="Nothing saved" testID="list" />);
    expect(byTestId('list-empty').textContent).toContain('Nothing saved');
    expect(byLabel('Add a payment method')).not.toBeNull();
  });

  it('keeps a picker selectable across renders', () => {
    function Demo() {
      const [id, setId] = useState('a');
      return (
        <PaymentMethodList methods={METHODS} variant="picker" selectedId={id} onSelect={setId} accessibilityLabel="Pay with" />
      );
    }
    mount(<Demo />);
    expect(allByRole('radio').map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false']);
    click(allByRole('radio')[1]!);
    expect(allByRole('radio').map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'true']);
  });
});

describe('the paint', () => {
  // Pure, so the whole ladder is walked without rendering: a plate picked by
  // eye disappears on one of the surfaces this family is dropped on.
  const PRESETS = ['teal', 'mono', 'purple'] as const;

  it('keeps the row text legible on every rung of every preset, in both modes', () => {
    for (const preset of PRESETS) {
      for (const mode of ['light', 'dark'] as const) {
        const built = buildTheme(preset, mode);
        for (const level of [0, 1, 2, 3] as const) {
          const surface = resolveSurfaceLevel(built, level).background;
          const paint = resolvePaymentMethodPaint(built, surface);
          expect([preset, mode, level, contrastRatio(paint.text, surface) >= AA_TEXT]).toEqual([
            preset,
            mode,
            level,
            true,
          ]);
        }
      }
    }
  });

  it('never lands the plate on the surface behind it', () => {
    for (const preset of PRESETS) {
      for (const mode of ['light', 'dark'] as const) {
        const built = buildTheme(preset, mode);
        for (const level of [0, 1, 2, 3] as const) {
          const surface = resolveSurfaceLevel(built, level).background;
          const paint = resolvePaymentMethodPaint(built, surface);
          expect([preset, mode, level, contrastRatio(paint.plate, surface) >= 1.1]).toEqual([
            preset,
            mode,
            level,
            true,
          ]);
        }
      }
    }
  });
});

describe('the pure helpers', () => {
  it('joins a name in reading order and drops what is not there', () => {
    expect(composePaymentMethodName(['Aurora', undefined, '•••• 4417', false, ''])).toBe(
      'Aurora, •••• 4417',
    );
  });

  it('says nothing for a method that is fine, and the state word otherwise', () => {
    expect(paymentMethodStateMessage('ok')).toBeUndefined();
    expect(paymentMethodStateMessage('ok', 'Ready')).toBe('Ready');
    expect(paymentMethodStateMessage('expired')).toBe('Expired');
    expect(paymentMethodStateMessage('declined', 'Your bank said no')).toBe('Your bank said no');
  });

  it('paints an ordinary method in no tone at all', () => {
    expect(PAYMENT_METHOD_STATE_TONE.ok).toBeUndefined();
    expect(PAYMENT_METHOD_STATE_TONE.expired).toBe('warning');
    expect(PAYMENT_METHOD_STATE_TONE.declined).toBe('error');
  });
});
