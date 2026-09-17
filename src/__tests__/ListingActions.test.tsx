/**
 * @jest-environment jsdom
 *
 * The listing-actions family — `RentalActionCard`, `SaleActionCard`,
 * `ExchangeProposalCard`, `ViewingScheduler`, `MortgageCalculator`,
 * `ApplicationChecklist`, `ActionBar` — and the pure `computeMortgage`,
 * rendered through the REAL react-native-web so the assertions read emitted
 * DOM attributes and computed styles rather than props.
 */
import React, { useState } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import { resolveBookingPalette } from '../booking/shared';
import { BookingBar, BookingCard } from '../booking';
import { RiHeart3Line } from '../icons/remix/RiHeart3Line';
import {
  APPLICATION_ITEM_STATUS,
  ActionBar,
  ApplicationChecklist,
  ExchangeProposalCard,
  MortgageCalculator,
  RENTAL_STATUS,
  RentalActionCard,
  SALE_STATUS,
  SaleActionCard,
  ViewingScheduler,
  computeMortgage,
} from '../listing-actions';
import { formatPlainAmount, parseAmount, parseRate } from '../listing-actions/mortgage';
import { slotGrid } from '../listing-actions/ViewingScheduler';
import { isApplicationItemReady } from '../listing-actions/ApplicationChecklist';
import type { ApplicationItem, ExchangeMode } from '../listing-actions';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let lastTheme: Theme | null = null;

function ThemeProbe() {
  lastTheme = useTheme();
  return null;
}

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light'): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        <ThemeProbe />
        {ui}
      </BloomThemeProvider>,
    );
  });
  return container;
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function byTestId(id: string): HTMLElement {
  const el = document.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

function queryTestId(id: string): HTMLElement | null {
  return document.querySelector(`[data-testid="${id}"]`);
}

function click(el: HTMLElement) {
  act(() => {
    el.click();
  });
}

function css(color: string): string {
  const probe = document.createElement('div');
  probe.style.color = color;
  return probe.style.color;
}

function theme(): Theme {
  if (!lastTheme) throw new Error('theme not captured');
  return lastTheme;
}

function isDisabled(el: HTMLElement): boolean {
  return (el as HTMLButtonElement).disabled === true || el.getAttribute('aria-disabled') === 'true';
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------

describe('computeMortgage', () => {
  it('matches the annuity formula on reference loans', () => {
    // 200,000 over 30 years at 6%: the textbook 1,199.10 a month.
    const a = computeMortgage({ price: 250000, downPayment: 50000, years: 30, annualRate: 6 });
    expect(a.loanAmount).toBe(200000);
    expect(a.payments).toBe(360);
    expect(round2(a.monthlyPayment)).toBe(1199.1);
    expect(round2(a.totalRepaid)).toBe(round2(a.monthlyPayment * 360));
    expect(Math.round(a.totalInterest)).toBe(231676);
    expect(Math.round(a.totalCost)).toBe(50000 + Math.round(a.totalRepaid));

    // 308,000 over 25 years at 3.4% (the story): 1,525 a month.
    const b = computeMortgage({ price: 385000, downPayment: 77000, years: 25, annualRate: 3.4 });
    expect(Math.round(b.monthlyPayment)).toBe(1525);
    expect(Math.round(b.totalInterest)).toBe(149635);

    // 100,000 over 15 years at 4.5%: 764.99.
    const c = computeMortgage({ price: 100000, downPayment: 0, years: 15, annualRate: 4.5 });
    expect(round2(c.monthlyPayment)).toBe(764.99);
  });

  it('divides evenly at 0% and pays nothing without a loan or a term', () => {
    const zero = computeMortgage({ price: 120000, downPayment: 0, years: 10, annualRate: 0 });
    expect(zero.monthlyPayment).toBe(1000);
    expect(zero.totalInterest).toBe(0);
    expect(zero.totalCost).toBe(120000);

    const paidUp = computeMortgage({ price: 90000, downPayment: 150000, years: 20, annualRate: 4 });
    expect(paidUp.loanAmount).toBe(0);
    expect(paidUp.monthlyPayment).toBe(0);
    expect(paidUp.totalCost).toBe(90000); // down payment clamped to the price

    const noTerm = computeMortgage({ price: 90000, downPayment: 0, years: 0, annualRate: 4 });
    expect(noTerm.monthlyPayment).toBe(0);
    expect(noTerm.totalInterest).toBe(0);

    const junk = computeMortgage({ price: NaN, downPayment: -5, years: Infinity, annualRate: -2 });
    expect(junk).toEqual({ loanAmount: 0, monthlyPayment: 0, payments: 0, totalRepaid: 0, totalInterest: 0, totalCost: 0 });
  });

  it('parses and formats the calculator fields', () => {
    expect(formatPlainAmount(1234567.6)).toBe('1,234,568');
    expect(formatPlainAmount(999)).toBe('999');
    expect(parseAmount('€ 250,000')).toBe(250000);
    expect(parseAmount('')).toBe(0);
    expect(parseRate('3,5 %')).toBe(3.5);
    expect(parseRate('3.')).toBe(3);
    expect(parseRate('abc')).toBe(0);
  });
});

// ---------------------------------------------------------------------------

describe('the shared action-card chrome', () => {
  it('draws every card with BookingCard’s shell: max 372, radius 16, padding 24, hairline, surface', () => {
    mount(
      <>
        <BookingCard testID="booking" price="$180" guests="1 guest" />
        <RentalActionCard testID="rental" price="€1,250" />
        <SaleActionCard testID="sale" price="€385,000" />
        <ExchangeProposalCard testID="exchange" yourHome={{ title: 'A' }} theirHome={{ title: 'B' }} />
      </>,
    );
    const palette = resolveBookingPalette(theme());
    const reference = getComputedStyle(byTestId('booking'));
    for (const id of ['rental', 'sale', 'exchange']) {
      const s = getComputedStyle(byTestId(id));
      expect(s.maxWidth).toBe('372px');
      expect(s.borderTopLeftRadius).toBe('16px');
      expect(s.paddingTop).toBe('24px');
      expect(s.paddingLeft).toBe('24px');
      expect(s.borderTopWidth).toBe('1px');
      expect(s.backgroundColor).toBe(css(palette.surface));
      expect(s.borderTopColor).toBe(css(palette.border));
      expect(s.boxShadow).toBe(reference.boxShadow);
    }
  });
});

describe('RentalActionCard', () => {
  const facts = [
    { label: 'Deposit', value: '€2,500' },
    { label: 'Minimum stay', value: '12 months' },
  ];

  it('prices per month as one spoken image and draws "/ month", bills and facts', () => {
    mount(<RentalActionCard testID="r" price="€1,250" billsNote="Bills included" facts={facts} note="Usually responds within a day" onApply={() => undefined} />);
    const price = byTestId('r-price');
    expect(price.getAttribute('role')).toBe('img');
    expect(price.getAttribute('aria-label')).toBe('€1,250 per month');
    expect(price.textContent).toBe('€1,250/ month');
    expect(container.textContent).toContain('Bills included');
    expect(byTestId('r-facts').textContent).toBe('Deposit€2,500Minimum stay12 months');
    expect(byTestId('r-request-viewing').textContent).toBe('Request a viewing');
    expect(byTestId('r-apply').textContent).toBe('Apply');
    expect(container.textContent).toContain('Usually responds within a day');
    expect(queryTestId('r-status')).toBeNull();
  });

  it('calls its handlers, and draws no Apply without onApply', () => {
    const viewing = jest.fn();
    const apply = jest.fn();
    mount(<RentalActionCard testID="r" price="€1,250" onRequestViewing={viewing} onApply={apply} />);
    click(byTestId('r-request-viewing'));
    click(byTestId('r-apply'));
    expect(viewing).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledTimes(1);
    mount(<RentalActionCard testID="r" price="€1,250" onRequestViewing={viewing} />);
    expect(queryTestId('r-apply')).toBeNull();
  });

  it.each(['reserved', 'rented'] as const)('%s: a badge, the message instead of the note, and disabled actions', (status) => {
    const viewing = jest.fn();
    const apply = jest.fn();
    mount(
      <RentalActionCard
        testID="r"
        price="€1,250"
        status={status}
        note="Usually responds within a day"
        onRequestViewing={viewing}
        onApply={apply}
      />,
    );
    expect(byTestId('r-status').textContent).toBe(RENTAL_STATUS[status].label);
    expect(byTestId('r-status-message').textContent).toBe(RENTAL_STATUS[status].message);
    expect(container.textContent).not.toContain('Usually responds within a day');
    expect(isDisabled(byTestId('r-request-viewing'))).toBe(true);
    expect(isDisabled(byTestId('r-apply'))).toBe(true);
    click(byTestId('r-request-viewing'));
    click(byTestId('r-apply'));
    expect(viewing).not.toHaveBeenCalled();
    expect(apply).not.toHaveBeenCalled();
  });
});

describe('SaleActionCard', () => {
  it('draws price per area, a pressable mortgage teaser and the offer link', () => {
    const mortgage = jest.fn();
    const offer = jest.fn();
    const contact = jest.fn();
    mount(
      <SaleActionCard
        testID="s"
        price="€385,000"
        pricePerArea="€3,438 / m²"
        mortgageEstimate="Est. €1,540/month"
        onPressMortgage={mortgage}
        onContact={contact}
        onRequestVisit={() => undefined}
        onMakeOffer={offer}
      />,
    );
    expect(byTestId('s-price').getAttribute('aria-label')).toBe('€385,000');
    expect(container.textContent).toContain('€3,438 / m²');
    const teaser = byTestId('s-mortgage');
    expect(teaser.getAttribute('role')).toBe('button');
    expect(teaser.getAttribute('aria-label')).toBe('Est. €1,540/month');
    click(teaser);
    click(byTestId('s-make-offer'));
    click(byTestId('s-contact'));
    expect(mortgage).toHaveBeenCalledTimes(1);
    expect(offer).toHaveBeenCalledTimes(1);
    expect(contact).toHaveBeenCalledTimes(1);
    expect(byTestId('s-request-visit').textContent).toBe('Request a visit');
  });

  it('sold: disables contact, hides the offer link, explains', () => {
    mount(<SaleActionCard testID="s" price="€385,000" status="sold" onContact={() => undefined} onMakeOffer={() => undefined} />);
    expect(byTestId('s-status').textContent).toBe('Sold');
    expect(byTestId('s-status-message').textContent).toBe(SALE_STATUS.sold.message);
    expect(isDisabled(byTestId('s-contact'))).toBe(true);
    expect(queryTestId('s-make-offer')).toBeNull();
  });
});

// ---------------------------------------------------------------------------

describe('ExchangeProposalCard', () => {
  function Demo({ layout }: { layout?: 'horizontal' | 'vertical' }) {
    const [mode, setMode] = useState<ExchangeMode>('swap');
    return (
      <ExchangeProposalCard
        testID="x"
        yourHome={{ title: 'Stone house', location: 'Porto Lindo', details: '3 beds · 6 guests' }}
        theirHome={{ title: 'Farmhouse', location: 'Valle Serra' }}
        dates="Jul 4 – 18"
        guests="4 guests"
        onPressDates={() => undefined}
        mode={mode}
        onModeChange={setMode}
        layout={layout}
      />
    );
  }

  it('names each home, hides the swap glyph, and labels the cells', () => {
    mount(<Demo />);
    expect(byTestId('x-your-home').getAttribute('aria-label')).toBe('Your home, Stone house, Porto Lindo, 3 beds · 6 guests');
    expect(byTestId('x-their-home').getAttribute('aria-label')).toBe('Their home, Farmhouse, Valle Serra');
    expect(byTestId('x-swap-glyph').getAttribute('aria-hidden')).toBe('true');
    expect(byTestId('x-dates').getAttribute('aria-label')).toBe('Dates: Jul 4 – 18');
    expect(byTestId('x-guests').getAttribute('aria-label')).toBe('Guests: 4 guests');
    expect(byTestId('x-propose').textContent).toBe('Propose a swap');
  });

  it('selects one mode chip at a time (aria-pressed)', () => {
    mount(<Demo />);
    expect(byTestId('x-mode-swap').getAttribute('aria-pressed')).toBe('true');
    expect(byTestId('x-mode-host').getAttribute('aria-pressed')).toBe('false');
    click(byTestId('x-mode-host'));
    expect(byTestId('x-mode-swap').getAttribute('aria-pressed')).toBe('false');
    expect(byTestId('x-mode-host').getAttribute('aria-pressed')).toBe('true');
    expect(byTestId('x-mode-both').textContent).toBe('Either');
  });

  it('stacks the homes and turns the glyph in the vertical layout', () => {
    mount(<Demo layout="horizontal" />);
    expect(getComputedStyle(byTestId('x-homes')).flexDirection).toBe('row');
    expect(getComputedStyle(byTestId('x-swap-glyph')).transform).toBe('');
    mount(<Demo layout="vertical" />);
    expect(getComputedStyle(byTestId('x-homes')).flexDirection).toBe('column');
    expect(getComputedStyle(byTestId('x-swap-glyph')).transform).toBe('rotate(90deg)');
  });
});

// ---------------------------------------------------------------------------

describe('ViewingScheduler', () => {
  const days = [
    { value: 'mon', weekday: 'Mon', day: '14' },
    { value: 'tue', weekday: 'Tue', day: '15', disabled: true },
    { value: 'wed', weekday: 'Wed', day: '16' },
  ];
  const slots = [
    { value: '09:00', label: '09:00' },
    { value: '09:30', label: '09:30', disabled: true },
  ];

  function Demo({ onSubmit }: { onSubmit?: () => void }) {
    const [day, setDay] = useState<string | null>(null);
    const [slot, setSlot] = useState<string | null>(null);
    const [mode, setMode] = useState<'in-person' | 'video'>('in-person');
    return (
      <ViewingScheduler
        testID="v"
        days={days}
        day={day}
        onDayChange={setDay}
        slots={day === 'wed' ? [] : slots}
        slot={slot}
        onSlotChange={setSlot}
        mode={mode}
        onModeChange={setMode}
        onSubmit={onSubmit}
      />
    );
  }

  it('is two radio groups with checked and disabled state on web', () => {
    mount(<Demo />);
    const groups = container.querySelectorAll('[role="radiogroup"]');
    expect([...groups].map((g) => g.getAttribute('aria-label'))).toEqual(['Day', 'Time', 'Viewing type']);
    const mon = byTestId('v-day-mon');
    expect(mon.getAttribute('role')).toBe('radio');
    expect(mon.getAttribute('aria-label')).toBe('Mon 14');
    expect(mon.getAttribute('aria-checked')).toBe('false');
    expect(byTestId('v-day-tue').getAttribute('aria-disabled')).toBe('true');
    click(mon);
    expect(byTestId('v-day-mon').getAttribute('aria-checked')).toBe('true');
    click(byTestId('v-day-tue'));
    expect(byTestId('v-day-tue').getAttribute('aria-checked')).toBe('false');
  });

  it('inverts the selected chip: text-primary fill, surface ink', () => {
    mount(<Demo />);
    click(byTestId('v-day-mon'));
    click(byTestId('v-slot-09:00'));
    const palette = resolveBookingPalette(theme());
    const chip = byTestId('v-slot-09:00');
    expect(getComputedStyle(chip).backgroundColor).toBe(css(palette.text));
    expect(getComputedStyle(chip.querySelector('div')!).color).toBe(css(palette.surface));
    expect(getComputedStyle(chip).borderTopLeftRadius).toBe('9999px');
    expect(getComputedStyle(byTestId('v-day-mon')).borderTopLeftRadius).toBe('12px');
    expect(getComputedStyle(byTestId('v-slot-09:30')).opacity).toBe('0.4');
  });

  it('enables the button once a day and a time are chosen, and shows the empty label', () => {
    const submit = jest.fn();
    mount(<Demo onSubmit={submit} />);
    expect(isDisabled(byTestId('v-submit'))).toBe(true);
    click(byTestId('v-day-mon'));
    expect(isDisabled(byTestId('v-submit'))).toBe(true);
    click(byTestId('v-slot-09:30'));
    expect(isDisabled(byTestId('v-submit'))).toBe(true);
    click(byTestId('v-slot-09:00'));
    expect(isDisabled(byTestId('v-submit'))).toBe(false);
    click(byTestId('v-submit'));
    expect(submit).toHaveBeenCalledTimes(1);
    click(byTestId('v-day-wed'));
    expect(byTestId('v-slots-empty').textContent).toBe('No times left on this day');
    expect(isDisabled(byTestId('v-submit'))).toBe(true);
  });

  it('fits slot columns of at least 76 into the width', () => {
    expect(slotGrid(322)).toEqual({ columns: 3, chipWidth: 102 });
    expect(slotGrid(76)).toEqual({ columns: 1, chipWidth: 76 });
    expect(slotGrid(600)).toEqual({ columns: 7, chipWidth: 78 });
  });
});

// ---------------------------------------------------------------------------

describe('MortgageCalculator', () => {
  const euro = (n: number) => `€${formatPlainAmount(n)}`;

  it('shows the computed payment, rows and donut from its inputs', () => {
    mount(
      <MortgageCalculator
        testID="m"
        defaultPrice={385000}
        defaultDownPayment={77000}
        defaultYears={25}
        defaultAnnualRate={3.4}
        formatCurrency={euro}
      />,
    );
    expect(byTestId('m-monthly').textContent).toBe('€1,525');
    expect(byTestId('m-row-loan').textContent).toBe('Loan amount€308,000');
    expect(byTestId('m-row-interest').textContent).toBe('Total interest€149,635');
    expect(byTestId('m-row-total').textContent).toBe('Total cost€534,635');
    const donut = byTestId('m-donut');
    expect(donut.getAttribute('role')).toBe('img');
    expect(donut.getAttribute('aria-label')).toBe('Principal €308,000, Interest €149,635');
    expect(byTestId('m-disclaimer').textContent).toMatch(/^An estimate/);
    expect((byTestId('m-price') as HTMLInputElement).value).toBe('385,000');
    expect((byTestId('m-down-payment-percent') as HTMLInputElement).value).toBe('20');
    const slider = container.querySelector('[role="slider"]');
    if (!slider) throw new Error('no slider');
    expect(slider.getAttribute('aria-label')).toBe('Down payment percent');
    expect(slider.getAttribute('aria-valuenow')).toBe('20');
  });

  it('changes term by radio chip and reports it when controlled', () => {
    const onYears = jest.fn();
    function Controlled() {
      const [years, setYears] = useState(25);
      return (
        <MortgageCalculator
          testID="m"
          price={200000}
          downPayment={0}
          annualRate={0}
          years={years}
          onYearsChange={(y) => {
            onYears(y);
            setYears(y);
          }}
          formatCurrency={euro}
        />
      );
    }
    mount(<Controlled />);
    expect(byTestId('m-term-25').getAttribute('aria-checked')).toBe('true');
    expect(byTestId('m-term-10').getAttribute('aria-label')).toBe('10 years');
    click(byTestId('m-term-10'));
    expect(onYears).toHaveBeenCalledWith(10);
    expect(byTestId('m-term-10').getAttribute('aria-checked')).toBe('true');
    expect(byTestId('m-monthly').textContent).toBe('€1,667');
  });

  it('keeps a half-typed rate and recomputes from the typed amount', () => {
    mount(<MortgageCalculator testID="m" defaultPrice={100000} defaultDownPayment={0} defaultYears={15} defaultAnnualRate={1} />);
    const input = byTestId('m-rate') as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    act(() => {
      setter.call(input, '4.');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect((byTestId('m-rate') as HTMLInputElement).value).toBe('4.');
    act(() => {
      setter.call(input, '4.5');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(byTestId('m-monthly').textContent).toBe('765');
  });
});

// ---------------------------------------------------------------------------

describe('ApplicationChecklist', () => {
  const items: ApplicationItem[] = [
    { key: 'id', title: 'Proof of identity', status: 'verified', description: 'Passport' },
    { key: 'pay', title: 'Payslips', status: 'uploaded' },
    { key: 'contract', title: 'Employment contract', status: 'missing' },
    { key: 'bank', title: 'Bank statement', status: 'rejected', description: 'Latest', reason: 'Name cut off' },
  ];

  it('announces progress over uploaded + verified items', () => {
    mount(<ApplicationChecklist testID="c" items={items} />);
    const bar = byTestId('c-progress');
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-label')).toBe('Your application');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('4');
    expect(bar.getAttribute('aria-valuenow')).toBe('2');
    expect(bar.getAttribute('aria-valuetext')).toBe('2 of 4 ready');
    expect(byTestId('c-progress-fill').style.width).toBe('50%');
    expect(items.map(isApplicationItemReady)).toEqual([true, true, false, false]);
  });

  it('labels statuses and actions by default, and names each action by its item', () => {
    const onAction = jest.fn();
    mount(<ApplicationChecklist testID="c" items={items} onItemAction={onAction} />);
    for (const item of items) {
      expect(byTestId(`c-item-${item.key}-status`).textContent).toBe(APPLICATION_ITEM_STATUS[item.status].label);
      const action = byTestId(`c-item-${item.key}-action`);
      expect(action.textContent).toBe(APPLICATION_ITEM_STATUS[item.status].action);
      expect(action.getAttribute('aria-label')).toBe(`${APPLICATION_ITEM_STATUS[item.status].action} ${item.title}`);
    }
    click(byTestId('c-item-contract-action'));
    expect(onAction).toHaveBeenCalledWith(items[2]);
  });

  it('shows a rejection reason in the error colour instead of the description', () => {
    mount(<ApplicationChecklist testID="c" items={items} />);
    const detail = byTestId('c-item-bank-detail');
    expect(detail.textContent).toBe('Name cut off');
    expect(getComputedStyle(detail).color).toBe(css(resolveAccentColors(theme().colors, 'error', 'outlined').foreground));
    expect(byTestId('c-item-id-detail').textContent).toBe('Passport');
  });

  it('draws no action for a null actionLabel, and a visible track in dark mode', () => {
    mount(<ApplicationChecklist testID="c" items={[{ key: 'a', title: 'A', status: 'missing', actionLabel: null }]} />, 'dark');
    expect(queryTestId('c-item-a-action')).toBeNull();
    const palette = resolveBookingPalette(theme());
    expect(getComputedStyle(byTestId('c-progress')).backgroundColor).not.toBe(css(palette.surface));
  });
});

// ---------------------------------------------------------------------------

describe('ActionBar', () => {
  it('draws price, subtitle link, a named icon button and the primary button', () => {
    const primary = jest.fn();
    const secondary = jest.fn();
    const subtitle = jest.fn();
    mount(
      <ActionBar
        testID="b"
        price="€1,250"
        priceUnit="month"
        priceUnitPrefix="/"
        subtitle="Available from Sep 1"
        onPressSubtitle={subtitle}
        primaryLabel="Request a viewing"
        onPrimary={primary}
        secondaryIcon={RiHeart3Line}
        secondaryLabel="Save"
        onSecondary={secondary}
        bottomInset={20}
      />,
    );
    expect(byTestId('b-price').getAttribute('aria-label')).toBe('€1,250 per month');
    expect(byTestId('b-secondary').getAttribute('aria-label')).toBe('Save');
    click(byTestId('b-secondary'));
    click(byTestId('b-subtitle'));
    click(byTestId('b-primary'));
    expect([secondary, subtitle, primary].map((f) => f.mock.calls.length)).toEqual([1, 1, 1]);
    const s = getComputedStyle(byTestId('b'));
    expect(s.paddingBottom).toBe('32px');
    expect(s.paddingLeft).toBe('24px');
    expect(s.borderTopWidth).toBe('1px');
  });

  it('keeps BookingBar as its preset, with the stay testIDs and wording', () => {
    const reserve = jest.fn();
    mount(<BookingBar testID="bb" price="$180" priceUnit="night" dates="Oct 12 – 17" onReserve={reserve} />);
    expect(byTestId('bb-reserve').textContent).toBe('Reserve');
    expect(byTestId('bb-dates').textContent).toBe('Oct 12 – 17');
    expect(queryTestId('bb-secondary')).toBeNull();
    click(byTestId('bb-reserve'));
    expect(reserve).toHaveBeenCalledTimes(1);
  });

  it('ignores a disabled primary', () => {
    const primary = jest.fn();
    mount(<ActionBar testID="b" price="€980" primaryLabel="Apply" onPrimary={primary} primaryDisabled />);
    click(byTestId('b-primary'));
    expect(primary).not.toHaveBeenCalled();
  });
});
