import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { AddressRow } from '../address';
import { ADDRESS_SECTION_GAP, ADDRESS_SECTIONS_GAP } from '../address/constants';
import { Text } from '../typography';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { DIRECTIONS_LEG_GLYPH, DIRECTIONS_MODE_ICON } from './constants';
import { DIRECTIONS_MANEUVER_ICON } from './maneuvers';
import { describeStep, describeTransitLine, resolveDirectionsPaint } from './shared';
import { TransitLineBadge } from './TransitLineBadge';
import type { DirectionsStepsProps } from './types';

/**
 * The turn list: what to do, where, and how far away it is.
 *
 *   leg header  a 16 mode glyph, the leg's title at the section rung
 *               (`caption-1-semibold`, secondary — `address`' own header), the
 *               line badge, and the leg's reading pushed right. A leg with no
 *               title draws no header, so a single-leg drive is just steps.
 *   step        `AddressRow` with the maneuver glyph in its tile: the row, the
 *               tile, the press target, the density rungs, the trailing
 *               `meta` and the disabled opacity are all `Item`'s through
 *               `AddressRow`, and this family adds the glyph table and the
 *               words.
 *   current     the accent's own `subtle` wash on the row, AND the word
 *               "Current step" first in its announced name.
 *
 * THE WASH IS PAINTED THROUGH `style`, NOT THROUGH `selected`. `Item` maps
 * `selected` to `aria-pressed` on a row with no role, and a turn instruction is
 * not a toggle — a screen reader would announce every step as "not pressed".
 * The state a step carries is "this is where you are", which ARIA has no
 * attribute for on a list row, so it travels in the NAME where it is certain to
 * be heard.
 *
 * WHERE THE NAME GOES depends on whether the row is a control, exactly as in
 * `RouteStops`: a pressable step is a button and carries its own name; a
 * read-only one renders `role="none"`, which assistive technology is told to
 * ignore, so the name goes on the `listitem` around it. Naming both would read
 * every step twice.
 */
function DirectionsStepsComponent({
  legs,
  currentStepId,
  onPressStep,
  density = 'comfortable',
  currentLabel = 'Current step',
  accessibilityLabel = 'Directions',
  style,
  testID,
}: DirectionsStepsProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolveDirectionsPaint(theme, surface), [theme, surface]);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[{ width: '100%', gap: ADDRESS_SECTIONS_GAP }, style]}
      testID={testID}
    >
      {legs.map((leg, legIndex) => {
        const legId = testID ? `${testID}-leg-${legIndex}` : undefined;
        const LegIcon = DIRECTIONS_MODE_ICON[leg.mode ?? 'drive'];
        const legName = [leg.title, leg.line ? describeTransitLine(leg.line) : undefined, leg.meta]
          .filter((part): part is string => typeof part === 'string' && part !== '')
          .join(', ');

        return (
          <View key={leg.id ?? legIndex} style={{ gap: ADDRESS_SECTION_GAP }} testID={legId}>
            {leg.title ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 16,
                  minWidth: 0,
                }}
                testID={legId ? `${legId}-header` : undefined}
              >
                <LegIcon
                  width={DIRECTIONS_LEG_GLYPH}
                  height={DIRECTIONS_LEG_GLYPH}
                  fill={paint.textSecondary}
                />
                <Text
                  variant="caption-1-semibold"
                  numberOfLines={1}
                  style={{ flexShrink: 1, minWidth: 0, color: paint.textSecondary }}
                >
                  {leg.title}
                </Text>
                {leg.line ? <TransitLineBadge line={leg.line} /> : null}
                {leg.meta ? (
                  <Text
                    variant="body-2-regular"
                    numberOfLines={1}
                    // The reading never yields: it is four characters and the
                    // leg TITLE is the line that can afford to truncate.
                    style={{ marginLeft: 'auto', flexShrink: 0, color: paint.textTertiary }}
                  >
                    {leg.meta}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View role="list" accessibilityLabel={legName || accessibilityLabel}>
              {leg.steps.map((step, stepIndex) => {
                const current = currentStepId !== undefined && step.id === currentStepId;
                const name = describeStep(step, { current, currentWord: currentLabel });
                const stepId = legId ? `${legId}-step-${stepIndex}` : undefined;
                return (
                  <View
                    key={step.id}
                    role="listitem"
                    accessibilityLabel={onPressStep ? undefined : name}
                    testID={stepId ? `${stepId}-item` : undefined}
                  >
                    <AddressRow
                      title={step.instruction}
                      subtitle={step.detail}
                      meta={step.distance}
                      icon={DIRECTIONS_MANEUVER_ICON[step.maneuver ?? 'straight']}
                      badge={step.line ? <TransitLineBadge line={step.line} /> : undefined}
                      density={density}
                      onPress={onPressStep ? () => onPressStep(step.id) : undefined}
                      accessibilityLabel={onPressStep ? name : undefined}
                      style={current ? { backgroundColor: paint.currentFill } : undefined}
                      testID={stepId}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export const DirectionsSteps = memo(DirectionsStepsComponent);
DirectionsSteps.displayName = 'DirectionsSteps';
