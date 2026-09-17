import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

/** Three treatments: one hairline, two framing hairlines, a soft strip. */
export type DividerVariant = 'single' | 'double' | 'fill';

/** Where the content sits; the remaining line stays flexible. */
export type DividerAlign = 'start' | 'center' | 'end';

export interface DividerProps {
  /** `single` (default) hairline, `double` framing hairlines, or a `fill` strip. Horizontal only. */
  variant?: DividerVariant;
  /** Positions `children` along the divider. Default `center`. */
  align?: DividerAlign;
  /** A label (string, 14/20 medium, secondary text) or any compact control placed in the divider. */
  children?: ReactNode;
  /** Style for the content wrapper. */
  contentStyle?: StyleProp<ViewStyle>;
  /** Style for a string label. */
  textStyle?: StyleProp<TextStyle>;
  /** Custom line color (defaults to the neutral separator stop: neutral-200 light, neutral-800 dark). */
  color?: string;
  /** Line thickness of a `single` divider (defaults to 1). */
  thickness?: number;
  /** If true, renders a vertical divider */
  vertical?: boolean;
  /** Spacing around the divider (marginVertical for horizontal, marginHorizontal for vertical) */
  spacing?: number;
  /** Custom style */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
