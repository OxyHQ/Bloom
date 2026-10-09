import type { StyleProp, ViewStyle } from 'react-native';
import type { TextFieldInputProps } from '../text-field/types';

export type SearchProps = Omit<TextFieldInputProps, 'label'> & {
  label?: TextFieldInputProps['label'];
  /** Called when the user presses the clear button. */
  onClearText?: () => void;
  /** Field layout classes (height, width and padding). */
  fieldClassName?: string;
  /** Inset surface classes (background, border/ring and radius). */
  fieldChromeClassName?: string;
  /** Classes on the outer layout box, including the clear control. */
  containerClassName?: string;
  containerStyle?: StyleProp<ViewStyle>;
};
