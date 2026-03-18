export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface BaseToastOptions {
  duration?: number;
  dismissible?: boolean;
  type?: ToastType;
  onDismiss?: () => void;
  onPress?: () => void;
  onAutoClose?: () => void;
}
