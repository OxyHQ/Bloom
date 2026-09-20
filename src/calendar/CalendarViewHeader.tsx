import React from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { formatMonthTitle } from '../date-picker/calendar-grid';
import { RiAddFill, RiMenuLine } from '../icons/remix';
import { Z_INDEX } from '../styles/z-index';
import { Text } from '../typography';
import { CalendarViewInboxMenu } from './CalendarViewInboxMenu';
import { CalendarViewMonthSwitcher } from './CalendarViewMonthSwitcher';
import { useBreakpoint } from './shared';
import type { CalendarViewHeaderProps } from './types';

/**
 * `CalendarHeader`: an optional breadcrumb over a title / actions row.
 *
 *   header       column, 4px gap
 *   title row    wraps; items bottom-aligned, 8px gap
 *   title        title-2-medium, 4px side inset; a 36px "Open navigation" menu
 *                button before it below `lg` when `onMenuPress` is set (6px gap)
 *   actions      10px apart: caller `actions` (a notification bell),
 *                the inbox menu, the month switcher (flex-1 below `sm`) and the
 *                primary medium "New event" button. Full width below `sm`.
 *
 * The breadcrumb and the notification bell are the app shell's, so they are
 * slots rather than ports.
 */
export function CalendarViewHeader({
  month,
  onPreviousMonth,
  onNextMonth,
  onSelectDate,
  title,
  breadcrumb,
  actions,
  inboxAccounts,
  onSelectFeed,
  onAddAccount,
  onNewEvent,
  newEventLabel = 'New event',
  onMenuPress,
  monthSwitcherWidth,
  headingLevel = 1,
  locale,
  style,
  testID,
}: CalendarViewHeaderProps) {
  const breakpoint = useBreakpoint();
  const isSm = breakpoint !== 'base';
  const isLg = breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl';

  return (
    // Raised over what follows: the month switcher grows DOWN over the grid.
    <View role="banner" testID={testID} style={[{ width: '100%', gap: 4, zIndex: Z_INDEX.floating }, style]}>
      {breadcrumb}
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <View
          style={{
            minWidth: 0,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {onMenuPress && !isLg ? (
            <Button size="md" icon={RiMenuLine} accessibilityLabel="Open navigation" onPress={onMenuPress} appearance="plain" tone="neutral" />
          ) : null}
          <Text
            role="heading"
            aria-level={headingLevel}
            variant="title-2-medium"
            numberOfLines={1}
            style={{ paddingLeft: 4, paddingRight: 4 }}
          >
            {title ?? formatMonthTitle(month, locale)}
          </Text>
        </View>

        <View
          style={[
            {
              flexDirection: 'row',
              flexWrap: 'nowrap',
              alignItems: 'flex-start',
              justifyContent: 'flex-end',
              gap: 10,
            },
            isSm ? null : { width: '100%' },
          ]}
        >
          {actions}
          {inboxAccounts ? (
            <CalendarViewInboxMenu
              accounts={inboxAccounts}
              onSelectFeed={onSelectFeed}
              onAddAccount={onAddAccount}
              testID={testID ? `${testID}-inbox` : undefined}
            />
          ) : null}
          <View
            style={[
              {
                minWidth: 0,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
              },
              isSm ? { flexShrink: 0 } : { flex: 1 },
            ]}
          >
            <CalendarViewMonthSwitcher
              month={month}
              onPreviousMonth={onPreviousMonth}
              onNextMonth={onNextMonth}
              onSelectDate={onSelectDate}
              width={monthSwitcherWidth}
              locale={locale}
              testID={testID ? `${testID}-switcher` : undefined}
            />
            <Button size="md" leadingIcon={RiAddFill} onPress={onNewEvent} appearance="solid" tone="accent">
              {newEventLabel}
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
}
