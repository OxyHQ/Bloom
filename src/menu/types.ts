import type {
  AccessibilityRole,
  GestureResponderEvent,
  PressableProps,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';

import type { Props as SVGIconProps } from '../icons/common';
import type { DialogControlProps } from '../dialog/types';

export type MenuAnchorRect = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export type MenuContextType = {
  control: DialogControlProps;
  isOpen?: boolean;
  triggerRef?: React.RefObject<unknown>;
  dropdownRef?: React.RefObject<unknown>;
};

export type ItemContextType = {
  disabled: boolean;
};

export type TriggerChildProps = {
  control: DialogControlProps;
  state: {
    hovered: boolean;
    focused: boolean;
    pressed: boolean;
  };
  props: {
    ref?: React.Ref<unknown>;
    onPress: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
    accessibilityHint?: string;
    accessibilityLabel: string;
    accessibilityRole: AccessibilityRole;
  };
};

export type MenuTriggerProps = {
  children: (props: TriggerChildProps) => React.ReactNode;
  label: string;
  hint?: string;
  role?: AccessibilityRole;
};

export type MenuItemProps = React.PropsWithChildren<
  Omit<PressableProps, 'style'> & {
    label: string;
    onPress: (e: GestureResponderEvent) => void;
    style?: StyleProp<ViewStyle>;
  }
>;

export type MenuItemTextProps = React.PropsWithChildren<{
  style?: TextStyle;
}>;

export type MenuItemIconProps = {
  icon: React.ComponentType<SVGIconProps>;
  position?: 'left' | 'right';
  fill?: (props: { disabled: boolean }) => string;
};

export type MenuGroupProps = React.PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;
