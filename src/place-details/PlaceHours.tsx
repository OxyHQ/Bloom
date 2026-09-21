import React, { memo, useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../accordion';
import { Badge } from '../badge';
import { useControllableState } from '../hooks/use-controllable-state';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import { PLACE_OPEN_TONE } from '../place-card/constants';
import { openLabelFor } from '../place-card/shared';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { PLACE_DETAILS_GEOMETRY } from './constants';
import { describeHoursDay, formatHoursDay, resolvePlaceDetailsPaint, type HoursFormat } from './shared';
import type { PlaceHoursProps } from './types';

/** The accordion's one item. A week is a single disclosure, not a set of them. */
const WEEK = 'week';

/**
 * When a place is open: today's answer, over the week it comes from.
 *
 *   trigger  a clock glyph, the state as a `Badge` on its tone, then TODAY'S
 *            LINE as a sentence. Pressing it opens the week; the chevron, the
 *            `aria-expanded` and the reveal are `Accordion`'s
 *   week      one row a day — the day on the left, its hours on the right,
 *            tabular so the columns of digits line up down the column
 *   today     `body-semibold` in the primary text colour against
 *            `body-regular` in the secondary one, `aria-current`, and the word
 *            "Today" in its announcement
 *   exception a `warning` `Badge` under that day's hours ("Public holiday")
 *
 * THE PILL AND THE SENTENCE ARE THE SAME TWO THINGS `PlaceCard` DRAWS, and
 * deliberately the same code: the state word comes from `openLabelFor` and the
 * tone from `PLACE_OPEN_TONE`, so a place cannot be "Open" on the header of a
 * sheet and "Closing soon" in the body of it.
 *
 * NOTHING HERE READS A CLOCK. `summary` is the app's sentence and `today` is
 * the app's flag: the hours of a place are in the place's timezone, the reader
 * is in another, and "open" also depends on a holiday calendar Bloom has never
 * heard of. A component that guessed would be wrong twice a year, quietly.
 *
 * A SPLIT DAY STAYS ON ONE LINE (`07:30 – 14:00, 17:00 – 20:00`). The week is
 * read as a column, and a day that takes two rows breaks the alignment that
 * makes the column scannable.
 */
function PlaceHoursComponent({
  days,
  state,
  stateLabel,
  summary,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  todayLabel = 'Today',
  closedLabel = 'Closed',
  intervalSeparator = ' – ',
  splitSeparator = ', ',
  accessibilityLabel = 'Opening hours',
  style,
  testID,
}: PlaceHoursProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolvePlaceDetailsPaint(theme, surface), [theme, surface]);
  const format = useMemo<HoursFormat>(
    () => ({ interval: intervalSeparator, split: splitSeparator, closed: closedLabel }),
    [intervalSeparator, splitSeparator, closedLabel],
  );

  const [open, setOpen] = useControllableState<boolean>({
    value: expanded,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
  });

  const onValueChange = useCallback(
    (next: string | string[] | undefined) => setOpen(next === WEEK),
    [setOpen],
  );

  const word = openLabelFor(state, stateLabel);

  return (
    <View
      role="group"
      accessibilityLabel={accessibilityLabel}
      style={style}
      testID={testID}
    >
      <Accordion type="single" value={open ? WEEK : undefined} onValueChange={onValueChange}>
        <AccordionItem value={WEEK}>
          <AccordionTrigger
            icon={
              <RiTimeLine
                width={PLACE_DETAILS_GEOMETRY.glyph}
                height={PLACE_DETAILS_GEOMETRY.glyph}
                fill={paint.textSecondary}
              />
            }
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flexWrap: 'wrap',
                columnGap: 8,
                rowGap: 4,
              }}
            >
              {word && state ? (
                <Badge
                  content={word}
                  variant="subtle"
                  color={PLACE_OPEN_TONE[state]}
                  size="label-small"
                  testID={testID ? `${testID}-state` : undefined}
                />
              ) : null}
              {summary ? (
                <Text
                  variant="body-regular"
                  style={{ color: paint.text }}
                  testID={testID ? `${testID}-summary` : undefined}
                >
                  {summary}
                </Text>
              ) : null}
            </View>
          </AccordionTrigger>
          <AccordionContent>
            {/*
              `AccordionContent` keeps its children MOUNTED while shut (it
              animates `maxHeight` to 0), so the week would still be read out
              by a screen reader under a trigger that says `aria-expanded`
              false. Nothing inside takes focus, so hiding it while shut costs
              nothing and removes the contradiction.
            */}
            <View
              role="list"
              aria-hidden={open ? undefined : true}
              accessibilityElementsHidden={!open}
              importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
              style={{ paddingBottom: PLACE_DETAILS_GEOMETRY.blockGap, gap: 2 }}
              testID={testID ? `${testID}-week` : undefined}
            >
              {days.map((day, index) => {
                const today = day.today === true;
                return (
                  <View
                    key={day.id ?? `${day.label}-${index}`}
                    role="listitem"
                    accessible
                    accessibilityLabel={describeHoursDay(day, format, todayLabel)}
                    {...(today ? { 'aria-current': 'date' as const } : null)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 16,
                      paddingVertical: 6,
                    }}
                    testID={testID ? `${testID}-day-${index}` : undefined}
                  >
                    <Text
                      variant={today ? 'body-semibold' : 'body-regular'}
                      style={{ flexShrink: 0, color: today ? paint.text : paint.textSecondary }}
                    >
                      {day.label}
                    </Text>
                    <View style={{ flex: 1, minWidth: 0, alignItems: 'flex-end', gap: 4 }}>
                      <Text
                        variant={today ? 'body-semibold' : 'body-regular'}
                        style={{
                          color: today ? paint.text : paint.textSecondary,
                          fontVariant: ['tabular-nums'],
                          textAlign: 'right',
                        }}
                      >
                        {formatHoursDay(day, format)}
                      </Text>
                      {day.exception ? (
                        // `Badge` pins itself to `alignSelf: 'flex-start'`, which
                        // wins over the column's `alignItems` — so the wrapper is
                        // what puts the exception under the END of the hours.
                        <View style={{ alignSelf: 'flex-end' }}>
                          <Badge
                            content={day.exception}
                            variant="subtle"
                            color="warning"
                            size="label-small"
                          />
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </View>
  );
}

export const PlaceHours = memo(PlaceHoursComponent);
PlaceHours.displayName = 'PlaceHours';
