import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Card } from '../card';
import { Chip } from '../chip';
import { useControllableState } from '../hooks/use-controllable-state';
import { IconCircle } from '../icon-circle';
import { RiInbox2Line } from '../icons/remix/RiInbox2Line';
import * as Skeleton from '../skeleton';
import { surfaceFillVars, useSurfaceLevel } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CarrierQuoteCard } from './CarrierQuoteCard';
import { CARRIER_QUOTE_GEOMETRY, CARRIER_QUOTE_LABELS, CARRIER_QUOTE_SORTS } from './constants';
import { markCarrierQuotes, resolveCarrierQuotePaint, sortCarrierQuotes } from './shared';
import type { CarrierQuoteListProps, CarrierQuoteSort } from './types';

/**
 * The offers on one job, ordered, marked and counted.
 *
 *   head     the count at `body-semibold` on the left, the order as a
 *            `radiogroup` of chips on the right; both wrap onto their own line
 *            under 420
 *   list     the cards, 12 apart, each one handed the marks the SET earned
 *   loading  placeholder cards of the same height, announced `busy` — not a
 *            spinner, because the answer arriving is a list and a list is what
 *            should be reserved for it
 *   empty    a tinted glyph disc over one line of explanation and the caller's
 *            own action; an empty offers list is a WAIT, not a failure, so it
 *            says what happens next rather than what went wrong
 *
 * **THE ORDER IS THIS COMPONENT'S, NOT THE CALLER'S.** `quotes` arrives in
 * whatever order the app has; `sortCarrierQuotes` puts it in the chosen one and
 * is stable, so two equal offers never swap places on a re-render.
 *
 * **THE MARKS ARE A STATEMENT ABOUT THE SET.** `cheapest` and `fastest` are
 * derived here from `priceValue` / `etaMinutes` — numbers the app supplies for
 * comparison and this family never draws — and every offer tied at a minimum
 * is marked. A card cannot mark itself: it has never seen the others.
 */

function CarrierQuoteListComponent({
  quotes,
  sort: sortProp,
  defaultSort = 'price',
  onSortChange,
  sortOptions = CARRIER_QUOTE_SORTS,
  showCount = true,
  marks = true,
  loading = false,
  loadingCount = 3,
  onAccept,
  onMessage,
  onDecline,
  onPressCarrier,
  selectedId = null,
  density = 'comfortable',
  breakdown,
  emptyTitle = 'No offers yet',
  emptyDescription = 'Carriers are looking at your job. The first offers usually arrive within a few minutes.',
  emptyAction,
  labels: labelOverrides,
  accessibilityLabel = 'Offers',
  style,
  testID,
}: CarrierQuoteListProps) {
  const theme = useTheme();
  const ambient = useSurfaceLevel(0);
  const paint = useMemo(
    () => resolveCarrierQuotePaint(theme, ambient.background),
    [theme, ambient.background],
  );
  const labels = useMemo(
    () => ({
      ...CARRIER_QUOTE_LABELS,
      ...labelOverrides,
      sortOptions: { ...CARRIER_QUOTE_LABELS.sortOptions, ...labelOverrides?.sortOptions },
    }),
    [labelOverrides],
  );
  const [sort, setSort] = useControllableState<CarrierQuoteSort>({
    value: sortProp,
    defaultValue: defaultSort,
    onChange: onSortChange,
  });

  const ordered = useMemo(() => sortCarrierQuotes(quotes, sort), [quotes, sort]);
  const marked = useMemo(
    () => (marks ? markCarrierQuotes(quotes) : new Map<string, never[]>()),
    [quotes, marks],
  );
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  // No head at all until there is something to count and something to order.
  // "0 offers" over a control that can reorder nothing is chrome for a list
  // that does not exist yet, and the empty state already says the same thing in
  // words a reader can act on.
  const head =
    quotes.length > 0 && (showCount || sortOptions.length > 0) ? (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
        testID={id('head')}
      >
        {showCount ? (
          <Text
            variant="body-semibold"
            role="heading"
            aria-level={3}
            style={{ color: paint.text }}
            testID={id('count')}
          >
            {labels.count(quotes.length)}
          </Text>
        ) : (
          <View />
        )}
        {sortOptions.length > 0 ? (
          <View
            role="radiogroup"
            accessibilityLabel={labels.sort}
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
            testID={id('sort')}
          >
            {sortOptions.map((option) => (
              <Chip
                key={option}
                role="radio"
                // 32 drawn, 44 under a thumb through `Chip`'s own hitSlop: this
                // is a control, not a label.
                size="xl"
                variant="outlined"
                selected={sort === option}
                onPress={() => setSort(option)}
                accessibilityLabel={labels.sortOptions[option]}
                testID={id(`sort-${option}`)}
              >
                {labels.sortOptions[option]}
              </Chip>
            ))}
          </View>
        ) : null}
      </View>
    ) : null;

  let body: React.ReactNode;
  if (loading) {
    body = (
      <View
        aria-busy
        accessibilityState={{ busy: true }}
        accessibilityLabel={labels.loading}
        style={{ gap: 12 }}
        testID={id('loading')}
      >
        {Array.from({ length: Math.max(1, loadingCount) }, (_unused, index) => (
          <Card
            key={index}
            variant="outlined"
            radius="radius-20"
            style={surfaceFillVars(theme.colors.card)}
            testID={id(`placeholder-${index}`)}
          >
            <View
              style={{
                paddingTop: CARRIER_QUOTE_GEOMETRY.padding,
                paddingBottom: CARRIER_QUOTE_GEOMETRY.padding,
                paddingLeft: CARRIER_QUOTE_GEOMETRY.padding,
                paddingRight: CARRIER_QUOTE_GEOMETRY.padding,
                gap: CARRIER_QUOTE_GEOMETRY.gap,
              }}
            >
              <Skeleton.Row style={{ alignItems: 'center', gap: 12 }}>
                <Skeleton.Circle size={CARRIER_QUOTE_GEOMETRY.avatar.comfortable} />
                <Skeleton.Col style={{ gap: 6 }}>
                  <Skeleton.Text style={{ width: 160 }} />
                  <Skeleton.Text style={{ width: 110 }} />
                </Skeleton.Col>
                <Skeleton.Box width={72} height={20} />
              </Skeleton.Row>
              <Skeleton.Box
                height={64}
                borderRadius={CARRIER_QUOTE_GEOMETRY.tileRadius}
              />
            </View>
          </Card>
        ))}
      </View>
    );
  } else if (ordered.length === 0) {
    body = (
      <View
        role="group"
        accessibilityLabel={emptyTitle}
        style={{
          alignItems: 'center',
          gap: 12,
          paddingTop: 32,
          paddingBottom: 32,
          paddingLeft: 24,
          paddingRight: 24,
        }}
        testID={id('empty')}
      >
        <IconCircle icon={RiInbox2Line} size="lg" />
        <Text
          variant="headline-semibold"
          style={{ color: paint.text, textAlign: 'center' }}
          testID={id('empty-title')}
        >
          {emptyTitle}
        </Text>
        {emptyDescription ? (
          <Text
            variant="body-regular"
            style={{ color: paint.textSecondary, textAlign: 'center', maxWidth: 360 }}
          >
            {emptyDescription}
          </Text>
        ) : null}
        {emptyAction}
      </View>
    );
  } else {
    body = (
      <View style={{ gap: 12 }}>
        {ordered.map((quote) => (
          <CarrierQuoteCard
            key={quote.id}
            quote={marks ? { ...quote, marks: marked.get(quote.id) ?? [] } : quote}
            onAccept={onAccept}
            onMessage={onMessage}
            onDecline={onDecline}
            onPressCarrier={onPressCarrier}
            selected={selectedId === quote.id}
            density={density}
            breakdown={breakdown}
            labels={labelOverrides}
            testID={id(quote.id)}
          />
        ))}
      </View>
    );
  }

  return (
    <View
      testID={testID}
      role="group"
      accessibilityLabel={accessibilityLabel}
      style={[{ gap: 16 }, style]}
    >
      {head}
      {body}
    </View>
  );
}

export const CarrierQuoteList = memo(CarrierQuoteListComponent);
CarrierQuoteList.displayName = 'CarrierQuoteList';
