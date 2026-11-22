import { RiKey2Line } from '@oxy.so/bloom/icons';
import {
  DocumentList,
  LeaseSummaryCard,
  MaintenanceRequestCard,
  RentPaymentList,
  TenancyTimeline,
} from '@oxy.so/bloom/tenancy';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};

const EVENTS = [
  {
    id: 'signed',
    title: 'Lease signed',
    date: '28 Aug 2025',
    actor: 'Ana Lima',
    state: 'complete' as const,
  },
  {
    id: 'keys',
    title: 'Keys handed over',
    date: '1 Sep 2025',
    state: 'complete' as const,
    tone: 'success' as const,
    icon: RiKey2Line,
  },
  {
    id: 'review',
    title: 'Rent review',
    date: '1 Sep 2026',
    description: 'Up to 3%',
    state: 'current' as const,
  },
  { id: 'end', title: 'Lease ends', date: '31 Aug 2027', state: 'upcoming' as const },
];

const LEASE = {
  title: 'Calle de los Tilos 27',
  subtitle: '2 bedrooms · 3rd floor',
  parties: [
    { name: 'Ana Lima', role: 'Tenant' },
    { name: 'Jordi Puig', role: 'Landlord' },
  ],
  startDate: '1 Sep 2025',
  endDate: '31 Aug 2027',
  progress: 0.52,
  rent: '€1,150',
  deposit: '€2,300',
  nextPayment: { amount: '€1,150', date: '1 Oct 2026', status: 'upcoming' as const },
};

const PAYMENTS = [
  {
    id: 'sep',
    month: 'September 2026',
    dueDate: '1 Sep 2026',
    amount: '€1,150',
    method: 'Bank transfer',
    status: 'pending' as const,
  },
  {
    id: 'aug',
    month: 'August 2026',
    dueDate: '1 Aug 2026',
    amount: '€1,150',
    method: 'Bank transfer',
    status: 'paid' as const,
    onDownloadReceipt: press,
  },
  {
    id: 'jul',
    month: 'July 2026',
    dueDate: '1 Jul 2026',
    amount: '€600 of €1,150',
    status: 'partial' as const,
    statusLabel: 'Partial',
  },
  {
    id: 'jun',
    month: 'June 2026',
    dueDate: '1 Jun 2026',
    amount: '€1,150',
    status: 'overdue' as const,
  },
];

const DOCUMENTS = [
  {
    id: 'lease',
    name: 'Tenancy agreement.pdf',
    type: 'pdf' as const,
    size: '412 KB',
    date: 'Signed 28 Aug 2025',
    status: 'signed' as const,
    onView: press,
    onDownload: press,
  },
  {
    id: 'renewal',
    name: 'Rent review addendum 2026.pdf',
    type: 'pdf' as const,
    size: '96 KB',
    status: 'pending' as const,
    onSign: press,
  },
  { id: 'photo', name: 'Meter reading.jpg', type: 'image' as const, status: 'expired' as const },
];

const REQUEST = {
  title: 'Leak under the kitchen sink',
  category: 'plumbing' as const,
  reference: 'MR-2041',
  description: 'Water pools under the cabinet after the dishwasher runs.',
  priority: 'high' as const,
  stage: 'scheduled' as const,
  stages: { reported: { date: '2 Sep' }, acknowledged: { date: '3 Sep', actor: 'Jordi' } },
  commentCount: 3,
  onPressComments: press,
};

export const TENANCY_CASES: ParityCase[] = [
  {
    name: 'TenancyTimeline',
    language: () => toElement(L.TenancyTimeline(EVENTS)),
    bloom: () => <TenancyTimeline events={EVENTS} />,
  },
  ...ENUMS.density.map((density) => ({
    name: `TenancyTimeline ${density}, named, its state words`,
    language: () =>
      toElement(
        L.TenancyTimeline(EVENTS, { stateLabels: { current: 'Now' } })
          .density(density)
          .label('Tenancy history'),
      ),
    bloom: () => (
      <TenancyTimeline
        events={EVENTS}
        stateLabels={{ current: 'Now' }}
        density={density === 'default' ? 'comfortable' : density}
        accessibilityLabel="Tenancy history"
      />
    ),
  })),
  {
    name: 'LeaseSummaryCard',
    language: () => toElement(L.LeaseSummaryCard(LEASE)),
    bloom: () => <LeaseSummaryCard {...LEASE} />,
  },
  ...ENUMS.tenancyLayout.map((layout) => ({
    name: `LeaseSummaryCard ${layout}, actions`,
    language: () =>
      toElement(
        L.LeaseSummaryCard({
          ...LEASE,
          actions: L.Button(L.Text('Pay rent')).onPress(press),
        }).style(layout),
      ),
    bloom: () => (
      <LeaseSummaryCard
        {...LEASE}
        layout={layout}
        actions={toElement(L.Button(L.Text('Pay rent')).onPress(press))}
      />
    ),
  })),
  {
    name: 'RentPaymentList',
    language: () => toElement(L.RentPaymentList(PAYMENTS)),
    bloom: () => <RentPaymentList payments={PAYMENTS} />,
  },
  ...ENUMS.tenancyLayout.flatMap((layout) =>
    ENUMS.rentOutstandingTone.map((tone) => ({
      name: `RentPaymentList ${layout}, outstanding ${tone}`,
      language: () =>
        toElement(
          L.RentPaymentList(PAYMENTS, {
            title: 'Rent',
            paidThisYear: '€9,200',
            outstanding: '€1,150',
          })
            .style(layout)
            .tint(tone),
        ),
      bloom: () => (
        <RentPaymentList
          payments={PAYMENTS}
          title="Rent"
          paidThisYear="€9,200"
          outstanding="€1,150"
          layout={layout}
          outstandingTone={tone}
        />
      ),
    })),
  ),
  {
    name: 'RentPaymentList empty',
    language: () => toElement(L.RentPaymentList([], { emptyLabel: 'No payments yet' })),
    bloom: () => <RentPaymentList payments={[]} emptyLabel="No payments yet" />,
  },
  {
    name: 'MaintenanceRequestCard',
    language: () => toElement(L.MaintenanceRequestCard(REQUEST)),
    bloom: () => <MaintenanceRequestCard {...REQUEST} />,
  },
  {
    name: 'MaintenanceRequestCard reported, no timeline, actions',
    language: () =>
      toElement(
        L.MaintenanceRequestCard({
          title: 'Boiler noise',
          category: 'heating',
          stage: 'reported',
          showTimeline: false,
          actions: L.Text('Call the plumber'),
        }),
      ),
    bloom: () => (
      <MaintenanceRequestCard
        title="Boiler noise"
        category="heating"
        stage="reported"
        showTimeline={false}
        actions={<Text>Call the plumber</Text>}
      />
    ),
  },
  {
    name: 'DocumentList',
    language: () => toElement(L.DocumentList(DOCUMENTS)),
    bloom: () => <DocumentList documents={DOCUMENTS} />,
  },
  ...ENUMS.tenancyLayout.map((layout) => ({
    name: `DocumentList ${layout}, its words`,
    language: () => toElement(L.DocumentList(DOCUMENTS, { signLabel: 'Sign now' }).style(layout)),
    bloom: () => <DocumentList documents={DOCUMENTS} signLabel="Sign now" layout={layout} />,
  })),
  {
    name: 'DocumentList empty',
    language: () => toElement(L.DocumentList([], { emptyLabel: 'No documents' })),
    bloom: () => <DocumentList documents={[]} emptyLabel="No documents" />,
  },
];
