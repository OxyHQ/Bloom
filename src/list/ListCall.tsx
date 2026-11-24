import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from '../avatar';
import { CALL_UI_MESSAGES } from '../call-ui/messages';
import { isNegativeDirection, resolveCallPaint } from '../call-ui/shared';
import { RiArrowLeftDownLine } from '../icons/remix/RiArrowLeftDownLine';
import { RiArrowRightUpLine } from '../icons/remix/RiArrowRightUpLine';
import { RiPhoneLine } from '../icons/remix/RiPhoneLine';
import { RiVideoOnLine } from '../icons/remix/RiVideoOnLine';
import { useMessages } from '../locale/messages';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { ListCommonProps, ListItemShellProps, ListCallData } from './types';

export function ListCall({
  Shell,
  Button,
  call,
  ...props
}: ListCommonProps & {
  Shell: ComponentType<ListItemShellProps>;
  Button: typeof import('../button')['Button'];
  call: ListCallData;
}) {
  const {
    name,
    avatar,
    avatarVariant,
    direction,
    mode = 'voice',
    meta,
    count,
    onCallBack,
    labels,
    textStyle,
  } = call;
  const { messages } = useMessages(CALL_UI_MESSAGES);
  const text = { ...messages.history, ...labels };
  const paint = resolveCallPaint(useTheme());
  const color = isNegativeDirection(direction) ? paint.negative : paint.text;
  const Arrow =
    direction === 'outgoing' || direction === 'declined' ? RiArrowRightUpLine : RiArrowLeftDownLine;
  const id = (part: string) => (props.testID ? `${props.testID}-${part}` : undefined);
  return (
    <Shell
      {...props}
      label={
        props.label ??
        `${name}, ${text[direction].toLowerCase()}, ${meta}${count && count > 1 ? `, ${count}` : ''}`
      }
      leading={
        props.leading !== undefined ? (
          props.leading
        ) : (
          <View pointerEvents="none" aria-hidden>
            <Avatar source={avatar} variant={avatarVariant} name={name} size={36} />
          </View>
        )
      }
      content={
        props.content !== undefined ? (
          props.content
        ) : (
          <View pointerEvents="none" aria-hidden style={styles.content}>
            <View style={styles.nameLine}>
              <Text
                variant="body-medium"
                numberOfLines={1}
                style={[styles.shrink, { color }, textStyle]}
                testID={id('name')}
              >
                {name}
              </Text>
              {count && count > 1 ? (
                <Text
                  variant="body-2-regular"
                  style={{ color: paint.textSecondary }}
                >{`(${count})`}</Text>
              ) : null}
            </View>
            <View style={styles.metaLine}>
              <Arrow
                width={14}
                height={14}
                fill={isNegativeDirection(direction) ? paint.negative : paint.textSecondary}
              />
              <Text
                variant="body-2-regular"
                numberOfLines={1}
                style={[styles.shrink, { color: paint.textSecondary }]}
                testID={id('meta')}
              >{`${text[direction]} · ${meta}`}</Text>
            </View>
          </View>
        )
      }
      trailing={
        props.trailing !== undefined ? (
          props.trailing
        ) : onCallBack ? (
          <Button
            icon={mode === 'video' ? RiVideoOnLine : RiPhoneLine}
            iconOnly
            tone="neutral"
            appearance="plain"
            accessibilityLabel={text.callBack(name)}
            disabled={props.disabled}
            onPress={onCallBack}
            testID={id('callback')}
          />
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { gap: 2, minWidth: 0 },
  nameLine: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  metaLine: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  shrink: { flexShrink: 1 },
});
