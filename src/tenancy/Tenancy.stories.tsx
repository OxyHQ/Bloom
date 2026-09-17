import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { RiCalendarLine, RiChat3Line, RiFileTextLine, RiHome4Line, RiKey2Line, RiBankCardLine } from '../icons/remix';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { DocumentList } from './DocumentList';
import { LeaseSummaryCard } from './LeaseSummaryCard';
import { MaintenanceRequestCard } from './MaintenanceRequestCard';
import { RentPaymentList } from './RentPaymentList';
import { TenancyTimeline } from './TenancyTimeline';
import type { MaintenanceStage, RentPayment, TenancyDocument, TenancyTimelineEvent } from './types';

const meta: Meta = {
  title: 'Blocks/Housing/Tenancy',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

const noop = () => undefined;

// ---------------------------------------------------------------------------
//  Demo data — an invented flat and its people
// ---------------------------------------------------------------------------

/** An offline placeholder photo drawn as an SVG data URI. */
function snapshot(wall: string, detail: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" fill="${wall}"/><rect x="40" y="130" width="160" height="110" rx="6" fill="${detail}"/><circle cx="170" cy="70" r="26" fill="${detail}" opacity="0.5"/><rect x="60" y="40" width="70" height="60" rx="4" fill="#ffffff" opacity="0.55"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

const PHOTOS = [
  { source: snapshot('#dfe7ec', '#7a95a8'), alt: 'Pipe under the sink' },
  { source: snapshot('#ece3d8', '#a8876b'), alt: 'Water stain on the cabinet' },
  { source: snapshot('#e3e8dd', '#6f8a63'), alt: 'Floor by the sink' },
];

const PAYMENTS: RentPayment[] = [
  { id: 'sep', month: 'September 2026', dueDate: '1 Sep 2026', amount: '€1,150', method: 'Bank transfer', status: 'pending' },
  { id: 'aug', month: 'August 2026', dueDate: '1 Aug 2026', amount: '€1,150', method: 'Bank transfer', status: 'paid', onDownloadReceipt: noop },
  { id: 'jul', month: 'July 2026', dueDate: '1 Jul 2026', amount: '€600 of €1,150', method: 'Card ending 4417', status: 'partial', statusLabel: 'Partial', onDownloadReceipt: noop },
  { id: 'jun', month: 'June 2026', dueDate: '1 Jun 2026', amount: '€1,150', method: 'Bank transfer', status: 'paid', onDownloadReceipt: noop },
  { id: 'may', month: 'May 2026', dueDate: '1 May 2026', amount: '€1,150', method: 'Bank transfer', status: 'paid', onDownloadReceipt: noop },
];

const LANDLORD_PAYMENTS: RentPayment[] = [
  { id: 'sep', month: 'September 2026', dueDate: '1 Sep 2026', amount: '€1,150', method: 'Bank transfer', status: 'overdue', statusLabel: 'Overdue 12 days' },
  { id: 'aug', month: 'August 2026', dueDate: '1 Aug 2026', amount: '€1,150', method: 'Bank transfer', status: 'paid', onDownloadReceipt: noop },
  { id: 'jul', month: 'July 2026', dueDate: '1 Jul 2026', amount: '€1,150', method: 'Bank transfer', status: 'paid', statusLabel: 'Paid 3 days late', onDownloadReceipt: noop },
];

const DOCUMENTS: TenancyDocument[] = [
  { id: 'lease', name: 'Tenancy agreement.pdf', type: 'pdf', size: '412 KB', date: 'Signed 28 Aug 2025', status: 'signed', onView: noop, onDownload: noop },
  { id: 'renewal', name: 'Rent review addendum 2026.pdf', type: 'pdf', size: '96 KB', date: 'Sent 10 Sep 2026', status: 'pending', onSign: noop, onView: noop },
  { id: 'inventory', name: 'Move-in inventory photos', type: 'image', size: '38 photos', date: '1 Sep 2025', onView: noop, onDownload: noop },
  { id: 'energy', name: 'Energy certificate.docx', type: 'document', size: '1.2 MB', date: 'Valid until 3 Jun 2026', status: 'expired', onView: noop, onDownload: noop },
];

const LEASE_TIMELINE: TenancyTimelineEvent[] = [
  { title: 'Lease signed', date: '28 Aug 2025', actor: 'Lucía Ferrer and Tomás Aranda', icon: RiFileTextLine },
  { title: 'Moved in', date: '1 Sep 2025', actor: 'Keys handed over by Tomás', icon: RiKey2Line },
  { title: 'Deposit registered', date: '15 Sep 2025', actor: 'Regional housing office', icon: RiBankCardLine, tone: 'success' },
  { title: 'Rent review', date: '1 Sep 2026', description: 'The addendum is waiting for your signature.', icon: RiCalendarLine, state: 'current', tone: 'warning' },
  { title: 'Lease ends', date: '31 Aug 2027', icon: RiHome4Line, state: 'upcoming' },
];

// ---------------------------------------------------------------------------
//  Frames
// ---------------------------------------------------------------------------

function Page({ width, children }: { width: number; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ width: '100%', minHeight: '100%', alignItems: 'flex-start', backgroundColor: theme.colors.background }}>
      <View
        style={{
          width,
          paddingTop: 32,
          paddingBottom: 48,
          paddingLeft: width < 600 ? 16 : 40,
          paddingRight: width < 600 ? 16 : 40,
          gap: 24,
          backgroundColor: theme.colors.background,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text role="heading" aria-level={2} variant="title-3-semibold" style={{ color: theme.colors.text }}>
      {children}
    </Text>
  );
}

function LeaseActions() {
  return (
    <>
      <Button variant="primary" size="small" onPress={noop}>
        Pay rent
      </Button>
      <Button variant="secondary" size="small" leadingIcon={RiChat3Line} onPress={noop}>
        Message landlord
      </Button>
    </>
  );
}

// ---------------------------------------------------------------------------
//  Tenant dashboard
// ---------------------------------------------------------------------------

function TenantDashboard({ width }: { width: number }) {
  const theme = useTheme();
  const wide = width >= 1000;
  const lease = (
    <LeaseSummaryCard
      title="Calle de los Tilos 27, 3º B"
      subtitle="Sunny two-bedroom flat · Arganzuela, Madrid"
      parties={[
        { name: 'Tomás Aranda', role: 'Landlord' },
        { name: 'Lucía Ferrer', role: 'Tenant (you)' },
      ]}
      startDate="1 Sep 2025"
      endDate="31 Aug 2027"
      progress={0.5}
      remainingLabel="11 months left"
      rent="€1,150"
      deposit="€2,300"
      nextPayment={{ date: '1 Oct', status: 'upcoming', statusLabel: 'Due in 14 days' }}
      actions={<LeaseActions />}
      testID="lease"
    />
  );
  const payments = (
    <RentPaymentList paidThisYear="€9,800" outstanding="€550" outstandingTone="error" payments={PAYMENTS} />
  );
  const requests = (
    <View style={{ gap: 16 }}>
      <MaintenanceRequestCard
        title="Kitchen sink is leaking under the cabinet"
        category="plumbing"
        reference="#1042"
        priority="high"
        description="Water collects under the sink after every use and the cabinet floor is starting to swell. I've put a bowl under the pipe for now."
        photos={PHOTOS}
        onPressPhoto={noop}
        stage="scheduled"
        stages={{
          reported: { date: '12 Sep, 18:40', actor: 'You' },
          acknowledged: { date: '13 Sep, 09:15', actor: 'Tomás (landlord)' },
          scheduled: { date: 'Thu 18 Sep, 9:00–11:00', actor: 'Fontanería Roble' },
        }}
        commentCount={4}
        onPressComments={noop}
        actions={
          <Button variant="secondary" size="small" onPress={noop}>
            Reschedule
          </Button>
        }
      />
      <MaintenanceRequestCard
        title="Bedroom radiator does not heat"
        category="heating"
        reference="#0987"
        priority="low"
        stage="resolved"
        stages={{
          reported: { date: '3 Feb', actor: 'You' },
          acknowledged: { date: '3 Feb', actor: 'Tomás (landlord)' },
          scheduled: { date: '6 Feb', actor: 'Calor Norte' },
          resolved: { date: '6 Feb', actor: 'Valve replaced' },
        }}
        commentCount={1}
      />
    </View>
  );
  const documents = <DocumentList documents={DOCUMENTS} />;

  return (
    <Page width={width}>
      <Text role="heading" aria-level={1} variant={wide ? 'title-1-semibold' : 'title-2-semibold'} style={{ color: theme.colors.text }}>
        Your home
      </Text>
      {wide ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 24 }}>
          <View style={{ flex: 1.15, gap: 24, minWidth: 0 }}>
            {lease}
            <SectionTitle>Payments</SectionTitle>
            {payments}
            <SectionTitle>Documents</SectionTitle>
            {documents}
          </View>
          <View style={{ flex: 1, gap: 24, minWidth: 0 }}>
            <SectionTitle>Repairs</SectionTitle>
            {requests}
            <SectionTitle>History</SectionTitle>
            <TenancyTimeline events={LEASE_TIMELINE} accessibilityLabel="Tenancy history" />
          </View>
        </View>
      ) : (
        <>
          {lease}
          <SectionTitle>Payments</SectionTitle>
          {payments}
          <SectionTitle>Repairs</SectionTitle>
          {requests}
          <SectionTitle>Documents</SectionTitle>
          {documents}
          <SectionTitle>History</SectionTitle>
          <TenancyTimeline events={LEASE_TIMELINE} accessibilityLabel="Tenancy history" />
        </>
      )}
    </Page>
  );
}

/** The tenant's home screen at 1280: lease, payments and documents left; repairs and history right. */
export const TenantDashboardWide: Story = {
  name: 'Tenant dashboard — 1280',
  render: () => <TenantDashboard width={1280} />,
};

export const TenantDashboardNarrow: Story = {
  name: 'Tenant dashboard — 375',
  render: () => <TenantDashboard width={375} />,
};

export const TenantDashboardWideDark: Story = {
  name: 'Tenant dashboard — 1280, dark',
  globals: { theme: 'dark' },
  render: () => <TenantDashboard width={1280} />,
};

export const TenantDashboardNarrowDark: Story = {
  name: 'Tenant dashboard — 375, dark',
  globals: { theme: 'dark' },
  render: () => <TenantDashboard width={375} />,
};

// ---------------------------------------------------------------------------
//  Landlord view
// ---------------------------------------------------------------------------

function LandlordView({ width }: { width: number }) {
  const wide = width >= 1000;
  return (
    <Page width={width}>
      <View style={wide ? { flexDirection: 'row', alignItems: 'flex-start', gap: 24 } : { gap: 24 }}>
        <View style={{ flex: wide ? 1 : undefined, gap: 24, minWidth: 0 }}>
          <LeaseSummaryCard
            title="Calle de los Tilos 27, 3º B"
            subtitle="Let since September 2025"
            parties={[
              { name: 'Lucía Ferrer', role: 'Tenant' },
              { name: 'Marco Ferrer', role: 'Co-tenant' },
            ]}
            startDate="1 Sep 2025"
            endDate="31 Aug 2027"
            progress={0.5}
            remainingLabel="11 months left"
            rent="€1,150"
            deposit="€2,300 held"
            depositLabel="Deposit"
            nextPayment={{ date: '1 Sep', status: 'overdue', statusLabel: 'Overdue 12 days' }}
            nextPaymentLabel="Last payment"
            actions={
              <>
                <Button variant="primary" size="small" onPress={noop}>
                  Send reminder
                </Button>
                <Button variant="secondary" size="small" onPress={noop}>
                  Renew lease
                </Button>
              </>
            }
          />
          <RentPaymentList
            title="Income"
            paidThisYear="€9,200"
            paidThisYearLabel="Received this year"
            outstanding="€1,150"
            outstandingTone="error"
            payments={LANDLORD_PAYMENTS}
          />
        </View>
        <View style={{ flex: wide ? 1 : undefined, gap: 16, minWidth: 0 }}>
          <MaintenanceRequestCard
            title="Kitchen sink is leaking under the cabinet"
            category="plumbing"
            reference="#1042"
            priority="urgent"
            description="Reported by Lucía. Water collects under the sink after every use."
            photos={PHOTOS}
            onPressPhoto={noop}
            stage="reported"
            stages={{ reported: { date: 'Today, 18:40', actor: 'Lucía (tenant)' } }}
            commentCount={0}
            actions={
              <>
                <Button variant="secondary" size="small" onPress={noop}>
                  Acknowledge
                </Button>
                <Button variant="primary" size="small" onPress={noop}>
                  Schedule visit
                </Button>
              </>
            }
          />
          <MaintenanceRequestCard
            title="Oven door does not close"
            category="appliances"
            reference="#1039"
            priority="medium"
            stage="acknowledged"
            stages={{
              reported: { date: '2 Sep', actor: 'Lucía (tenant)' },
              acknowledged: { date: '3 Sep', actor: 'You' },
            }}
            commentCount={2}
            onPressComments={noop}
          />
          <DocumentList
            documents={[
              { id: 'renewal', name: 'Rent review addendum 2026.pdf', type: 'pdf', size: '96 KB', date: 'Sent 10 Sep 2026', status: 'pending', statusLabel: 'Awaiting tenant', onView: noop },
              DOCUMENTS[0]!,
            ]}
          />
        </View>
      </View>
    </Page>
  );
}

/** The same flat from the landlord's side: an overdue payment, a new urgent request to act on. */
export const LandlordViewWide: Story = {
  name: 'Landlord view — 1280',
  render: () => <LandlordView width={1280} />,
};

export const LandlordViewNarrowDark: Story = {
  name: 'Landlord view — 375, dark',
  globals: { theme: 'dark' },
  render: () => <LandlordView width={375} />,
};

// ---------------------------------------------------------------------------
//  Parts
// ---------------------------------------------------------------------------

const STAGES: MaintenanceStage[] = ['reported', 'acknowledged', 'scheduled', 'resolved'];

/** Every stage and priority, and the four categories' icons. */
export const MaintenanceStages: Story = {
  render: () => (
    <Page width={1280}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {STAGES.map((stage, index) => (
          <View key={stage} style={{ width: 280 }}>
            <MaintenanceRequestCard
              title={['No power in the hallway', 'Washing machine drains slowly', 'Boiler pressure keeps dropping', 'Dripping shower tap'][index]!}
              category={(['electrical', 'appliances', 'heating', 'plumbing'] as const)[index]!}
              priority={(['urgent', 'medium', 'high', 'low'] as const)[index]}
              stage={stage}
              stages={{
                reported: { date: '2 Sep', actor: 'You' },
                acknowledged: { date: '3 Sep', actor: 'Landlord' },
                scheduled: { date: '5 Sep', actor: 'Technician' },
                resolved: { date: '5 Sep' },
              }}
            />
          </View>
        ))}
      </View>
    </Page>
  ),
};

/** Payments with columns (wide) and stacked (narrow), and the empty state. */
export const Payments: Story = {
  render: () => (
    <Page width={1280}>
      <RentPaymentList paidThisYear="€9,800" outstanding="€0" payments={PAYMENTS} />
      <View style={{ width: 375 }}>
        <RentPaymentList paidThisYear="€9,800" outstanding="€550" outstandingTone="error" payments={PAYMENTS} />
      </View>
      <View style={{ width: 375 }}>
        <RentPaymentList title="Rent payments" payments={[]} />
      </View>
    </Page>
  ),
};

/** Documents wide and narrow. */
export const Documents: Story = {
  render: () => (
    <Page width={1280}>
      <View style={{ width: 720 }}>
        <DocumentList documents={DOCUMENTS} />
      </View>
      <View style={{ width: 375 }}>
        <DocumentList documents={DOCUMENTS} />
      </View>
    </Page>
  ),
};

function TimelineDemo() {
  const [compact, setCompact] = useState(false);
  return (
    <View style={{ width: 420, gap: 16 }}>
      <Button variant="secondary" size="small" onPress={() => setCompact((c) => !c)}>
        {compact ? 'Comfortable' : 'Compact'}
      </Button>
      <TenancyTimeline
        density={compact ? 'compact' : 'comfortable'}
        events={LEASE_TIMELINE}
        accessibilityLabel="Tenancy history"
      />
    </View>
  );
}

/** The generic timeline, comfortable (icons) and compact. */
export const Timeline: Story = {
  render: () => (
    <Page width={900}>
      <TimelineDemo />
    </Page>
  ),
};

export const TimelineDark: Story = {
  name: 'Timeline, dark',
  globals: { theme: 'dark' },
  render: () => (
    <Page width={900}>
      <TimelineDemo />
    </Page>
  ),
};
