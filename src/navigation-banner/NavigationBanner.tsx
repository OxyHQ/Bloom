import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { DIRECTIONS_MANEUVER_ICON } from '../directions/maneuvers';
import { GlassIsland } from '../glass';
import { borderRadius } from '../styles/tokens';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  NAVIGATION_BANNER_GEOMETRY,
  NAVIGATION_STATE_ICON,
  NAVIGATION_STATE_LABELS,
  NAVIGATION_STATE_TONE,
} from './constants';
import { describeNavigationBanner, maneuverWordFor, resolveNavigationPaint } from './shared';
import type { NavigationBannerProps } from './types';

/**
 * THE NEXT MANEUVER, while it is happening.
 *
 *   pane        `GlassIsland` at the 16 rung — the guidance is drawn over tiles
 *               Bloom does not own, and the island is the one material in the
 *               library priced for that. It is asked for a SURFACE radius
 *               rather than its default capsule: a banner is a surface, and the
 *               pill rung belongs to button-like controls.
 *   tile        56 square, 12 radius, the state's tone as a tint with the
 *               maneuver glyph in that tone's own accent — the same tile recipe
 *               `OrderStatusBar` paints, at the size a driver reads without
 *               focusing.
 *   glyph       `DIRECTIONS_MANEUVER_ICON`. The SAME map the step list beside
 *               it uses: two sets of arrows for one vocabulary is two answers
 *               to the question "which way is slight right".
 *   headline    the distance, TABULAR, so a reading counting down from 400 m
 *               does not shuffle the street name under it
 *   instruction the street, up to two lines
 *   then        the maneuver after this one, behind a full-bleed hairline
 *   children    lanes, a speed sign — behind a second hairline, and outside the
 *               announcement, because each names itself
 *
 * ── THE TWO EXCEPTIONAL STATES ARE THIS COMPONENT ───────────────────────────
 *
 * `off-route` and `rerouting` take the same strip, in the same place, at the
 * same moment. A separate surface appearing where this one was is a jump, and
 * the driver has to find the thing they were already reading. So the state
 * swaps the glyph, the tone and the headline, and the maneuver — which is no
 * longer true — stops being announced at all.
 *
 * ── THE ROW IS ONE UTTERANCE ────────────────────────────────────────────────
 *
 * The glyph is the only thing on screen that says which way to turn, and a
 * glyph says nothing aloud. The maneuver row is therefore one `img` named by
 * `describeNavigationBanner`, with its drawn text hidden from assistive
 * technology so the distance is not read twice. `children` sit OUTSIDE that
 * name: a lane row and a speed sign each announce themselves.
 */
function NavigationBannerComponent({
  maneuver,
  distance,
  instruction,
  thenManeuver,
  then,
  state = 'guiding',
  children,
  labels,
  accessibilityLabel,
  style,
  testID,
}: NavigationBannerProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveNavigationPaint(theme), [theme]);
  const g = NAVIGATION_BANNER_GEOMETRY;

  const guiding = state === 'guiding';
  const tone = guiding ? 'primary' : NAVIGATION_STATE_TONE[state];
  const accent = resolveAccentColors(theme.colors, tone, 'subtle');
  const Glyph = guiding ? DIRECTIONS_MANEUVER_ICON[maneuver] : NAVIGATION_STATE_ICON[state];

  const stateHeadline = guiding
    ? undefined
    : ((state === 'off-route' ? labels?.offRoute : labels?.rerouting) ??
      NAVIGATION_STATE_LABELS[state]);
  const headline = stateHeadline ?? distance;
  const thenWord = labels?.then ?? 'then';
  const ThenGlyph = thenManeuver !== undefined ? DIRECTIONS_MANEUVER_ICON[thenManeuver] : null;
  const thenLine =
    guiding && (thenManeuver !== undefined || then)
      ? [
          thenWord,
          thenManeuver !== undefined ? maneuverWordFor(thenManeuver, labels).toLowerCase() : null,
          then,
        ]
          .filter(Boolean)
          .join(' ')
      : null;

  const name =
    accessibilityLabel ??
    describeNavigationBanner({ maneuver, distance, instruction, then, thenManeuver, state, labels });

  return (
    <GlassIsland
      radius={g.radius}
      style={[{ alignSelf: 'stretch', flexDirection: 'column' }, style]}
      testID={testID}
    >
      <View role="img" accessibilityLabel={name} testID={testID ? `${testID}-guidance` : undefined}>
        <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: g.padding,
              padding: g.padding,
            }}
          >
            <View
              testID={testID ? `${testID}-glyph` : undefined}
              style={{
                width: g.glyph,
                height: g.glyph,
                borderRadius: borderRadius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: accent.background,
              }}
            >
              <Glyph width={g.glyphIcon} height={g.glyphIcon} fill={accent.foreground} />
            </View>
            {/*
              `minWidth: 0` on the COLUMN, not only on the texts inside it: a
              `numberOfLines={1}` Text is `white-space: nowrap` on web, so its
              min-content width is the whole string, and a flex child without
              this takes that as its floor and pushes the pane wider than the
              phone it is on.
            */}
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              {headline ? (
                <Text
                  variant="title-2-semibold"
                  numberOfLines={1}
                  testID={testID ? `${testID}-headline` : undefined}
                  style={{
                    color: paint.text,
                    ...(guiding ? { fontVariant: ['tabular-nums' as const] } : null),
                  }}
                >
                  {headline}
                </Text>
              ) : null}
              <Text
                variant={headline ? 'headline-medium' : 'title-2-semibold'}
                numberOfLines={2}
                testID={testID ? `${testID}-instruction` : undefined}
                style={{ color: headline ? paint.textSecondary : paint.text }}
              >
                {instruction}
              </Text>
            </View>
          </View>
          {thenLine ? (
            <View
              testID={testID ? `${testID}-then` : undefined}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingLeft: g.padding,
                paddingRight: g.padding,
                paddingTop: 10,
                paddingBottom: 10,
                borderTopWidth: 1,
                borderTopColor: paint.border,
              }}
            >
              {ThenGlyph ? (
                <ThenGlyph
                  width={g.smallGlyph}
                  height={g.smallGlyph}
                  fill={paint.textSecondary}
                />
              ) : null}
              <Text
                variant="body-2-medium"
                numberOfLines={1}
                style={{ flex: 1, minWidth: 0, color: paint.textSecondary }}
              >
                {thenLine}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      {children != null ? (
        <View
          testID={testID ? `${testID}-extras` : undefined}
          style={{
            paddingLeft: g.padding,
            paddingRight: g.padding,
            paddingTop: 10,
            paddingBottom: 10,
            borderTopWidth: 1,
            borderTopColor: paint.border,
          }}
        >
          {children}
        </View>
      ) : null}
    </GlassIsland>
  );
}

export const NavigationBanner = memo(NavigationBannerComponent);
NavigationBanner.displayName = 'NavigationBanner';
