import React, { memo } from 'react';
import { View } from 'react-native';

import { Meter } from '../stat-bar';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { WizardProgressProps } from './types';

/**
 * The header of a multi-step flow: a segmented bar, the step count and the
 * current step's title.
 *
 *   bar       one segment per step, 4 tall, 4 apart, radius 2, sharing the
 *             width equally. Each segment is a `Meter`: track neutral-200
 *             (dark neutral-700), fill the accent. Done steps are full, the
 *             current step fills to `currentProgress`, later steps are empty.
 *   count     caption-1-medium, text-secondary, 16 under the bar ("Step 3 of 8"),
 *             with the optional `action` on its right
 *   title     title-2-semibold, text-primary, 4 under the count, a heading
 *   desc      body-regular, text-secondary, 4 under the title
 *
 * The fill eases its width over 300ms on web and snaps under reduced motion;
 * native snaps. `Meter` owns that transition now — the duration rides in on a
 * custom property, so the stylesheet is the one every meter shares.
 *
 * Accessibility: the bar is a `progressbar` over the whole flow —
 * `aria-valuemin` 0, `aria-valuemax` the step count, `aria-valuenow` the done
 * steps plus the current step's progress — named by the count and the title.
 * The segments themselves are `decorative` meters: two nested progressbars
 * would announce the same measurement twice.
 */

const SEGMENT_HEIGHT = 4;
const SEGMENT_GAP = 4;
const SEGMENT_TRANSITION_MS = 300;

/** The fill fraction of each segment. Pure. */
export function wizardSegmentFills(total: number, current: number, currentProgress: number): number[] {
  const clampedCurrent = Math.min(Math.max(0, current), Math.max(0, total - 1));
  const partial = Math.min(1, Math.max(0, currentProgress));
  return Array.from({ length: total }, (_, index) =>
    index < clampedCurrent ? 1 : index === clampedCurrent ? partial : 0,
  );
}

function WizardProgressComponent({
  steps,
  current,
  currentProgress = 0.5,
  formatStepCount = (position, total) => `Step ${position} of ${total}`,
  hideTitle = false,
  action,
  headingLevel = 1,
  accessibilityLabel,
  style,
  testID,
}: WizardProgressProps) {
  const theme = useTheme();

  const total = steps.length;
  const index = Math.min(Math.max(0, current), Math.max(0, total - 1));
  const step = steps[index];
  const fills = wizardSegmentFills(total, index, currentProgress);
  const done = fills.reduce((sum, fill) => sum + fill, 0);
  const countLine = formatStepCount(index + 1, total);
  const name = accessibilityLabel ?? (step ? `${countLine}, ${step.title}` : countLine);

  return (
    <View testID={testID} style={[{ gap: 16 }, style]}>
      <View
        role="progressbar"
        accessibilityLabel={name}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.round(done * 100) / 100}
        aria-valuetext={name}
        testID={testID ? `${testID}-bar` : undefined}
        style={{ flexDirection: 'row', gap: SEGMENT_GAP }}
      >
        {fills.map((fill, i) => (
          <Meter
            key={steps[i]?.key ?? i}
            decorative
            value={fill}
            height={SEGMENT_HEIGHT}
            transitionMs={SEGMENT_TRANSITION_MS}
            testID={testID ? `${testID}-segment-${i}` : undefined}
            style={{ flex: 1 }}
          />
        ))}
      </View>
      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 20 }}>
          <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
            {countLine}
          </Text>
          {action ?? null}
        </View>
        {!hideTitle && step ? (
          <>
            <Text
              variant="title-2-semibold"
              role="heading"
              aria-level={headingLevel}
              style={{ color: theme.colors.text }}
            >
              {step.title}
            </Text>
            {step.description ? (
              <Text variant="body-regular" style={{ color: theme.colors.textSecondary }}>
                {step.description}
              </Text>
            ) : null}
          </>
        ) : null}
      </View>
    </View>
  );
}

export const WizardProgress = memo(WizardProgressComponent);
WizardProgress.displayName = 'WizardProgress';
