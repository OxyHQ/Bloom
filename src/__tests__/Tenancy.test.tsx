/**
 * @jest-environment jsdom
 *
 * The tenancy parts rendered through the REAL react-native-web, so the
 * assertions read the emitted DOM: status colours, geometry and accessibility
 * attributes. Width-driven layouts need `onLayout` (a ResizeObserver jsdom does
 * not have), so every part is given an explicit `layout`.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { RiKey2Line } from '../icons/remix';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolveAccentColors, type AccentTone } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import {
  DocumentList,
  LEASE_PAYMENT_STATUS,
  LeaseSummaryCard,
  MAINTENANCE_PRIORITY,
  MAINTENANCE_STAGE,
  MaintenanceRequestCard,
  RENT_PAYMENT_STATUS,
  RentPaymentList,
  TENANCY_DOCUMENT_STATUS,
  TenancyTimeline,
} from '../tenancy';
import { resolveHousingPalette } from '../tenancy/shared';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let theme: Theme;

function ReadTheme() {
  theme = useTheme();
  return null;
}

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        <ReadTheme />
        {ui}
      </BloomThemeProvider>,
    );
  });
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
  const el = container.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

const queryTestId = (id: string) => container.querySelector(`[data-testid="${id}"]`);

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.color = color;
  return probe.style.color;
}

/** A subtle badge paints the tone's tint behind the tone's text colour. */
function expectSubtle(el: HTMLElement, tone: AccentTone) {
  const accent = resolveAccentColors(theme.colors, tone, 'subtle');
  expect(getComputedStyle(el).backgroundColor).toBe(normalise(accent.background));
  expect(el.textContent).not.toBe('');
}

const noop = () => undefined;

// ---------------------------------------------------------------------------

describe('TenancyTimeline', () => {
  const events = [
    { title: 'Reported', date: '12 Mar', actor: 'You' },
    { title: 'Acknowledged', date: '13 Mar', state: 'current' as const, tone: 'warning' as const },
    { title: 'Resolved', state: 'upcoming' as const, icon: RiKey2Line },
  ];

  it('is a named list of list items; each marker is an img named by its state', () => {
    mount(<TenancyTimeline events={events} accessibilityLabel="Repair history" testID="t" />);
    const list = byTestId('t');
    expect(list.getAttribute('role')).toBe('list');
    expect(list.getAttribute('aria-label')).toBe('Repair history');
    expect(byTestId('t-0-item').getAttribute('role')).toBe('listitem');
    expect(byTestId('t-0-marker').getAttribute('role')).toBe('img');
    expect(byTestId('t-0-marker').getAttribute('aria-label')).toBe('Done');
    expect(byTestId('t-1-marker').getAttribute('aria-label')).toBe('In progress');
    expect(byTestId('t-2-marker').getAttribute('aria-label')).toBe('Not yet');
  });

  it('joins date and actor into one meta line', () => {
    mount(<TenancyTimeline events={events} testID="t" />);
    expect(byTestId('t-0-meta').textContent).toBe('12 Mar · You');
    expect(queryTestId('t-2-meta')).toBeNull();
  });

  it('fills complete and current markers with the tone, draws upcoming hollow, and connects all but the last', () => {
    mount(<TenancyTimeline events={events} testID="t" />);
    const palette = resolveHousingPalette(theme);
    expect(getComputedStyle(byTestId('t-0-marker')).backgroundColor).toBe(
      normalise(resolveAccentColors(theme.colors, 'primary', 'solid').background),
    );
    const current = getComputedStyle(byTestId('t-1-marker'));
    expect(current.backgroundColor).toBe(normalise(resolveAccentColors(theme.colors, 'warning', 'solid').background));
    expect(current.borderTopWidth).toBe('3px');
    const upcoming = getComputedStyle(byTestId('t-2-marker'));
    expect(upcoming.backgroundColor).toBe(normalise(palette.surface));
    expect(upcoming.borderTopColor).toBe(normalise(palette.markerRing));
    // An event with an icon draws a 24 disc.
    expect(upcoming.width).toBe('24px');
    expect(queryTestId('t-0-connector')).not.toBeNull();
    expect(queryTestId('t-2-connector')).toBeNull();
    expect(getComputedStyle(byTestId('t-0-connector')).width).toBe('2px');
  });

  it('compact density draws 8px dots', () => {
    mount(<TenancyTimeline events={events.slice(0, 1)} density="compact" testID="t" />);
    expect(getComputedStyle(byTestId('t-0-marker')).width).toBe('8px');
  });
});

describe('LeaseSummaryCard', () => {
  const base = {
    title: 'Calle de los Tilos 27, 3º B',
    subtitle: 'Two bedrooms',
    parties: [
      { name: 'Tomás Aranda', role: 'Landlord' },
      { name: 'Lucía Ferrer', role: 'Tenant' },
    ],
    startDate: '1 Sep 2025',
    endDate: '31 Aug 2027',
    progress: 0.5,
    remainingLabel: '11 months left',
    rent: '€1,150',
    deposit: '€2,300',
  };

  it('draws the address as a heading, the period and the relative label from props', () => {
    mount(<LeaseSummaryCard {...base} layout="wide" testID="l" />);
    const title = byTestId('l-title');
    expect(title.getAttribute('role')).toBe('heading');
    expect(title.getAttribute('aria-level')).toBe('3');
    expect(byTestId('l-period').textContent).toContain('1 Sep 2025 – 31 Aug 2027');
    expect(byTestId('l-remaining').textContent).toBe('11 months left');
    expect(byTestId('l-parties').getAttribute('role')).toBe('list');
  });

  it('draws the elapsed share as a named progressbar with flat aria-value*', () => {
    mount(<LeaseSummaryCard {...base} layout="wide" testID="l" />);
    const bar = byTestId('l-progress');
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-label')).toBe('Lease period');
    expect(bar.getAttribute('aria-valuenow')).toBe('50');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(bar.getAttribute('aria-valuetext')).toBe('11 months left');
    expect(getComputedStyle(byTestId('l-progress-fill')).width).toBe('50%');
  });

  it('paints the next-payment badge per status, with the caller’s relative text', () => {
    for (const status of ['upcoming', 'due', 'overdue', 'paid'] as const) {
      mount(
        <LeaseSummaryCard
          {...base}
          layout="wide"
          nextPayment={{ date: '1 Oct', status, statusLabel: status === 'due' ? 'Due in 5 days' : undefined }}
          testID="l"
        />,
      );
      const badge = byTestId('l-payment-status');
      expectSubtle(badge, LEASE_PAYMENT_STATUS[status].tone);
      expect(badge.textContent).toBe(status === 'due' ? 'Due in 5 days' : LEASE_PAYMENT_STATUS[status].label);
    }
    expect(LEASE_PAYMENT_STATUS.overdue.tone).toBe('error');
    expect(LEASE_PAYMENT_STATUS.paid.tone).toBe('success');
  });

  it('lays the figures in a row when wide and stacked when narrow', () => {
    mount(<LeaseSummaryCard {...base} layout="wide" nextPayment={{ date: '1 Oct', status: 'due' }} testID="l" />);
    expect(getComputedStyle(byTestId('l-figures')).flexDirection).toBe('row');
    expect(getComputedStyle(byTestId('l-figure-deposit')).borderLeftWidth).toBe('1px');
    mount(<LeaseSummaryCard {...base} layout="narrow" testID="l" />);
    expect(getComputedStyle(byTestId('l-figures')).flexDirection).toBe('column');
  });

  it('is a radius-20 card on the housing surface', () => {
    mount(<LeaseSummaryCard {...base} layout="wide" testID="l" />, 'dark');
    const card = getComputedStyle(byTestId('l'));
    expect(card.borderTopLeftRadius).toBe('20px');
    expect(card.backgroundColor).toBe(normalise(resolveHousingPalette(theme).surface));
    expect(card.paddingLeft).toBe('20px');
  });
});

describe('RentPaymentList', () => {
  const receipt = jest.fn();
  const payments = [
    { id: 'a', month: 'August 2026', dueDate: '1 Aug', amount: '€1,150', method: 'Bank transfer', status: 'paid' as const, onDownloadReceipt: receipt },
    { id: 'b', month: 'September 2026', dueDate: '1 Sep', amount: '€1,150', status: 'overdue' as const },
    { id: 'c', month: 'July 2026', dueDate: '1 Jul', amount: '€600', status: 'partial' as const },
    { id: 'd', month: 'October 2026', dueDate: '1 Oct', amount: '€1,150', status: 'pending' as const },
  ];

  it('paints each status badge in its tone', () => {
    mount(<RentPaymentList payments={payments} layout="wide" testID="p" />);
    payments.forEach((payment, index) => {
      const badge = byTestId(`p-status-${index}`);
      expectSubtle(badge, RENT_PAYMENT_STATUS[payment.status].tone);
      expect(badge.textContent).toBe(RENT_PAYMENT_STATUS[payment.status].label);
    });
    expect(RENT_PAYMENT_STATUS.overdue.tone).toBe('error');
  });

  it('names the receipt button after the month and calls it; rows without one draw none', () => {
    mount(<RentPaymentList payments={payments} layout="narrow" testID="p" />);
    const button = byTestId('p-receipt-0');
    expect(button.getAttribute('aria-label')).toBe('Download receipt for August 2026');
    act(() => button.click());
    expect(receipt).toHaveBeenCalledTimes(1);
    expect(queryTestId('p-receipt-1')).toBeNull();
    expect(byTestId('p-row-0').getAttribute('role')).toBe('listitem');
  });

  it('draws the summary and paints outstanding in the error text colour on request', () => {
    mount(
      <RentPaymentList payments={payments} paidThisYear="€9,800" outstanding="€550" outstandingTone="error" layout="wide" testID="p" />,
    );
    expect(byTestId('p-paid').textContent).toBe('Paid this year€9,800');
    expect(getComputedStyle(byTestId('p-outstanding-value')).color).toBe(
      normalise(resolveAccentColors(theme.colors, 'error', 'outlined').foreground),
    );
  });

  it('hides the wide column headings from assistive tech and drops them when narrow', () => {
    mount(<RentPaymentList payments={payments} layout="wide" testID="p" />);
    expect(byTestId('p-columns').getAttribute('aria-hidden')).toBe('true');
    mount(<RentPaymentList payments={payments} layout="narrow" testID="p" />);
    expect(queryTestId('p-columns')).toBeNull();
    expect(byTestId('p-row-0').textContent).toContain('Due 1 Aug · Bank transfer');
  });

  it('draws the empty label', () => {
    mount(<RentPaymentList payments={[]} emptyLabel="Nothing yet" testID="p" />);
    expect(byTestId('p-empty').textContent).toBe('Nothing yet');
  });
});

describe('MaintenanceRequestCard', () => {
  const photos = [
    { source: 'https://example.test/a.jpg', alt: 'Pipe' },
    { source: 'https://example.test/b.jpg' },
  ];

  it('draws the stage badge, the priority chip and the category line', () => {
    mount(
      <MaintenanceRequestCard title="Leak" category="plumbing" reference="#1042" priority="urgent" stage="scheduled" testID="m" />,
    );
    const stage = byTestId('m-stage');
    expectSubtle(stage, MAINTENANCE_STAGE.scheduled.tone);
    expect(stage.textContent).toBe('Scheduled');
    expect(byTestId('m-priority').textContent).toBe('Urgent');
    expect(getComputedStyle(byTestId('m-priority')).backgroundColor).toBe(
      normalise(resolveAccentColors(theme.colors, MAINTENANCE_PRIORITY.urgent.tone, 'subtle').background),
    );
    expect(container.textContent).toContain('Plumbing · #1042');
    expect(byTestId('m-title').getAttribute('role')).toBe('heading');
  });

  it('marks earlier stages done, the current one in progress and later ones not yet', () => {
    mount(
      <MaintenanceRequestCard
        title="Leak"
        category="plumbing"
        stage="acknowledged"
        stages={{ reported: { date: '12 Mar', actor: 'You' }, acknowledged: { date: '13 Mar', actor: 'Landlord' } }}
        testID="m"
      />,
    );
    expect(byTestId('m-timeline-0-marker').getAttribute('aria-label')).toBe('Done');
    expect(byTestId('m-timeline-1-marker').getAttribute('aria-label')).toBe('In progress');
    expect(byTestId('m-timeline-2-marker').getAttribute('aria-label')).toBe('Not yet');
    expect(byTestId('m-timeline-3-marker').getAttribute('aria-label')).toBe('Not yet');
    expect(byTestId('m-timeline-1-meta').textContent).toBe('13 Mar · Landlord');
  });

  it('a resolved request completes every stage', () => {
    mount(<MaintenanceRequestCard title="Leak" category="heating" stage="resolved" testID="m" />);
    for (let i = 0; i < 4; i += 1) {
      expect(byTestId(`m-timeline-${i}-marker`).getAttribute('aria-label')).toBe('Done');
    }
  });

  it('names each photo button and reports its index; the comment count is a button', () => {
    const onPressPhoto = jest.fn();
    const onPressComments = jest.fn();
    mount(
      <MaintenanceRequestCard
        title="Leak"
        category="plumbing"
        stage="reported"
        photos={photos}
        onPressPhoto={onPressPhoto}
        commentCount={3}
        onPressComments={onPressComments}
        testID="m"
      />,
    );
    const second = byTestId('m-photo-1');
    expect(second.getAttribute('role')).toBe('button');
    expect(second.getAttribute('aria-label')).toBe('Photo 2 of 2');
    expect(byTestId('m-photo-0').getAttribute('aria-label')).toBe('Pipe, photo 1 of 2');
    expect(getComputedStyle(second).width).toBe('64px');
    expect(getComputedStyle(second).borderTopLeftRadius).toBe('12px');
    act(() => second.click());
    expect(onPressPhoto).toHaveBeenCalledWith(1);
    const comments = byTestId('m-comments');
    expect(comments.getAttribute('role')).toBe('button');
    expect(comments.getAttribute('aria-label')).toBe('3 comments');
    act(() => comments.click());
    expect(onPressComments).toHaveBeenCalled();
  });
});

describe('DocumentList', () => {
  const sign = jest.fn();
  const documents = [
    { id: '1', name: 'Lease.pdf', type: 'pdf' as const, size: '412 KB', date: 'Signed 2 Sep', status: 'signed' as const, onView: noop, onDownload: noop },
    { id: '2', name: 'Addendum.pdf', type: 'pdf' as const, status: 'pending' as const, onSign: sign },
    { id: '3', name: 'Certificate.docx', type: 'document' as const, status: 'expired' as const },
  ];

  it('paints signed / pending / expired in success / warning / error', () => {
    mount(<DocumentList documents={documents} layout="wide" testID="d" />);
    documents.forEach((doc, index) => {
      const badge = byTestId(`d-status-${index}`);
      expectSubtle(badge, TENANCY_DOCUMENT_STATUS[doc.status].tone);
    });
    expect(byTestId('d-status-1').textContent).toBe('Pending signature');
    expect(TENANCY_DOCUMENT_STATUS.signed.tone).toBe('success');
    expect(TENANCY_DOCUMENT_STATUS.expired.tone).toBe('error');
  });

  it('names the icon buttons after the document and draws Sign only with onSign', () => {
    mount(<DocumentList documents={documents} layout="narrow" testID="d" />);
    expect(byTestId('d-view-0').getAttribute('aria-label')).toBe('View Lease.pdf');
    expect(byTestId('d-download-0').getAttribute('aria-label')).toBe('Download Lease.pdf');
    expect(queryTestId('d-sign-0')).toBeNull();
    const button = byTestId('d-sign-1');
    expect(button.getAttribute('aria-label')).toBe('Sign Addendum.pdf');
    act(() => button.click());
    expect(sign).toHaveBeenCalled();
    expect(byTestId('d-row-0').textContent).toContain('412 KB · Signed 2 Sep');
  });
});
