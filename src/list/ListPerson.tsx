import type { ComponentType } from 'react';
import { View } from 'react-native';
import { AvatarPresence } from '../chat-indicators/AvatarPresence';
import { CHAT_PEOPLE_MESSAGES } from '../chat-people/messages';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { useMessages } from '../locale/messages';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { ListCommonProps, ListPersonData } from './types';

export function ListPerson({
  Shell,
  Button,
  person,
  ...props
}: ListCommonProps & {
  Shell: ComponentType<ListCommonProps>;
  Button: typeof import('../button')['Button'];
  person: ListPersonData;
}) {
  const { messages } = useMessages(CHAT_PEOPLE_MESSAGES);
  const fill = useSurfaceFill();
  const theme = useTheme();
  const {
    name,
    avatar,
    avatarVariant,
    status,
    subtitle,
    onAction,
    actionLabel = messages.add,
    actionDone,
    actionDoneLabel = messages.added,
    textStyle,
  } = person;
  const id = (part: string) => (props.testID ? `${props.testID}-${part}` : undefined);
  return (
    <Shell
      {...props}
      label={props.label ?? [name, subtitle].filter(Boolean).join(', ')}
      leading={
        props.leading !== undefined ? (
          props.leading
        ) : (
          <View pointerEvents="none" aria-hidden>
            <AvatarPresence
              source={avatar}
              variant={avatarVariant}
              name={name}
              size={36}
              status={status}
              presenceRingColor={fill}
              presenceLabel=""
            />
          </View>
        )
      }
      content={
        props.content !== undefined ? (
          props.content
        ) : (
          <View pointerEvents="none" aria-hidden style={{ gap: 2, minWidth: 0 }}>
            <Text variant="body-medium" numberOfLines={1} style={textStyle} testID={id('name')}>
              {name}
            </Text>
            {subtitle !== undefined ? (
              <Text
                variant="body-2-regular"
                numberOfLines={1}
                style={{ color: theme.colors.textSecondary }}
                testID={id('subtitle')}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        )
      }
      trailing={
        props.trailing !== undefined ? (
          props.trailing
        ) : onAction ? (
          actionDone ? (
            <View
              pointerEvents="none"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              testID={id('action-done')}
            >
              <RiCheckLine size="sm" />
              <Text variant="body-2-medium">{actionDoneLabel}</Text>
            </View>
          ) : (
            <Button
              disabled={props.disabled}
              onPress={onAction}
              accessibilityLabel={messages.actionOn(actionLabel, name)}
              tone="neutral"
              appearance="outline"
              testID={id('action')}
            >
              {actionLabel}
            </Button>
          )
        ) : null
      }
    />
  );
}
