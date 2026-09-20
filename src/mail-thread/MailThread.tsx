import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Divider } from '../divider';
import { useControllableState } from '../hooks/use-controllable-state';
import { MailLabelChips, MailStar } from '../mail-list/parts';
import { mailStrings, resolveMailPaint, visibleLabels } from '../mail-list/shared';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { useSurfaceFill } from '../styles/surface-levels';
import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MailMessage } from './MailMessage';
import {
  MAIL_BODY_INSET,
  MAIL_THREAD_CSS,
  MAIL_THREAD_GEOMETRY,
  MAIL_THREAD_STYLE_ID,
  collapseThread,
  defaultExpandedIds,
  mailThreadStrings,
} from './shared';
import type { MailThreadProps } from './types';

/**
 * One conversation: the subject, the stack of messages, and the quick reply.
 *
 * THE NEWEST MESSAGE IS OPEN AND THE REST ARE CLOSED. That is the arrangement
 * a reader arriving at a thread wants every time, so it is the default rather
 * than a prop the app has to remember; `expandedIds` takes it over when the app
 * has its own idea (a deep link to one message, "expand all").
 *
 * THE MIDDLE FOLDS, NOT THE TAIL. A long thread hides everything between the
 * first message and the last two behind one "N earlier messages" control: the
 * message that started the conversation and the two that are the conversation
 * NOW are the three a reader needs, and folding from the top instead would hide
 * the first, which is the one that says what the thread is about. `collapseAfter`
 * moves the threshold; `0` turns it off. The arithmetic is pure and lives in
 * `collapseThread`.
 *
 * The quick reply is a SLOT. What a reply box is — a one-line field, a row of
 * suggested replies, a full composer — is an app's decision, and a thread that
 * shipped one of them would be wrong in the other two apps.
 */
export function MailThread({
  subject,
  labels,
  starred = false,
  onStarredChange,
  messages,
  expandedIds,
  onExpandedIdsChange,
  collapseAfter = 4,
  quickReply,
  header,
  strings,
  accessibilityLabel,
  style,
  testID,
}: MailThreadProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  useEffect(() => {
    adoptStyleSheet(MAIL_THREAD_STYLE_ID, MAIL_THREAD_CSS);
  }, []);
  const paint = useMemo(() => resolveMailPaint(theme, surface), [theme, surface]);
  const text = useMemo(() => mailThreadStrings(strings), [strings]);
  const rowStrings = useMemo(
    () => mailStrings({ starred: text.starred, star: text.star }),
    [text.star, text.starred],
  );
  const geo = MAIL_THREAD_GEOMETRY;

  const [openIds, setOpenIds] = useControllableState<readonly string[]>({
    value: expandedIds,
    defaultValue: useMemo(() => defaultExpandedIds(messages), [messages]),
    onChange: onExpandedIdsChange
      ? (next: readonly string[]) => onExpandedIdsChange([...next])
      : undefined,
  });
  const open = useMemo(() => new Set(openIds), [openIds]);
  const [revealed, setRevealed] = useState(false);

  const entries = useMemo(
    () => collapseThread(messages, revealed ? 0 : collapseAfter),
    [collapseAfter, messages, revealed],
  );

  const { shown, overflow } = visibleLabels(labels, 3);

  const revealStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginLeft: MAIL_BODY_INSET,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 999,
    backgroundColor: paint.hover,
    '--bloom-mail-ring': paint.accent,
  };

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? subject}
      style={style}
      testID={testID}
    >
      {header}
      {subject !== undefined || onStarredChange !== undefined ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 8,
            paddingTop: geo.paddingVertical,
            paddingBottom: geo.paddingVertical,
            paddingLeft: geo.paddingHorizontal,
            paddingRight: geo.paddingHorizontal,
          }}
        >
          <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
            {subject === undefined ? null : (
              <Text
                variant="title-3-semibold"
                style={{ color: paint.text }}
                testID={testID ? `${testID}-subject` : undefined}
              >
                {subject}
              </Text>
            )}
            {shown.length > 0 || overflow > 0 ? (
              <MailLabelChips
                labels={shown}
                overflow={overflow}
                surface={paint.surface}
                strings={rowStrings}
                testID={testID ? `${testID}-labels` : undefined}
              />
            ) : null}
          </View>
          <MailStar
            starred={starred}
            onStarredChange={onStarredChange}
            size={geo.action}
            glyph={18}
            paint={paint}
            strings={rowStrings}
            testID={testID ? `${testID}-star` : undefined}
          />
        </View>
      ) : null}
      <Divider />
      <View style={{ paddingTop: 4, paddingBottom: 4 }}>
        {entries.map((entry) =>
          entry.kind === 'message' ? (
            <MailMessage
              key={entry.message.id}
              {...entry.message}
              strings={entry.message.strings ?? strings}
              expanded={open.has(entry.message.id)}
              onExpandedChange={(next) => {
                const ids = new Set(open);
                if (next) ids.add(entry.message.id);
                else ids.delete(entry.message.id);
                setOpenIds([...ids]);
              }}
              testID={testID ? `${testID}-message-${entry.message.id}` : undefined}
            />
          ) : (
            <Pressable
              key="earlier"
              {...webDataSet({ bloomMailThreadFocusable: '' })}
              role="button"
              accessibilityLabel={text.earlierMessages(entry.count)}
              onPress={() => setRevealed(true)}
              style={revealStyle}
              testID={testID ? `${testID}-earlier` : undefined}
            >
              <Text variant="body-2-medium" style={{ color: paint.textSecondary }}>
                {text.earlierMessages(entry.count)}
              </Text>
            </Pressable>
          ),
        )}
      </View>
      {quickReply === undefined ? null : (
        <View
          style={{
            paddingTop: geo.paddingVertical,
            paddingBottom: geo.paddingVertical,
            paddingLeft: geo.paddingHorizontal,
            paddingRight: geo.paddingHorizontal,
          }}
          testID={testID ? `${testID}-quick-reply` : undefined}
        >
          {quickReply}
        </View>
      )}
    </View>
  );
}
