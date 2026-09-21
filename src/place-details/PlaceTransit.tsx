import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { TransitLineBadge } from '../directions/TransitLineBadge';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import { useSurfaceFill } from '../styles/surface-levels';
import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { PLACE_DETAILS_GEOMETRY, PLACE_TRANSIT_MODE_ICON } from './constants';
import { describeDeparture, describeTransitStop, resolvePlaceDetailsPaint } from './shared';
import type { PlaceTransitProps, PlaceTransitStop } from './types';

const STYLE_ID = 'bloom-place-transit-web-css';

/**
 * The hover wash and the keyboard ring for a pressable stop header, built by
 * the shared recipe rather than hand-written: `reset: 'none'` because the
 * header is a react-native-web `Pressable` and the button reset's `inline-flex`
 * would break its layout, and no press scale because this library has none.
 */
const CSS = interactiveWebCss({
  selector: '[data-bloom-place-stop]',
  varPrefix: 'bloom-place-stop',
  reset: 'none',
  transition: 'background-color 150ms ease-out',
  base: 'cursor: pointer; border-radius: 10px;',
  hover: { declarations: 'background-color: var(--bloom-place-stop-hover, transparent);' },
  outlineOffset: 2,
});

/**
 * The stops around a place, each with the lines that call there and what is
 * due next.
 *
 *   stop        a mode glyph (bus, metro, train, tram, ferry), the stop's name
 *               in `body-semibold` and how far it is under it. Pressable when
 *               the app can pan its map to it, with the library's one hover
 *               wash and one focus ring
 *   lines       `directions`' own `TransitLineBadge`, imported — an operator's
 *               line colour is drawn by the badge that already knows how to
 *               MEASURE a readable label against it, and a second badge here
 *               would be a second answer to that question
 *   departures  one row each: the line badge, where it is going, and the time
 *               on the right, tabular so a column of times lines up
 *   live        a dot in the success tone AND the word "live" in the row's
 *               announcement. A colour is not a fact: green alone says nothing
 *               to a reader who cannot see it, and it is the first thing a
 *               high-contrast mode takes away
 *
 * Each departure is ONE utterance ("Line L4 to Pla del Bosc, 4 min, live"),
 * because read part by part a column of three badges and three times is six
 * announcements the listener has to pair up themselves.
 */
function PlaceTransitComponent({
  stops,
  onPressStop,
  departureLimit,
  realtimeLabel = 'live',
  emptyLabel = 'No departures right now',
  accessibilityLabel = 'Nearby transit',
  footer,
  style,
  testID,
}: PlaceTransitProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolvePlaceDetailsPaint(theme, surface), [theme, surface]);
  useInteractiveWebCss(STYLE_ID, CSS);

  const webVars: WebCssStyle = {
    '--bloom-place-stop-ring': paint.ring,
    '--bloom-place-stop-hover': paint.fill,
  };

  const renderStop = (stop: PlaceTransitStop, index: number) => {
    const Glyph = PLACE_TRANSIT_MODE_ICON[stop.mode ?? 'bus'];
    const departures =
      departureLimit != null && departureLimit >= 0
        ? (stop.departures ?? []).slice(0, departureLimit)
        : stop.departures ?? [];
    const stopTestID = testID ? `${testID}-stop-${index}` : undefined;

    const header = (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 6 }}>
        <View
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ paddingTop: 2 }}
        >
          <Glyph
            width={PLACE_DETAILS_GEOMETRY.glyph}
            height={PLACE_DETAILS_GEOMETRY.glyph}
            fill={paint.textSecondary}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text variant="body-semibold" style={{ color: paint.text }}>
            {stop.name}
          </Text>
          {stop.distance ? (
            <Text variant="body-2-regular" style={{ color: paint.textSecondary }}>
              {stop.distance}
            </Text>
          ) : null}
          {stop.note ? (
            <Text variant="body-2-regular" style={{ color: paint.textTertiary }}>
              {stop.note}
            </Text>
          ) : null}
        </View>
      </View>
    );

    return (
      <View
        key={stop.id}
        role="listitem"
        style={{ gap: PLACE_DETAILS_GEOMETRY.rowGap }}
        testID={stopTestID}
      >
        {onPressStop ? (
          <Pressable
            {...webDataSet({ bloomPlaceStop: '' })}
            role="button"
            accessibilityLabel={describeTransitStop(stop)}
            onPress={() => onPressStop(stop.id)}
            style={webVars}
            testID={stopTestID ? `${stopTestID}-press` : undefined}
          >
            {header}
          </Pressable>
        ) : (
          <View accessible accessibilityLabel={describeTransitStop(stop)}>{header}</View>
        )}

        {stop.lines && stop.lines.length > 0 ? (
          <View
            role="group"
            accessibilityLabel="Lines"
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingLeft: 38 }}
          >
            {stop.lines.map((line, lineIndex) => (
              <TransitLineBadge key={`${line.name}-${lineIndex}`} line={line} />
            ))}
          </View>
        ) : null}

        {departures.length === 0 ? (
          <Text variant="body-2-regular" style={{ color: paint.textTertiary, paddingLeft: 38 }}>
            {emptyLabel}
          </Text>
        ) : (
          <View role="list" style={{ gap: 2, paddingLeft: 38 }}>
            {departures.map((departure, departureIndex) => (
              <View
                key={departure.id}
                role="listitem"
                accessible
                accessibilityLabel={describeDeparture(departure, realtimeLabel)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  minHeight: 32,
                }}
                testID={stopTestID ? `${stopTestID}-departure-${departureIndex}` : undefined}
              >
                <View
                  aria-hidden
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <TransitLineBadge line={departure.line} />
                </View>
                <Text
                  variant="body-regular"
                  numberOfLines={1}
                  style={{ flex: 1, minWidth: 0, color: paint.textSecondary }}
                >
                  {departure.headsign ?? departure.line.headsign ?? ''}
                </Text>
                {departure.realtime ? (
                  <View
                    aria-hidden
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: paint.live }}
                  />
                ) : null}
                <Text
                  variant="body-semibold"
                  style={{
                    color: departure.realtime ? paint.live : paint.text,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {departure.time}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (stops.length === 0) return null;

  return (
    <View
      role="list"
      accessibilityLabel={accessibilityLabel}
      style={[{ gap: PLACE_DETAILS_GEOMETRY.blockGap }, style]}
      testID={testID}
    >
      {stops.map(renderStop)}
      {footer}
    </View>
  );
}

export const PlaceTransit = memo(PlaceTransitComponent);
PlaceTransit.displayName = 'PlaceTransit';
