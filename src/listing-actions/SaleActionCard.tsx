import React, { memo } from 'react';
import { View } from 'react-native';

import { ActionCardHeader, ActionCardNote, ActionCardShell } from '../booking/ActionCard';
import { BookingLink } from '../booking/BookingLink';
import { Badge } from '../badge';
import { Button } from '../button';
import { RiCalculatorLine } from '../icons/remix/RiCalculatorLine';
import { Text } from '../typography';
import { SALE_STATUS } from './constants';
import { FactList, StatusMessage, useActionPalette } from './parts';
import type { SaleActionCardProps } from './types';

/**
 * The home-for-sale card beside a listing.
 *
 *   header     price title-3-semibold; `pricePerArea` body-2-regular
 *              text-secondary under it; a subtle status `Badge` on the right
 *              while reserved or sold
 *   mortgage   8 below; a calculator glyph and the estimate, underlined — a
 *              button with `onPressMortgage` (open the `MortgageCalculator`)
 *   facts      20 below; label / value rows
 *   status     16 below, while not available: an information tile
 *   buttons    16 below; "Contact agent" primary large, "Request a visit"
 *              secondary large, full width, 8 apart; disabled while not
 *              available
 *   offer      12 below, centred; "Make an offer" link — hidden while not
 *              available
 *   note       12 below; body-2-regular text-secondary, centred
 */
function SaleActionCardComponent({
  price,
  originalPrice,
  priceUnit,
  priceUnitPrefix,
  priceAccessibilityLabel,
  pricePerArea,
  mortgageEstimate,
  onPressMortgage,
  facts,
  status = 'available',
  statusLabel,
  statusMessage,
  contactLabel = 'Contact agent',
  onContact,
  requestVisitLabel = 'Request a visit',
  onRequestVisit,
  makeOfferLabel = 'Make an offer',
  onMakeOffer,
  loading = false,
  note,
  footer,
  style,
  testID,
}: SaleActionCardProps) {
  const palette = useActionPalette();
  const info = SALE_STATUS[status];
  const available = status === 'available';
  const message = statusMessage ?? info.message;
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  return (
    <ActionCardShell testID={testID} style={style}>
      <ActionCardHeader
        price={price}
        originalPrice={originalPrice}
        priceUnit={priceUnit}
        priceUnitPrefix={priceUnitPrefix}
        priceAccessibilityLabel={priceAccessibilityLabel}
        below={pricePerArea}
        testID={id('price')}
        trailing={
          available ? null : (
            <Badge variant="subtle" color={info.tone} size="large" content={statusLabel ?? info.label} testID={id('status')} />
          )
        }
      />

      {mortgageEstimate ? (
        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <RiCalculatorLine width={16} height={16} fill={palette.textSecondary} />
          {onPressMortgage ? (
            <BookingLink variant="body-2-medium" onPress={onPressMortgage} testID={id('mortgage')}>
              {mortgageEstimate}
            </BookingLink>
          ) : (
            <Text variant="body-2-medium" style={{ color: palette.text }} testID={id('mortgage')}>
              {mortgageEstimate}
            </Text>
          )}
        </View>
      ) : null}

      {facts && facts.length > 0 ? <FactList facts={facts} style={{ marginTop: 20 }} testID={id('facts')} /> : null}

      {!available && message ? (
        <StatusMessage style={{ marginTop: 16 }} testID={id('status-message')}>
          {message}
        </StatusMessage>
      ) : null}

      <View style={{ marginTop: 16, gap: 8 }}>
        <Button
          variant="primary"
          size="large"
          fullWidth
          onPress={onContact}
          disabled={!available}
          loading={loading}
          testID={id('contact')}
        >
          {contactLabel}
        </Button>
        {onRequestVisit ? (
          <Button
            variant="secondary"
            size="large"
            fullWidth
            onPress={onRequestVisit}
            disabled={!available}
            testID={id('request-visit')}
          >
            {requestVisitLabel}
          </Button>
        ) : null}
      </View>

      {available && onMakeOffer ? (
        <View style={{ marginTop: 12, alignItems: 'center' }}>
          <BookingLink variant="body-2-medium" onPress={onMakeOffer} style={{ alignSelf: 'center' }} testID={id('make-offer')}>
            {makeOfferLabel}
          </BookingLink>
        </View>
      ) : null}

      {note != null ? <ActionCardNote style={{ marginTop: 12 }}>{note}</ActionCardNote> : null}

      {footer != null ? <View style={{ marginTop: 24, alignItems: 'center' }}>{footer}</View> : null}
    </ActionCardShell>
  );
}

export const SaleActionCard = memo(SaleActionCardComponent);
SaleActionCard.displayName = 'SaleActionCard';
