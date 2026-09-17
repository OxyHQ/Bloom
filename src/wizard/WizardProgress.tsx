import React, { memo, useEffect, useMemo } from 'react';
import { Platform, View } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import { webDataSet } from '../checkbox/shared';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { WizardProgressProps } from './types';

/**
 * The header of a multi-step flow: a segmented bar, the step count and the
 * current step's title.
 *
 *   bar       one segment per step, 4 tall, 4 apart, radius 2, sharing the
 *             width equally. Track neutral-300 (dark neutral-700); fill
 *             text-primary. Done steps are full, the current step fills to
 *             `currentProgress`, later steps are empty.
 *   count     caption-1-medium, text-secondary, 16 under the bar ("Step 3 of 8"),
 *             with the optional `action` on its right
 *   title     title-2-semibold, text-primary, 4 under the count, a heading
 *   desc      body-regular, text-secondary, 4 under the title
 *
 * The fill eases its width over 300ms on web and snaps under reduced motion;
 * native snaps.
 *
 * Accessibility: the bar is a `progressbar` over the whole flow —
 * `aria-valuemin` 0, `aria-valuemax` the step count, `aria-valuenow` the done
 * steps plus the current step's progress — named by the count and the title.
 * The segments themselves are hidden from assistive technology.
 */

const IS_WEB = Platform.OS === 'web';
const SEGMENT_HEIGHT = 4;
const SEGMENT_GAP = 4;

const STYLE_ID = 'bloom-wizard-progress-web-css';
const FILL = '[data-bloom-wizard-segment-fill]';
const CSS = `
${FILL} {
  transition: width 300ms ease-out;
}
@media (prefers-reduced-motion: reduce) {
  ${FILL} {
    transition: none;
  }
}
`;

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
  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(STYLE_ID, CSS);
  }, []);
  const { neutral } = useMemo(() => resolveButtonRamps(theme), [theme]);

  const total = steps.length;
  const index = Math.min(Math.max(0, current), Math.max(0, total - 1));
  const step = steps[index];
  const fills = wizardSegmentFills(total, index, currentProgress);
  const done = fills.reduce((sum, fill) => sum + fill, 0);
  const countLine = formatStepCount(index + 1, total);
  const name = accessibilityLabel ?? (step ? `${countLine}, ${step.title}` : countLine);
  const track = theme.isDark ? neutral[700] : neutral[300];

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
          <View
            key={steps[i]?.key ?? i}
            aria-hidden
            testID={testID ? `${testID}-segment-${i}` : undefined}
            style={{
              flex: 1,
              height: SEGMENT_HEIGHT,
              borderRadius: SEGMENT_HEIGHT / 2,
              backgroundColor: track,
              overflow: 'hidden',
            }}
          >
            <View
              {...webDataSet({ bloomWizardSegmentFill: '' })}
              testID={testID ? `${testID}-segment-${i}-fill` : undefined}
              style={
                {
                  width: `${fill * 100}%`,
                  height: SEGMENT_HEIGHT,
                  backgroundColor: theme.colors.text,
                } satisfies WebCssStyle
              }
            />
          </View>
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
