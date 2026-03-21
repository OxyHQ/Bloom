import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

export type AccordionType = 'single' | 'multiple';

export interface AccordionProps {
  /** Controls which items are expanded. For 'single' type, pass a string or undefined.
   *  For 'multiple' type, pass an array of strings. */
  value: string | string[] | undefined;
  /** Called when expanded items change. */
  onValueChange: (value: string | string[] | undefined) => void;
  /** Whether only one item can be expanded at a time. */
  type?: AccordionType;
  /** Accordion items. */
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface AccordionItemProps {
  /** Unique value identifying this item. */
  value: string;
  /** Item content: should be AccordionTrigger and AccordionContent. */
  children: React.ReactNode;
  /** Whether this item is disabled. */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export interface AccordionTriggerProps {
  /** Trigger content (label text). */
  children: React.ReactNode;
  /** Icon to show on the left side. */
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export interface AccordionContentProps {
  /** Content to show when expanded. */
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}
