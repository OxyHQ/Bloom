import React, { memo, useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { AddressRow, resolveAddressPaint } from '../address';
import { Button, GlyphButton } from '../button';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiArrowUpDownLine } from '../icons/remix/RiArrowUpDownLine';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { hairlineOn, useSurfaceFill } from '../styles/surface-levels';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { ROUTE_STOPS_GEOMETRY, ROUTE_STOP_STATE_LABELS, ROUTE_STOPS_SWAP_COLUMN, ROUTE_STOPS_SWAP_SIZE } from './constants';
import type { RouteStop, RouteStopState, RouteStopsProps } from './types';

/**
 * An origin, a destination, and what is between them.
 *
 *   marker   the SHAPE says which stop it is, the COLOUR says how far the
 *            journey got. Origin: a 12 ring (3px). Between: an 8 dot.
 *            Destination: a 12 square, 3 radius — an end, not another dot.
 *            `reached` and `current` paint the accent, `pending` the graphical
 *            rung, and `current` adds a 3px tint halo.
 *   connector 2px, travelled when the stop BELOW it has been reached or is
 *            current — so the line fills behind the journey.
 *   rows     `AddressRow` with `leading={null}`: the marker column is already
 *            the gutter, so the row draws no tile of its own and every other
 *            decision — press target, density, selected wash, disabled — stays
 *            where it already was.
 *   swap     a column of its own beside the list, centred against the whole of
 *            it, so with two stops it lands between them without a magic
 *            offset. Offered only for exactly two stops.
 *
 * THE MARKER COLUMN IS TWO HALF-LINES AROUND THE MARKER, each `flex: 1`. The
 * marker therefore centres itself in whatever height the row turns out to be,
 * and the half below one row meets the half above the next exactly — for a row
 * with a subtitle, a badge, a wrapped line or none of those. Nothing measures
 * anything and nothing is nudged.
 *
 * A `list` of `listitem`s named as one. Each row's announced name carries its
 * POSITION and its STATE before its text — "Destination, not reached, Home,
 * Carrer de l’Om 14" — because the shape and the colour that say both of
 * those things on screen say nothing at all to a screen reader.
 */
function RouteStopsComponent({
  stops,
  onPressStop,
  onSwap,
  onAddStop,
  onRemoveStop,
  canAddStop = true,
  density = 'comfortable',
  labels,
  addIcon = RiAddLine,
  accessibilityLabel = 'Route stops',
  style,
  testID,
}: RouteStopsProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolveAddressPaint(theme, surface), [theme, surface]);
  const connector = useMemo(() => hairlineOn(theme, surface), [theme, surface]);
  const g = ROUTE_STOPS_GEOMETRY[density];

  const accent = resolveAccentColors(theme.colors, 'primary', 'solid');
  const halo = resolveAccentColors(theme.colors, 'primary', 'subtle').background;

  const stateWords = { ...ROUTE_STOP_STATE_LABELS, ...labels?.state };
  const originWord = labels?.origin ?? 'Origin';
  const destinationWord = labels?.destination ?? 'Destination';
  const stopWord = labels?.stop ?? ((position: number) => `Stop ${position}`);
  const removeWord = labels?.remove ?? ((stop: RouteStop) => `Remove ${stop.title}`);

  const travelled = (index: number): boolean => {
    const stop = stops[index];
    if (stop === undefined) return false;
    const state = stop.state ?? 'pending';
    return state === 'reached' || state === 'current';
  };

  const press = useCallback(
    (id: string) => (onPressStop ? () => onPressStop(id) : undefined),
    [onPressStop],
  );

  const positionWord = (index: number): string => {
    if (index === 0) return originWord;
    if (index === stops.length - 1) return destinationWord;
    return stopWord(index + 1);
  };

  const list = (
    <View role="list" accessibilityLabel={accessibilityLabel} testID={testID ? `${testID}-list` : undefined}>
      {stops.map((stop, index) => {
        const state: RouteStopState = stop.state ?? 'pending';
        const first = index === 0;
        const last = index === stops.length - 1;
        const on = state === 'reached' || state === 'current';
        const id = (part: string) => (testID ? `${testID}-${index}-${part}` : undefined);

        // SHAPE says which stop, COLOUR says how far the journey got, and
        // SIZE says which one is current. The third is not decoration: at 8px a
        // tint halo drawn INSIDE the dot is two pixels of fill and reads as the
        // same dot as the one before it, so the current stop grows by `halo`
        // and wears the ring on the outside of its own diameter.
        const current = state === 'current';
        const base = first || last ? g.terminal : g.waypoint;
        const size = current ? base + g.halo : base;
        const marker = (
          <View
            testID={id('marker')}
            style={{
              width: size,
              height: size,
              borderRadius: last && !first ? g.square : size / 2,
              backgroundColor: first ? surface : on ? accent.background : surface,
              borderWidth: first || current ? 3 : on ? 0 : 1.5,
              borderColor: first
                ? on
                  ? accent.background
                  : paint.textGraphical
                : current
                  ? halo
                  : paint.textGraphical,
            }}
          />
        );

        const rail = (side: 'in' | 'out') => (
          <View
            testID={id(side === 'in' ? 'rail-in' : 'rail-out')}
            style={{
              flex: 1,
              minHeight: 4,
              width: g.line,
              borderRadius: g.line / 2,
              backgroundColor:
                side === 'in'
                  ? first
                    ? 'transparent'
                    : travelled(index)
                      ? accent.background
                      : connector
                  : last
                    ? 'transparent'
                    : travelled(index + 1)
                      ? accent.background
                      : connector,
            }}
          />
        );

        const name =
          stop.accessibilityLabel ??
          [positionWord(index), stateWords[state], stop.title, stop.subtitle, stop.meta]
            .filter((part): part is string => typeof part === 'string' && part !== '')
            .join(', ');

        return (
          <View
            key={stop.id}
            role="listitem"
            // WHERE THE NAME GOES depends on whether the row is a control, and
            // it is one or the other, never both. A pressable row is a BUTTON
            // and carries the name itself; an unnamed `listitem` around it adds
            // nothing. A read-only row is not a control at all — `Item`'s
            // non-pressable branch renders `role="none"`, which is exactly the
            // element an assistive technology is told to ignore — so the name
            // has to be on the `listitem`, and naming both would announce the
            // stop twice.
            accessibilityLabel={onPressStop ? undefined : name}
            testID={id('item')}
            style={{ flexDirection: 'row' }}
          >
            <View style={{ width: g.column, alignItems: 'center' }}>
              {rail('in')}
              {marker}
              {rail('out')}
            </View>
            {/*
              The flex goes on a wrapper, not on `AddressRow`'s `style`: `Item`
              applies that to its CONTENT view, one node below the `Pressable`
              (or plain `View`) this row actually lays out — so `flex: 1` there
              is invisible to this row, and the stop took the full min-content
              width of its own one-line title.
            */}
            <View style={{ flex: 1, minWidth: 0 }}>
            <AddressRow
              title={stop.title}
              subtitle={stop.subtitle}
              meta={stop.meta}
              badge={stop.badge}
              kind={stop.kind}
              leading={null}
              density={density}
              onPress={press(stop.id)}
              accessibilityLabel={onPressStop ? name : undefined}
              action={
                <>
                  {stop.action}
                  {onRemoveStop ? (
                    <GlyphButton
                      size={32}
                      glyphSize={16}
                      icon={RiCloseLine}
                      color={paint.textTertiary}
                      hoverColor={paint.text}
                      onPress={() => onRemoveStop(stop.id)}
                      accessibilityLabel={removeWord(stop)}
                      testID={id('remove')}
                    />
                  ) : null}
                </>
              }
              testID={id('row')}
            />
            </View>
          </View>
        );
      })}
    </View>
  );

  const swappable = onSwap !== undefined && stops.length === 2;

  return (
    <View testID={testID} style={style}>
      <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
        <View style={{ flex: 1, minWidth: 0 }}>{list}</View>
        {swappable ? (
          <View
            style={{ width: ROUTE_STOPS_SWAP_COLUMN, alignItems: 'center', justifyContent: 'center' }}
          >
            <GlyphButton
              size={ROUTE_STOPS_SWAP_SIZE}
              icon={RiArrowUpDownLine}
              color={paint.textSecondary}
              hoverColor={paint.text}
              onPress={onSwap}
              accessibilityLabel={labels?.swap ?? 'Swap origin and destination'}
              testID={testID ? `${testID}-swap` : undefined}
            />
          </View>
        ) : null}
      </View>
      {onAddStop ? (
        <View style={{ alignItems: 'flex-start', paddingLeft: 8, paddingTop: 4 }}>
          <Button
            variant="text"
            size="small"
            leadingIcon={addIcon}
            onPress={onAddStop}
            disabled={!canAddStop}
            testID={testID ? `${testID}-add` : undefined}
          >
            {labels?.addStop ?? 'Add a stop'}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

export const RouteStops = memo(RouteStopsComponent);
RouteStops.displayName = 'RouteStops';
