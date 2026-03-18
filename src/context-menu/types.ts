import type {
  AccessibilityRole,
  GestureResponderEvent,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';

import type { Props as SVGIconProps } from '../icons/common';

export type ContextMenuContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export type ItemContextValue = {
  disabled: boolean;
};

export type TriggerProps = {
  children: (props: TriggerChildProps) => React.ReactNode;
  label: string;
  /** Accessibility hint describing what long-pressing / right-clicking does. */
  hint?: string;
  role?: AccessibilityRole;
  style?: StyleProp<ViewStyle>;
};

export type TriggerChildProps = {
  isOpen: boolean;
  state: {
    hovered: boolean;
    focused: boolean;
    pressed: boolean;
  };
  props: {
    onPress?: (() => void) | null;
    onLongPress?: (() => void) | null;
    onFocus?: (() => void) | null;
    onBlur?: (() => void) | null;
    accessibilityLabel: string;
    accessibilityHint?: string;
  };
};

export type OuterProps = React.PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export type ItemProps = React.PropsWithChildren<{
  label: string;
  onPress: (e?: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export type ItemTextProps = React.PropsWithChildren<{
  style?: TextStyle;
}>;

export type ItemIconProps = {
  icon: React.ComponentType<SVGIconProps>;
};

export type GroupProps = React.PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;
