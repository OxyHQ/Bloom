import type { ComponentType } from 'react';
import { View } from 'react-native';
import { Avatar } from '../avatar';
import { Badge } from '../badge';
import { RiAttachment2 } from '../icons/remix/RiAttachment2';
import { useMessages } from '../locale/messages';
import { MAIL_LIST_MESSAGES } from '../mail-list/messages';
import { MailLabelChips, MailStar } from '../mail-list/parts';
import {
  composeMailRowName,
  mailStrings,
  resolveMailPaint,
  visibleLabels,
} from '../mail-list/shared';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { webDataSet } from '../styles/web-data';
import { Text } from '../typography';
import type { ListCommonProps, ListMailData } from './types';

/** Mail content only; ListItem owns layout, selection, gestures and commands. */
export function ListMail({
  Shell,
  mail,
  ...props
}: ListCommonProps & {
  Shell: ComponentType<ListCommonProps>;
  mail: ListMailData;
}) {
  const {
    sender,
    subject,
    snippet,
    time,
    unread = false,
    starred = false,
    onStarredChange,
    hasAttachment = false,
    threadCount,
    draft = false,
    labels,
    maxLabels = 2,
    showAvatar = true,
    strings,
  } = mail;
  const { messages } = useMessages(MAIL_LIST_MESSAGES);
  const theme = useTheme();
  const paint = resolveMailPaint(theme, useSurfaceFill());
  const text = mailStrings(strings, messages);
  const { shown, overflow } = visibleLabels(labels, maxLabels);
  const id = (part: string) => (props.testID ? `${props.testID}-${part}` : undefined);
  const label =
    props.label ??
    composeMailRowName(
      {
        sender: sender.name,
        subject,
        snippet,
        time,
        unread,
        starred,
        draft,
        hasAttachment,
        threadCount,
        labels,
      },
      text,
    );
  return (
    <Shell
      {...props}
      label={label}
      selectionLabel={props.selectionLabel ?? `${text.select}: ${sender.name}, ${subject}`}
      leading={
        props.leading !== undefined ? (
          props.leading
        ) : showAvatar ? (
          <View pointerEvents="none" aria-hidden importantForAccessibility="no-hide-descendants">
            <Avatar
              source={sender.avatar ?? null}
              name={sender.name}
              size={36}
              testID={id('avatar-image')}
            />
          </View>
        ) : null
      }
      content={
        props.content !== undefined ? (
          props.content
        ) : (
          <View
            pointerEvents="none"
            aria-hidden
            importantForAccessibility="no-hide-descendants"
            style={{ gap: 2, minWidth: 0 }}
          >
            <Text
              variant={unread ? 'body-semibold' : 'body-regular'}
              numberOfLines={1}
              style={{ color: unread ? paint.text : paint.textSecondary }}
              testID={id('sender')}
            >
              {sender.name}
            </Text>
            <Text
              {...webDataSet({ bloomListSupporting: String(props.supportingLines ?? 1) })}
              variant={unread ? 'caption-1-semibold' : 'caption-1-regular'}
              numberOfLines={
                props.supportingLines === 'adaptive' ? 3 : (props.supportingLines ?? 1)
              }
              style={{ color: unread ? paint.text : paint.textSecondary }}
              testID={id('subject')}
            >
              {subject}
              {snippet !== undefined || draft ? (
                <Text
                  style={{
                    color: unread ? paint.textSecondary : paint.textTertiary,
                    fontWeight: '400',
                  }}
                  testID={id('snippet')}
                >
                  {' · '}
                  {draft ? <Text style={{ color: paint.negative }}>{`${text.draft} `}</Text> : null}
                  {snippet}
                </Text>
              ) : null}
            </Text>
            {shown.length || overflow ? (
              <MailLabelChips
                labels={shown}
                overflow={overflow}
                surface={paint.surface}
                strings={text}
                testID={id('labels')}
              />
            ) : null}
          </View>
        )
      }
      trailing={
        props.trailing !== undefined ? (
          props.trailing
        ) : (
          <View pointerEvents="box-none" style={{ alignItems: 'flex-end', gap: 3 }}>
            {time !== undefined ? (
              <View pointerEvents="none" aria-hidden>
                <Text
                  aria-hidden
                  numberOfLines={1}
                  variant="caption-2-regular"
                  style={{ color: unread ? paint.accent : paint.textTertiary }}
                  testID={id('time')}
                >
                  {time}
                </Text>
              </View>
            ) : null}
            <View
              pointerEvents="box-none"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              {hasAttachment ? (
                <View aria-hidden pointerEvents="none" testID={id('attachment')}>
                  <RiAttachment2 width={14} height={14} fill={paint.textGraphical} />
                </View>
              ) : null}
              {(threadCount ?? 0) > 1 ? (
                <View aria-hidden pointerEvents="none" testID={id('thread-count')}>
                  <Badge content={threadCount} size="sm" appearance="subtle" />
                </View>
              ) : null}
              {starred || onStarredChange ? (
                <MailStar
                  starred={starred}
                  disabled={props.disabled}
                  onStarredChange={onStarredChange}
                  size={32}
                  glyph={16}
                  paint={paint}
                  strings={text}
                  testID={id('star')}
                />
              ) : null}
            </View>
          </View>
        )
      }
    />
  );
}
