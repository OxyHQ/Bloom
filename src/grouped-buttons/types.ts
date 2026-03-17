import type { StyleProp, ViewStyle } from 'react-native';

export interface GroupedButtonsProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export interface GroupedButtonItemProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  testID?: string;
}
