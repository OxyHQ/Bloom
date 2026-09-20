import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { GlyphButton } from '../button';
import { RiInformationLine } from '../icons/remix/RiInformationLine';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  PRICE_INFO_GLYPH,
  PRICE_INFO_SIZE,
  PRICE_LINE_HEIGHT,
  PRICE_PENDING_PLACEHOLDER,
  PRICE_STATE_LABELS,
} from './constants';
import { resolvePricePaint } from './shared';
import type { PriceSummaryLineProps } from './types';

/**
 * ONE charge: what it is on the left, what it costs on the right.
 *
 *   label     body-regular; `sublabel` body-2-regular secondary beneath it
 *   amount    body-regular, TABULAR figures, right-aligned — a column of
 *             proportional digits does not line up and a price column that does
 *             not line up cannot be scanned
 *   state     "Estimated" / "Pending" in caption-1 under the amount, so the
 *             caveat travels with the NUMBER rather than with the label; the
 *             row keeps its own reading order for a screen reader
 *   info      a 32 round glyph after the label, opening a `Popover`
 *   height    32 minimum, whether or not the line has the info affordance
 *
 * The amount is drawn exactly as it arrives. Nothing here parses a number,
 * applies a sign or picks a currency: `tone="discount"` colours a credit, it
 * does not negate one.
 */
function PriceSummaryLineComponent({
  label,
  sublabel,
  amount,
  tone = 'default',
  state = 'final',
  info,
  infoAccessibilityLabel,
  stateLabels,
  pendingPlaceholder = PRICE_PENDING_PLACEHOLDER,
  style,
  testID,
}: PriceSummaryLineProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolvePricePaint(theme, surface), [theme, surface]);
  const words = { ...PRICE_STATE_LABELS, ...stateLabels };

  const muted = tone === 'muted';
  const labelColor = muted ? paint.textSecondary : paint.text;
  const amountColor =
    tone === 'discount' ? paint.discount : muted ? paint.textSecondary : paint.text;
  const caveat = state === 'final' ? undefined : words[state];

  return (
    <View
      role="listitem"
      testID={testID}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          minHeight: PRICE_LINE_HEIGHT,
        },
        style,
      ]}
    >
      <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <View style={{ flexShrink: 1, minWidth: 0 }}>
          <Text variant="body-regular" testID={testID ? `${testID}-label` : undefined} style={{ color: labelColor }}>
            {label}
          </Text>
          {sublabel ? (
            <Text
              variant="body-2-regular"
              testID={testID ? `${testID}-sublabel` : undefined}
              style={{ color: paint.textSecondary }}
            >
              {sublabel}
            </Text>
          ) : null}
        </View>
        {info != null ? (
          <Popover>
            <PopoverTrigger asChild>
              <GlyphButton
                size={PRICE_INFO_SIZE}
                glyphSize={PRICE_INFO_GLYPH}
                icon={RiInformationLine}
                color={paint.textTertiary}
                hoverColor={paint.text}
                accessibilityLabel={infoAccessibilityLabel ?? `About ${label}`}
                testID={testID ? `${testID}-info` : undefined}
              />
            </PopoverTrigger>
            <PopoverContent label={label} side="top" align="start" maxWidth={280}>
              {typeof info === 'string' ? (
                <Text variant="body-2-regular" style={{ color: paint.text }}>
                  {info}
                </Text>
              ) : (
                info
              )}
            </PopoverContent>
          </Popover>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text
          variant="body-regular"
          testID={testID ? `${testID}-amount` : undefined}
          style={{ color: amountColor, fontVariant: ['tabular-nums'], textAlign: 'right' }}
        >
          {amount ?? pendingPlaceholder}
        </Text>
        {caveat ? (
          <Text
            variant="caption-1-regular"
            testID={testID ? `${testID}-state` : undefined}
            style={{ color: paint.textTertiary, textAlign: 'right' }}
          >
            {caveat}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export const PriceSummaryLine = memo(PriceSummaryLineComponent);
PriceSummaryLine.displayName = 'PriceSummaryLine';
