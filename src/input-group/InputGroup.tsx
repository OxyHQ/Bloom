import React, {
  createContext,
  memo,
  useContext,
  useMemo,
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { useInteractionState } from '../hooks/useInteractionState';
import { Text } from '../typography';
import { borderRadius, fontSize, space } from '../styles/tokens';
import type { InputGroupAddonProps, InputGroupProps } from './types';

const SIZE_CONFIG = {
  sm: { minHeight: 36, paddingHorizontal: space.sm },
  md: { minHeight: 44, paddingHorizontal: space.md },
  lg: { minHeight: 52, paddingHorizontal: space.lg },
} as const;

interface InputGroupContextValue {
  size: 'sm' | 'md' | 'lg';
}

const InputGroupContext = createContext<InputGroupContextValue>({ size: 'md' });
InputGroupContext.displayName = 'InputGroupContext';

const AddonComponent = function InputGroupAddon({
  children,
  divider = false,
  noPadding = false,
  style,
  testID,
}: InputGroupAddonProps) {
  const theme = useTheme();
  const { size } = useContext(InputGroupContext);
  const cfg = SIZE_CONFIG[size];

  // Plain string/number content is wrapped in a themed Text so it reads as a
  // subdued addon label (and never trips RN's "raw text outside <Text>" rule).
  const content =
    typeof children === 'string' || typeof children === 'number' ? (
      <Text
        numberOfLines={1}
        style={{ color: theme.colors.textSecondary, fontSize: fontSize.md }}>
        {children}
      </Text>
    ) : (
      children
    );

  return (
    <View
      testID={testID}
      style={[
        styles.addon,
        !noPadding && { paddingHorizontal: cfg.paddingHorizontal },
        style,
      ]}>
      {divider ? (
        <View
          style={[styles.divider, { backgroundColor: theme.colors.borderLight }]}
        />
      ) : null}
      {content}
    </View>
  );
};

export const Addon = memo(AddonComponent);
Addon.displayName = 'InputGroup.Addon';

/**
 * Horizontal group that wraps an input with leading/trailing addons (icons,
 * text, buttons, `Kbd`). Renders a single bordered chrome — radii, border,
 * focus/error colors match Bloom's `TextField` so a group reads as one field.
 * The input child stretches to fill the middle.
 *
 * ```tsx
 * <InputGroup>
 *   <InputGroup.Addon>https://</InputGroup.Addon>
 *   <TextFieldInput label="Domain" value={v} onChangeText={setV} />
 *   <InputGroup.Addon divider>
 *     <Button size="small" variant="ghost" onPress={go}>Go</Button>
 *   </InputGroup.Addon>
 * </InputGroup>
 * ```
 */
const InputGroupComponent = function InputGroup({
  children,
  isInvalid = false,
  disabled = false,
  size = 'md',
  style,
  testID,
}: InputGroupProps) {
  const theme = useTheme();
  const cfg = SIZE_CONFIG[size];
  const { state: focused, onIn: onFocus, onOut: onBlur } = useInteractionState();
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } =
    useInteractionState();

  const borderColor = isInvalid
    ? theme.colors.negative
    : focused
      ? theme.colors.primary
      : hovered
        ? theme.colors.borderLight
        : 'transparent';

  const backgroundColor = isInvalid
    ? theme.colors.negativeSubtle
    : theme.colors.contrast50;

  const ctx = useMemo<InputGroupContextValue>(() => ({ size }), [size]);

  const webHandlers: Record<string, unknown> =
    Platform.OS === 'web'
      ? {
          onMouseOver: onHoverIn,
          onMouseOut: onHoverOut,
        }
      : {};

  return (
    <InputGroupContext.Provider value={ctx}>
      <View
        testID={testID}
        accessibilityState={disabled ? { disabled: true } : undefined}
        // Capture focus bubbling from a nested input so the whole chrome
        // reflects focus — RN-web bubbles focus/blur, native does not but a
        // nested TextInput's own focus ring is sufficient there.
        onFocus={onFocus}
        onBlur={onBlur}
        {...webHandlers}
        style={[
          styles.container,
          {
            minHeight: cfg.minHeight,
            backgroundColor,
            borderColor,
          },
          disabled && styles.disabled,
          style,
        ]}>
        {children}
      </View>
    </InputGroupContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    overflow: 'hidden',
  },
  addon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    flexShrink: 0,
    position: 'relative',
  },
  divider: {
    position: 'absolute',
    left: 0,
    top: space.sm,
    bottom: space.sm,
    width: StyleSheet.hairlineWidth,
  },
  disabled: {
    opacity: 0.5,
  },
});

const InputGroupBase = memo(InputGroupComponent);
InputGroupBase.displayName = 'InputGroup';

export const InputGroup = Object.assign(InputGroupBase, { Addon });
