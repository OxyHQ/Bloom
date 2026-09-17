import React, { memo, useCallback, useMemo, useState } from 'react';
import { Platform, View, type LayoutChangeEvent } from 'react-native';

import { ActionCardNote, ActionCardShell } from '../booking/ActionCard';
import { BookingFieldCell } from '../booking/BookingFieldCell';
import { BOOKING_FIELD_RADIUS } from '../booking/shared';
import { Button } from '../button';
import { Chip } from '../chip';
import { RiArrowLeftRightLine } from '../icons/remix/RiArrowLeftRightLine';
import { borderRadius } from '../styles/tokens';
import { EXCHANGE_MODE_LABELS, EXCHANGE_STACK_BELOW } from './constants';
import { HomeTile, useActionPalette, useFocusSheet } from './parts';
import type { ExchangeMode, ExchangeProposalCardProps } from './types';

const IS_WEB = Platform.OS === 'web';
const SWAP_GLYPH = 36;
const HOMES_GAP = 10;
/** A tile's caption-2 label line (15) and the gap under it (8). */
const TILE_LABEL = 23;
const ALL_MODES: readonly ExchangeMode[] = ['swap', 'host', 'both'];

/**
 * A home-swap proposal: your home and theirs, when, how many, and how.
 *
 *   homes      two `HomeTile`s — label caption-2-bold uppercase, a 4:3 photo
 *              radius 12, title body-2-medium, location and size
 *              caption-1-regular text-secondary — with a 36 round swap glyph
 *              between them (1px hairline, surface fill). Below 360 wide
 *              (`layout="auto"`) they stack as 72-square rows and the glyph
 *              turns 90°
 *   box        20 below; DATES | GUESTS cells, `BookingCard`'s box
 *   modes      16 below; `Chip`s (xl — 32 tall, a target rather than a tag —
 *              `selected` for the chosen mode)
 *   button     16 below; "Propose a swap" primary large, full width
 *   note       12 below; centred
 */
function ExchangeProposalCardComponent({
  yourHome,
  theirHome,
  yourHomeLabel = 'Your home',
  theirHomeLabel = 'Their home',
  dates,
  onPressDates,
  guests,
  onPressGuests,
  datesLabel = 'Dates',
  guestsLabel = 'Guests',
  datesPlaceholder = 'Add dates',
  guestsPlaceholder = 'Add guests',
  mode,
  onModeChange,
  modes = ALL_MODES,
  modeLabels,
  proposeLabel = 'Propose a swap',
  onPropose,
  proposeDisabled = false,
  loading = false,
  note,
  footer,
  layout = 'auto',
  style,
  testID,
}: ExchangeProposalCardProps) {
  const palette = useActionPalette();
  useFocusSheet();
  const [width, setWidth] = useState<number | null>(null);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setWidth(Math.round(e.nativeEvent.layout.width));
  }, []);
  const [rowWidth, setRowWidth] = useState<number | null>(null);
  const onRowLayout = useCallback((e: LayoutChangeEvent) => {
    setRowWidth(Math.round(e.nativeEvent.layout.width));
  }, []);
  const stacked =
    layout === 'vertical' || (layout === 'auto' && width != null && width < EXCHANGE_STACK_BELOW);
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const labels = useMemo(() => ({ ...EXCHANGE_MODE_LABELS, ...modeLabels }), [modeLabels]);

  // Side by side, the glyph sits on the photos' centre line: the label (15 +
  // 8 gap) plus half a 4:3 photo as wide as one tile.
  const tileWidth = rowWidth != null ? (rowWidth - SWAP_GLYPH - HOMES_GAP * 2) / 2 : 0;
  const arrowTop = rowWidth != null ? Math.round(TILE_LABEL + (tileWidth * 3) / 4 / 2 - SWAP_GLYPH / 2) : 0;

  const arrow = (
    <View
      testID={id('swap-glyph')}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      {...(IS_WEB ? { 'aria-hidden': true as const } : null)}
      style={{
        width: SWAP_GLYPH,
        height: SWAP_GLYPH,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.surface,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: stacked ? 'center' : 'flex-start',
        marginTop: stacked ? 0 : arrowTop,
        transform: stacked ? [{ rotate: '90deg' }] : undefined,
      }}
    >
      <RiArrowLeftRightLine width={18} height={18} fill={palette.text} />
    </View>
  );

  return (
    <ActionCardShell testID={testID} onLayout={onLayout} style={style}>
      <View
        testID={id('homes')}
        onLayout={onRowLayout}
        style={{
          flexDirection: stacked ? 'column' : 'row',
          alignItems: stacked ? 'stretch' : 'flex-start',
          gap: stacked ? 8 : HOMES_GAP,
        }}
      >
        <HomeTile
          home={yourHome}
          label={yourHomeLabel}
          orientation={stacked ? 'horizontal' : 'vertical'}
          style={stacked ? undefined : { flex: 1, minWidth: 0 }}
          testID={id('your-home')}
        />
        {arrow}
        <HomeTile
          home={theirHome}
          label={theirHomeLabel}
          orientation={stacked ? 'horizontal' : 'vertical'}
          style={stacked ? undefined : { flex: 1, minWidth: 0 }}
          testID={id('their-home')}
        />
      </View>

      <View
        testID={id('fields')}
        style={{
          marginTop: 20,
          flexDirection: 'row',
          borderWidth: 1,
          borderColor: palette.fieldBorder,
          borderRadius: BOOKING_FIELD_RADIUS,
        }}
      >
        <BookingFieldCell
          label={datesLabel}
          value={dates}
          placeholder={datesPlaceholder}
          active={false}
          palette={palette}
          onPress={onPressDates ? () => onPressDates() : undefined}
          style={{ flex: 1, minWidth: 0 }}
          testID={id('dates')}
        />
        <View style={{ width: 1, backgroundColor: palette.fieldBorder }} />
        <BookingFieldCell
          label={guestsLabel}
          value={guests}
          placeholder={guestsPlaceholder}
          active={false}
          palette={palette}
          onPress={onPressGuests ? () => onPressGuests() : undefined}
          style={{ flex: 1, minWidth: 0 }}
          testID={id('guests')}
        />
      </View>

      {mode !== undefined ? (
        <View
          testID={id('modes')}
          style={{ marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
        >
          {modes.map((value) => (
            <Chip
              key={value}
              size="xl"
              variant="outlined"
              selected={mode === value}
              onPress={onModeChange ? () => onModeChange(value) : undefined}
              testID={id(`mode-${value}`)}
            >
              {labels[value]}
            </Chip>
          ))}
        </View>
      ) : null}

      <Button
        variant="primary"
        size="large"
        fullWidth
        onPress={onPropose}
        disabled={proposeDisabled}
        loading={loading}
        style={{ marginTop: 16, alignSelf: 'stretch' }}
        testID={id('propose')}
      >
        {proposeLabel}
      </Button>

      {note != null ? <ActionCardNote style={{ marginTop: 12 }}>{note}</ActionCardNote> : null}

      {footer != null ? <View style={{ marginTop: 24, alignItems: 'center' }}>{footer}</View> : null}
    </ActionCardShell>
  );
}

export const ExchangeProposalCard = memo(ExchangeProposalCardComponent);
ExchangeProposalCard.displayName = 'ExchangeProposalCard';
