import React, { useState } from 'react';
import { View } from 'react-native';

import { Button } from '../../src/button';
import { RiChat3Line, RiToolsLine } from '../../src/icons/remix';
import { ApplicationChecklist } from '../../src/listing-actions';
import {
  DocumentList,
  LeaseSummaryCard,
  MaintenanceRequestCard,
  RentPaymentList,
  TenancyTimeline,
} from '../../src/tenancy';
import { useTheme } from '../../src/theme/use-theme';
import { Text } from '../../src/typography';
import { APPLICATION, DOCUMENTS, LEASE, MAINTENANCE, PAYMENTS, TENANCY_EVENTS } from './data';
import { HousingFrame, HousingHeader, PageColumn } from './HousingHeader';

const noop = () => undefined;

function SectionTitle({ children, action }: { children: string; action?: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 16,
      }}
    >
      <Text
        role="heading"
        aria-level={2}
        variant="title-3-semibold"
        style={{ color: theme.colors.text }}
      >
        {children}
      </Text>
      {action}
    </View>
  );
}

/** The tenant's lease, payments, repairs, documents and timeline in one reading panel. */
export function MyHomePage() {
  const [application, setApplication] = useState(APPLICATION);

  return (
    <HousingFrame testID="housing-my-home">
      <HousingHeader />
      <PageColumn maxWidth={960} style={{ gap: 16, paddingTop: 24, paddingBottom: 48 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <Text role="heading" aria-level={1} variant="title-1-semibold">
            My home
          </Text>
          <Button
            size="sm"
            leadingIcon={RiToolsLine}
            onPress={noop}
            tone="accent"
            appearance="solid"
          >
            Report a repair
          </Button>
        </View>
        <LeaseSummaryCard
          {...LEASE}
          actions={
            <>
              <Button size="sm" onPress={noop} tone="accent" appearance="solid">
                Pay rent
              </Button>
              <Button
                size="sm"
                leadingIcon={RiChat3Line}
                onPress={noop}
                tone="neutral"
                appearance="outline"
              >
                Message landlord
              </Button>
            </>
          }
          testID="housing-lease"
        />

        <SectionTitle>Rent payments</SectionTitle>
        <RentPaymentList
          payments={PAYMENTS.map((p) =>
            p.status === 'paid' || p.status === 'partial' ? { ...p, onDownloadReceipt: noop } : p,
          )}
          paidThisYear="€7,550"
          outstanding="€450"
          outstandingTone="error"
          testID="housing-payments"
        />

        <SectionTitle
          action={
            <Button size="sm" onPress={noop} tone="neutral" appearance="outline">
              New request
            </Button>
          }
        >
          Repairs
        </SectionTitle>
        {MAINTENANCE.map((request) => (
          <MaintenanceRequestCard
            key={request.reference}
            {...request}
            onPressComments={noop}
            onPressPhoto={noop}
          />
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
              setApplication((list) =>
                list.map((i) =>
                  i.key === item.key && i.status !== 'verified'
                    ? { ...i, status: 'uploaded', reason: undefined }
                    : i,
                ),
              ),
          }))}
          maxWidth={null}
          testID="housing-application"
        />
        <SectionTitle>Tenancy</SectionTitle>
        <TenancyTimeline
          events={TENANCY_EVENTS}
          density="compact"
          accessibilityLabel="Tenancy timeline"
        />
      </PageColumn>
    </HousingFrame>
  );
}
