import React, { memo, useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { Divider } from '../divider';
import { useControllableState } from '../hooks/use-controllable-state';
import { RiArrowDownSLine } from '../icons/remix/RiArrowDownSLine';
import { RiArrowUpSLine } from '../icons/remix/RiArrowUpSLine';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  PRICE_LINE_GAP,
  PRICE_PENDING_PLACEHOLDER,
  PRICE_RULE_SPACING,
  PRICE_STATE_LABELS,
} from './constants';
import { PriceSummaryLine } from './PriceSummaryLine';
import { resolvePricePaint } from './shared';
import type { PriceSummaryProps } from './types';

/**
 * What a price is made of: the charges, and the number they add up to.
 *
 *   lines     a `list` of `PriceSummaryLine`s, 4 apart
 *   rule      a hairline above the total, 8 either side
 *   total     title-3-semibold on BOTH sides. The total is the answer, so it is
 *             a type step above the charges rather than the same size in bold —
 *             a reader scanning for the number finds it without reading any of
 *             the lines.
 *   collapse  the LINES fold, never the total: the number stays on screen and
 *             the itemisation is what a reader opts into. The disclosure is a
 *             `text` button carrying `aria-expanded`, so it announces the state
 *             it controls on both platforms.
 *
 * It adds nothing up. Every amount here — each line's and the total's — is a
 * string the app formatted, because currency, locale, rounding and the sign on
 * a credit are all decisions this component cannot make correctly for three
 * different apps.
 */
function PriceSummaryComponent({
  lines,
  total,
  collapsible = false,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  expandLabel = 'Show price details',
  collapseLabel = 'Hide price details',
  stateLabels,
  pendingPlaceholder = PRICE_PENDING_PLACEHOLDER,
  accessibilityLabel = 'Price breakdown',
  style,
  testID,
}: PriceSummaryProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolvePricePaint(theme, surface), [theme, surface]);
  const [open, setOpen] = useControllableState<boolean>({
    value: expanded,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
  });
  const toggle = useCallback(() => setOpen(!open), [open, setOpen]);

  const words = { ...PRICE_STATE_LABELS, ...stateLabels };
  const totalCaveat = total && total.state && total.state !== 'final' ? words[total.state] : undefined;
  const showLines = !collapsible || open;

  return (
    <View testID={testID} style={style}>
      {showLines ? (
        <View
          role="list"
          accessibilityLabel={accessibilityLabel}
          testID={testID ? `${testID}-lines` : undefined}
          style={{ gap: PRICE_LINE_GAP }}
        >
          {lines.map((line, index) => (
            <PriceSummaryLine
              key={line.id ?? index}
              label={line.label}
              sublabel={line.sublabel}
              amount={line.amount}
              secondaryAmount={line.secondaryAmount}
              tone={line.tone}
              state={line.state}
              info={line.info}
              infoAccessibilityLabel={line.infoAccessibilityLabel}
              stateLabels={stateLabels}
              pendingPlaceholder={pendingPlaceholder}
              testID={testID ? `${testID}-line-${index}` : undefined}
            />
          ))}
        </View>
      ) : null}
      {collapsible ? (
        <View style={{ alignItems: 'flex-start', paddingTop: showLines ? PRICE_LINE_GAP : 0 }}>
          <Button
            variant="text"
            size="small"
            trailingIcon={open ? RiArrowUpSLine : RiArrowDownSLine}
            onPress={toggle}
            aria-expanded={open}
            testID={testID ? `${testID}-disclosure` : undefined}
          >
            {open ? collapseLabel : expandLabel}
          </Button>
        </View>
      ) : null}
      {total ? (
        <>
          <Divider color={paint.rule} spacing={PRICE_RULE_SPACING} />
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                variant="title-3-semibold"
                testID={testID ? `${testID}-total-label` : undefined}
                style={{ color: paint.text }}
              >
                {total.label}
              </Text>
              {total.note ? (
                <Text
                  variant="body-2-regular"
                  testID={testID ? `${testID}-total-note` : undefined}
                  style={{ color: paint.textSecondary }}
                >
                  {total.note}
                </Text>
              ) : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text
                variant="title-3-semibold"
                testID={testID ? `${testID}-total-amount` : undefined}
                style={{ color: paint.text, fontVariant: ['tabular-nums'], textAlign: 'right' }}
              >
                {total.amount ?? pendingPlaceholder}
              </Text>
              {total.secondaryAmount ? (
                <Text
                  variant="body-2-regular"
                  testID={testID ? `${testID}-total-secondary-amount` : undefined}
                  style={{ color: paint.textSecondary, fontVariant: ['tabular-nums'], textAlign: 'right' }}
                >
                  {total.secondaryAmount}
                </Text>
              ) : null}
              {totalCaveat ? (
                <Text
                  variant="caption-1-regular"
                  testID={testID ? `${testID}-total-state` : undefined}
                  style={{ color: paint.textTertiary, textAlign: 'right' }}
                >
                  {totalCaveat}
                </Text>
              ) : null}
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}

export const PriceSummary = memo(PriceSummaryComponent);
PriceSummary.displayName = 'PriceSummary';
