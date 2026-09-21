import React, { memo, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View, type TextStyle } from 'react-native';

import { Avatar } from '../avatar';
import { Badge } from '../badge';
import { Button } from '../button';
import { Card } from '../card';
import { useContainerWidth } from '../hooks/use-container-width';
import { RiChat3Line } from '../icons/remix/RiChat3Line';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiMapPin2Line } from '../icons/remix/RiMapPin2Line';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import { RiVerifiedBadgeFill } from '../icons/remix/RiVerifiedBadgeFill';
import { PriceSummary } from '../price-breakdown';
import { Rating } from '../rating';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { SurfaceLevelProvider, surfaceFillVars, useSurfaceFill } from '../styles/surface-levels';
import { DISABLED_OPACITY } from '../styles/tokens';
import { webDataSet } from '../styles/web-data';
import type { BloomIconComponent } from '../icons/icon-component';
import type { WebCssStyle } from '../styles/web-view-style';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CARRIER_QUOTE_GEOMETRY, CARRIER_QUOTE_LABELS, CARRIER_QUOTE_MARK_TONE } from './constants';
import {
  CARRIER_QUOTE_STYLE_ID,
  CARRIER_QUOTE_WEB_CSS,
  carrierActionsAreLabelled,
  joinQuoteName,
  orderCarrierMarks,
  resolveCarrierQuotePaint,
  type CarrierQuotePaint,
} from './shared';
import type { CarrierQuoteCardProps } from './types';

/**
 * One carrier's offer on a job.
 *
 * It is a RECORD OF A PERSON with a number attached, so it is drawn in the
 * register Bloom draws a person in — the same blocks in the same order as a
 * contact record, with the price where a record puts its headline figure:
 *
 *   mark      the 48 avatar
 *   identity  the name at `title-3-semibold` with the verified glyph and the
 *             list's marks beside it, then ONE meta line — the rating, the jobs
 *             done, the trade line
 *   headline  the price at `title-1-medium` in tabular figures, right-aligned
 *             against the identity, with `priceNote` under it
 *   tiles     pick-up, arrival, vehicle, as rounded tiles: the value over what
 *             it is. One row on a wide card, two columns on a narrow one
 *   message   what the carrier wrote, three lines then truncated
 *   price     the itemisation, collapsed, through `PriceSummary`
 *   footer    decline, message, accept — over the card's hairline
 *
 *   compact   no surface, no tiles, no breakdown (the list owns all of it): 64
 *             tall, a 36 mark, the name, one meta line, the price at the end.
 *             That density is a LIST ITEM, and a list item that drew tiles
 *             would be a card with the padding taken out.
 *
 * **The card is not one big button.** `onPressCarrier` is bound to the IDENTITY
 * BLOCK and the three actions sit outside it — a control inside a control is
 * invalid on web and ambiguous everywhere, and it renders fine either way.
 *
 * **The actions never lose their names.** Each is a `Button`; each drops to
 * `iconOnly` where the card is too narrow to carry its words, and each is named
 * `"<action> <carrier>"` either way, so losing the label never loses the name.
 *
 * **MONEY ARRIVES FORMATTED.** `price`, `priceNote` and every `priceLines`
 * amount are drawn exactly as given. `priceValue` is a separate NUMBER used for
 * ordering and for the `cheapest` mark, and it is never drawn.
 */

const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };

/** One reading in the tile row: what it is, what it says, and its glyph. */
interface QuoteTile {
  key: string;
  label: string;
  value: string;
  icon?: BloomIconComponent;
}

/** The fill the content lands on, and everything derived from it. */
function useQuotePaint(onCard: boolean): CarrierQuotePaint {
  const theme = useTheme();
  const ambient = useSurfaceFill();
  const surface = onCard ? theme.colors.card : ambient;
  return useMemo(() => resolveCarrierQuotePaint(theme, surface), [theme, surface]);
}

function CarrierQuoteCardComponent({
  quote,
  onAccept,
  onMessage,
  onDecline,
  onPressCarrier,
  breakdown,
  defaultBreakdownExpanded = false,
  density = 'comfortable',
  selected = false,
  disabled = false,
  actions,
  labels: labelOverrides,
  accessibilityLabel,
  style,
  testID,
}: CarrierQuoteCardProps) {
  const theme = useTheme();
  const comfortable = density === 'comfortable';
  const paint = useQuotePaint(comfortable);
  const { width, onLayout } = useContainerWidth();
  const labelled =
    comfortable && carrierActionsAreLabelled(width, CARRIER_QUOTE_GEOMETRY.narrowWidth);
  const labels = useMemo(
    () => ({
      ...CARRIER_QUOTE_LABELS,
      ...labelOverrides,
      marks: { ...CARRIER_QUOTE_LABELS.marks, ...labelOverrides?.marks },
    }),
    [labelOverrides],
  );

  useEffect(() => {
    adoptStyleSheet(CARRIER_QUOTE_STYLE_ID, CARRIER_QUOTE_WEB_CSS);
  }, []);

  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const { carrier } = quote;
  const jobs = carrier.jobs === undefined ? undefined : labels.jobs(String(carrier.jobs));
  const marks = orderCarrierMarks(quote.marks ?? []);
  const warning = resolveAccentColors(theme.colors, 'warning', 'subtle');

  const mark = (
    <Avatar
      size={CARRIER_QUOTE_GEOMETRY.avatar[density]}
      source={carrier.avatar}
      name={carrier.name}
      // The quiet grey disc. The deterministic pastel tints belong to a people
      // LIST, where colour tells two rows apart; on a record card the subject
      // is already named and the tint reads as a status nobody set.
      color="neutral"
      testID={id('avatar')}
    />
  );

  const nameLine = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text
        variant={comfortable ? 'title-3-semibold' : 'body-semibold'}
        numberOfLines={1}
        style={{ flexShrink: 1, color: paint.text }}
        testID={id('name')}
      >
        {carrier.name}
      </Text>
      {carrier.verified ? (
        // The glyph states a fact the NAME already carries (see the join
        // below), so it is hidden rather than announced twice.
        <View aria-hidden style={{ flexShrink: 0 }} testID={id('verified')}>
          <RiVerifiedBadgeFill width={16} height={16} fill={theme.colors.primary} />
        </View>
      ) : null}
    </View>
  );

  // The marks sit on the META line, never beside the name. A pill states a fact
  // in one word and must not shrink; the name beside it is what gives way, and
  // at 390 that left "Maris…" next to a full-width "Cheapest".
  const markPills = marks.map((markName) => (
    <Badge
      key={markName}
      content={labels.marks[markName]}
      variant="subtle"
      color={CARRIER_QUOTE_MARK_TONE[markName]}
      size="label-medium"
      style={{ flexShrink: 0 }}
      testID={id(`mark-${markName}`)}
    />
  ));

  const metaLine =
    markPills.length > 0 ||
    carrier.rating !== undefined ||
    jobs !== undefined ||
    carrier.detail !== undefined ? (
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
        testID={id('meta')}
      >
        {markPills}
        {carrier.rating !== undefined ? (
          <Rating value={carrier.rating} size="small" testID={id('rating')} />
        ) : null}
        {jobs !== undefined || carrier.detail !== undefined ? (
          <Text
            variant="body-2-regular"
            numberOfLines={1}
            style={{ flexShrink: 1, color: paint.textSecondary }}
          >
            {joinQuoteName([jobs, carrier.detail], ' · ')}
          </Text>
        ) : null}
      </View>
    ) : null;

  const identity = (
    <View style={{ flex: 1, minWidth: 0, gap: comfortable ? 4 : 2 }}>
      {nameLine}
      {metaLine}
    </View>
  );

  const carrierName = joinQuoteName([
    carrier.name,
    carrier.verified === true ? labels.verified : undefined,
    ...marks.map((markName) => labels.marks[markName]),
    carrier.rating === undefined || carrier.rating === null
      ? undefined
      : `${carrier.rating} out of 5`,
    jobs,
    carrier.detail,
    quote.price,
  ]);

  const ringVars: WebCssStyle = { '--bloom-carrier-ring': paint.accent };
  const subject = onPressCarrier ? (
    <Pressable
      role="button"
      accessibilityLabel={accessibilityLabel ?? carrierName}
      onPress={() => onPressCarrier(quote.id)}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      accessibilityState={{ disabled }}
      {...webDataSet({ bloomCarrierSubject: '' })}
      style={({ pressed }) => [
        { flex: 1, minWidth: 0, borderRadius: 12, ...ringVars },
        pressed ? { opacity: 0.7 } : null,
      ]}
      testID={id('subject')}
    >
      {identity}
    </Pressable>
  ) : (
    identity
  );

  const headline = (
    <View style={{ alignItems: 'flex-end', flexShrink: 0, gap: 2 }} testID={id('price')}>
      <Text
        variant={comfortable ? 'title-1-medium' : 'headline-semibold'}
        numberOfLines={1}
        style={[{ color: paint.text }, TABULAR]}
        testID={id('price-amount')}
      >
        {quote.price}
      </Text>
      {quote.priceNote ? (
        <Text
          variant="caption-1-regular"
          numberOfLines={1}
          style={{ color: paint.textSecondary, textAlign: 'right' }}
        >
          {quote.priceNote}
        </Text>
      ) : null}
    </View>
  );

  // ---------------------------------------------------------------------
  //  compact: a list row, and nothing a list would draw twice
  // ---------------------------------------------------------------------
  if (!comfortable) {
    return (
      <View
        style={[
          {
            minHeight: CARRIER_QUOTE_GEOMETRY.rowMinHeight,
            justifyContent: 'center',
            opacity: disabled ? DISABLED_OPACITY : 1,
          },
          style,
        ]}
        testID={testID}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {mark}
          {subject}
          {headline}
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------
  //  comfortable: the record card
  // ---------------------------------------------------------------------
  // Only the tiles the quote actually answers. A tile drawn with an em dash is
  // a slot the offer did not fill, which reads as a number that failed to load.
  const tiles: QuoteTile[] = [];
  if (quote.pickupWindow)
    tiles.push({ key: 'pickup', label: labels.pickup, value: quote.pickupWindow, icon: RiMapPin2Line });
  if (quote.eta) tiles.push({ key: 'eta', label: labels.eta, value: quote.eta, icon: RiTimeLine });
  if (carrier.vehicle)
    tiles.push({
      key: 'vehicle',
      label: labels.vehicle,
      value: carrier.vehicle,
      // A marketplace that routes five bodies has five glyphs; Bloom's set has
      // no generic one that is honest about all of them, so a caller that does
      // not name one gets no glyph rather than the wrong vehicle.
      icon: carrier.vehicleIcon,
    });

  const tileRows: QuoteTile[][] = [];
  if (labelled) {
    if (tiles.length > 0) tileRows.push(tiles);
  } else {
    for (let i = 0; i < tiles.length; i += 2) tileRows.push(tiles.slice(i, i + 2));
  }

  const showBreakdown = (breakdown ?? true) && (quote.priceLines?.length ?? 0) > 0;
  // The chosen card takes a 2px border and gives the extra pixel back out of
  // its own inset, so nothing inside it moves when it is chosen.
  const inset = CARRIER_QUOTE_GEOMETRY.padding - (selected ? 1 : 0);

  const hasOwnActions = onAccept !== undefined || onMessage !== undefined || onDecline !== undefined;
  const actionRow = actions ?? (!hasOwnActions ? null : (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} testID={id('actions')}>
      {onDecline ? (
        <Button
          variant="text"
          size="medium"
          iconOnly={!labelled}
          leadingIcon={RiCloseLine}
          onPress={() => onDecline(quote.id)}
          disabled={disabled}
          hitSlop={CARRIER_QUOTE_GEOMETRY.actionHit}
          accessibilityLabel={`${labels.decline} ${carrier.name}`}
          testID={id('decline')}
        >
          {labelled ? labels.decline : undefined}
        </Button>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }} />
      {onMessage ? (
        <Button
          variant="secondary"
          size="medium"
          iconOnly={!labelled}
          leadingIcon={RiChat3Line}
          onPress={() => onMessage(quote.id)}
          disabled={disabled}
          hitSlop={CARRIER_QUOTE_GEOMETRY.actionHit}
          accessibilityLabel={`${labels.message} ${carrier.name}`}
          testID={id('message')}
        >
          {labelled ? labels.message : undefined}
        </Button>
      ) : null}
      {onAccept ? (
        <Button
          variant="primary"
          size="medium"
          leadingIcon={selected ? RiCheckLine : undefined}
          onPress={() => onAccept(quote.id)}
          disabled={disabled}
          accessibilityLabel={`${labels.accept} ${carrier.name}, ${quote.price}`}
          testID={id('accept')}
        >
          {labels.accept}
        </Button>
      ) : null}
    </View>
  ));

  return (
    <SurfaceLevelProvider level={1} fill={paint.surface}>
      <Card
        variant="outlined"
        radius="radius-20"
        style={[
          surfaceFillVars(paint.surface),
          selected ? { borderWidth: 2, borderColor: paint.accent } : null,
          disabled ? { opacity: DISABLED_OPACITY } : null,
          style,
        ]}
        testID={testID}
      >
        <View
          // The card measures ITSELF, not the window: this same card is 358
          // wide in a phone column and 720 in an offers pane.
          onLayout={onLayout}
          style={{
            paddingTop: inset,
            paddingBottom: inset,
            paddingLeft: inset,
            paddingRight: inset,
            gap: CARRIER_QUOTE_GEOMETRY.gap,
          }}
          testID={id('content')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            {mark}
            {subject}
            {headline}
          </View>

          {tileRows.length > 0 ? (
            <View style={{ gap: CARRIER_QUOTE_GEOMETRY.tileGap }} testID={id('tiles')}>
              {tileRows.map((row, rowIndex) => (
                <View
                  key={`tile-row-${rowIndex}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    gap: CARRIER_QUOTE_GEOMETRY.tileGap,
                  }}
                >
                  {row.map((tile) => (
                    <View
                      key={tile.key}
                      style={[styles.tile, { backgroundColor: paint.tile }]}
                      testID={id(`tile-${tile.key}`)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        {tile.icon ? (
                          <tile.icon width={14} height={14} fill={paint.tileText.textSecondary} />
                        ) : null}
                        <Text
                          variant="body-2-medium"
                          numberOfLines={1}
                          style={{ flexShrink: 1, color: paint.tileText.textSecondary }}
                        >
                          {tile.label}
                        </Text>
                      </View>
                      <Text
                        variant="body-medium"
                        // A narrow card gives a tile half the width, and a
                        // pick-up window is the reading most likely to lose its
                        // second half to an ellipsis there.
                        numberOfLines={labelled ? 1 : 2}
                        style={[{ width: '100%', color: paint.tileText.text }, TABULAR]}
                      >
                        {tile.value}
                      </Text>
                    </View>
                  ))}
                  {/* An odd tile keeps its half of the two-column grid. */}
                  {row.length === 1 && !labelled ? <View style={styles.tileSpacer} /> : null}
                </View>
              ))}
            </View>
          ) : null}

          {quote.expiresIn ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              testID={id('expires')}
            >
              <RiTimeLine width={14} height={14} fill={warning.foreground} />
              <Text variant="body-2-medium" numberOfLines={1} style={{ color: warning.foreground }}>
                {quote.expiresIn}
              </Text>
            </View>
          ) : null}

          {quote.message ? (
            <Text
              variant="body-2-regular"
              numberOfLines={3}
              style={{ color: paint.textSecondary }}
              testID={id('message-text')}
            >
              {quote.message}
            </Text>
          ) : null}

          {showBreakdown ? (
            <PriceSummary
              lines={quote.priceLines ?? []}
              total={quote.priceTotal}
              collapsible
              defaultExpanded={defaultBreakdownExpanded}
              expandLabel={labels.showPrice}
              collapseLabel={labels.hidePrice}
              accessibilityLabel={`${labels.priceDetails} ${carrier.name}`}
              testID={id('breakdown')}
            />
          ) : null}

          {actionRow ? (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: paint.hairline,
                paddingTop: 12,
              }}
            >
              {actionRow}
            </View>
          ) : null}
        </View>
      </Card>
    </SurfaceLevelProvider>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    gap: 2,
    borderRadius: CARRIER_QUOTE_GEOMETRY.tileRadius,
    paddingTop: CARRIER_QUOTE_GEOMETRY.tilePadding,
    paddingBottom: CARRIER_QUOTE_GEOMETRY.tilePadding,
    paddingLeft: CARRIER_QUOTE_GEOMETRY.tilePadding,
    paddingRight: CARRIER_QUOTE_GEOMETRY.tilePadding,
  },
  tileSpacer: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
});

export const CarrierQuoteCard = memo(CarrierQuoteCardComponent);
CarrierQuoteCard.displayName = 'CarrierQuoteCard';
