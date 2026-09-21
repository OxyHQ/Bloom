import React, { memo, useMemo } from 'react';
import { View, type TextStyle } from 'react-native';

import { Badge } from '../badge';
import { RiBankCardLine } from '../icons/remix/RiBankCardLine';
import { Item } from '../item';
import { useSurfaceFill } from '../styles/surface-levels';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { EARNINGS_GEOMETRY, EARNINGS_LABELS, EARNINGS_PAYOUT_TONE } from './constants';
import { joinEarningsName, resolveEarningsPaint } from './shared';
import type { EarningsPayoutRowProps } from './types';

const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };

/**
 * The money that is on its way, and what is holding it up.
 *
 * It is an `Item`, not a card: a payout is a ROW in a panel, and `item` already
 * owns the press target, the density, the leading and trailing slots and the
 * disabled wash. What this component decides is what goes in the three slots.
 *
 *   leading   a 40 glyph tile at the panel's next fill up
 *   content   the title over the date and the destination
 *   trailing  the amount at `headline-semibold` in tabular figures, with the
 *             state `Badge` under it
 *   note      under the row, and ONLY for `held` and `failed` — the two states
 *             that ask the reader to do something. A note on a scheduled payout
 *             is a sentence nobody has to read.
 *
 * **THE STATE IS SAID IN WORDS, NOT ONLY IN COLOUR.** The badge carries the
 * word; the tone is a second channel on top of it, so the row survives a reader
 * who cannot tell the warning tint from the neutral one.
 */
function EarningsPayoutRowComponent({
  payout,
  title,
  onPress,
  action,
  labels: labelOverrides,
  accessibilityLabel,
  style,
  testID,
}: EarningsPayoutRowProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolveEarningsPaint(theme, surface), [theme, surface]);
  const labels = useMemo(
    () => ({
      ...EARNINGS_LABELS,
      ...labelOverrides,
      payoutState: { ...EARNINGS_LABELS.payoutState, ...labelOverrides?.payoutState },
    }),
    [labelOverrides],
  );

  const state = payout.state ?? 'scheduled';
  const stateWord = labels.payoutState[state];
  const heading = title ?? labels.payout;
  const needsAction = state === 'held' || state === 'failed';
  const noteTone = resolveAccentColors(theme.colors, EARNINGS_PAYOUT_TONE[state], 'subtle');
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  const name =
    accessibilityLabel ??
    joinEarningsName([heading, payout.amount, payout.date, stateWord, payout.destination]);

  return (
    // A `group`, not a bare column: `Item`'s non-pressable branch is
    // `role="none"`, on which an `aria-label` is not exposed at all — so the
    // composed name has to hang off something ARIA will read it from.
    <View role="group" accessibilityLabel={name} style={style} testID={testID}>
      <Item
        onPress={onPress}
        accessibilityLabel={onPress ? name : undefined}
        leading={
          <View
            aria-hidden
            style={{
              width: EARNINGS_GEOMETRY.glyph,
              height: EARNINGS_GEOMETRY.glyph,
              borderRadius: EARNINGS_GEOMETRY.glyphRadius,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: paint.tile,
            }}
            testID={id('glyph')}
          >
            <RiBankCardLine width={20} height={20} fill={paint.tileText.textSecondary} />
          </View>
        }
        title={heading}
        subtitle={joinEarningsName([payout.date, payout.destination], ' · ')}
        trailing={
          <View style={{ alignItems: 'flex-end', gap: 4 }} testID={id('amount')}>
            <Text
              variant="headline-semibold"
              numberOfLines={1}
              style={[{ color: paint.text }, TABULAR]}
              testID={id('amount-text')}
            >
              {payout.amount}
            </Text>
            <Badge
              content={stateWord}
              variant="subtle"
              color={EARNINGS_PAYOUT_TONE[state]}
              size="label-small"
              testID={id('state')}
            />
          </View>
        }
        testID={id('row')}
      />
      {payout.note && needsAction ? (
        <Text
          variant="body-2-regular"
          style={{ color: noteTone.foreground, paddingLeft: 12, paddingRight: 12 }}
          testID={id('note')}
        >
          {payout.note}
        </Text>
      ) : null}
      {action ? (
        <View
          style={{ flexDirection: 'row', paddingLeft: 12, paddingTop: 8 }}
          testID={id('action')}
        >
          {action}
        </View>
      ) : null}
    </View>
  );
}

export const EarningsPayoutRow = memo(EarningsPayoutRowComponent);
EarningsPayoutRow.displayName = 'EarningsPayoutRow';
