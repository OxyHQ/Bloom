import React, { memo, useCallback, useState } from 'react';
import { Platform, ScrollView, View, type LayoutChangeEvent } from 'react-native';

import { ActionCardShell } from '../booking/ActionCard';
import { Button } from '../button';
import { RiVideoLine } from '../icons/remix/RiVideoLine';
import { RiUserLine } from '../icons/remix/RiUserLine';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '../segmented-control';
import { Textarea } from '../textarea';
import { Text } from '../typography';
import { SelectChip, useActionPalette } from './parts';
import type { ViewingMode, ViewingSchedulerProps } from './types';

const IS_WEB = Platform.OS === 'web';

/** Slot chips are at least this wide; the grid fits as many columns as that allows. */
export const VIEWING_SLOT_MIN_WIDTH = 76;
const GAP = 8;

/** Columns and chip width for a slot grid `width` wide. */
export function slotGrid(width: number): { columns: number; chipWidth: number } {
  const columns = Math.max(1, Math.floor((width + GAP) / (VIEWING_SLOT_MIN_WIDTH + GAP)));
  return { columns, chipWidth: Math.floor((width - GAP * (columns - 1)) / columns) };
}

/**
 * Book a viewing: a day, a time, in person or by video, a note.
 *
 *   title      headline-semibold
 *   days       16 below; a horizontal scroll of 56-wide day tiles, 8 apart,
 *              radius 12, weekday caption-1-regular over the date
 *              headline-semibold; unavailable days at 40% and not pressable
 *   times      20 below; caption label, then a grid of 36-tall pill chips at
 *              least 76 wide, 8 apart, filling the row
 *   selected   INVERTED — text-primary fill, surface ink — on days and times
 *   mode       20 below; `SegmentedControl` (radio), full width
 *   note       16 below; `Textarea`, 2 rows
 *   button     20 below; "Request viewing" primary large, full width;
 *              disabled until a day and a time are chosen
 *
 * Fully controlled: the app owns which days and slots exist, and reloads
 * `slots` when the day changes.
 */
function ViewingSchedulerComponent({
  title = 'Schedule a viewing',
  days,
  day,
  onDayChange,
  slots,
  slot,
  onSlotChange,
  emptySlotsLabel = 'No times left on this day',
  mode,
  onModeChange,
  modeLabels,
  note,
  onNoteChange,
  noteLabel = 'Note for the landlord',
  notePlaceholder,
  dayLabel = 'Day',
  timeLabel = 'Time',
  submitLabel = 'Request viewing',
  onSubmit,
  submitDisabled,
  loading = false,
  footer,
  maxWidth,
  style,
  testID,
}: ViewingSchedulerProps) {
  const palette = useActionPalette();
  const [gridWidth, setGridWidth] = useState<number | null>(null);
  const onGridLayout = useCallback((e: LayoutChangeEvent) => {
    setGridWidth(Math.round(e.nativeEvent.layout.width));
  }, []);
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const chipWidth = gridWidth != null ? slotGrid(gridWidth).chipWidth : VIEWING_SLOT_MIN_WIDTH;
  const selectedSlot = slots.find((s) => s.value === slot && !s.disabled);
  const canSubmit = day != null && selectedSlot != null;
  const disabled = submitDisabled ?? !canSubmit;
  const inPerson = modeLabels?.['in-person'] ?? 'In person';
  const video = modeLabels?.video ?? 'Video call';
  const groupRole = IS_WEB ? { role: 'radiogroup' as const } : null;

  const caption = (text: string) => (
    <Text
      variant="body-2-medium"
      importantForAccessibility="no"
      accessibilityElementsHidden
      {...(IS_WEB ? { 'aria-hidden': true as const } : null)}
      style={{ color: palette.text }}
    >
      {text}
    </Text>
  );

  return (
    <ActionCardShell testID={testID} maxWidth={maxWidth} style={style}>
      {title != null ? (
        <Text variant="headline-semibold" accessibilityRole="header" style={{ color: palette.text, marginBottom: 16 }}>
          {title}
        </Text>
      ) : null}

      {caption(dayLabel)}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityLabel={dayLabel}
        {...groupRole}
        testID={id('days')}
        style={{ marginTop: 8, marginLeft: -24, marginRight: -24 }}
        contentContainerStyle={{ gap: GAP, paddingLeft: 24, paddingRight: 24 }}
      >
        {days.map((d) => (
          <SelectChip
            key={d.value}
            shape="day"
            selected={d.value === day}
            disabled={d.disabled}
            onPress={onDayChange ? () => onDayChange(d.value) : undefined}
            accessibilityLabel={d.accessibilityLabel ?? `${d.weekday} ${d.day}`}
            testID={id(`day-${d.value}`)}
          >
            {(ink) => (
              <>
                <Text variant="caption-1-regular" style={{ color: ink }}>
                  {d.weekday}
                </Text>
                <Text
                  variant="headline-semibold"
                  style={{
                    color: ink,
                    fontVariant: ['tabular-nums'],
                    textDecorationLine: d.disabled ? 'line-through' : 'none',
                  }}
                >
                  {d.day}
                </Text>
              </>
            )}
          </SelectChip>
        ))}
      </ScrollView>

      <View style={{ marginTop: 20 }}>{caption(timeLabel)}</View>
      {slots.length === 0 ? (
        <Text
          variant="body-2-regular"
          testID={id('slots-empty')}
          style={{ marginTop: 8, color: palette.textSecondary }}
        >
          {emptySlotsLabel}
        </Text>
      ) : (
        <View
          onLayout={onGridLayout}
          accessibilityLabel={timeLabel}
          {...groupRole}
          testID={id('slots')}
          style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}
        >
          {slots.map((s) => (
            <SelectChip
              key={s.value}
              shape="slot"
              selected={s.value === slot}
              disabled={s.disabled}
              onPress={onSlotChange ? () => onSlotChange(s.value) : undefined}
              accessibilityLabel={s.accessibilityLabel ?? s.label}
              style={{ width: chipWidth }}
              testID={id(`slot-${s.value}`)}
            >
              {(ink) => (
                <Text
                  variant="body-2-medium"
                  numberOfLines={1}
                  style={{ color: ink, fontVariant: ['tabular-nums'] }}
                >
                  {s.label}
                </Text>
              )}
            </SelectChip>
          ))}
        </View>
      )}

      {mode !== undefined ? (
        <SegmentedControl<ViewingMode>
          label="Viewing type"
          type="radio"
          size="large"
          value={mode}
          onChange={(value) => onModeChange?.(value)}
          style={{ marginTop: 20, alignSelf: 'stretch' }}
        >
          <SegmentedControlItem value="in-person" style={{ flex: 1 }} testID={id('mode-in-person')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <RiUserLine width={16} height={16} fill={mode === 'in-person' ? palette.text : palette.textSecondary} />
              <SegmentedControlItemText>{inPerson}</SegmentedControlItemText>
            </View>
          </SegmentedControlItem>
          <SegmentedControlItem value="video" style={{ flex: 1 }} testID={id('mode-video')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <RiVideoLine width={16} height={16} fill={mode === 'video' ? palette.text : palette.textSecondary} />
              <SegmentedControlItemText>{video}</SegmentedControlItemText>
            </View>
          </SegmentedControlItem>
        </SegmentedControl>
      ) : null}

      {onNoteChange ? (
        <Textarea
          label={noteLabel}
          value={note ?? ''}
          onChangeText={onNoteChange}
          placeholder={notePlaceholder}
          rows={2}
          testID={id('note')}
          style={{ marginTop: 16 }}
        />
      ) : null}

      <Button
        variant="primary"
        size="large"
        fullWidth
        onPress={onSubmit}
        disabled={disabled}
        loading={loading}
        style={{ marginTop: 20, alignSelf: 'stretch' }}
        testID={id('submit')}
      >
        {submitLabel}
      </Button>

      {footer != null ? <View style={{ marginTop: 16, alignItems: 'center' }}>{footer}</View> : null}
    </ActionCardShell>
  );
}

export const ViewingScheduler = memo(ViewingSchedulerComponent);
ViewingScheduler.displayName = 'ViewingScheduler';
