import React, { useState } from 'react';
import { View } from 'react-native';

import { alert, confirm, prompt } from '../../src/surfaces';
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
  const [requests, setRequests] = useState(MAINTENANCE);
  const [payments, setPayments] = useState(PAYMENTS);
  const [paid, setPaid] = useState(false);
  const addRepair = async () => {
    const title = await prompt({
      title: 'Report a repair',
      placeholder: 'What needs fixing?',
      confirmLabel: 'Add request',
    });
    if (title?.trim())
      setRequests((all) => [
        {
          title: title.trim(),
          category: 'other',
          reference: `#${Date.now()}`,
          stage: 'reported',
          commentCount: 0,
        },
        ...all,
      ]);
  };
  const payRent = async () => {
    if (
      await confirm({
        title: 'Record a demo payment?',
        description: 'Mark the outstanding €450 as paid in this preview. No money is transferred.',
        confirmLabel: 'Record payment',
      })
    ) {
      setPaid(true);
      setPayments((all) =>
        all.map((payment) =>
          payment.status === 'partial'
            ? { ...payment, amount: '€950', status: 'paid', statusLabel: 'Paid' }
            : payment,
        ),
      );
    }
  };

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
          <Button leadingIcon={RiToolsLine} onPress={addRepair} tone="accent" appearance="solid">
            Report a repair
          </Button>
        </View>
        <LeaseSummaryCard
          {...LEASE}
          actions={
            <>
              <Button onPress={payRent} disabled={paid} tone="accent" appearance="solid">
                Pay rent
              </Button>
              <Button
                leadingIcon={RiChat3Line}
                onPress={async () => {
                  const message = await prompt({
                    title: 'Message landlord',
                    confirmLabel: 'Save draft',
                  });
                  if (message?.trim()) void alert('Message draft', message.trim());
                }}
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
          payments={payments}
          paidThisYear={paid ? '€8,000' : '€7,550'}
          outstanding={paid ? '€0' : '€450'}
          outstandingTone={paid ? 'default' : 'error'}
          testID="housing-payments"
        />

        <SectionTitle
          action={
            <Button onPress={addRepair} tone="neutral" appearance="outline">
              New request
            </Button>
          }
        >
          Repairs
        </SectionTitle>
        {requests.map((request) => (
          <MaintenanceRequestCard
            key={request.reference}
            {...request}
            onPressComments={async () => {
              const comment = await prompt({
                title: `Comment on ${request.title}`,
                confirmLabel: 'Add comment',
              });
              if (comment?.trim()) {
                setRequests((all) =>
                  all.map((item) =>
                    item.reference === request.reference
                      ? { ...item, commentCount: (item.commentCount ?? 0) + 1 }
                      : item,
                  ),
                );
                void alert('Comment added', comment.trim());
              }
            }}
          />
        ))}

        <SectionTitle>Documents</SectionTitle>
        <DocumentList
          documents={DOCUMENTS.map((d) => ({
            ...d,
            onView: () => alert(d.name, [d.date, d.size, d.status].filter(Boolean).join(' · ')),
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
