import type { StyleProp, ViewStyle } from 'react-native';
import type { GlyphButtonProps } from '../button/types';
import type { BloomIconComponent } from '../icons/icon-component';
import type { TextFieldInputProps } from '../text-field/types';

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
  /** Leading icon edge in pixels. Default 20. */
  iconSize?: number;
  /** Clear glyph/target geometry. Search owns its name, callback and disabled state. */
  clearButtonProps?: Pick<GlyphButtonProps, 'icon' | 'size' | 'glyphSize'>;
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
