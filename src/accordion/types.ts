import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import type { BloomSize } from '../appearance';

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
  /** Inherited size for the whole accordion; nearest BloomScope is used when omitted. */
  size?: BloomSize;
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
  /** The trigger's style; its text keys (colour, font, line height) reach the label. */
  style?: StyleProp<TextStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export interface AccordionContentProps {
  /** The measured body's style, over its default content padding. */
  contentStyle?: StyleProp<ViewStyle>;
  /** Content to show when expanded. */
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}
