import React, { useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '../avatar';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { Card } from '../card';
import { useContainerWidth } from '../hooks/use-container-width';
import { ComposerAttachmentStrip } from '../chat-composer';
import { Chip } from '../chip';
import { useControllableState } from '../hooks/use-controllable-state';
import { RiAttachment2 } from '../icons/remix/RiAttachment2';
import { RiCornerUpLeftLine } from '../icons/remix/RiCornerUpLeftLine';
import { RiFileTextLine } from '../icons/remix/RiFileTextLine';
import { RiGroupLine } from '../icons/remix/RiGroupLine';
import { RiShareForwardLine } from '../icons/remix/RiShareForwardLine';
import { MailStar } from '../mail-list/parts';
import { mailStrings, resolveMailPaint } from '../mail-list/shared';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { useSurfaceFill } from '../styles/surface-levels';
import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MailAddressLine } from './MailAddressLine';
import { MailQuoteToggle } from './MailQuoteToggle';
import {
  MAIL_BODY_INSET,
  MAIL_THREAD_CSS,
  MAIL_THREAD_GEOMETRY,
  MAIL_THREAD_STYLE_ID,
  addressName,
  mailThreadStrings,
  replyLabelsFit,
} from './shared';
import type { MailMessageProps } from './types';

/**
 * One message in a thread, collapsed or open.
 *
 * COLLAPSED it is one line: who, the first words, and when. OPEN it grows a
 * full header (the addresses, the full date), the body slot, the trimmed-content
 * toggle, the attachments and the three replies.
 *
 * THE TWO STATES SHARE ONE HEADER ROW, and that is the whole reason the
 * transition does not leave a gap. Both draw the same avatar at the same
 * `paddingVertical` in the same leading column; the only thing that changes is
 * what the text column holds and whether a body is drawn under it. A collapsed
 * state written as its own compact row — its own padding, its own avatar size —
 * is a row that jumps by a few pixels every time it opens, which reads as the
 * list resettling rather than as the message opening.
 *
 * THE BODY IS A SLOT. This family renders no HTML and no rich text; a mail body
 * is markup from a stranger and sanitising it is the app's decision, not a
 * component's. What Bloom owns around it is the frame, the indent (the body
 * starts under the NAME, not under the avatar) and the trimmed-content toggle.
 *
 * ACCESSIBILITY: the disclosure is a `button` carrying `aria-expanded` and the
 * native `accessibilityState.expanded`, named "Expand message: <sender>" so a
 * list of them is not eight identically-named buttons. The star, the overflow
 * slot and the three replies are SIBLINGS of it, never children — a button
 * inside a button is invalid, and the press target would be ambiguous.
 */
export function MailMessage({
  sender,
  to,
  cc,
  date,
  time,
  preview,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  unread = false,
  starred = false,
  onStarredChange,
  attachments,
  children,
  trimmed,
  onReply,
  onReplyAll,
  onForward,
  menu,
  strings,
  style,
  testID,
}: MailMessageProps) {
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
  const [open, setOpen] = useControllableState<boolean>({
    value: expanded,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
  });

  const geo = MAIL_THREAD_GEOMETRY;
  const { width, onLayout } = useContainerWidth();
  const name = addressName(sender);
  const stamp = open ? (date ?? time) : (time ?? date);
  const hasAttachments = (attachments ?? []).length > 0;

  const toggleStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    borderRadius: 6,
    '--bloom-mail-ring': paint.accent,
  };

  const replies = [
    onReply === undefined
      ? null
      : { key: 'reply', label: text.reply, icon: RiCornerUpLeftLine, onPress: onReply },
    onReplyAll === undefined
      ? null
      : { key: 'reply-all', label: text.replyAll, icon: RiGroupLine, onPress: onReplyAll },
    onForward === undefined
      ? null
      : { key: 'forward', label: text.forward, icon: RiShareForwardLine, onPress: onForward },
  ].filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  // An OPEN message is a surface, and Bloom's surface is a `Card` — the card
  // fill, the hairline, the radius scale — not a grey wash painted by hand. A
  // COLLAPSED one paints nothing, so a thread reads as one list with a card
  // opened inside it rather than as a column of blocks.
  // Three labelled actions need about 320 of the message's own width; under
  // that the group keeps the glyphs and drops the words, which is what
  // `ButtonGroupItem` is built for — the accessible name is the label either
  // way, so nothing is lost by the labels going.
  const compactReplies = !replyLabelsFit(width);
  const Shell = open ? Card : View;
  const shellProps = open
    ? { variant: 'outlined' as const, radius: 'radius-16' as const, testID }
    : { testID };
  return (
    <Shell
      {...shellProps}
      style={[open ? { paddingBottom: geo.paddingVertical } : null, style]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: open ? 'flex-start' : 'center',
          paddingTop: geo.paddingVertical,
          paddingBottom: geo.paddingVertical,
          paddingLeft: geo.paddingHorizontal,
          paddingRight: geo.paddingHorizontal,
          gap: geo.gap,
        }}
      >
        <View pointerEvents="none" aria-hidden importantForAccessibility="no-hide-descendants">
          <Avatar
            source={sender.avatar ?? null}
            name={name}
            size={geo.avatar}
            testID={testID ? `${testID}-avatar` : undefined}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Pressable
            {...webDataSet({ bloomMailThreadFocusable: '' })}
            role="button"
            accessibilityLabel={`${open ? text.collapse : text.expand}: ${name}`}
            aria-expanded={open}
            accessibilityState={{ expanded: open }}
            onPress={() => setOpen(!open)}
            style={toggleStyle}
            testID={testID ? `${testID}-toggle` : undefined}
          >
            <Text
              variant={unread ? 'body-semibold' : 'body-medium'}
              numberOfLines={1}
              // Shrinkable: the row's own date is not, so a long sender on a
              // narrow pane has to give way or it overruns the star beside it
              // (measured at 390px, where the two overlapped by a few pixels).
              style={{ color: paint.text, flexShrink: 1, minWidth: 0, maxWidth: '60%' }}
              testID={testID ? `${testID}-sender` : undefined}
            >
              {name}
            </Text>
            {open ? (
              <View style={{ flex: 1 }} />
            ) : (
              <Text
                variant="body-2-regular"
                numberOfLines={1}
                style={{ color: paint.textTertiary, flex: 1, minWidth: 0 }}
                testID={testID ? `${testID}-preview` : undefined}
              >
                {preview}
              </Text>
            )}
            {hasAttachments ? (
              <View
                aria-hidden
                importantForAccessibility="no-hide-descendants"
                style={{ flexShrink: 0 }}
                testID={testID ? `${testID}-attachment-marker` : undefined}
              >
                <RiAttachment2 width={geo.glyph} height={geo.glyph} fill={paint.textGraphical} />
              </View>
            ) : null}
            {stamp === undefined ? null : (
              <Text
                variant="caption-1-regular"
                numberOfLines={1}
                style={{ color: paint.textTertiary, flexShrink: 0 }}
                testID={testID ? `${testID}-time` : undefined}
              >
                {stamp}
              </Text>
            )}
          </Pressable>
          {open ? (
            <View style={{ gap: 2 }}>
              {(to ?? []).length > 0 ? (
                <MailAddressLine
                  label={text.to}
                  addresses={to as NonNullable<typeof to>}
                  strings={strings}
                  testID={testID ? `${testID}-to` : undefined}
                />
              ) : null}
              {(cc ?? []).length > 0 ? (
                <MailAddressLine
                  label={text.cc}
                  addresses={cc as NonNullable<typeof cc>}
                  strings={strings}
                  testID={testID ? `${testID}-cc` : undefined}
                />
              ) : null}
            </View>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <MailStar
            starred={starred}
            onStarredChange={onStarredChange}
            size={geo.action}
            glyph={18}
            paint={paint}
            strings={rowStrings}
            testID={testID ? `${testID}-star` : undefined}
          />
          {menu}
        </View>
      </View>

      {open ? (
        <View
          // The BODY is what measures itself, not the card: the reply group
          // lives in here, and `Card` has no `onLayout` of its own to borrow.
          onLayout={onLayout}
          style={{
            paddingLeft: MAIL_BODY_INSET,
            paddingRight: geo.paddingHorizontal,
            gap: 12,
          }}
          testID={testID ? `${testID}-body` : undefined}
        >
          {children}
          {trimmed === undefined ? null : (
            <MailQuoteToggle
              strings={strings}
              testID={testID ? `${testID}-trimmed` : undefined}
            >
              {trimmed}
            </MailQuoteToggle>
          )}
          {hasAttachments ? (
            <ComposerAttachmentStrip
              // The tile's one line is the NAME: a column of "1.2 MB" says
              // nothing about which file it is. The size travels in the
              // accessible name instead, where it costs no width.
              attachments={(attachments ?? []).map((attachment) => ({
                id: attachment.id,
                name: attachment.name,
                icon: attachment.icon,
              }))}
              openLabel={(tile) => {
                const size = (attachments ?? []).find((entry) => entry.id === tile.id)?.size;
                return size === undefined ? tile.name : `${tile.name} · ${size}`;
              }}
              onOpen={(id) => (attachments ?? []).find((entry) => entry.id === id)?.onPress?.()}
              accessibilityLabel={text.attachments}
              testID={testID ? `${testID}-attachments` : undefined}
            />
          ) : null}
          {replies.length > 0 ? (
            <ButtonGroup accessibilityLabel={text.attachments} style={{ alignSelf: 'flex-start' }}>
              {replies.map((reply) => (
                <ButtonGroupItem
                  key={reply.key}
                  leadingIcon={reply.icon}
                  iconOnly={compactReplies}
                  accessibilityLabel={reply.label}
                  onPress={reply.onPress}
                  testID={testID ? `${testID}-${reply.key}` : undefined}
                >
                  {reply.label}
                </ButtonGroupItem>
              ))}
            </ButtonGroup>
          ) : null}
        </View>
      ) : null}
    </Shell>
  );
}
