import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '../button';
import { AvatarPresence } from '../chat-indicators/AvatarPresence';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { resolveChatPeoplePaint } from './shared';
import type { ContactRowProps, ContactRowTrailing } from './types';

/**
 * `ContactRow`: one person in a list of people.
 *
 *   avatar with presence · name (`body-medium`) over the subtitle
 *   (`caption-1-regular`, secondary) · one trailing affordance
 *
 * The trailing slot is DERIVED from the handlers by default — a `checkbox` with
 * `onSelectedChange`, an action button with `onAction`, nothing otherwise —
 * for the same reason `CallControls` derives its buttons: a `trailing` prop and
 * a handler prop that disagree is a control that does nothing, and there is no
 * way for the row to notice.
 *
 * SELECTION IS ONE TARGET, NOT TWO. When the row is a checkbox row, the ROW is
 * the `role="checkbox"` and the mark inside it is DRAWN, not a `Checkbox`
 * component. Nesting Bloom's `Checkbox` here would put a second
 * `role="checkbox"` inside the first — two hit areas that disagree about which
 * one the user meant, and a screen reader announcing the same control twice.
 * The mark is a 20px circle (the picker idiom) rather than a square, so it
 * cannot be mistaken for the settings checkbox it is not.
 */

const AVATAR: Record<'small' | 'medium', number> = { small: 36, medium: 44 };

function resolveTrailing(props: ContactRowProps): ContactRowTrailing {
  if (props.trailing !== undefined) return props.trailing;
  if (props.onSelectedChange !== undefined) return 'checkbox';
  if (props.onAction !== undefined) return 'action';
  return 'none';
}

function ContactRowComponent(props: ContactRowProps) {
  const {
    name,
    avatar,
    avatarVariant,
    subtitle,
    status,
    trailingSlot,
    selected = false,
    onSelectedChange,
    actionLabel = 'Add',
    onAction,
    actionDone = false,
    actionDoneLabel = 'Added',
    onPress,
    disabled = false,
    size = 'medium',
    style,
    textStyle,
    testID,
  } = props;
  const theme = useTheme();
  const paint = useMemo(() => resolveChatPeoplePaint(theme), [theme]);
  const { state: hovered, onIn, onOut } = useInteractionState();
  const trailing = resolveTrailing(props);
  const checkboxRow = trailing === 'checkbox' && onSelectedChange !== undefined;
  const pressable = checkboxRow || onPress !== undefined;

  const body = (
    <>
      <AvatarPresence
        source={avatar}
        variant={avatarVariant}
        name={name}
        size={AVATAR[size]}
        status={status}
        presenceRingColor={paint.surface}
        presenceLabel=""
      />
      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <Text
          variant="body-medium"
          numberOfLines={1}
          style={[{ color: paint.text }, textStyle]}
          testID={testID ? `${testID}-name` : undefined}
        >
          {name}
        </Text>
        {subtitle === undefined ? null : (
          <Text
            variant="caption-1-regular"
            numberOfLines={1}
            style={{ color: paint.textSecondary }}
            testID={testID ? `${testID}-subtitle` : undefined}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {trailingSlot !== undefined ? (
        trailingSlot
      ) : trailing === 'chevron' ? (
        <RiArrowRightSLine width={20} height={20} fill={paint.textTertiary} />
      ) : checkboxRow ? (
        <View
          pointerEvents="none"
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: selected ? 0 : 1.5,
            borderColor: paint.textTertiary,
            backgroundColor: selected ? paint.accent : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          testID={testID ? `${testID}-checkbox` : undefined}
        >
          {selected ? <RiCheckLine width={14} height={14} fill={paint.onAccent} /> : null}
        </View>
      ) : null}
    </>
  );

  const shell = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    backgroundColor:
      (hovered && pressable) || (checkboxRow && selected) ? paint.rowHighlight : 'transparent',
    paddingTop: 8,
    paddingRight: 10,
    paddingBottom: 8,
    paddingLeft: 10,
    opacity: disabled ? 0.5 : 1,
  };

  const main = checkboxRow ? (
    <Pressable
      role="checkbox"
      accessibilityLabel={name}
      aria-checked={selected}
      accessibilityState={{ checked: selected, disabled }}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onPress={() => onSelectedChange?.(!selected)}
      onHoverIn={onIn}
      onHoverOut={onOut}
      style={shell}
      testID={testID ? `${testID}-select` : undefined}
    >
      {body}
    </Pressable>
  ) : onPress === undefined ? (
    <View style={shell}>{body}</View>
  ) : (
    <Pressable
      role="button"
      accessibilityLabel={subtitle === undefined ? name : `${name}, ${subtitle}`}
      aria-disabled={disabled || undefined}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={onIn}
      onHoverOut={onOut}
      style={shell}
      testID={testID ? `${testID}-open` : undefined}
    >
      {body}
    </Pressable>
  );

  return (
    <View
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}
      testID={testID}
    >
      {main}
      {trailing === 'action' && onAction !== undefined ? (
        actionDone ? (
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 6 }}
            testID={testID ? `${testID}-action-done` : undefined}
          >
            <RiCheckLine width={16} height={16} fill={paint.textSecondary} />
            <Text variant="body-2-medium" style={{ color: paint.textSecondary }}>
              {actionDoneLabel}
            </Text>
          </View>
        ) : (
          <Button
            variant="secondary"
            size="small"
            disabled={disabled}
            onPress={onAction}
            testID={testID ? `${testID}-action` : undefined}
          >
            {actionLabel}
          </Button>
        )
      ) : null}
    </View>
  );
}

export const ContactRow = memo(ContactRowComponent);
ContactRow.displayName = 'ContactRow';
