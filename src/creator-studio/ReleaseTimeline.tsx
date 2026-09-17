import React, { memo, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { resolveCreatorStudioPaint, type CreatorStudioPaint } from './shared';
import type { ReleaseStep, ReleaseStepState, ReleaseTimelineProps } from './types';

/**
 * `ReleaseTimeline`: a release's distribution steps — Uploaded → Metadata →
 * Artwork → Review → Scheduled → Live — with a state and a date each.
 *
 *   marker     24px disc: complete — accent fill, 14px white check;
 *              current — accent 2px ring around an 8px accent dot;
 *              upcoming — 2px neutral ring; error — error fill, white cross
 *   connector  2px, accent after a complete step, track otherwise
 *   vertical   marker column, 12 gap, label `body-medium` (`body-2-medium`
 *              text-secondary when upcoming) + date `caption-1-regular`
 *              text-tertiary on the right, description `body-2-regular` under
 *              it (error colour on an error step); 16 between steps with the
 *              connector running through the gap
 *   horizontal markers on one line joined by connectors, each label and date
 *              centred under its marker; the steps share the width equally.
 *              Under 96px per step of its own width it renders vertically
 *
 * Assistive tech gets a list (`role="list"`) of items named
 * "<label>, <state>, <date>"; the current step carries `aria-current="step"`.
 */

export const RELEASE_STEP_STATE_LABELS: Record<ReleaseStepState, string> = {
  complete: 'complete',
  current: 'in progress',
  upcoming: 'not started',
  error: 'needs attention',
};

const MARKER = 24;
/** The narrowest a horizontal step may be before the timeline falls back to vertical. */
const HORIZONTAL_STEP_MIN = 96;

/** The spoken name of one step. */
export function releaseStepAccessibilityLabel(
  step: ReleaseStep,
  stateLabels: Record<ReleaseStepState, string> = RELEASE_STEP_STATE_LABELS,
): string {
  return [step.label, stateLabels[step.state], step.date, step.description].filter(Boolean).join(', ');
}

function Marker({ state, paint }: { state: ReleaseStepState; paint: CreatorStudioPaint }) {
  if (state === 'complete') {
    return (
      <View style={[styles.marker, { backgroundColor: paint.accent }]}>
        <RiCheckLine width={14} height={14} fill={paint.onAccent} />
      </View>
    );
  }
  if (state === 'error') {
    return (
      <View style={[styles.marker, { backgroundColor: paint.error }]}>
        <RiCloseLine width={14} height={14} fill="#fff" />
      </View>
    );
  }
  if (state === 'current') {
    return (
      <View style={[styles.marker, styles.ring, { borderColor: paint.accent }]}>
        <View style={[styles.dot, { backgroundColor: paint.accent }]} />
      </View>
    );
  }
  return <View style={[styles.marker, styles.ring, { borderColor: paint.ring }]} />;
}

function ReleaseTimelineComponent({
  steps,
  orientation = 'vertical',
  accessibilityLabel = 'Release progress',
  stateLabels: stateOverrides,
  style,
  testID,
}: ReleaseTimelineProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveCreatorStudioPaint(theme), [theme]);
  const stateLabels = { ...RELEASE_STEP_STATE_LABELS, ...stateOverrides };
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    setWidth((prev) => (prev === next ? prev : next));
  }, []);
  // A row of steps needs room for its labels; narrower than that it reads as a column.
  const horizontal =
    orientation === 'horizontal' && (width === 0 || width >= steps.length * HORIZONTAL_STEP_MIN);

  return (
    <View
      onLayout={onLayout}
      role="list"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[horizontal ? styles.rootHorizontal : styles.rootVertical, style]}
    >
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        const first = i === 0;
        const muted = step.state === 'upcoming';
        const connector = step.state === 'complete' ? paint.accent : paint.track;
        const previousConnector = steps[i - 1]?.state === 'complete' ? paint.accent : paint.track;
        const itemProps = {
          role: 'listitem' as const,
          accessibilityLabel: releaseStepAccessibilityLabel(step, stateLabels),
          ...(step.state === 'current' ? { 'aria-current': 'step' as const } : null),
          testID: testID ? `${testID}-step-${step.id}` : undefined,
        };
        const label = (
          <Text
            variant={muted ? 'body-2-medium' : 'body-medium'}
            numberOfLines={horizontal ? 2 : 1}
            style={[
              { color: muted ? paint.textSecondary : paint.text },
              horizontal ? styles.centerText : styles.flexText,
            ]}
          >
            {step.label}
          </Text>
        );
        const date = step.date ? (
          <Text
            variant="caption-1-regular"
            numberOfLines={1}
            style={[{ color: paint.textTertiary }, horizontal ? styles.centerText : null]}
          >
            {step.date}
          </Text>
        ) : null;
        const description = step.description ? (
          <Text
            variant="body-2-regular"
            style={[
              { color: step.state === 'error' ? paint.error : paint.textSecondary },
              horizontal ? styles.centerText : null,
            ]}
          >
            {step.description}
          </Text>
        ) : null;

        if (horizontal) {
          return (
            <View key={step.id} {...itemProps} style={styles.hItem}>
              <View style={styles.hTrack}>
                <View
                  style={[styles.hConnector, { backgroundColor: first ? 'transparent' : previousConnector }]}
                />
                <Marker state={step.state} paint={paint} />
                <View style={[styles.hConnector, { backgroundColor: last ? 'transparent' : connector }]} />
              </View>
              <View style={styles.hText}>
                {label}
                {date}
                {description}
              </View>
            </View>
          );
        }

        return (
          <View key={step.id} {...itemProps} style={styles.vItem}>
            <View style={styles.vRail}>
              <Marker state={step.state} paint={paint} />
              {last ? null : <View style={[styles.vConnector, { backgroundColor: connector }]} />}
            </View>
            <View style={[styles.vText, last ? null : styles.vTextGap]}>
              <View style={styles.vHeading}>
                {label}
                {date}
              </View>
              {description}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export const ReleaseTimeline = memo(ReleaseTimelineComponent);
ReleaseTimeline.displayName = 'ReleaseTimeline';

const styles = StyleSheet.create({
  rootVertical: { width: '100%' },
  rootHorizontal: { width: '100%', flexDirection: 'row', alignItems: 'flex-start' },
  marker: {
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ring: { borderWidth: 2, backgroundColor: 'transparent' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  vItem: { flexDirection: 'row', gap: 12 },
  vRail: { width: MARKER, alignItems: 'center' },
  vConnector: { width: 2, flexGrow: 1, minHeight: 16, marginTop: 4, marginBottom: 4, borderRadius: 1 },
  vText: { flex: 1, minWidth: 0, gap: 2, paddingTop: 2 },
  vTextGap: { paddingBottom: 16 },
  vHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  flexText: { flexShrink: 1 },
  hItem: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0, alignItems: 'center', gap: 8 },
  hTrack: { width: '100%', flexDirection: 'row', alignItems: 'center' },
  hConnector: { flex: 1, height: 2 },
  hText: { alignItems: 'center', gap: 2, paddingLeft: 4, paddingRight: 4 },
  centerText: { textAlign: 'center' },
});
