import React, { memo } from 'react';
import { View } from 'react-native';

import { Badge } from '../badge';
import { Button } from '../button';
import { RiDownload2Line } from '../icons/remix';
import { useContainerWidth } from '../hooks/use-container-width';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { RENT_PAYMENT_LIST_WIDE_MIN_WIDTH, RENT_PAYMENT_STATUS } from './constants';
import { FigureLabel, HousingCard, useHousingPalette } from './parts';
import type { RentPayment, RentPaymentListProps } from './types';

/**
 * A tenancy's rent payments, newest first, with the year's totals on top.
 *
 *   card       the housing card, unpadded; rows run edge to edge
 *   summary    padding 20: optional `title` headline-semibold, then "Paid this
 *              year" and "Outstanding" figures (caption label over
 *              title-3-semibold, tabular) side by side, 32 apart; outstanding in
 *              the error text colour with `outstandingTone="error"`
 *   header     wide only: caption-1-medium column labels, text-secondary
 *   row        min height 56, padding 12 / 20, hairline above.
 *              wide (from 640): month body-medium | due date | method
 *              (body-2-regular, secondary) | amount body-medium tabular, right |
 *              status Badge | receipt button (a 32 secondary icon button, or a
 *              32 spacer so the columns stay aligned)
 *              narrow: month body-medium over "Due 1 Mar · Bank transfer"
 *              caption; amount over the Badge on the right; receipt button
 *
 * Each row is a `listitem` of a `list`. The receipt button is named
 * "Download receipt for March 2026" — a bare download glyph names nothing.
 */

const RECEIPT_WIDTH = 32;

function RentPaymentListComponent({
  payments,
  title,
  paidThisYear,
  paidThisYearLabel = 'Paid this year',
  outstanding,
  outstandingLabel = 'Outstanding',
  outstandingTone = 'default',
  statusLabels,
  receiptLabel = (payment: RentPayment) => `Download receipt for ${payment.month}`,
  columnLabels,
  formatDueDate = (dueDate: string) => `Due ${dueDate}`,
  emptyLabel = 'No payments yet',
  layout = 'auto',
  style,
  testID,
}: RentPaymentListProps) {
  const theme = useTheme();
  const palette = useHousingPalette();
  const { width, onLayout } = useContainerWidth();
  const wide =
    layout === 'wide' || (layout === 'auto' && width != null && width >= RENT_PAYMENT_LIST_WIDE_MIN_WIDTH);
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const columns = {
    month: 'Month',
    dueDate: 'Due date',
    method: 'Method',
    amount: 'Amount',
    status: 'Status',
    ...columnLabels,
  };
  const outstandingColor =
    outstandingTone === 'error'
      ? resolveAccentColors(theme.colors, 'error', 'outlined').foreground
      : palette.text;
  const hasSummary = title != null || paidThisYear != null || outstanding != null;
  const hasReceipts = payments.some((p) => p.onDownloadReceipt);

  const receipt = (payment: RentPayment, index: number) =>
    payment.onDownloadReceipt ? (
      <Button
        variant="secondary"
        size="small"
        iconOnly
        leadingIcon={RiDownload2Line}
        accessibilityLabel={receiptLabel(payment)}
        onPress={payment.onDownloadReceipt}
        testID={id(`receipt-${index}`)}
      />
    ) : hasReceipts ? (
      <View style={{ width: RECEIPT_WIDTH }} />
    ) : null;

  const badge = (payment: RentPayment, index: number) => {
    const info = RENT_PAYMENT_STATUS[payment.status];
    return (
      <Badge
        content={payment.statusLabel ?? statusLabels?.[payment.status] ?? info.label}
        color={info.tone}
        variant="subtle"
        size="medium"
        testID={id(`status-${index}`)}
      />
    );
  };

  const secondary = { color: palette.textSecondary };

  return (
    <HousingCard padded={false} style={style} testID={testID}>
      <View onLayout={onLayout}>
        {hasSummary ? (
          <View style={{ paddingTop: 20, paddingBottom: 20, paddingLeft: 20, paddingRight: 20, gap: 12 }}>
            {title ? (
              <Text role="heading" aria-level={3} variant="headline-semibold" style={{ color: palette.text }}>
                {title}
              </Text>
            ) : null}
            {paidThisYear != null || outstanding != null ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 32, rowGap: 12 }}>
                {paidThisYear != null ? (
                  <View style={{ gap: 2 }} testID={id('paid')}>
                    <FigureLabel>{paidThisYearLabel}</FigureLabel>
                    <Text variant="title-3-semibold" style={{ color: palette.text, fontVariant: ['tabular-nums'] }}>
                      {paidThisYear}
                    </Text>
                  </View>
                ) : null}
                {outstanding != null ? (
                  <View style={{ gap: 2 }} testID={id('outstanding')}>
                    <FigureLabel>{outstandingLabel}</FigureLabel>
                    <Text
                      variant="title-3-semibold"
                      style={{ color: outstandingColor, fontVariant: ['tabular-nums'] }}
                      testID={id('outstanding-value')}
                    >
                      {outstanding}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {wide && payments.length > 0 ? (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            aria-hidden
            testID={id('columns')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: 20,
              paddingRight: hasReceipts ? 12 : 20,
              borderTopWidth: hasSummary ? 1 : 0,
              borderTopColor: palette.hairline,
            }}
          >
            <Text variant="caption-1-medium" style={[secondary, { flex: 1.4 }]}>{columns.month}</Text>
            <Text variant="caption-1-medium" style={[secondary, { flex: 1 }]}>{columns.dueDate}</Text>
            <Text variant="caption-1-medium" style={[secondary, { flex: 1.2 }]}>{columns.method}</Text>
            <Text variant="caption-1-medium" style={[secondary, { flex: 1, textAlign: 'right' }]}>
              {columns.amount}
            </Text>
            <Text variant="caption-1-medium" style={[secondary, { width: 96 }]}>{columns.status}</Text>
            {hasReceipts ? <View style={{ width: RECEIPT_WIDTH }} /> : null}
          </View>
        ) : null}

        {payments.length === 0 ? (
          <View
            style={{
              paddingTop: 24,
              paddingBottom: 24,
              paddingLeft: 20,
              paddingRight: 20,
              borderTopWidth: hasSummary ? 1 : 0,
              borderTopColor: palette.hairline,
            }}
          >
            <Text variant="body-regular" style={secondary} testID={id('empty')}>
              {emptyLabel}
            </Text>
          </View>
        ) : (
          <View role="list">
            {payments.map((payment, index) => {
              const rowStyle = {
                flexDirection: 'row' as const,
                alignItems: 'center' as const,
                gap: wide ? 16 : 12,
                minHeight: 56,
                paddingTop: 12,
                paddingBottom: 12,
                paddingLeft: 20,
                paddingRight: hasReceipts ? 12 : 20,
                borderTopWidth: index === 0 && !hasSummary && !wide ? 0 : 1,
                borderTopColor: palette.hairline,
              };
              return wide ? (
                <View key={payment.id} role="listitem" style={rowStyle} testID={id(`row-${index}`)}>
                  <Text variant="body-medium" numberOfLines={1} style={{ flex: 1.4, color: palette.text }}>
                    {payment.month}
                  </Text>
                  <Text variant="body-2-regular" numberOfLines={1} style={[secondary, { flex: 1 }]}>
                    {payment.dueDate}
                  </Text>
                  <Text variant="body-2-regular" numberOfLines={1} style={[secondary, { flex: 1.2 }]}>
                    {payment.method ?? ''}
                  </Text>
                  <Text
                    variant="body-medium"
                    numberOfLines={1}
                    style={{ flex: 1, color: palette.text, textAlign: 'right', fontVariant: ['tabular-nums'] }}
                  >
                    {payment.amount}
                  </Text>
                  <View style={{ width: 96, alignItems: 'flex-start' }}>{badge(payment, index)}</View>
                  {receipt(payment, index)}
                </View>
              ) : (
                <View key={payment.id} role="listitem" style={rowStyle} testID={id(`row-${index}`)}>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
                      {payment.month}
                    </Text>
                    <Text variant="caption-1-regular" numberOfLines={1} style={secondary}>
                      {[formatDueDate(payment.dueDate), payment.method].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text variant="body-medium" style={{ color: palette.text, fontVariant: ['tabular-nums'] }}>
                      {payment.amount}
                    </Text>
                    {badge(payment, index)}
                  </View>
                  {receipt(payment, index)}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </HousingCard>
  );
}

export const RentPaymentList = memo(RentPaymentListComponent);
RentPaymentList.displayName = 'RentPaymentList';
