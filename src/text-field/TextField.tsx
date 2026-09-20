import { useBloomAppearance } from '../appearance';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  type AccessibilityProps,
  Animated,
  Platform,
  StyleSheet,
  TextInput,
  type TextInputProps,
  type TextStyle,
  View,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { useTheme } from '../theme/use-theme';
import { useInteractionState } from '../hooks/use-interaction-state';
import { mergeRefs } from '../hooks/merge-refs';
import {
  atoms as a,
  web,
  android,
  platform,
  tokens,
  type TextStyleProp,
} from '../styles';
import { RiInformationFill } from '../icons/remix';
import { Text } from '../typography';
import {
  SANS_FONT_FAMILY,
  TEXT_FIELD_ADDON_PADDING,
  TEXT_FIELD_GEOMETRY,
  TEXT_FIELD_HINT_TEXT,
  TEXT_FIELD_ICON_SIZE,
  TEXT_FIELD_INPUT_INSET,
  TEXT_FIELD_LEADING_GAP,
  TEXT_FIELD_RADIUS,
  TEXT_FIELD_RING_WIDTH,
  TEXT_FIELD_STACK_GAP,
  TEXT_FIELD_TEXT,
  TEXT_FIELD_TRAILING_GAP,
  TEXT_FIELD_WEB_TRANSITION,
  resolveIconColor,
  resolvePlaceholderColor,
  resolveShellPaint,
  resolveTextFieldPalette,
  type TextFieldPalette,
  type TextFieldSize,
} from './shared';
import type {
  TextFieldHintProps,
  TextFieldIconProps,
  TextFieldInputProps,
  TextFieldLabelProps,
  TextFieldProps,
} from './types';

interface TextFieldContextValue {
  inputRef: React.RefObject<TextInput | null>;
  invalid: boolean;
  /** Disabled by the root's `disabled` OR by the input reporting itself disabled. */
  disabled: boolean;
  /** Lets the input report `disabled` / `editable={false}` up to its siblings. */
  setInputDisabled: (disabled: boolean) => void;
  size: TextFieldSize;
  palette: TextFieldPalette;
  /** Corner radius of the input chrome. A large value (e.g. 999) reads as a pill. */
  radius: number;
  hovered: boolean;
  onHoverIn: () => void;
  onHoverOut: () => void;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  /**
   * The `leadingAddon` holds focus. Paints the shell's focus ring but NOT the input's `focus:` placeholder colour,
   * which belongs to the input alone.
   */
  addonFocused: boolean;
  /** Inside an `InputGroup`: the group paints the shell, so the field draws none. */
  bare: boolean;
}

/**
 * The default is `null`, not an inert value object — see `useTextFieldContext`.
 */
const Context = createContext<TextFieldContextValue | null>(null);
Context.displayName = 'BloomTextFieldContext';

/**
 * Set by `InputGroup`, which owns the filled shell and its ring. A `TextField`
 * (or a self-wrapping `TextFieldInput`, or a `Search`) inside one renders BARE —
 * no shell of its own, no side padding, and the group's size, invalid and
 * disabled state — so the group reads as ONE field instead of a field
 * nested in a field, each drawing its own fill and ring.
 *
 * Internal: not on the family barrel.
 */
export interface TextFieldGroupContextValue {
  size: TextFieldSize;
  invalid: boolean;
  disabled: boolean;
}
export const TextFieldGroupContext = createContext<TextFieldGroupContextValue | null>(null);
TextFieldGroupContext.displayName = 'BloomTextFieldGroupContext';

/**
 * The context, or an error naming what is missing.
 *
 * A filled-in default would let a part render OUTSIDE a `<TextField>` and look
 * finished: an icon that never takes the invalid colour, a suffix stuck on the
 * resting tint, a corner radius that ignores the field it is not inside. Nothing
 * errors, nothing logs, and the field is simply wrong forever — the failure this
 * whole library answers with a throw everywhere else (`useDropdownMenu`,
 * `usePopover`, `useMenubar`, `useTheme`).
 *
 * `TextFieldInput` deliberately does NOT use this: it reads the context directly
 * so that a `null` means "no root above me", which is the signal it uses to wrap
 * itself in one. Standalone `<TextFieldInput>` is a supported spelling and by far
 * the most common one in the fleet.
 */
function useTextFieldContext(): TextFieldContextValue {
  const value = useContext(Context);
  if (!value) {
    throw new Error('TextField parts must be rendered inside a <TextField>.');
  }
  return value;
}

/**
 * RN Web paints the browser's default focus outline on the underlying `<input>`.
 * That rectangle follows the input's own box — NOT the TextField chrome — so on a
 * pill (large radius) it pokes out of the corners and reads as a stray border on
 * focus. Strip it so ONLY the TextField's own focus chrome (the inset ring)
 * signals focus. `outlineStyle`/`outlineWidth` are RN-Web style properties absent
 * from RN's core types; `web()` guarantees this object is never applied on native.
 */
const WEB_INPUT_OUTLINE_RESET: TextStyle | undefined =
  Platform.OS === 'web'
    ? ({ outlineWidth: 0, outlineStyle: 'none' } as unknown as TextStyle)
    : undefined;

const IS_WEB = Platform.OS === 'web';

/** `disabled:cursor-not-allowed`; RN's `cursor` type has no such value. */
const WEB_INPUT_DISABLED_CURSOR: TextStyle | undefined = IS_WEB
  ? ({ cursor: 'not-allowed' } as unknown as TextStyle)
  : undefined;

/** The textarea rests at three lines: 3 × 20 + 2 × 8. */
const MULTILINE_MIN_HEIGHT = 3 * TEXT_FIELD_TEXT.lineHeight + 16;

export function TextField({
  children,
  invalid: invalidProp = false,
  disabled: disabledProp = false,
  size: sizeProp,
  radius = TEXT_FIELD_RADIUS,
  leadingAddon,
  style,
}: TextFieldProps) {
  const theme = useTheme();
  const group = useContext(TextFieldGroupContext);
  const bare = group !== null;
  const invalid = invalidProp || (group?.invalid ?? false);
  const disabled = disabledProp || (group?.disabled ?? false);
  const {size: inheritedSize} = useBloomAppearance({size: sizeProp}, {size: 'md', tone: 'neutral'});
  const size = group?.size ?? inheritedSize;
  const inputRef = useRef<TextInput>(null);
  const [inputDisabled, setInputDisabled] = useState(false);
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
  const [addonFocused, setAddonFocused] = useState(false);
  const hasAddon = leadingAddon !== undefined && leadingAddon !== null;

  const palette = useMemo(() => resolveTextFieldPalette(theme), [theme]);
  const resolvedDisabled = disabled || inputDisabled;

  const context = useMemo(
    () => ({
      inputRef,
      hovered,
      onHoverIn,
      onHoverOut,
      focused,
      onFocus,
      onBlur,
      addonFocused,
      invalid,
      disabled: resolvedDisabled,
      setInputDisabled,
      size,
      palette,
      radius,
      bare,
    }),
    [inputRef, hovered, onHoverIn, onHoverOut, focused, onFocus, onBlur, addonFocused, invalid, resolvedDisabled, size, palette, radius, bare],
  );

  return (
    <Context.Provider value={context}>
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.relative,
          bare
            ? { flex: 1, minWidth: 0 }
            : [
                a.w_full,
                hasAddon
                  ? TEXT_FIELD_ADDON_PADDING[size]
                  : { paddingHorizontal: TEXT_FIELD_GEOMETRY[size].paddingHorizontal },
              ],
          style,
        ]}
        {...(IS_WEB
          ? ({
              onClick: () => inputRef.current?.focus(),
              onMouseOver: onHoverIn,
              onMouseOut: onHoverOut,
            } as Record<string, unknown>)
          : undefined)}>
        {hasAddon ? (
          <LeadingAddon onFocusChange={setAddonFocused}>{leadingAddon}</LeadingAddon>
        ) : null}
        {children}
      </View>
    </Context.Provider>
  );
}

/**
 * The `leadingAddon` slot: `shrink-0`, 2px before the input (`gap-0.5`).
 *
 * On web it also reports FOCUS WITHIN up to the shell, lighting the ring while
 * the country-code trigger holds focus — except while that control reports
 * `aria-expanded="true"`: the ring drops to the hover ring while the list is
 * open and comes back on close. Bloom's trigger keeps DOM focus while its list
 * is open, so the attribute is what marks the open state.
 *
 * Its click stops at the slot: the shell's own click focuses the input, which
 * would take focus from the control the press was meant for.
 */
function LeadingAddon({
  children,
  onFocusChange,
}: {
  children: React.ReactNode;
  onFocusChange: (focused: boolean) => void;
}) {
  const observer = useRef<MutationObserver | null>(null);
  useEffect(() => () => observer.current?.disconnect(), []);

  const webHandlers = IS_WEB
    ? {
        onClick: (event: { stopPropagation: () => void }) => event.stopPropagation(),
        onFocus: (event: { target: unknown; currentTarget: unknown }) => {
          const target = event.target as HTMLElement;
          // React bubbles focus through PORTALS too: a row of the addon's open
          // list is a React descendant but not a DOM one, and is not "within".
          if (!(event.currentTarget as HTMLElement).contains(target)) return;
          const report = () => onFocusChange(target.getAttribute('aria-expanded') !== 'true');
          observer.current?.disconnect();
          if (typeof MutationObserver !== 'undefined') {
            observer.current = new MutationObserver(report);
            observer.current.observe(target, { attributes: true, attributeFilter: ['aria-expanded'] });
          }
          report();
        },
        onBlur: (event: { target: unknown; currentTarget: unknown }) => {
          if (!(event.currentTarget as HTMLElement).contains(event.target as HTMLElement)) return;
          observer.current?.disconnect();
          observer.current = null;
          onFocusChange(false);
        },
      }
    : undefined;

  return (
    <View
      style={[a.z_20, { flexShrink: 0, marginRight: TEXT_FIELD_LEADING_GAP }]}
      {...(webHandlers as Record<string, unknown> | undefined)}>
      {children}
    </View>
  );
}

/** The filled shell behind the input: fill + inset ring for the current state. */
function Chrome({ invalid }: { invalid: boolean }) {
  const ctx = useTextFieldContext();
  if (ctx.bare) return null;
  const paint = resolveShellPaint(ctx.palette, {
    hovered: ctx.hovered,
    focused: ctx.focused || ctx.addonFocused,
    invalid,
    disabled: ctx.disabled,
  });
  return (
    <View
      pointerEvents="none"
      style={[
        a.z_10,
        a.absolute,
        a.inset_0,
        {
          borderRadius: ctx.radius,
          borderWidth: TEXT_FIELD_RING_WIDTH,
          ...paint,
        },
        TEXT_FIELD_WEB_TRANSITION,
      ]}
    />
  );
}

export function TextFieldInput({
  label,
  placeholder,
  value,
  onValueChange,
  onFocus,
  onBlur,
  invalid: invalidProp,
  disabled,
  size,
  inputRef,
  style,
  floatingLabel = false,
  ...rest
}: TextFieldInputProps) {
  const theme = useTheme();
  // Read directly rather than through `useTextFieldContext`: a missing root is
  // not an error here, it is the branch below.
  const ctx = useContext(Context);
  const inputDisabled = disabled === true || rest.editable === false;
  const setInputDisabled = ctx?.setInputDisabled;

  // Report up, so the icon and suffix beside the input dim with it.
  useEffect(() => {
    if (!setInputDisabled) return;
    setInputDisabled(inputDisabled);
    return () => setInputDisabled(false);
  }, [setInputDisabled, inputDisabled]);

  if (ctx === null) {
    return (
      <TextField invalid={invalidProp} disabled={disabled} size={size}>
        <TextFieldInput
          label={label}
          placeholder={placeholder}
          value={value}
          onValueChange={onValueChange}
          invalid={invalidProp}
          disabled={disabled}
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

  const invalid = ctx.invalid || invalidProp === true;
  const fieldDisabled = ctx.disabled || inputDisabled;
  const state = {
    hovered: ctx.hovered,
    focused: ctx.focused,
    invalid,
    disabled: fieldDisabled,
  };

  // `editable` is what native reads; web additionally gets the real `disabled`
  // attribute (react-native-web forwards it) so the control leaves the tab order
  // and `:disabled` matches an `isDisabled` prop.
  const disabledProps = {
    editable: fieldDisabled ? false : rest.editable,
    'aria-disabled': fieldDisabled || undefined,
    'aria-invalid': invalid || undefined,
  };
  const webDisabled = IS_WEB && fieldDisabled ? ({ disabled: true } as Record<string, unknown>) : undefined;

  if (floatingLabel) {
    return (
      <FloatingLabelInput
        label={label}
        value={value}
        onValueChange={onValueChange}
        onFocus={onFocus}
        onBlur={onBlur}
        invalid={invalid}
        refs={refs}
        style={style}
        {...rest}
        {...disabledProps}
        {...webDisabled}
      />
    );
  }

  const geometry = TEXT_FIELD_GEOMETRY[ctx.size];
  const multiline = rest.multiline === true;

  const flattened: TextStyle = StyleSheet.flatten([
    a.relative,
    a.z_20,
    a.flex_1,
    {
      fontFamily: SANS_FONT_FAMILY,
      fontSize: TEXT_FIELD_TEXT.fontSize,
      fontWeight: TEXT_FIELD_TEXT.fontWeight,
      color: fieldDisabled ? ctx.palette.textDisabled : ctx.palette.text,
      minWidth: 0,
      // Longhands, so a caller's `paddingRight` (Search's clear button) wins on
      // web too — `paddingHorizontal` becomes `padding-inline`, which outranks it.
      paddingLeft: TEXT_FIELD_INPUT_INSET,
      paddingRight: 0,
    },
    multiline
      ? {
          lineHeight: TEXT_FIELD_TEXT.lineHeight,
          textAlignVertical: 'top' as const,
          minHeight: MULTILINE_MIN_HEIGHT,
          paddingTop: 8,
          paddingBottom: 8,
        }
      : {
          // The input IS the shell's height, so the whole field is the hit area.
          // Inside an `InputGroup` the group's 2px ring border takes its share.
          height: ctx.bare ? geometry.height - 2 * TEXT_FIELD_RING_WIDTH : geometry.height,
          paddingTop: 0,
          paddingBottom: 0,
          textAlignVertical: 'center' as const,
        },
    // A single-line iOS `TextInput` with a `lineHeight` sits its glyphs low, so
    // the 20px line box is web's alone; native centres within the height.
    !multiline ? web({ lineHeight: TEXT_FIELD_TEXT.lineHeight }) : undefined,
    android({ includeFontPadding: false }),
    WEB_INPUT_OUTLINE_RESET,
    // `disabled:cursor-not-allowed` on the control.
    fieldDisabled ? WEB_INPUT_DISABLED_CURSOR : undefined,
    style,
  ]) as TextStyle;

  return (
    <>
      <TextInput
        accessibilityHint={undefined}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        {...rest}
        {...disabledProps}
        {...webDisabled}
        accessibilityLabel={label}
        ref={refs}
        value={value}
        onChangeText={onValueChange}
        onFocus={(e) => {
          ctx.onFocus();
          onFocus?.(e);
        }}
        onBlur={(e) => {
          ctx.onBlur();
          onBlur?.(e);
        }}
        placeholder={placeholder === null ? undefined : placeholder || label}
        placeholderTextColor={resolvePlaceholderColor(ctx.palette, state)}
        keyboardAppearance={theme.mode === 'light' ? 'light' : 'dark'}
        style={flattened}
      />

      <Chrome invalid={invalid} />
    </>
  );
}

/** Vertical band the floating label travels between rest (centered) and floated (top). */
const FLOAT_TRAVEL = 11;
/** Resting label size (matches the input text) vs. floated caption size. */
const FLOAT_LABEL_REST_SIZE = TEXT_FIELD_TEXT.fontSize;
const FLOAT_LABEL_FLOAT_SIZE = TEXT_FIELD_HINT_TEXT.fontSize;

type FloatingLabelInputProps = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'placeholder'
> & {
  label: string;
  value?: string;
  onValueChange?: (value: string) => void;
  invalid?: boolean;
  refs: (instance: TextInput | null) => void;
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
 * chrome / focus / error / disabled paint is shared with the default variant.
 *
 * The floating label's geometry is Bloom's own (a taller field to hold the
 * caption); its colours are the input palette.
 */
function FloatingLabelInput({
  label,
  value,
  onValueChange,
  onFocus,
  onBlur,
  invalid: invalidProp,
  refs,
  style,
  ...rest
}: FloatingLabelInputProps) {
  const theme = useTheme();
  const ctx = useTextFieldContext();
  const reduceMotion = useReducedMotion();

  const hasValue = (value?.length ?? 0) > 0;
  const floated = ctx.focused || hasValue;
  const invalid = ctx.invalid || invalidProp === true;
  const palette = ctx.palette;

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
  const restColor = invalid
    ? palette.placeholderInvalid
    : ctx.disabled
      ? palette.textDisabled
      : palette.placeholder;
  const labelColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [restColor, invalid ? palette.error : ctx.disabled ? palette.textDisabled : palette.hint],
  });

  const inputStyle: TextStyle = StyleSheet.flatten([
    a.relative,
    a.z_20,
    a.flex_1,
    {
      fontFamily: SANS_FONT_FAMILY,
      fontSize: TEXT_FIELD_TEXT.fontSize,
      fontWeight: TEXT_FIELD_TEXT.fontWeight,
      color: ctx.disabled ? palette.textDisabled : palette.text,
      lineHeight: TEXT_FIELD_TEXT.fontSize * 1.2,
      minWidth: 0,
      paddingLeft: tokens.space.xs,
      paddingRight: tokens.space.xs,
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
            fontFamily: SANS_FONT_FAMILY,
            fontWeight: TEXT_FIELD_HINT_TEXT.fontWeight,
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
        onChangeText={onValueChange}
        onFocus={(e) => {
          ctx.onFocus();
          onFocus?.(e);
        }}
        onBlur={(e) => {
          ctx.onBlur();
          onBlur?.(e);
        }}
        placeholder={undefined}
        placeholderTextColor={palette.placeholder}
        keyboardAppearance={theme.mode === 'light' ? 'light' : 'dark'}
        style={inputStyle}
      />

      <Chrome invalid={invalid} />
    </>
  );
}

/**
 * The visible label ABOVE the field: `text-body-medium`
 * (14/20 500) in `text-primary`, a `text-error-primary` asterisk and a 16px
 * `foreground-icon-quaternary` info glyph, 2px apart, 4px above the shell.
 */
export function TextFieldLabel({
  nativeID,
  children,
  required = false,
  tooltip = false,
  style,
}: TextFieldLabelProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveTextFieldPalette(theme), [theme]);
  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        { gap: TEXT_FIELD_LEADING_GAP, marginBottom: TEXT_FIELD_STACK_GAP },
        style,
      ]}>
      <Text variant="body-medium" nativeID={nativeID} style={{ color: palette.text }}>
        {children}
      </Text>
      {required ? (
        <Text variant="body-medium" accessibilityLabel="required" style={{ color: palette.error }}>
          *
        </Text>
      ) : null}
      {tooltip ? (
        <RiInformationFill
          size="sm"
          aria-hidden
          fill={palette.infoIcon}
          style={{ flexShrink: 0 }}
        />
      ) : null}
    </View>
  );
}

/**
 * Caption under the field: `text-caption-1-medium`
 * (12/16 500, tracking .15) in `text-secondary`, `text-error-primary` when
 * invalid, 1px top inset, 4px below the shell.
 */
export function TextFieldHint({
  children,
  invalid = false,
  nativeID,
  style,
}: TextFieldHintProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveTextFieldPalette(theme), [theme]);
  return (
    <Text
      variant="caption-1-medium"
      nativeID={nativeID}
      style={[
        {
          paddingTop: 1,
          marginTop: TEXT_FIELD_STACK_GAP,
          color: invalid ? palette.error : palette.hint,
        },
        style,
      ]}>
      {children}
    </Text>
  );
}

/**
 * A 20px adornment in `foreground-icon-tertiary` — dimmed when the field is
 * disabled, red when it is invalid. The icon does not react to hover or
 * focus; the ring does.
 */
export function TextFieldIcon({ icon: Comp, position = 'leading' }: TextFieldIconProps) {
  const ctx = useTextFieldContext();
  const color = resolveIconColor(ctx.palette, {
    invalid: ctx.invalid,
    disabled: ctx.disabled,
  });

  return (
    <View
      style={[
        a.z_20,
        position === 'leading'
          ? { marginRight: TEXT_FIELD_LEADING_GAP }
          : { marginLeft: TEXT_FIELD_TRAILING_GAP },
      ]}>
      <Comp
        size="md"
        style={[
          {
            color,
            pointerEvents: 'none',
            flexShrink: 0,
          },
          TEXT_FIELD_WEB_TRANSITION,
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
  const ctx = useTextFieldContext();
  const color = ctx.disabled
    ? ctx.palette.textDisabled
    : ctx.hovered || ctx.focused
      ? ctx.palette.text
      : ctx.palette.hint;
  return (
    <Text
      variant="body-regular"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      numberOfLines={1}
      style={StyleSheet.flatten([
        a.z_20,
        {
          marginLeft: TEXT_FIELD_TRAILING_GAP,
          color,
        },
        a.pointer_events_none,
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
  const palette = useMemo(() => resolveTextFieldPalette(theme), [theme]);
  // Aligned with the typed text after a leading icon: icon + gap + input inset.
  const textOffset = TEXT_FIELD_ICON_SIZE + TEXT_FIELD_LEADING_GAP + TEXT_FIELD_INPUT_INSET;
  return (
    <View
      style={[
        a.pointer_events_none,
        a.absolute,
        a.z_10,
        platform({
          native: {
            paddingLeft: TEXT_FIELD_GEOMETRY.md.paddingHorizontal + textOffset,
          },
          web: {
            paddingLeft: textOffset,
          },
        }),
        web({ paddingRight: TEXT_FIELD_GEOMETRY.md.paddingHorizontal }),
        a.overflow_hidden,
        a.max_w_full,
      ]}
      aria-hidden={true}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Text
        variant="body-regular"
        style={[{ color: 'transparent' }, a.w_full]}
        numberOfLines={1}>
        {children}
        <Text variant="body-regular" style={{ color: palette.placeholder }}>
          {value}
        </Text>
      </Text>
    </View>
  );
}

