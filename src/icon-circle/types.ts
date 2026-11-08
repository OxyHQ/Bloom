import type { ViewStyle } from 'react-native';
import type { BloomIconComponent } from '../icons/icon-component';
import type { Props as IconProps } from '../icons/shared';

export interface IconCircleProps {
  icon: BloomIconComponent;
  size?: IconProps['size'];
  style?: ViewStyle | ViewStyle[];
  iconStyle?: IconProps['style'];
}
