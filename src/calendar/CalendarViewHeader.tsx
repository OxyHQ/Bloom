import React from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { formatMonthTitle } from '../date-picker/calendar-grid';
import { RiAddFill } from '../icons/remix/RiAddFill';
import { RiMenuLine } from '../icons/remix/RiMenuLine';
import { PageHeader } from '../page-header';
import { useMessages } from '../locale/messages';
import { CalendarViewInboxMenu } from './CalendarViewInboxMenu';
import { CalendarViewMonthSwitcher } from './CalendarViewMonthSwitcher';
import { CALENDAR_MESSAGES } from './messages';
import { useBreakpoint } from './shared';
import type { CalendarViewHeaderProps } from './types';

/** Calendar commands and month navigation composed into the shared page header. */
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
  newEventLabel: newEventLabelProp,
  onMenuPress,
  monthSwitcherWidth,
  headingLevel = 1,
  locale: localeProp,
  style,
  testID,
}: CalendarViewHeaderProps) {
  const { locale, messages } = useMessages(CALENDAR_MESSAGES, localeProp);
  const newEventLabel = newEventLabelProp ?? messages.newEvent;
  const breakpoint = useBreakpoint();
  const isLg = breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl';

  return (
    <PageHeader
      title={title ?? formatMonthTitle(month, locale)}
      subtitle={breadcrumb}
      headingLevel={headingLevel}
      onBack={null}
      safeArea={false}
      leading={
        onMenuPress && !isLg ? (
          <Button.Group>
            <Button
              icon={RiMenuLine}
              accessibilityLabel={messages.openNavigation}
              onPress={onMenuPress}
            />
          </Button.Group>
        ) : undefined
      }
      actions={({ compact }) => (
        <>
          {actions}
          {inboxAccounts ? (
            <CalendarViewInboxMenu
              accounts={inboxAccounts}
              onSelectFeed={onSelectFeed}
              onAddAccount={onAddAccount}
              locale={locale}
              testID={testID ? `${testID}-inbox` : undefined}
            />
          ) : null}
          <Button
            icon={RiAddFill}
            iconOnly={compact}
            accessibilityLabel={newEventLabel}
            onPress={onNewEvent}
            appearance="solid"
            tone="accent"
          >
            {compact ? undefined : newEventLabel}
          </Button>
        </>
      )}
      accessory={
        <View style={{ flexDirection: 'row', minWidth: 0 }}>
          <CalendarViewMonthSwitcher
            month={month}
            onPreviousMonth={onPreviousMonth}
            onNextMonth={onNextMonth}
            onSelectDate={onSelectDate}
            width={monthSwitcherWidth}
            locale={locale}
            testID={testID ? `${testID}-switcher` : undefined}
          />
        </View>
      }
      style={style}
      testID={testID}
    />
  );
}
