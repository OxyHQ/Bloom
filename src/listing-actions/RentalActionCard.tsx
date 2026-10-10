import React, { memo } from 'react';
import { View } from 'react-native';

import { ActionCardHeader, ActionCardNote, ActionCardShell } from '../booking/ActionCard';
import { Badge } from '../badge';
import { Button } from '../button';
import { useMessages } from '../locale/messages';
import { RENTAL_STATUS } from './constants';
import { LISTING_ACTIONS_MESSAGES } from './messages';
import { FactList, StatusMessage } from './parts';
import type { RentalActionCardProps } from './types';

/**
 * The long-term rental card beside a listing — `BookingCard`'s chrome with a
 * monthly price, the terms and the two steps of renting.
 *
 *   card       the shared action-card shell: up to 372, radius 16, 1px hairline,
 *              shadow-m, padding 24
 *   header     price title-3-semibold + "/ month" body-regular; `billsNote`
 *              body-2-regular text-secondary under it; a subtle status `Badge`
 *              on the right while reserved or rented
 *   facts      20 below; label / value rows in a radius-12 box
 *   status     16 below, while not available: an information tile
 *   buttons    16 below; "Request a viewing" primary large, "Apply"
 *              secondary large under it (8 apart), both full width, both
 *              disabled while not available
 *   note       12 below; body-2-regular text-secondary, centred; hidden while
 *              not available (the status tile replaces it)
 */
function RentalActionCardComponent({
  price,
  originalPrice,
  priceUnit: priceUnitProp,
  priceUnitPrefix = '/',
  priceAccessibilityLabel,
  billsNote,
  facts,
  status = 'available',
  statusLabel,
  statusMessage,
  requestViewingLabel: requestViewingLabelProp,
  onRequestViewing,
  applyLabel: applyLabelProp,
  onApply,
  loading = false,
  note,
  footer,
  style,
  testID,
}: RentalActionCardProps) {
  const { messages } = useMessages(LISTING_ACTIONS_MESSAGES);
  const priceUnit = priceUnitProp === undefined ? messages.month : priceUnitProp;
  const requestViewingLabel = requestViewingLabelProp ?? messages.requestViewing;
  const applyLabel = applyLabelProp ?? messages.apply;
  const info = RENTAL_STATUS[status];
  const available = status === 'available';
  const message =
    statusMessage ?? (status === 'available' ? info.message : messages.rentalStatusMessage[status]);
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  return (
    <ActionCardShell testID={testID} style={style}>
      <ActionCardHeader
        price={price}
        originalPrice={originalPrice}
        priceUnit={priceUnit}
        priceUnitPrefix={priceUnitPrefix}
        priceAccessibilityLabel={priceAccessibilityLabel}
        below={billsNote}
        testID={id('price')}
        trailing={
          available ? null : (
            <Badge
              variant="subtle"
              color={info.tone}
              size="large"
              content={statusLabel ?? messages.rentalStatus[status]}
              testID={id('status')}
            />
          )
        }
      />

      {facts && facts.length > 0 ? (
        <FactList facts={facts} style={{ marginTop: 20 }} testID={id('facts')} />
      ) : null}

      {!available && message ? (
        <StatusMessage style={{ marginTop: 16 }} testID={id('status-message')}>
          {message}
        </StatusMessage>
      ) : null}

      <View style={{ marginTop: 16, gap: 8 }}>
        <Button
          size="lg"
          fullWidth
          onPress={onRequestViewing}
          disabled={!available}
          loading={loading}
          testID={id('request-viewing')}
          tone="accent"
          appearance="solid"
        >
          {requestViewingLabel}
        </Button>
        {onApply ? (
          <Button
            size="lg"
            fullWidth
            onPress={onApply}
            disabled={!available}
            testID={id('apply')}
            tone="neutral"
            appearance="outline"
          >
            {applyLabel}
          </Button>
        ) : null}
      </View>

      {available && note != null ? (
        <ActionCardNote style={{ marginTop: 12 }}>{note}</ActionCardNote>
      ) : null}

      {footer != null ? (
        <View style={{ marginTop: 24, alignItems: 'center' }}>{footer}</View>
      ) : null}
    </ActionCardShell>
  );
}

export const RentalActionCard = memo(RentalActionCardComponent);
RentalActionCard.displayName = 'RentalActionCard';
