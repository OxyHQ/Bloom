import type { StyleProp, ViewStyle } from 'react-native';

import type { ButtonIconComponent } from '../button/types';

/** The two group sizes: 34px (`medium`) and 30px (`small`) items. */
export type ButtonGroupSize = 'medium' | 'small';

export interface ButtonGroupProps {
  /** Size for every item that does not set its own. */
  size?: ButtonGroupSize;
  /** `ButtonGroupItem` children. Hairlines are drawn between them. */
  children: React.ReactNode;
  /** Names the group for assistive tech. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ButtonGroupItemProps {
  onPress?: () => void;
  /** Label. Ignored when `iconOnly`. */
  children?: React.ReactNode;
  /** Overrides the group's size. */
  size?: ButtonGroupSize;
  /** Highlights the item like its hover state and announces it as pressed. */
  selected?: boolean;
  disabled?: boolean;
  /** Square item showing only `leadingIcon` — name it with `accessibilityLabel`. */
  iconOnly?: boolean;
  /** Icon component before the label, sized and coloured by the item. */
  leadingIcon?: ButtonIconComponent;
  /** Icon component after the label. */
  trailingIcon?: ButtonIconComponent;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
