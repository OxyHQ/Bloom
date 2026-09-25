/**
 * @jest-environment jsdom
 *
 * `PriceSummary` and `PriceSummaryLine` through the REAL react-native-web.
 *
 * The property this file exists for is the NEGATIVE one: the family does no
 * money maths. A test that passed `"€12.40"` and read `"€12.40"` back would
 * pass whether or not the component reformatted it, so the amounts here are
 * deliberately hostile — an unsigned credit, a number with the symbol after it,
 * a thousands separator that is a dot — and the assertion is that every one of
 * them comes out byte for byte.
 */
import React, { useState } from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { PriceSummary, PriceSummaryLine, PRICE_PENDING_PLACEHOLDER } from '../price-breakdown';
import { resolvePricePaint } from '../price-breakdown/shared';
import { AA_TEXT, resolveSurfaceLevel } from '../styles/surface-levels';
import { contrastRatio } from '../styles/color-contrast';
import { resolveAccentColors } from '../theme/accent-colors';
import { buildTheme } from '../theme/build-theme';
import type { PriceLine } from '../price-breakdown';
import {
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

const LINES: PriceLine[] = [
  { id: 'base', label: 'Collection and delivery', sublabel: '18 km', amount: '€34.00' },
  { id: 'promo', label: 'First trip discount', amount: '5,00 €', tone: 'discount' },
  { id: 'vat', label: 'VAT', amount: '1.234,56 €', tone: 'muted' },
  { id: 'tip', label: 'Courier tip', state: 'pending' },
];

describe('it does no money maths, in either direction', () => {
  it('draws every amount byte for byte, hostile formatting included', () => {
    mount(<PriceSummary lines={LINES} total={{ label: 'Total', amount: '1.268,56 €' }} testID="p" />);
    expect(byTestId('p-line-0-amount').textContent).toBe('€34.00');
    // An UNSIGNED credit stays unsigned: `tone="discount"` colours a line, it
    // does not negate one. This is the assertion that fails the moment somebody
    // adds a "helpful" minus sign.
    expect(byTestId('p-line-1-amount').textContent).toBe('5,00 €');
    expect(byTestId('p-line-2-amount').textContent).toBe('1.234,56 €');
    expect(byTestId('p-total-amount').textContent).toBe('1.268,56 €');
  });

  it('never sums the lines — the total is only ever what it was handed', () => {
    mount(
      <PriceSummary
        lines={[
          { label: 'One', amount: '€10.00' },
          { label: 'Two', amount: '€10.00' },
        ]}
        total={{ label: 'Total', amount: '€3.00' }}
        testID="p"
      />,
    );
    expect(byTestId('p-total-amount').textContent).toBe('€3.00');
  });

  it('draws the placeholder where a line has no number yet', () => {
    mount(<PriceSummary lines={LINES} testID="p" />);
    expect(byTestId('p-line-3-amount').textContent).toBe(PRICE_PENDING_PLACEHOLDER);
    expect(byTestId('p-line-3-state').textContent).toBe('Pending');
  });
});

describe('a secondary amount (a second currency)', () => {
  it('draws it under the line amount and under the total, byte for byte, and only when given', () => {
    mount(
      <PriceSummary
        lines={[
          { label: 'Subtotal', amount: '$13.20', secondaryAmount: '≈ 12,00 €' },
          { label: 'Delivery', amount: '$2.00' },
        ]}
        total={{ label: 'Total', amount: '$15.20', secondaryAmount: '≈ 13,82 €' }}
        testID="p"
      />,
    );
    expect(byTestId('p-line-0-amount').textContent).toBe('$13.20');
    expect(byTestId('p-line-0-secondary-amount').textContent).toBe('≈ 12,00 €');
    expect(queryTestId('p-line-1-secondary-amount')).toBeNull();
    expect(byTestId('p-total-secondary-amount').textContent).toBe('≈ 13,82 €');
    // De-emphasised: the secondary rung, not the amount's colour.
    const paint = resolvePricePaint(theme(), resolveSurfaceLevel(theme(), 0).background);
    expect(getComputedStyle(byTestId('p-line-0-secondary-amount')).color).toBe(css(paint.textSecondary));
    expect(getComputedStyle(byTestId('p-line-0-amount')).color).toBe(css(paint.text));
  });

  it('PriceSummaryLine takes it directly', () => {
    mount(<PriceSummaryLine label="Subtotal" amount="$13.20" secondaryAmount="≈ 12,00 €" testID="l" />);
    expect(byTestId('l-secondary-amount').textContent).toBe('≈ 12,00 €');
  });
});

describe('tone and state', () => {
  it('paints a discount the success rung and leaves the rest alone', () => {
    mount(<PriceSummary lines={LINES} testID="p" />);
    const success = resolveAccentColors(theme().colors, 'success', 'subtle').foreground;
    expect(getComputedStyle(byTestId('p-line-1-amount')).color).toBe(css(success));
    expect(getComputedStyle(byTestId('p-line-0-amount')).color).not.toBe(css(success));
  });

  it('quietens a muted line on BOTH sides', () => {
    mount(<PriceSummary lines={LINES} testID="p" />);
    const paint = resolvePricePaint(theme(), resolveSurfaceLevel(theme(), 0).background);
    expect(getComputedStyle(byTestId('p-line-2-label')).color).toBe(css(paint.textSecondary));
    expect(getComputedStyle(byTestId('p-line-2-amount')).color).toBe(css(paint.textSecondary));
    expect(getComputedStyle(byTestId('p-line-0-label')).color).toBe(css(paint.text));
  });

  it('puts the caveat under the AMOUNT, not after the label, and renames it', () => {
    mount(
      <PriceSummary
        lines={[{ label: 'Delivery', amount: '€2.90', state: 'estimated' }]}
        total={{ label: 'Total', amount: '€2.90', state: 'estimated' }}
        stateLabels={{ estimated: 'Could change' }}
        testID="p"
      />,
    );
    expect(byTestId('p-line-0-state').textContent).toBe('Could change');
    expect(byTestId('p-total-state').textContent).toBe('Could change');
    // The caveat is a SIBLING of the amount, so it travels with the number.
    expect(byTestId('p-line-0-amount').parentElement).toBe(byTestId('p-line-0-state').parentElement);
    expect(byTestId('p-line-0-label').textContent).toBe('Delivery');
  });

  it('says nothing at all for a final line', () => {
    mount(<PriceSummary lines={[{ label: 'Delivery', amount: '€2.90' }]} testID="p" />);
    expect(queryTestId('p-line-0-state')).toBeNull();
  });
});

describe('the disclosure folds the LINES and keeps the total', () => {
  function Controlled() {
    const [open, setOpen] = useState(false);
    return (
      <PriceSummary
        lines={LINES}
        total={{ label: 'Total', amount: '€45.72' }}
        collapsible
        expanded={open}
        onExpandedChange={setOpen}
        testID="p"
      />
    );
  }

  it('hides the lines, never the answer, and announces which', () => {
    mount(<Controlled />);
    expect(queryTestId('p-lines')).toBeNull();
    expect(byTestId('p-total-amount').textContent).toBe('€45.72');
    const trigger = byTestId('p-disclosure');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.textContent).toContain('Show price details');
    click(trigger);
    expect(byTestId('p-lines')).not.toBeNull();
    expect(byTestId('p-disclosure').getAttribute('aria-expanded')).toBe('true');
    expect(byTestId('p-disclosure').textContent).toContain('Hide price details');
    expect(byTestId('p-total-amount').textContent).toBe('€45.72');
  });

  it('works uncontrolled from a default', () => {
    mount(<PriceSummary lines={LINES} collapsible defaultExpanded testID="p" />);
    expect(byTestId('p-lines')).not.toBeNull();
    click(byTestId('p-disclosure'));
    expect(queryTestId('p-lines')).toBeNull();
  });

  it('draws no disclosure at all when it is not collapsible', () => {
    mount(<PriceSummary lines={LINES} testID="p" />);
    expect(queryTestId('p-disclosure')).toBeNull();
    expect(byTestId('p-lines')).not.toBeNull();
  });
});

describe('structure and naming', () => {
  it('is a named list of lines', () => {
    mount(<PriceSummary lines={LINES} accessibilityLabel="What you pay" testID="p" />);
    const list = byTestId('p-lines');
    expect(list.getAttribute('role')).toBe('list');
    expect(list.getAttribute('aria-label')).toBe('What you pay');
    expect(list.querySelectorAll('[role="listitem"]')).toHaveLength(4);
  });

  it('names the info affordance, which draws no text of its own', () => {
    mount(
      <PriceSummary
        lines={[
          { label: 'Stairs', amount: '€8.00', info: 'Per floor above the second.' },
          { label: 'Cover', amount: '€4.50', info: 'Per trip.', infoAccessibilityLabel: 'How cover works' },
        ]}
        testID="p"
      />,
    );
    expect(byTestId('p-line-0-info').getAttribute('aria-label')).toBe('About Stairs');
    expect(byTestId('p-line-1-info').getAttribute('aria-label')).toBe('How cover works');
    // Closed: the explanation is not in the document until the popover opens.
    expect(root$().textContent).not.toContain('Per floor above the second.');
  });

  it('draws no rule and no total row without a total', () => {
    mount(<PriceSummary lines={LINES} testID="p" />);
    expect(queryTestId('p-total-label')).toBeNull();
    expect(queryTestId('p-total-amount')).toBeNull();
  });

  it('draws one line on its own, with the same geometry', () => {
    mount(<PriceSummaryLine label="Delivery" sublabel="2.4 km" amount="€2.90" testID="one" />);
    expect(byTestId('one').getAttribute('role')).toBe('listitem');
    expect(byTestId('one-sublabel').textContent).toBe('2.4 km');
    expect(getComputedStyle(byTestId('one')).minHeight).toBe('32px');
  });
});

describe('the paint is read off the surface, over every preset and mode', () => {
  const PRESETS = ['blue', 'teal', 'mono', 'yellow', 'purple'] as const;

  it('keeps the discount, the caveat and the rule legible on every rung', () => {
    const failures: string[] = [];
    for (const preset of PRESETS) {
      for (const mode of ['light', 'dark'] as const) {
        const t = buildTheme(preset, mode);
        for (const level of [0, 1, 2, 3] as const) {
          const surface = resolveSurfaceLevel(t, level).background;
          const paint = resolvePricePaint(t, surface);
          const where = `${preset}/${mode}/L${level}`;
          if (contrastRatio(paint.discount, surface) < AA_TEXT) {
            failures.push(`${where}: discount ${contrastRatio(paint.discount, surface).toFixed(2)}`);
          }
          if (contrastRatio(paint.textTertiary, surface) < AA_TEXT) {
            failures.push(`${where}: caveat ${contrastRatio(paint.textTertiary, surface).toFixed(2)}`);
          }
          if (paint.rule === surface) failures.push(`${where}: the rule is the surface`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
