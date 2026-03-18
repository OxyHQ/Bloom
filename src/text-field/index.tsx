import { createContext, useContext, useMemo, useRef } from 'react';
import {
  type AccessibilityProps,
  Platform,
  StyleSheet,
  TextInput,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../theme/use-theme';
import { useInteractionState } from '../hooks/useInteractionState';
import { mergeRefs } from '../hooks/mergeRefs';
import {
  atoms as a,
  web,
  android,
  platform,
  tokens,
  type TextStyleProp,
} from '../styles';
import { type Props as SVGIconProps } from '../icons/common';
import { Text } from '../typography';

const Context = createContext<{
  inputRef: React.RefObject<TextInput | null> | null;
  isInvalid: boolean;
  hovered: boolean;
  onHoverIn: () => void;
  onHoverOut: () => void;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}>({
  inputRef: null,
  isInvalid: false,
  hovered: false,
  onHoverIn: () => {},
  onHoverOut: () => {},
  focused: false,
  onFocus: () => {},
  onBlur: () => {},
});
Context.displayName = 'TextFieldContext';

export type RootProps = React.PropsWithChildren<
  { isInvalid?: boolean } & TextStyleProp
>;

export function Root({ children, isInvalid = false, style }: RootProps) {
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
    }),
    [inputRef, hovered, onHoverIn, onHoverOut, focused, onFocus, onBlur, isInvalid],
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

export function useSharedInputStyles() {
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

export type InputProps = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'placeholder'
> & {
  label: string;
  value?: string;
  onChangeText?: (value: string) => void;
  isInvalid?: boolean;
  inputRef?: React.RefObject<TextInput | null> | React.ForwardedRef<TextInput>;
  placeholder?: string | null | undefined;
};

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  onFocus,
  onBlur,
  isInvalid,
  inputRef,
  style,
  ...rest
}: InputProps) {
  const theme = useTheme();
  const ctx = useContext(Context);
  const withinRoot = Boolean(ctx.inputRef);

  const { chromeHover, chromeFocus, chromeError, chromeErrorHover } =
    useSharedInputStyles();

  if (!withinRoot) {
    return (
      <Root isInvalid={isInvalid}>
        <Input
          label={label}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          isInvalid={isInvalid}
          {...rest}
        />
      </Root>
    );
  }

  const refs = mergeRefs(
    [ctx.inputRef, inputRef].filter(
      (ref): ref is NonNullable<typeof ref> => ref != null,
    ),
  );

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
          { borderRadius: 10 },
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

export function LabelText({
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

export function Icon({ icon: Comp }: { icon: React.ComponentType<SVGIconProps> }) {
  const theme = useTheme();
  const ctx = useContext(Context);

  const { hover, focus, errorHover, errorFocus } = useMemo(() => {
    return {
      hover: { color: theme.colors.text } as TextStyle,
      focus: { color: theme.colors.primary } as TextStyle,
      errorHover: { color: theme.colors.error } as TextStyle,
      errorFocus: { color: theme.colors.error } as TextStyle,
    };
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

export function SuffixText({
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

export function GhostText({
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
