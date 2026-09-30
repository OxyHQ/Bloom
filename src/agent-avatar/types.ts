import type { StyleProp, ViewStyle } from 'react-native';
import type { AvatarConfig } from './model';

export type AgentAvatarProps = {
  config: AvatarConfig;
  size?: number;
  paused?: boolean;
  label?: string;
  locale?: string;
  /** Compatibility options reserved by the original artwork. */
  interactive?: boolean;
  portrait?: boolean;
  entranceKey?: number;
  workingKey?: number;
  workingCycles?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
};
export type AvatarProps = AgentAvatarProps;
