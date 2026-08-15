import { TextInput, type TextInputProps } from 'react-native';
import { atoms as a, web, platform, type ViewStyleProp } from '../styles';

export type TextFieldProps = React.PropsWithChildren<
  { isInvalid?: boolean; radius?: number } & ViewStyleProp
>;

export type TextFieldInputProps = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'placeholder'
> & {
  label: string;
  value?: string;
  onChangeText?: (value: string) => void;
  isInvalid?: boolean;
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
