import React, { useState } from 'react';
import { View } from 'react-native';

import { AppShell } from '../../src/app-shell';
import { Button } from '../../src/button';
import {
  RiAlarmWarningLine,
  RiBankCardLine,
  RiBookmarkLine,
  RiChat3Line,
  RiCompass3Line,
  RiFileTextLine,
  RiHome4Line,
  RiListCheck3,
  RiMegaphoneLine,
  RiToolsLine,
} from '../../src/icons/remix';
import { ApplicationChecklist } from '../../src/listing-actions';
import type { SidebarNavItem } from '../../src/sidebar';
import { DocumentList, LeaseSummaryCard, MaintenanceRequestCard, RentPaymentList, TenancyTimeline } from '../../src/tenancy';
import { useTheme } from '../../src/theme/use-theme';
import { Text } from '../../src/typography';
import { TEMPLATE_FRAME } from '../shared/dashboard';
import { APPLICATION, DOCUMENTS, LEASE, MAINTENANCE, PAYMENTS, PEOPLE, TENANCY_EVENTS } from './data';
import { HousingMark, useHousingLayout, useHousingNav } from './HousingHeader';

const noop = () => undefined;

function SectionTitle({ children, action }: { children: string; action?: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16 }}>
      <Text role="heading" aria-level={2} variant="title-3-semibold" style={{ color: theme.colors.text }}>
        {children}
      </Text>
      {action}
    </View>
  );
}

/**
 * The tenant's area: the lease, rent payments, repair requests, documents and
 * the checklist of a new application, inside `AppShell` with the housing
 * sidebar. From `xl` the tenancy timeline sits in the aside column.
 */
export function MyHomePage() {
  const go = useHousingNav();
  const { md } = useHousingLayout();
  const [selected, setSelected] = useState('home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [application, setApplication] = useState(APPLICATION);

  const items: SidebarNavItem[] = [
    { key: 'home', label: 'My home', icon: RiHome4Line },
    { key: 'payments', label: 'Payments', icon: RiBankCardLine },
    { key: 'repairs', label: 'Repairs', icon: RiToolsLine, badge: 1 },
    { key: 'documents', label: 'Documents', icon: RiFileTextLine, badge: 1 },
    { key: 'application', label: 'Applications', icon: RiListCheck3 },
    { key: 'messages', label: 'Messages', icon: RiChat3Line, badge: 3 },
  ];
  const secondaryItems: SidebarNavItem[] = [
    { key: 'explore', label: 'Explore homes', icon: RiCompass3Line, onPress: () => go('explore') },
    { key: 'saved', label: 'Saved', icon: RiBookmarkLine, onPress: () => go('saved') },
    { key: 'evictions', label: 'Evictions', icon: RiAlarmWarningLine, onPress: () => go('evictions') },
    { key: 'publish', label: 'List your home', icon: RiMegaphoneLine, onPress: () => go('publish') },
  ];

  return (
    <View style={TEMPLATE_FRAME}>
      <AppShell
        testID="housing-my-home"
        drawer="reveal"
        drawerOpen={drawerOpen}
        onDrawerOpenChange={setDrawerOpen}
        sidebar={{
          logo: { icon: <HousingMark size={28} />, wordmark: 'Homes', onPress: () => go('explore') },
          items,
          secondaryItems,
          selected,
          onNavigate: (item) => setSelected(item.key),
          account: { name: PEOPLE.you.name, avatar: { source: PEOPLE.you.avatar } },
        }}
        title="My home"
        actions={
          <Button variant="primary" size="small" leadingIcon={RiToolsLine} onPress={noop}>
            Report a repair
          </Button>
        }
        aside={
          <View style={{ gap: 16, paddingTop: 8 }}>
            <SectionTitle>Tenancy</SectionTitle>
            <TenancyTimeline events={TENANCY_EVENTS} density="compact" accessibilityLabel="Tenancy timeline" />
          </View>
        }
        asideCollapse="hidden"
        contentMaxWidth={960}
      >
        <View style={{ gap: 16, paddingLeft: md ? 12 : 0, paddingRight: md ? 12 : 0, paddingBottom: 48 }}>
          <LeaseSummaryCard
            {...LEASE}
            actions={
              <>
                <Button variant="primary" size="small" onPress={noop}>
                  Pay rent
                </Button>
                <Button variant="secondary" size="small" leadingIcon={RiChat3Line} onPress={noop}>
                  Message landlord
                </Button>
              </>
            }
            testID="housing-lease"
          />

          <SectionTitle>Rent payments</SectionTitle>
          <RentPaymentList
            payments={PAYMENTS.map((p) => (p.status === 'paid' || p.status === 'partial' ? { ...p, onDownloadReceipt: noop } : p))}
            paidThisYear="€7,550"
            outstanding="€450"
            outstandingTone="error"
            testID="housing-payments"
          />

          <SectionTitle action={<Button variant="secondary" size="small" onPress={noop}>New request</Button>}>Repairs</SectionTitle>
          {MAINTENANCE.map((request) => (
            <MaintenanceRequestCard key={request.reference} {...request} onPressComments={noop} onPressPhoto={noop} />
          ))}

          <SectionTitle>Documents</SectionTitle>
          <DocumentList
            documents={DOCUMENTS.map((d) => ({
              ...d,
              onView: noop,
              onDownload: d.status === 'pending' ? undefined : noop,
              onSign: d.status === 'pending' ? noop : undefined,
            }))}
            testID="housing-documents"
          />

          <SectionTitle>Your next application</SectionTitle>
          <ApplicationChecklist
            title="Canal-side two-bed, Heron Quay"
            items={application.map((item) => ({
              ...item,
              onAction: () =>
                setApplication((list) => list.map((i) => (i.key === item.key && i.status !== 'verified' ? { ...i, status: 'uploaded', reason: undefined } : i))),
            }))}
            maxWidth={null}
            testID="housing-application"
          />
        </View>
      </AppShell>
    </View>
  );
}
