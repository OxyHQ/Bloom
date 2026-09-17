import React, { memo } from 'react';
import { View } from 'react-native';

import { Avatar } from '../avatar';
import { Badge } from '../badge';
import { useContainerWidth } from '../listing-details/use-container-width';
import { Text } from '../typography';
import { LEASE_CARD_WIDE_MIN_WIDTH, LEASE_PAYMENT_STATUS } from './constants';
import { FigureLabel, HousingCard, ProgressTrack, useHousingPalette } from './parts';
import type { LeaseSummaryCardProps } from './types';

/**
 * A rental at a glance, for the tenant or the landlord.
 *
 *   card       the housing card (radius 20, hairline, surface, padding 20)
 *   heading    the address title-3-semibold (a `heading` on web), the unit
 *              line body-2-regular text-secondary
 *   parties    avatar 32 + name body-2-medium over role caption-1-regular,
 *              wrapping, 20 apart
 *   period     "Lease period" caption, "start – end" body-medium, a 6px
 *              progress bar (the ELAPSED share) and the remaining label
 *              caption-1-medium on the right
 *   figures    rent, deposit and next payment: one row of three from 520 wide
 *              (hairlines between), a stacked list below; the next payment
 *              draws its amount, date and a subtle status `Badge`
 *   actions    under a hairline, 8 apart
 *
 * Nothing here reads the clock: the dates, "8 months left", the elapsed share
 * and "Due in 5 days" are all props the app computes.
 */
function LeaseSummaryCardComponent({
  title,
  subtitle,
  headingLevel = 3,
  parties,
  startDate,
  endDate,
  periodLabel = 'Lease period',
  remainingLabel,
  progress,
  rent,
  rentLabel = 'Monthly rent',
  deposit,
  depositLabel = 'Deposit',
  nextPayment,
  nextPaymentLabel = 'Next payment',
  actions,
  layout = 'auto',
  style,
  testID,
}: LeaseSummaryCardProps) {
  const palette = useHousingPalette();
  const { width, onLayout } = useContainerWidth();
  const wide = layout === 'wide' || (layout === 'auto' && width != null && width >= LEASE_CARD_WIDE_MIN_WIDTH);
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  const period = `${startDate} – ${endDate}`;
  const payment = nextPayment ? LEASE_PAYMENT_STATUS[nextPayment.status] : null;
  const paymentStatus = nextPayment ? nextPayment.statusLabel ?? payment?.label : undefined;

  const figures: { key: string; label: string; body: React.ReactNode }[] = [
    {
      key: 'rent',
      label: rentLabel,
      body: (
        <Text variant="title-3-semibold" style={{ color: palette.text, fontVariant: ['tabular-nums'] }}>
          {rent}
        </Text>
      ),
    },
  ];
  if (deposit) {
    figures.push({
      key: 'deposit',
      label: depositLabel,
      body: (
        <Text variant="title-3-semibold" style={{ color: palette.text, fontVariant: ['tabular-nums'] }}>
          {deposit}
        </Text>
      ),
    });
  }
  if (nextPayment && payment) {
    figures.push({
      key: 'next-payment',
      label: nextPaymentLabel,
      body: (
        <View style={{ gap: 6, alignItems: 'flex-start' }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 6 }}>
            <Text variant="title-3-semibold" style={{ color: palette.text, fontVariant: ['tabular-nums'] }}>
              {nextPayment.amount ?? rent}
            </Text>
            <Text variant="body-2-regular" style={{ color: palette.textSecondary }}>
              {nextPayment.date}
            </Text>
          </View>
          {paymentStatus ? (
            <Badge
              content={paymentStatus}
              color={payment.tone}
              variant="subtle"
              size="medium"
              testID={id('payment-status')}
            />
          ) : null}
        </View>
      ),
    });
  }

  return (
    <HousingCard style={[{ gap: 20 }, style]} testID={testID}>
      <View onLayout={onLayout} style={{ gap: 20 }}>
        <View style={{ gap: 2 }}>
          <Text
            variant="title-3-semibold"
            role="heading"
            aria-level={headingLevel}
            style={{ color: palette.text }}
            testID={id('title')}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text variant="body-2-regular" style={{ color: palette.textSecondary }}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {parties && parties.length > 0 ? (
          <View
            role="list"
            testID={id('parties')}
            style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 20, rowGap: 12 }}
          >
            {parties.map((party, index) => (
              <View
                key={`${party.name}-${index}`}
                role="listitem"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <Avatar source={party.avatar} name={party.name} size={32} variant="thumb" />
                <View>
                  <Text variant="body-2-medium" numberOfLines={1} style={{ color: palette.text }}>
                    {party.name}
                  </Text>
                  <Text variant="caption-1-regular" numberOfLines={1} style={{ color: palette.textSecondary }}>
                    {party.role}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ gap: 8 }} testID={id('period')}>
          <View style={{ gap: 2 }}>
            <FigureLabel>{periodLabel}</FigureLabel>
            <Text variant="body-medium" style={{ color: palette.text }}>
              {period}
            </Text>
          </View>
          {progress != null ? (
            <ProgressTrack
              value={progress}
              accessibilityLabel={periodLabel}
              valueText={remainingLabel}
              testID={id('progress')}
            />
          ) : null}
          {remainingLabel ? (
            <Text
              variant="caption-1-medium"
              style={{ color: palette.textSecondary, alignSelf: 'flex-end' }}
              testID={id('remaining')}
            >
              {remainingLabel}
            </Text>
          ) : null}
        </View>

        <View
          testID={id('figures')}
          style={
            wide
              ? {
                  flexDirection: 'row',
                  borderTopWidth: 1,
                  borderTopColor: palette.hairline,
                  paddingTop: 16,
                }
              : { flexDirection: 'column', borderTopWidth: 1, borderTopColor: palette.hairline }
          }
        >
          {figures.map((figure, index) => (
            <View
              key={figure.key}
              testID={id(`figure-${figure.key}`)}
              style={
                wide
                  ? {
                      flex: 1,
                      minWidth: 0,
                      gap: 4,
                      paddingLeft: index === 0 ? 0 : 16,
                      paddingRight: 16,
                      borderLeftWidth: index === 0 ? 0 : 1,
                      borderLeftColor: palette.hairline,
                    }
                  : {
                      gap: 4,
                      paddingTop: 12,
                      paddingBottom: 12,
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderTopColor: palette.hairline,
                    }
              }
            >
              <FigureLabel>{figure.label}</FigureLabel>
              {figure.body}
            </View>
          ))}
        </View>
      </View>

      {actions != null ? (
        <View
          testID={id('actions')}
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            paddingTop: 16,
            marginTop: -4,
            borderTopWidth: 1,
            borderTopColor: palette.hairline,
          }}
        >
          {actions}
        </View>
      ) : null}
    </HousingCard>
  );
}

export const LeaseSummaryCard = memo(LeaseSummaryCardComponent);
LeaseSummaryCard.displayName = 'LeaseSummaryCard';
