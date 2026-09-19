import React, {
  Children,
  createContext,
  isValidElement,
  memo,
  useContext,
  useMemo,
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useInteractionState } from '../hooks/use-interaction-state';
import { Text } from '../typography';
import {
  TEXT_FIELD_GEOMETRY,
  TEXT_FIELD_LEADING_GAP,
  TEXT_FIELD_RADIUS,
  TEXT_FIELD_RING_WIDTH,
  TEXT_FIELD_TRAILING_GAP,
  TEXT_FIELD_WEB_TRANSITION,
  resolveShellPaint,
  useTextFieldPalette,
  type TextFieldPalette,
  type TextFieldSize,
} from '../text-field/shared';
import { TextFieldGroupContext } from '../text-field/TextField';
import type { InputGroupAddonProps, InputGroupProps } from './types';
import { useFieldMembership } from '../field/membership';

/**
 * The group is the input shell (`base/input/input.tsx`) with its adornment
 * slots opened up: the same fill, inset ring, radius and state paint as
 * `TextField` (`text-field/shared`).
 *
 *                 sm        md        lg
 *   height        32        36        44
 *   shell px      6         8         10
 *
 * `sm` corresponds to `small` and `md` to `medium`; `lg` extends the ramp.
 *
 *   leading addon   2px before the control (`leftSection gap-0.5`)
 *   trailing addon  8px after it (`content gap-2`)
 *   `noPadding`     the addon reaches 4px from the shell's edge —
 *                   `pl-1` for a leading addon (Phone basic)
 *
 * A `TextFieldInput` (or a `Search`) inside renders BARE through
 * `TextFieldGroupContext`: the group paints the one shell, the field draws none.
 */
const SIZE_CONFIG: Record<NonNullable<InputGroupProps['size']>, { height: number; paddingHorizontal: number; field: TextFieldSize }> = {
  sm: { height: TEXT_FIELD_GEOMETRY.small.height, paddingHorizontal: TEXT_FIELD_GEOMETRY.small.paddingHorizontal, field: 'small' },
  md: { height: TEXT_FIELD_GEOMETRY.medium.height, paddingHorizontal: TEXT_FIELD_GEOMETRY.medium.paddingHorizontal, field: 'medium' },
  lg: { height: 44, paddingHorizontal: 10, field: 'medium' },
};

/** `pl-1`: how close a padding-less addon sits to the shell's edge. */
const ADDON_EDGE_INSET = 4;
/** Space between an addon's content and its divider. */
const DIVIDER_GAP = 8;

interface InputGroupContextValue {
  size: 'sm' | 'md' | 'lg';
  palette: TextFieldPalette;
  disabled: boolean;
}

const InputGroupContext = createContext<InputGroupContextValue | null>(null);
InputGroupContext.displayName = 'InputGroupContext';

/** Where an addon sits relative to the control; set by the group per child. */
const AddonPositionContext = createContext<'leading' | 'trailing'>('trailing');

const InputGroupAddonComponent = function InputGroupAddon({
  children,
  divider = false,
  noPadding = false,
  style,
  testID,
}: InputGroupAddonProps) {
  const group = useContext(InputGroupContext);
  const position = useContext(AddonPositionContext);
  const fallbackPalette = useTextFieldPalette();
  const palette = group?.palette ?? fallbackPalette;
  const cfg = SIZE_CONFIG[group?.size ?? 'md'];
  const leading = position === 'leading';

  // Plain string/number content reads as a subdued `text-body-regular` label in
  // `text-secondary` (and never trips RN's "raw text outside <Text>" rule).
  const content =
    typeof children === 'string' || typeof children === 'number' ? (
      <Text
        variant="body-regular"
        numberOfLines={1}
        style={{ color: group?.disabled ? palette.textDisabled : palette.hint }}>
        {children}
      </Text>
    ) : (
      children
    );

  // Longhands throughout: react-native-web ranks `marginHorizontal` /
  // `paddingHorizontal` above a caller's `marginLeft`, so a shorthand here would
  // silently beat the `style` override on web.
  const edgeMargin = noPadding ? ADDON_EDGE_INSET - cfg.paddingHorizontal : 0;
  const spacing = leading
    ? {
        marginLeft: edgeMargin,
        marginRight: TEXT_FIELD_LEADING_GAP,
        paddingRight: divider ? DIVIDER_GAP : 0,
      }
    : {
        marginLeft: TEXT_FIELD_TRAILING_GAP,
        marginRight: edgeMargin,
        paddingLeft: divider ? DIVIDER_GAP : 0,
      };

  return (
    <View testID={testID} style={[styles.addon, spacing, style]}>
      {divider ? (
        <View
          style={[
            styles.divider,
            leading ? { right: 0 } : { left: 0 },
            { backgroundColor: palette.ringHover },
          ]}
        />
      ) : null}
      {content}
    </View>
  );
};

export const InputGroupAddon = memo(InputGroupAddonComponent);
InputGroupAddon.displayName = 'InputGroupAddon';

/**
 * Horizontal group that wraps an input with leading/trailing addons (icons,
 * text, buttons, `Kbd`). Renders a single filled chrome — radius, fill, inset
 * ring and its hover/focus/invalid/disabled paint are `TextField`'s own
 * (`text-field/shared`), so a group reads as one field.
 * The input child stretches to fill the middle.
 *
 * ```tsx
 * <InputGroup>
 *   <InputGroupAddon>https://</InputGroupAddon>
 *   <TextFieldInput label="Domain" value={v} onChangeText={setV} />
 *   <InputGroupAddon divider>
 *     <Button size="small" variant="ghost" onPress={go}>Go</Button>
 *   </InputGroupAddon>
 * </InputGroup>
 * ```
 */
const InputGroupComponent = function InputGroup({
  children,
  isInvalid: isInvalidProp = false,
  disabled: disabledProp = false,
  size = 'md',
  style,
  testID,
}: InputGroupProps) {
  // A group holding a control and its addons is ONE control as far as a `Field`
  // is concerned: the field's `disabled` and invalid state reach every member
  // through the group's own contexts, including an addon's `Button`, which reads
  // neither the field nor the text-field group. The group publishes no name — it
  // does not know which of its children is the control the label points at, so
  // that stays the field's `nativeID` and the input's to apply.
  const member = useFieldMembership({ disabled: disabledProp, invalid: isInvalidProp });
  const disabled = member.disabled;
  const isInvalid = member.invalid;
  const cfg = SIZE_CONFIG[size];
  const { state: focused, onIn: onFocus, onOut: onBlur } = useInteractionState();
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } =
    useInteractionState();

  const palette = useTextFieldPalette();
  const { backgroundColor, borderColor } = resolveShellPaint(palette, {
    hovered,
    focused,
    invalid: isInvalid,
    disabled,
  });

  const ctx = useMemo<InputGroupContextValue>(
    () => ({ size, palette, disabled }),
    [size, palette, disabled],
  );
  const fieldCtx = useMemo(
    () => ({ size: cfg.field, isInvalid, disabled }),
    [cfg.field, isInvalid, disabled],
  );

  // Addons before the first non-addon child are leading; the rest trail.
  const items = Children.toArray(children);
  const controlIndex = items.findIndex(
    (child) => !(isValidElement(child) && child.type === InputGroupAddon),
  );
  const positioned = items.map((child, index) =>
    isValidElement(child) && child.type === InputGroupAddon ? (
      <AddonPositionContext.Provider
        key={child.key ?? index}
        value={controlIndex === -1 || index < controlIndex ? 'leading' : 'trailing'}>
        {child}
      </AddonPositionContext.Provider>
    ) : (
      child
    ),
  );

  const webHandlers: Record<string, unknown> =
    Platform.OS === 'web'
      ? {
          onMouseOver: onHoverIn,
          onMouseOut: onHoverOut,
        }
      : {};

  return (
    <InputGroupContext.Provider value={ctx}>
      <TextFieldGroupContext.Provider value={fieldCtx}>
        <View
          testID={testID}
          // `aria-disabled`, not `accessibilityState`: this is a `View`, so
          // react-native-web has no `disabled` prop to derive the attribute from
          // and never reads `accessibilityState`. React Native folds it back.
          aria-disabled={disabled || undefined}
          aria-invalid={isInvalid || undefined}
          // Capture focus bubbling from a nested input so the whole chrome
          // reflects focus — RN-web bubbles focus/blur, native does not but a
          // nested TextInput's own focus ring is sufficient there.
          onFocus={onFocus}
          onBlur={onBlur}
          {...webHandlers}
          style={[
            styles.container,
            {
              height: cfg.height,
              // The ring is a 2px border here, so it takes its share of the
              // shell's side padding and the content stays put.
              paddingLeft: cfg.paddingHorizontal - TEXT_FIELD_RING_WIDTH,
              paddingRight: cfg.paddingHorizontal - TEXT_FIELD_RING_WIDTH,
              backgroundColor,
              borderColor,
            },
            TEXT_FIELD_WEB_TRANSITION,
            style,
          ]}>
          {positioned}
        </View>
      </TextFieldGroupContext.Provider>
    </InputGroupContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: TEXT_FIELD_RADIUS,
    borderWidth: TEXT_FIELD_RING_WIDTH,
    overflow: 'hidden',
  },
  addon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    gap: 4,
    flexShrink: 0,
    position: 'relative',
  },
  divider: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    width: StyleSheet.hairlineWidth,
  },
});

// Flat-prefixed, with no `InputGroup.Addon` static beside it. Two spellings of
// one part is the ambiguity the flat-prefix rule exists to remove, and no other
// Bloom compound carries one — there is no `Tabs.Trigger`, `Menu.Item` or
// `Select.Trigger`. The static was the last place a reader could learn a second
// name for a part that already has one.
export const InputGroup = memo(InputGroupComponent);
InputGroup.displayName = 'InputGroup';
