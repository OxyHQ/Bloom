import React, { memo, useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MailListSkeleton } from './MailListSkeleton';
import { MailRow } from './MailRow';
import { MailSelectionBar } from './MailSelectionBar';
import { MailSectionHeading } from './parts';
import {
  MAIL_EMPTY_ICON,
  MAIL_LIST_CSS,
  MAIL_LIST_STYLE_ID,
  MAIL_ROW_GEOMETRY,
  mailStrings,
  resolveMailPaint,
} from './shared';
import type { MailListProps, MailListSection } from './types';

/**
 * The inbox: day sections, the rows, the empty and loading states, and the bulk
 * selection bar.
 *
 * `sections` renders each bucket under its own heading; the `mails` shorthand
 * is one unlabelled run. `groupMailByDay` turns a flat list into the first from
 * the second, and it is a pure function rather than a prop on this component
 * because "which day is that" needs a clock, and a component that reads one is
 * a component a test cannot pin.
 *
 * ROW ACTIONS ARE TWO AFFORDANCES, ONE LIST OF KEYS. `rowActions` is the rail
 * a pointer hovers; `rowSwipeActions` is what a drag uncovers on touch, per
 * side. Both report through `onMailAction`, and a row's own `actions` /
 * `swipeActions` win over the list's.
 *
 * THE SELECTION BAR IS NOT A SECOND COMPONENT. Give the list
 * `onCheckedIdsChange` and it draws the checkboxes AND mounts the bar as soon
 * as something is checked; select-all, clear and the per-row toggles all resolve
 * here. An app that had to place the bar itself would be an app that can render
 * a selection with no way out of it.
 *
 * It MAPS every row, which is right for the few hundred a mailbox screen shows.
 * For a longer list render `MailRow` yourself inside a virtualised list; every
 * row prop is on `MailSummary` and nothing here holds list state.
 *
 * ACCESSIBILITY: a `role="list"` named by `accessibilityLabel`, each titled
 * section a nested list named by its heading. While `loading` the region is
 * `aria-busy` and the placeholders are hidden, so "loading" is announced once.
 */
function MailListComponent({
  sections,
  mails,
  density = 'comfortable',
  selectedId,
  checkedIds,
  onCheckedIdsChange,
  bulkActions,
  onBulkAction,
  rowActions,
  rowSwipeActions,
  actionsPlacement,
  swipeEnabled,
  onMailPress,
  onMailLongPress,
  onMailAction,
  onMailStarredChange,
  loading = false,
  loadingCount = 8,
  empty,
  header,
  footer,
  strings,
  accessibilityLabel = 'Mail',
  style,
  testID,
}: MailListProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  useEffect(() => {
    adoptStyleSheet(MAIL_LIST_STYLE_ID, MAIL_LIST_CSS);
  }, []);
  const paint = useMemo(() => resolveMailPaint(theme, surface), [theme, surface]);
  const text = useMemo(() => mailStrings(strings), [strings]);
  const geo = MAIL_ROW_GEOMETRY[density];

  const resolved: readonly MailListSection[] = useMemo(() => {
    if (sections !== undefined) return sections;
    if (mails !== undefined) return [{ key: 'all', mails }];
    return [];
  }, [mails, sections]);

  const allIds = useMemo(
    () => resolved.flatMap((section) => section.mails.map((mail) => mail.id)),
    [resolved],
  );
  const checked = useMemo(() => new Set(checkedIds ?? []), [checkedIds]);
  const total = allIds.length;
  const EmptyIcon = MAIL_EMPTY_ICON;

  const toggle = (id: string, next: boolean) => {
    if (onCheckedIdsChange === undefined) return;
    const keep = allIds.filter((candidate) =>
      candidate === id ? next : checked.has(candidate),
    );
    onCheckedIdsChange(keep);
  };

  const body = loading ? (
    <MailListSkeleton
      count={loadingCount}
      density={density}
      testID={testID ? `${testID}-skeleton` : undefined}
    />
  ) : total === 0 ? (
    (empty ?? (
      <View
        style={{
          paddingLeft: geo.paddingHorizontal,
          paddingRight: geo.paddingHorizontal,
          paddingTop: 48,
          paddingBottom: 48,
          alignItems: 'center',
          gap: 8,
        }}
        testID={testID ? `${testID}-empty` : undefined}
      >
        <EmptyIcon width={32} height={32} fill={paint.textGraphical} />
        <Text variant="headline-semibold" style={{ color: paint.text, textAlign: 'center' }}>
          {text.emptyTitle}
        </Text>
        <Text
          variant="body-regular"
          style={{ color: paint.textSecondary, textAlign: 'center', maxWidth: 280 }}
        >
          {text.emptyDescription}
        </Text>
      </View>
    ))
  ) : (
    resolved.map((section) => (
      <View key={section.key}>
        {section.title !== undefined ? (
          <MailSectionHeading
            title={section.title}
            paint={paint}
            paddingHorizontal={geo.paddingHorizontal}
            testID={testID ? `${testID}-heading-${section.key}` : undefined}
          />
        ) : null}
        <View
          {...(section.title !== undefined
            ? { role: 'list' as const, accessibilityLabel: section.title }
            : null)}
        >
          {section.mails.map(({ id, date: _date, actions, swipeActions, ...mail }) => (
            <MailRow
              key={id}
              {...mail}
              actions={actions ?? rowActions}
              swipeActions={swipeActions ?? rowSwipeActions}
              actionsPlacement={mail.actionsPlacement ?? actionsPlacement}
              swipeEnabled={mail.swipeEnabled ?? swipeEnabled}
              density={density}
              strings={mail.strings ?? strings}
              selected={selectedId === id}
              checked={checked.has(id)}
              onCheckedChange={
                onCheckedIdsChange ? (next: boolean) => toggle(id, next) : undefined
              }
              onStarredChange={
                onMailStarredChange
                  ? (next: boolean) => onMailStarredChange(id, next)
                  : undefined
              }
              onPress={onMailPress ? () => onMailPress(id) : undefined}
              onLongPress={onMailLongPress ? () => onMailLongPress(id) : undefined}
              onAction={onMailAction ? (key) => onMailAction(key, id) : undefined}
              testID={testID ? `${testID}-mail-${id}` : undefined}
            />
          ))}
        </View>
      </View>
    ))
  );

  return (
    <View
      role="list"
      accessibilityLabel={accessibilityLabel}
      {...(loading ? { 'aria-busy': true, accessibilityState: { busy: true } } : null)}
      style={style}
      testID={testID}
    >
      {header}
      {onCheckedIdsChange !== undefined ? (
        <MailSelectionBar
          count={checked.size}
          total={total}
          density={density}
          strings={strings}
          actions={bulkActions}
          onAction={(key) => onBulkAction?.(key, [...checked])}
          onSelectAll={(next) => onCheckedIdsChange(next ? [...allIds] : [])}
          onClear={() => onCheckedIdsChange([])}
          testID={testID ? `${testID}-selection` : undefined}
        />
      ) : null}
      {body}
      {footer}
    </View>
  );
}

export const MailList = memo(MailListComponent);
MailList.displayName = 'MailList';
