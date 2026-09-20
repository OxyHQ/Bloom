import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { useSurfaceFill } from '../styles/surface-levels';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ORDER_STATUS_GEOMETRY, ORDER_STATUS_STATE_LABELS, type OrderStatusGeometry } from './constants';
import { IS_WEB, resolveOrderStatusPaint } from './shared';
import type { OrderStatusStep, OrderStatusStepState, OrderStatusTimelineProps } from './types';

/**
 * Where a thing that moves through named steps is now.
 *
 * ONE component with two orientations, because the data is the same list and a
 * screen that switches at a breakpoint must not switch components — the state a
 * caller holds, the keys, the accessible tree and the announced words all stay
 * put across the switch.
 *
 *   marker       comfortable: a `column` (24) disc — a filled tone disc with a
 *                check for `done`, the same disc with the step's own glyph and
 *                a 3px tint halo for `current`, a hollow 1.5px ring for
 *                `upcoming`, a filled error disc with a cross for `failed`.
 *                compact: an 8 dot, filled / haloed / hollow the same way and
 *                with no glyph — there is no room for one, so at that rung the
 *                state travels as colour plus the announced word.
 *   connector    2px, radius 1. TRAVELLED between two steps when the LATER one
 *                is `done`, `current` or `failed` — so the rail fills behind
 *                the thing as it moves — and the neutral hairline otherwise.
 *   vertical     marker column 24 (compact 16), 12 to the text, 20 between
 *                steps (compact 12); label, "timestamp", note.
 *   horizontal   each step is an equal column; the rail runs through the marker
 *                row and the label sits centred under it, two lines at most.
 *                `note` is not drawn — a rail has a column's width, and a
 *                sentence in it would either clip or set the whole rail's
 *                height by its longest entry.
 *
 * A `list` of `listitem`s. Each marker is an `img` named by its state, so a
 * screen reader hears "Done, Picked up, 14:20" rather than a bare label with
 * the state carried only by colour.
 *
 * Nothing here formats a date or reads a clock: `timestamp` arrives as the
 * string it will be drawn as.
 */

/** Whether the rail between a step and the one before it has been travelled. */
function travelled(state: OrderStatusStepState): boolean {
  return state === 'done' || state === 'current' || state === 'failed';
}

interface MarkerProps {
  step: OrderStatusStep;
  state: OrderStatusStepState;
  geometry: OrderStatusGeometry;
  label: string;
  surface: string;
  testID: string | undefined;
}

function Marker({ step, state, geometry, label, surface, testID }: MarkerProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveOrderStatusPaint(theme, surface), [theme, surface]);
  const tone = state === 'failed' ? 'error' : (step.tone ?? 'primary');
  const accent = resolveAccentColors(theme.colors, tone, 'solid');
  const halo = resolveAccentColors(theme.colors, tone, 'subtle').background;
  const upcoming = state === 'upcoming';

  const size =
    geometry.glyph > 0
      ? geometry.column
      : state === 'current'
        ? geometry.dot + geometry.halo
        : geometry.dot;

  const Glyph =
    geometry.glyph === 0
      ? undefined
      : (step.icon ?? (state === 'done' ? RiCheckLine : state === 'failed' ? RiCloseLine : undefined));

  return (
    <View
      accessible
      accessibilityLabel={label}
      {...(IS_WEB ? { role: 'img' as const } : { accessibilityRole: 'image' as const })}
      testID={testID}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: upcoming ? surface : accent.background,
        borderWidth: upcoming ? 1.5 : state === 'current' ? 3 : 0,
        borderColor: upcoming ? paint.upcomingRing : halo,
      }}
    >
      {Glyph ? (
        <Glyph
          width={geometry.glyph}
          height={geometry.glyph}
          fill={upcoming ? paint.textSecondary : accent.foreground}
        />
      ) : null}
    </View>
  );
}

function OrderStatusTimelineComponent({
  steps,
  orientation = 'vertical',
  density = 'comfortable',
  accessibilityLabel = 'Status',
  stateLabels,
  style,
  testID,
}: OrderStatusTimelineProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolveOrderStatusPaint(theme, surface), [theme, surface]);
  const g = ORDER_STATUS_GEOMETRY[orientation][density];
  const labels = { ...ORDER_STATUS_STATE_LABELS, ...stateLabels };

  /** The colour of the rail leading INTO step `index`. */
  const segment = (index: number): string => {
    const step = steps[index];
    if (step === undefined) return paint.connector;
    const state = step.state ?? 'upcoming';
    if (!travelled(state)) return paint.connector;
    const tone = state === 'failed' ? 'error' : (step.tone ?? 'primary');
    return resolveAccentColors(theme.colors, tone, 'solid').background;
  };

  const markerBox = Math.max(g.lead, g.glyph > 0 ? g.column : g.dot + g.halo);

  return (
    <View
      role="list"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[orientation === 'horizontal' ? { flexDirection: 'row' } : null, style]}
    >
      {steps.map((step, index) => {
        const state = step.state ?? 'upcoming';
        const last = index === steps.length - 1;
        const first = index === 0;
        const id = (part: string) => (testID ? `${testID}-${index}-${part}` : undefined);
        const quiet = state === 'upcoming';
        const labelVariant = state === 'current' ? g.labelStrong : g.label;

        const marker = (
          <Marker
            step={step}
            state={state}
            geometry={g}
            label={labels[state]}
            surface={surface}
            testID={id('marker')}
          />
        );

        if (orientation === 'horizontal') {
          const rail = (side: 'in' | 'out') => (
            <View
              testID={id(side === 'in' ? 'rail-in' : 'rail-out')}
              style={{
                flex: 1,
                height: g.line,
                borderRadius: g.line / 2,
                backgroundColor:
                  side === 'in'
                    ? first
                      ? 'transparent'
                      : segment(index)
                    : last
                      ? 'transparent'
                      : segment(index + 1),
              }}
            />
          );
          return (
            <View
              key={step.id ?? index}
              role="listitem"
              testID={id('item')}
              style={{ flex: 1, minWidth: 0, alignItems: 'center' }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  alignSelf: 'stretch',
                  height: markerBox,
                }}
              >
                {rail('in')}
                {marker}
                {rail('out')}
              </View>
              <Text
                variant={labelVariant}
                numberOfLines={2}
                testID={id('label')}
                style={{
                  marginTop: g.gap,
                  textAlign: 'center',
                  color: quiet ? paint.textSecondary : paint.text,
                }}
              >
                {step.label}
              </Text>
              {step.timestamp ? (
                <Text
                  variant={g.meta}
                  numberOfLines={1}
                  testID={id('meta')}
                  style={{ textAlign: 'center', color: paint.textTertiary }}
                >
                  {step.timestamp}
                </Text>
              ) : null}
            </View>
          );
        }

        return (
          <View
            key={step.id ?? index}
            role="listitem"
            testID={id('item')}
            style={{ flexDirection: 'row', gap: 12 }}
          >
            <View style={{ width: g.column, alignItems: 'center' }}>
              <View style={{ height: markerBox, alignItems: 'center', justifyContent: 'center' }}>
                {marker}
              </View>
              {last ? null : (
                <View
                  testID={id('connector')}
                  style={{
                    flex: 1,
                    width: g.line,
                    minHeight: 8,
                    marginTop: 4,
                    borderRadius: g.line / 2,
                    backgroundColor: segment(index + 1),
                  }}
                />
              )}
            </View>
            <View
              style={{
                flex: 1,
                minWidth: 0,
                gap: 2,
                paddingTop: (markerBox - g.lead) / 2,
                paddingBottom: last ? 0 : g.gap,
              }}
            >
              <Text
                variant={labelVariant}
                testID={id('label')}
                style={{ color: quiet ? paint.textSecondary : paint.text }}
              >
                {step.label}
              </Text>
              {step.timestamp ? (
                <Text variant={g.meta} testID={id('meta')} style={{ color: paint.textTertiary }}>
                  {step.timestamp}
                </Text>
              ) : null}
              {step.note ? (
                <Text
                  variant={g.meta}
                  testID={id('note')}
                  style={{ color: quiet ? paint.textTertiary : paint.textSecondary, marginTop: 2 }}
                >
                  {step.note}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export const OrderStatusTimeline = memo(OrderStatusTimelineComponent);
OrderStatusTimeline.displayName = 'OrderStatusTimeline';
