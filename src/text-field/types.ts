import type { TextInput, TextInputProps } from 'react-native';

import type { ViewStyleProp, TextStyleProp } from '../styles';
import type { Props as SVGIconProps } from '../icons/shared';
import type { TextFieldSize } from './shared';

export type { TextFieldSize } from './shared';

export type TextFieldProps = React.PropsWithChildren<
  {
    isInvalid?: boolean;
    /**
     * Paint the whole field disabled: the dimmed fill,
     * no ring, dimmed adornments, and a non-editable input. An input with
     * `disabled` or `editable={false}` reports the same state up on its own.
     */
    disabled?: boolean;
    /** Two heights: `medium` 36 (default), `small` 32. */
    size?: TextFieldSize;
    /** Corner radius of the chrome, default `10`. A large value (999) reads as a pill. */
    radius?: number;
    /**
     * A control in the LEADING slot, before the input — the phone input's
     * country-code select. The field tightens its left padding to 4px around
     * it (`pl-1`, keeping `pr-2` / `pr-1.5`), sits it 2px from the input, and
     * shows its focus ring while the addon holds focus. It replaces a leading
     * `TextFieldIcon`; don't render both.
     */
    leadingAddon?: React.ReactNode;
  } & ViewStyleProp
>;

export type TextFieldInputProps = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'placeholder'
> & {
  label: string;
  value?: string;
  onChangeText?: (value: string) => void;
  isInvalid?: boolean;
  /** Disable the input; the field around it paints disabled. */
  disabled?: boolean;
  /** Size of the self-wrapped field when rendered without a `TextField`. */
  size?: TextFieldSize;
  inputRef?: React.RefObject<TextInput | null> | React.ForwardedRef<TextInput>;
  placeholder?: string | null | undefined;
  /**
   * Render the field with a Material-style floating label. When `true`, the
   * {@link label} sits inside the field as the placeholder while the input is
   * empty AND unfocused; on focus OR when a value is present it animates up to a
   * small caption pinned to the top of the field and the typed value shows
   * below it. Opt-in — the default (`false`) keeps the existing chrome where the
   * label lives above the field (`TextFieldLabel`) and the placeholder is plain.
   *
   * Cross-platform: the animation is driven by focus + value-presence state (no
   * CSS `:placeholder-shown` / `peer-focus`), so web and native behave
   * identically. Respects reduced-motion (snaps instead of animating).
   */
  floatingLabel?: boolean;
};

export type TextFieldLabelProps = React.PropsWithChildren<
  {
    nativeID?: string;
    /** Append the `text-error-primary` asterisk. */
    required?: boolean;
    /** Show the 16px info glyph after the label. */
    tooltip?: boolean;
  } & ViewStyleProp
>;

export type TextFieldHintProps = React.PropsWithChildren<
  {
    /** Paint the hint in the error colour. */
    isInvalid?: boolean;
    nativeID?: string;
  } & TextStyleProp
>;

export interface TextFieldIconProps {
  /** A Bloom icon component, drawn at 20px. */
  icon: React.ComponentType<SVGIconProps>;
  /** `leading` (default) sits 2px before the input; `trailing` 8px after it. */
  position?: 'leading' | 'trailing';
}
