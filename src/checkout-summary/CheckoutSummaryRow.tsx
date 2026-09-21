import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { Item } from '../item';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  CHECKOUT_ROW_CHEVRON,
  CHECKOUT_ROW_GLYPH,
  CHECKOUT_ROW_HINT,
  CHECKOUT_ROW_PLACEHOLDER,
  CHECKOUT_ROW_TEXT_GAP,
  CHECKOUT_ROW_TILE,
} from './constants';
import { checkoutRowName, resolveCheckoutPaint } from './shared';
import type { CheckoutSummaryRowProps } from './types';

/**
 * One decision, as a row: what it is, what was chosen, and the press that
 * changes it.
 *
 *   tile      40 round, one surface step off the group behind the row, with a
 *             20 glyph in the secondary rung — `address`'s own geometry, so a
 *             summary and an address list line up
 *   label     caption-2-bold uppercase secondary; the row is read label-first
 *             because every row in the group is a different QUESTION
 *   value     body-medium, up to two lines, falling back to the placeholder
 *   detail    body-2-regular secondary
 *   chevron   20, tertiary, decorative — the whole row is the button
 *
 * It is `Item` with those slots filled in: the press target, the hover and
 * press paint, the density rungs, the disabled opacity and the a11y role are
 * `Item`'s job, and this family owns no second copy of any of them.
 *
 * The label/value pair is a CAPTION OVER A VALUE rather than a title with the
 * value on the right, which is the other row Bloom draws (`SettingsListItem`).
 * The difference is the length: a settings value is a word, and a checkout
 * value is an address, a window and a card number — none of which fits in the
 * right half of a 390 row without truncating the thing the reader came to
 * check.
 */
function CheckoutSummaryRowComponent({
  label,
  icon: Icon,
  leading,
  value,
  placeholder = CHECKOUT_ROW_PLACEHOLDER,
  detail,
  badge,
  content,
  onPress,
  disabled = false,
  accessibilityHint,
  accessibilityLabel,
  style,
  testID,
}: CheckoutSummaryRowProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolveCheckoutPaint(theme, surface), [theme, surface]);
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const chosen = value != null && value !== '';
  const shown = chosen ? value : placeholder;

  // `leading` is read for PRESENCE, not truthiness: `leading={null}` is a row
  // that draws no media, for a group that already has a gutter of its own —
  // and `??` would have quietly given it the tile instead.
  const media =
    leading !== undefined ? (
      leading
    ) : Icon ? (
      <View
        testID={id('tile')}
        style={{
          width: CHECKOUT_ROW_TILE,
          height: CHECKOUT_ROW_TILE,
          borderRadius: CHECKOUT_ROW_TILE / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: paint.tile,
        }}
      >
        <Icon width={CHECKOUT_ROW_GLYPH} height={CHECKOUT_ROW_GLYPH} fill={paint.textSecondary} />
      </View>
    ) : null;

  const body = (
    // `flex: 1` + `minWidth: 0`: `Item` gives `children` no column of its own,
    // and a one-line Text is `nowrap` on web, so without the floor the row's
    // min-content width becomes the whole value string and the page scrolls
    // sideways instead of the value truncating.
    <View style={{ flex: 1, minWidth: 0, gap: CHECKOUT_ROW_TEXT_GAP }}>
      <Text
        variant="caption-2-bold"
        numberOfLines={1}
        testID={id('label')}
        style={{ color: paint.textSecondary, textTransform: 'uppercase' }}
      >
        {label}
      </Text>
      {content !== undefined ? (
        content
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <Text
              variant="body-medium"
              numberOfLines={2}
              testID={id('value')}
              style={{
                flexShrink: 1,
                minWidth: 0,
                color: chosen ? paint.text : paint.textTertiary,
              }}
            >
              {shown}
            </Text>
            {badge}
          </View>
          {detail ? (
            <Text
              variant="body-2-regular"
              numberOfLines={2}
              testID={id('detail')}
              style={{ color: paint.textSecondary }}
            >
              {detail}
            </Text>
          ) : null}
        </>
      )}
    </View>
  );

  return (
    <Item
      leading={media}
      trailing={
        onPress ? (
          <RiArrowRightSLine
            width={CHECKOUT_ROW_CHEVRON}
            height={CHECKOUT_ROW_CHEVRON}
            fill={paint.textTertiary}
          />
        ) : null
      }
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel ?? checkoutRowName(label, chosen ? value : placeholder)}
      // NATIVE ONLY, and knowingly: react-native-web has no `accessibilityHint`
      // — no mapping at all, not a wrong one — so on web the affordance is the
      // `button` role plus the chevron and this says nothing. Recorded in
      // `docs/checkout-summary.mdx` and pinned in `CheckoutSummary.test.tsx`
      // rather than swapped for an `aria-describedby` that native would then
      // announce twice.
      accessibilityHint={onPress ? (accessibilityHint ?? CHECKOUT_ROW_HINT) : accessibilityHint}
      style={style}
      testID={testID}
    >
      {body}
    </Item>
  );
}

export const CheckoutSummaryRow = memo(CheckoutSummaryRowComponent);
CheckoutSummaryRow.displayName = 'CheckoutSummaryRow';
