import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { ButtonProps } from '../button/types';
import type { BloomIconComponent } from '../icons/icon-component';
import type { TextFieldProps, TextFieldInputProps } from '../text-field/types';

/**
 * A filter the person chose, drawn as a token inside the field before the
 * text (UIKit's `UISearchToken`, AppKit's search field tokens): "Kind: PDF".
 */
export type SearchToken = {
  /** Stable and unique among the field's tokens; what `onRemoveToken` reports. */
  key: string;
  /** What the token shows and is called ("Kind: PDF"). */
  label: string;
  /** A glyph before the label. */
  icon?: BloomIconComponent;
};

export type SearchProps = Omit<TextFieldInputProps, 'label'> & {
  label?: TextFieldInputProps['label'];
  /** Field always visible, button on demand, or adapt to the allocated container width. */
  presentation?: 'field' | 'collapsible' | 'auto';
  /** Minimum allocated width for an automatic field, in pixels. Default 240. */
  expandedMinWidth?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Explicit close also clears the query (sidebar behavior). Default false. */
  clearOnClose?: boolean;
  closeLabel?: string;
  /** The closed state is the canonical Button. Search owns activation and its name. */
  triggerProps?: Pick<
    ButtonProps,
    'appearance' | 'tone' | 'size' | 'style' | 'className' | 'testID'
  >;
  /** Optional field action, such as voice search. */
  trailing?: ReactNode;
  fieldStyle?: TextFieldProps['style'];
  /** Leading icon edge in pixels. Default 20. */
  iconSize?: number;
  /** Clear glyph/target geometry. Search owns its name, callback and disabled state. */
  clearButtonProps?: Pick<ButtonProps, 'icon' | 'size' | 'iconSize'>;
  /**
   * Called when the user presses the clear button. With `tokens`, the button
   * clears the whole query: the caller empties the text AND the tokens here
   * (`onRemoveToken` is not called for them).
   */
  onClearText?: () => void;
  /**
   * Filters drawn as tokens inside the field, before the text, in order. The
   * field is controlled: a token goes when the caller drops it from this list.
   */
  tokens?: readonly SearchToken[];
  /**
   * The person removed one token: its remove button, or Backspace with the
   * caret at the start of the text and nothing selected (the last token).
   */
  onRemoveToken?: (key: string) => void;
  /** Field layout classes (height, width and padding). */
  fieldClassName?: string;
  /** Inset surface classes (background, border/ring and radius). */
  fieldChromeClassName?: string;
  /** Classes on the outer layout box, including the clear control. */
  containerClassName?: string;
  containerStyle?: StyleProp<ViewStyle>;
};
