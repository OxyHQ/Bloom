import type { BloomSize } from '../appearance';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

import type { BloomAppearance, BloomTone } from '../appearance';

import type { Props as SVGIconProps } from '../icons/shared';

export type ChipSize = BloomSize;

/**
 * Data hues: a category, a department, an objective — colours that carry
 * data rather than a status role.
 */
export type ChipHue = 'lime' | 'rose' | 'yellow' | 'cyan' | 'blue' | 'purple' | 'neutral' | 'gray' | 'soft';

export interface ChipProps {
  /** Text content of the chip. */
  children?: React.ReactNode;
  /**
   * How loudly the chip is painted. `subtle` used to be spelled `soft` here and
   * `subtle` on `Badge` — one concept, two names, resolved by the shared
   * {@link BloomAppearance}.
   */
  appearance?: BloomAppearance;
  /** Semantic color. */
  tone?: BloomTone;
  /**
   * Paints the chip in one of the data hues instead of `tone` +
   * `appearance` (both are ignored while it is set; `checked` still promotes the
   * chip to the brand tone). Pair it with a size for the right emphasis:
   * `bold` is `md`, `subtle` is `lg`, `caption` is `sm`.
   */
  hue?: ChipHue;
  /**
   * The colour the chip sits on. A hue's dark fill is translucent,
   * so it is mixed over this. Defaults to the page background.
   */
  surface?: string;
  /** Size preset. */
  size?: ChipSize;
  /** Icon rendered before the label. */
  leadingIcon?: React.ComponentType<SVGIconProps>;
  trailingIcon?: React.ComponentType<SVGIconProps>;
  leading?: React.ReactNode;
  /** Icon or close button rendered after the label. */
  trailing?: React.ReactNode;
  /** Called when the chip is pressed. Makes the chip interactive. */
  onPress?: () => void;
  /** Called when the close/end icon is pressed. */
  onClose?: () => void;
  /** Whether the chip is in a selected state. */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Whether the chip is disabled. */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
}
