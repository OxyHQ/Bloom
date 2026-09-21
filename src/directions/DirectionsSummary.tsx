import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Badge } from '../badge';
import { Button } from '../button';
import { Chip } from '../chip';
import { TABULAR } from '../chart-cards/primitives/ChartHeader';
import { AddressRow } from '../address';
import { RiRouteLine } from '../icons/remix/RiRouteLine';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import { RouteStops } from '../route-stops';
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemText } from '../segmented-control';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { BloomIconComponent } from '../icons/icon-component';
import {
  DIRECTIONS_MODE_ICON,
  DIRECTIONS_TRAFFIC_TONE,
} from './constants';
import { describeRoute, modeLabelFor, resolveDirectionsPaint, trafficLabelFor, type DirectionsPaint } from './shared';
import { TransitLineBadge } from './TransitLineBadge';
import type { DirectionsRoute, DirectionsSummaryProps } from './types';

/**
 * The route you have chosen, and the ones you have not.
 *
 *   stops        `RouteStops` — the origin and the destination, drawn by the
 *                family that already owns them. This component draws no second
 *                one, and renders nothing at all without `stops`.
 *   modes        `SegmentedControl` — drive / transit / walk / cycle. Not a new
 *                control: a switcher of views is the segmented control, and the
 *                mode words are data.
 *   figure       a quiet label over the DURATION at title-1, tabular, with the
 *                distance as a `Chip` and the traffic as a `Badge` on its tone
 *                — `ai-profile-card`'s figure block, with a duration in it.
 *   readings     the arrival time and the via line, each a 16 glyph and a line
 *                of secondary text.
 *   alternates   the other routes as pressable `AddressRow`s in a `list`. A
 *                press CHOOSES one, which swaps it into the figure above.
 *
 * WHY THE DURATION AND NOT THE DISTANCE IS THE FIGURE: nobody leaves a house
 * because a place is 8.2 km away. The distance is the qualifier, which is what
 * the chip rung is for.
 *
 * THE CHOSEN ROUTE IS NOT IN THE LIST. It is drawn in full above it, and a
 * route shown twice is a reader wondering whether they are two. That is also
 * why the rows are a `list` of pressable rows rather than a `radiogroup` —
 * a radio group whose checked member is missing announces a choice with nothing
 * chosen.
 */

const GLYPH = 16;

function ReadingLine({
  icon: Icon,
  text,
  paint,
  testID,
}: {
  icon: BloomIconComponent;
  text: string;
  paint: DirectionsPaint;
  testID?: string;
}) {
  return (
    <View
      accessible
      accessibilityLabel={text}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 }}
      testID={testID}
    >
      <Icon width={GLYPH} height={GLYPH} fill={paint.textSecondary} />
      <Text
        variant="body-regular"
        numberOfLines={1}
        style={{ flexShrink: 1, minWidth: 0, color: paint.textSecondary }}
      >
        {text}
      </Text>
    </View>
  );
}

function DirectionsSummaryComponent({
  routes,
  selectedRouteId,
  onSelectRoute,
  stops,
  onPressStop,
  onSwapStops,
  modes,
  mode = 'drive',
  onModeChange,
  onStart,
  labels,
  accessibilityLabel = 'Directions',
  style,
  testID,
}: DirectionsSummaryProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolveDirectionsPaint(theme, surface), [theme, surface]);

  const chosen: DirectionsRoute | undefined =
    routes.find((route) => route.id === selectedRouteId) ?? routes[0];
  const alternates = routes.filter((route) => route.id !== chosen?.id);
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  const figureLabel = labels?.figure ?? modeLabelFor(mode, labels);
  const alternatesLabel = labels?.alternates ?? 'Other routes';
  const ModeIcon = DIRECTIONS_MODE_ICON[mode];

  const traffic = chosen ? trafficLabelFor(chosen.traffic, chosen.trafficLabel, labels) : null;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[{ width: '100%', gap: 16 }, style]}
      testID={testID}
    >
      {stops && stops.length > 0 ? (
        <RouteStops
          stops={stops}
          onPressStop={onPressStop}
          onSwap={onSwapStops}
          testID={id('stops')}
        />
      ) : null}

      {modes && modes.length > 0 && onModeChange ? (
        <SegmentedControl
          label={labels?.modes ?? 'Travel mode'}
          type="radio"
          value={mode}
          onChange={onModeChange}
          testID={id('modes')}
        >
          {modes.map((item) => (
            <SegmentedControlItem key={item} value={item} testID={id(`mode-${item}`)}>
              <SegmentedControlItemText>{modeLabelFor(item, labels)}</SegmentedControlItemText>
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      ) : null}

      {chosen ? (
        <View style={{ gap: 8 }} testID={id('figure')}>
          <Text variant="body-medium" numberOfLines={1} style={{ color: paint.textSecondary }}>
            {figureLabel}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <Text
              variant="title-1-medium"
              numberOfLines={1}
              style={[{ color: paint.text }, TABULAR]}
              testID={id('duration')}
            >
              {chosen.duration}
            </Text>
            {chosen.distance ? (
              <Chip size="medium" testID={id('distance')}>
                {chosen.distance}
              </Chip>
            ) : null}
            {traffic && chosen.traffic ? (
              <Badge
                content={traffic}
                variant="subtle"
                color={DIRECTIONS_TRAFFIC_TONE[chosen.traffic]}
                size="label-medium"
                testID={id('traffic')}
              />
            ) : null}
            {chosen.note ? (
              <Badge
                content={chosen.note}
                variant="subtle"
                color="primary"
                size="label-medium"
                testID={id('note')}
              />
            ) : null}
          </View>

          {chosen.lines && chosen.lines.length > 0 ? (
            <View
              style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}
              testID={id('lines')}
            >
              {chosen.lines.map((line, index) => (
                <TransitLineBadge
                  key={`${line.name}-${index}`}
                  line={line}
                  size="label-medium"
                  testID={id(`line-${index}`)}
                />
              ))}
            </View>
          ) : null}

          {chosen.arrival ? (
            <ReadingLine icon={RiTimeLine} text={chosen.arrival} paint={paint} testID={id('arrival')} />
          ) : null}
          {chosen.via ? (
            <ReadingLine icon={RiRouteLine} text={chosen.via} paint={paint} testID={id('via')} />
          ) : null}
        </View>
      ) : null}

      {onStart && chosen ? (
        <Button
          variant="primary"
          size="medium"
          leadingIcon={ModeIcon}
          onPress={onStart}
          testID={id('start')}
        >
          {labels?.start ?? 'Start'}
        </Button>
      ) : null}

      {alternates.length > 0 ? (
        <View style={{ gap: 8 }} testID={id('alternates')}>
          <Text variant="caption-1-semibold" style={{ color: paint.textSecondary }}>
            {alternatesLabel}
          </Text>
          <View role="list" accessibilityLabel={alternatesLabel}>
            {alternates.map((route, index) => {
              const routeTraffic = trafficLabelFor(route.traffic, route.trafficLabel, labels);
              return (
                <View key={route.id} role="listitem">
                  <AddressRow
                    title={route.duration}
                    // The via line, the distance and the arrival are ONE
                    // subtitle rather than a subtitle and a trailing `meta`:
                    // the row's title is a figure four characters wide, and a
                    // trailing reading squeezed it until "31 min" truncated to
                    // "31 …" at 390. The badge is what earns the trailing room.
                    subtitle={
                      [route.via, route.distance, route.arrival].filter(Boolean).join(' · ') || undefined
                    }
                    icon={DIRECTIONS_MODE_ICON[mode]}
                    badge={
                      routeTraffic && route.traffic ? (
                        <Badge
                          content={routeTraffic}
                          variant="subtle"
                          color={DIRECTIONS_TRAFFIC_TONE[route.traffic]}
                          size="label-small"
                        />
                      ) : route.lines && route.lines.length > 0 ? (
                        <TransitLineBadge line={route.lines[0]!} />
                      ) : undefined
                    }
                    onPress={onSelectRoute ? () => onSelectRoute(route.id) : undefined}
                    accessibilityLabel={describeRoute(route, labels)}
                    testID={id(`route-${index}`)}
                  />
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export const DirectionsSummary = memo(DirectionsSummaryComponent);
DirectionsSummary.displayName = 'DirectionsSummary';
