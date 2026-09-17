import type { TextInput, TextInputProps } from 'react-native';

import type { ViewStyleProp, TextStyleProp } from '../styles';
import type { TextFieldSize } from '../text-field';

export type TextareaResize = 'none' | 'vertical';

export type TextareaProps = Omit<
  TextInputProps,
  'value' | 'defaultValue' | 'onChangeText' | 'placeholder' | 'multiline' | 'style' | 'maxLength'
> &
  ViewStyleProp & {
    /**
     * Visible label above the field, and the input's accessible name. When
     * omitted, pass `accessibilityLabel` (or at least a `placeholder`, which is
     * used as the fallback name).
     */
    label?: string;
    /** Caption under the field; painted in the error colour when invalid. */
    hint?: string;
    placeholder?: string;
    value?: string;
    defaultValue?: string;
    onChangeText?: (value: string) => void;
    /** Two insets: `medium` (default) or `small`. */
    size?: TextFieldSize;
    /** Resting height in lines, default `3`. Also the floor when `autoResize` is on. */
    rows?: number;
    /** Grow with the content instead of scrolling at `rows`. */
    autoResize?: boolean;
    /** Ceiling for `autoResize`, in lines. Past it the field scrolls. */
    maxRows?: number;
    /** Web's native grab handle, default `vertical`. Forced `none` under `autoResize`. */
    resize?: TextareaResize;
    /** Hard character limit. */
    maxLength?: number;
    /** Show the character counter under the field (`12/280` with `maxLength`). */
    showCount?: boolean;
    isInvalid?: boolean;
    disabled?: boolean;
    /** Append the required asterisk to the label. */
    required?: boolean;
    /** Show the info glyph after the label. */
    tooltip?: boolean;
    /** Style for the `TextInput` itself (the outer `style` is the whole field). */
    inputStyle?: TextStyleProp['style'];
    inputRef?: React.RefObject<TextInput | null> | React.ForwardedRef<TextInput>;
  };
