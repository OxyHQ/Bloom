import type { StyleProp, ViewStyle } from 'react-native';
import type { DialogControlProps } from '../dialog/types';

export type PopoverPlacement = 'bottom' | 'top' | 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

export type PopoverControlProps = DialogControlProps;

export interface PopoverTriggerState {
  hovered: boolean;
  focused: boolean;
  pressed: boolean;
}

export interface PopoverTriggerRenderProps {
  control: PopoverControlProps;
  state: PopoverTriggerState;
  props: {
    onPress: () => void;
    onFocus: () => void;
    onBlur: () => void;
    accessibilityLabel?: string;
    accessibilityRole?: 'button';
    'aria-expanded'?: boolean;
    'aria-haspopup'?: 'dialog';
  };
}

export interface PopoverTriggerProps {
  /** Render-prop receiving the control + interaction state + a11y props. */
  children: (renderProps: PopoverTriggerRenderProps) => React.ReactElement;
  /** Accessibility label for the trigger. */
  label?: string;
}

export interface PopoverContentProps {
  children: React.ReactNode;
  /** Accessibility label for the floating panel. */
  label?: string;
  /**
   * Preferred placement relative to the trigger (web only — native presents a
   * bottom sheet). Defaults to `'bottom-start'`.
   */
  placement?: PopoverPlacement;
  /** Gap in px between the trigger and the panel (web). Defaults to `6`. */
  offset?: number;
  /** Minimum panel width in px (web). Defaults to the trigger width. */
  minWidth?: number;
  /** Max panel width in px (web). Defaults to `360`. */
  maxWidth?: number;
  /** Dismiss on outside press / Escape. Defaults to `true`. */
  dismissible?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface PopoverRootProps {
  children: React.ReactNode;
  /** Optionally supply your own control (from `usePopoverControl`). */
  control?: PopoverControlProps;
}
