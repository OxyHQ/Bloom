import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import {
  type AccessibilityProps,
  Animated,
  Platform,
  StyleSheet,
  TextInput,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { useTheme } from '../theme/use-theme';
import { useInteractionState } from '../hooks/use-interaction-state';
import { mergeRefs } from '../hooks/mergeRefs';
import {
  atoms as a,
  web,
  android,
  platform,
  tokens,
  type TextStyleProp,
  type ViewStyleProp,
} from '../styles';
import { type IconStyle, type Props as SVGIconProps } from '../icons/shared';
import { Text } from '../typography';
import type { TextFieldProps, TextFieldInputProps } from './types';

const Context = createContext<{
  inputRef: React.RefObject<TextInput | null> | null;
  isInvalid: boolean;
  /** Corner radius of the input chrome. A large value (e.g. 999) reads as a pill. */
  radius: number;
  hovered: boolean;
  onHoverIn: () => void;
  onHoverOut: () => void;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}>({
  inputRef: null,
  isInvalid: false,
  radius: 10,
  hovered: false,
  onHoverIn: () => {},
  onHoverOut: () => {},
  focused: false,
  onFocus: () => {},
  onBlur: () => {},
});
Context.displayName = 'TextFieldContext';

/**
 * RN Web paints the browser's default focus outline on the underlying `<input>`.
 * That rectangle follows the input's own box — NOT the TextField chrome — so on a
 * pill (large radius) it pokes out of the corners and reads as a stray border on
 * focus. Strip it so ONLY the TextField's own focus chrome (the animated border)
 * signals focus. `outlineStyle`/`outlineWidth` are RN-Web style properties absent
 * from RN's core types; `web()` guarantees this object is never applied on native.
 */
const WEB_INPUT_OUTLINE_RESET: TextStyle | undefined =
  Platform.OS === 'web'
    ? ({ outlineWidth: 0, outlineStyle: 'none' } as unknown as TextStyle)
    : undefined;

export function TextField({ children, isInvalid = false, radius = 10, style }: TextFieldProps) {
  const inputRef = useRef<TextInput>(null);
  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState();
  const {
    state: focused,
    onIn: onFocus,
    onOut: onBlur,
  } = useInteractionState();

  const context = useMemo(
    () => ({
      inputRef,
      hovered,
      onHoverIn,
      onHoverOut,
      focused,
      onFocus,
      onBlur,
      isInvalid,
      radius,
    }),
    [inputRef, hovered, onHoverIn, onHoverOut, focused, onFocus, onBlur, isInvalid, radius],
  );

  return (
    <Context.Provider value={context}>
      <View
        style={[a.flex_row, a.align_center, a.relative, a.w_full, a.px_md, style]}
        {...(Platform.OS === 'web'
          ? ({
              onClick: () => inputRef.current?.focus(),
              onMouseOver: onHoverIn,
              onMouseOut: onHoverOut,
            } as Record<string, unknown>)
          : undefined)}>
        {children}
      </View>
    </Context.Provider>
  );
}

function useSharedInputStyles() {
  const theme = useTheme();
  return useMemo(() => {
    const hover: ViewStyle = {
      borderColor: theme.colors.borderLight,
    };
    const focus: ViewStyle = {
      backgroundColor: theme.colors.contrast50,
      borderColor: theme.colors.primary,
    };
    const error: ViewStyle = {
      backgroundColor: theme.colors.negativeSubtle,
      borderColor: theme.colors.negative,
    };
    const errorHover: ViewStyle = {
      backgroundColor: theme.colors.negativeSubtle,
      borderColor: theme.colors.error,
    };

    return {
      chromeHover: hover,
      chromeFocus: focus,
      chromeError: error,
      chromeErrorHover: errorHover,
    };
  }, [theme]);
}

export function TextFieldInput({
  label,
  placeholder,
  value,
  onChangeText,
  onFocus,
  onBlur,
  isInvalid,
  inputRef,
  style,
  floatingLabel = false,
  ...rest
}: TextFieldInputProps) {
  const theme = useTheme();
  const ctx = useContext(Context);
  const withinRoot = Boolean(ctx.inputRef);

  const { chromeHover, chromeFocus, chromeError, chromeErrorHover } =
    useSharedInputStyles();

  if (!withinRoot) {
    return (
      <TextField isInvalid={isInvalid}>
        <TextFieldInput
          label={label}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          isInvalid={isInvalid}
          floatingLabel={floatingLabel}
          style={style}
          inputRef={inputRef}
          onFocus={onFocus}
          onBlur={onBlur}
          {...rest}
        />
      </TextField>
    );
  }

  const refs = mergeRefs(
    [ctx.inputRef, inputRef].filter(
      (ref): ref is NonNullable<typeof ref> => ref != null,
    ),
  );

  if (floatingLabel) {
    return (
      <FloatingLabelInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        isInvalid={isInvalid}
        refs={refs}
        style={style}
        chromeHover={chromeHover}
        chromeFocus={chromeFocus}
        chromeError={chromeError}
        chromeErrorHover={chromeErrorHover}
        {...rest}
      />
    );
  }

  const flattened: TextStyle = StyleSheet.flatten([
    a.relative,
    a.z_20,
    a.flex_1,
    a.text_md,
    { color: theme.colors.text },
    a.px_xs,
    {
      lineHeight: a.text_md.fontSize * 1.2,
      textAlignVertical: rest.multiline ? ('top' as const) : undefined,
      minHeight: rest.multiline ? 80 : undefined,
      minWidth: 0,
      paddingTop: 13,
      paddingBottom: 13,
    },
    android({
      paddingTop: 8,
      paddingBottom: 9,
    }),
    web({
      paddingTop: 11,
      paddingBottom: 11,
      marginTop: 2,
      marginBottom: 2,
    }),
    WEB_INPUT_OUTLINE_RESET,
    style,
  ]) as TextStyle;

  return (
    <>
      <TextInput
        accessibilityHint={undefined}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        {...rest}
        accessibilityLabel={label}
        ref={refs}
        value={value}
        onChangeText={onChangeText}
        onFocus={(e) => {
          ctx.onFocus();
          onFocus?.(e);
        }}
        onBlur={(e) => {
          ctx.onBlur();
          onBlur?.(e);
        }}
        placeholder={placeholder === null ? undefined : placeholder || label}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardAppearance={theme.mode === 'light' ? 'light' : 'dark'}
        style={flattened}
      />

      <View
        style={[
          a.z_10,
          a.absolute,
          a.inset_0,
          { borderRadius: ctx.radius },
          { backgroundColor: theme.colors.contrast50 },
          { borderColor: 'transparent', borderWidth: 2 },
          ctx.hovered ? chromeHover : {},
          ctx.focused ? chromeFocus : {},
          ctx.isInvalid || isInvalid ? chromeError : {},
          (ctx.isInvalid || isInvalid) && (ctx.hovered || ctx.focused)
            ? chromeErrorHover
            : {},
        ]}
      />
    </>
  );
}

/** Vertical band the floating label travels between rest (centered) and floated (top). */
const FLOAT_TRAVEL = 11;
/** Resting label size (matches the input text) vs. floated caption size. */
const FLOAT_LABEL_REST_SIZE = a.text_md.fontSize;
const FLOAT_LABEL_FLOAT_SIZE = a.text_xs.fontSize;

type FloatingLabelInputProps = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'placeholder'
> & {
  label: string;
  value?: string;
  onChangeText?: (value: string) => void;
  isInvalid?: boolean;
  refs: (instance: TextInput | null) => void;
  chromeHover: ViewStyle;
  chromeFocus: ViewStyle;
  chromeError: ViewStyle;
  chromeErrorHover: ViewStyle;
};

/**
 * The floating-label rendering of {@link TextFieldInput}.
 *
 * State, not CSS, drives the motion so web and native behave identically:
 * `floated = focused || hasValue`. A single `Animated.Value` (0 → rest, 1 →
 * floated) interpolates the label's `top`, `fontSize`, and `color`; the same
 * `Animated` API maps to CSS transforms on web via react-native-web, so no
 * `:placeholder-shown` / `peer-focus` is needed. Reduced-motion snaps the value
 * (duration 0) instead of animating.
 *
 * The native placeholder is intentionally suppressed — the floating label IS the
 * placeholder at rest. The label still drives `accessibilityLabel`, and the
 * chrome / focus / error / disabled infra is shared with the default variant.
 */
function FloatingLabelInput({
  label,
  value,
  onChangeText,
  onFocus,
  onBlur,
  isInvalid,
  refs,
  style,
  chromeHover,
  chromeFocus,
  chromeError,
  chromeErrorHover,
  ...rest
}: FloatingLabelInputProps) {
  const theme = useTheme();
  const ctx = useContext(Context);
  const reduceMotion = useReducedMotion();

  const hasValue = (value?.length ?? 0) > 0;
  const floated = ctx.focused || hasValue;
  const invalid = ctx.isInvalid || isInvalid;

  const progress = useRef(new Animated.Value(floated ? 1 : 0)).current;

  useEffect(() => {
    const target = floated ? 1 : 0;
    if (reduceMotion) {
      progress.setValue(target);
      return;
    }
    const timing = Animated.timing(progress, {
      toValue: target,
      duration: tokens.animation.duration.fast,
      useNativeDriver: false,
    });
    timing.start();
    return () => timing.stop();
  }, [floated, reduceMotion, progress]);

  const labelTop = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 16 - FLOAT_TRAVEL],
  });
  const labelSize = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [FLOAT_LABEL_REST_SIZE, FLOAT_LABEL_FLOAT_SIZE],
  });
  const labelColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      theme.colors.textSecondary,
      invalid ? theme.colors.negative : theme.colors.primary,
    ],
  });

  const inputStyle: TextStyle = StyleSheet.flatten([
    a.relative,
    a.z_20,
    a.flex_1,
    a.text_md,
    { color: theme.colors.text },
    a.px_xs,
    {
      lineHeight: a.text_md.fontSize * 1.2,
      minWidth: 0,
      paddingTop: 26,
      paddingBottom: 8,
    },
    android({ paddingTop: 24, paddingBottom: 6 }),
    web({ paddingTop: 25, paddingBottom: 7 }),
    WEB_INPUT_OUTLINE_RESET,
    style,
  ]) as TextStyle;

  return (
    <>
      <Animated.Text
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        aria-hidden
        numberOfLines={1}
        style={[
          a.absolute,
          a.z_30,
          a.pointer_events_none,
          {
            left: tokens.space.xs + tokens.space._2xs,
            top: labelTop,
            fontSize: labelSize,
            color: labelColor,
          },
        ]}>
        {label}
      </Animated.Text>

      <TextInput
        accessibilityHint={undefined}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        {...rest}
        accessibilityLabel={label}
        ref={refs}
        value={value}
        onChangeText={onChangeText}
        onFocus={(e) => {
          ctx.onFocus();
          onFocus?.(e);
        }}
        onBlur={(e) => {
          ctx.onBlur();
          onBlur?.(e);
        }}
        placeholder={undefined}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardAppearance={theme.mode === 'light' ? 'light' : 'dark'}
        style={inputStyle}
      />

      <View
        style={[
          a.z_10,
          a.absolute,
          a.inset_0,
          { borderRadius: ctx.radius },
          { backgroundColor: theme.colors.contrast50 },
          { borderColor: 'transparent', borderWidth: 2 },
          ctx.hovered ? chromeHover : {},
          ctx.focused ? chromeFocus : {},
          invalid ? chromeError : {},
          invalid && (ctx.hovered || ctx.focused) ? chromeErrorHover : {},
        ]}
      />
    </>
  );
}

export function TextFieldLabel({
  nativeID,
  children,
}: React.PropsWithChildren<{ nativeID?: string }>) {
  const theme = useTheme();
  return (
    <Text
      nativeID={nativeID}
      style={[
        a.text_sm,
        a.font_medium,
        { color: theme.colors.textSecondary },
        a.mb_sm,
      ]}>
      {children}
    </Text>
  );
}

export function TextFieldIcon({ icon: Comp }: { icon: React.ComponentType<SVGIconProps> }) {
  const theme = useTheme();
  const ctx = useContext(Context);

  const { hover, focus, errorHover, errorFocus } = useMemo(() => {
    const hover: IconStyle = { color: theme.colors.text };
    const focus: IconStyle = { color: theme.colors.primary };
    const errorHover: IconStyle = { color: theme.colors.error };
    const errorFocus: IconStyle = { color: theme.colors.error };
    return { hover, focus, errorHover, errorFocus };
  }, [theme]);

  return (
    <View style={[a.z_20, a.pr_xs]}>
      <Comp
        size="md"
        style={[
          {
            color: theme.colors.textSecondary,
            pointerEvents: 'none',
            flexShrink: 0,
          },
          ctx.hovered ? hover : {},
          ctx.focused ? focus : {},
          ctx.isInvalid && ctx.hovered ? errorHover : {},
          ctx.isInvalid && ctx.focused ? errorFocus : {},
        ]}
      />
    </View>
  );
}

export function TextFieldSuffix({
  children,
  label,
  accessibilityHint,
  style,
}: React.PropsWithChildren<
  TextStyleProp & {
    label: string;
    accessibilityHint?: AccessibilityProps['accessibilityHint'];
  }
>) {
  const theme = useTheme();
  const ctx = useContext(Context);
  return (
    <Text
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      numberOfLines={1}
      style={StyleSheet.flatten([
        a.z_20,
        a.pr_sm,
        a.text_md,
        { color: theme.colors.textSecondary },
        a.pointer_events_none,
        web({ marginTop: -2, lineHeight: a.text_md.fontSize * 1.3 }),
        (ctx.hovered || ctx.focused) ? { color: theme.colors.text } : undefined,
        style,
      ]) as TextStyle}>
      {children}
    </Text>
  );
}

export function TextFieldGhost({
  children,
  value,
}: {
  children: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        a.pointer_events_none,
        a.absolute,
        a.z_10,
        platform({
          native: {
            paddingLeft:
              tokens.space.md +
              tokens.space.xl +
              tokens.space.xs +
              tokens.space.xs,
          },
          web: {
            paddingLeft:
              tokens.space.xl +
              tokens.space.xs +
              tokens.space.xs,
          },
        }),
        web({ paddingRight: tokens.space.md }),
        a.overflow_hidden,
        a.max_w_full,
      ]}
      aria-hidden={true}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Text
        style={[
          { color: 'transparent' },
          a.text_md,
          { lineHeight: a.text_md.fontSize * 1.1875 },
          a.w_full,
        ]}
        numberOfLines={1}>
        {children}
        <Text
          style={[
            { color: theme.colors.textTertiary },
            a.text_md,
            { lineHeight: a.text_md.fontSize * 1.1875 },
          ]}>
          {value}
        </Text>
      </Text>
    </View>
  );
}
