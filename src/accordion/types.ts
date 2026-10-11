import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

export type AccordionType = 'single' | 'multiple';
/** Preserve the default springs, or opt into a shared timed reveal/chevron curve. */
export type AccordionTransition =
  | 'spring'
  | {
      /** Non-negative duration in milliseconds. Zero settles immediately. */
      duration: number;
      /** CSS cubic-bezier control points; x coordinates must be in 0..1. Default ease. */
      easing?: readonly [number, number, number, number];
    };

export interface AccordionProps {
  /** Controls which items are expanded. For 'single' type, pass a string or undefined.
   *  For 'multiple' type, pass an array of strings. */
  value: string | string[] | undefined;
  /** Called when expanded items change. */
  onValueChange: (value: string | string[] | undefined) => void;
  /** Whether only one item can be expanded at a time. */
  type?: AccordionType;
  /** OS reduced motion always settles immediately, including live changes. */
  transition?: AccordionTransition;
  /** Accordion items. */
  children: React.ReactNode;
  className?: string;
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
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export interface AccordionTriggerProps {
  /** Trigger content (label text). */
  children: React.ReactNode;
  /** Icon to show on the left side. */
  icon?: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export interface AccordionContentProps {
  /** Classes for the measured body, including its default content padding. */
  contentClassName?: string;
  /** Content to show when expanded. */
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}
