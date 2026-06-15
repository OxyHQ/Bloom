import type { StyleProp, ViewStyle } from 'react-native';

export type AlertDialogActionStyle = 'default' | 'cancel' | 'destructive';

export interface AlertDialogProps {
  /** Whether the dialog is mounted + visible (controlled). */
  visible: boolean;
  /** Close request — backdrop tap, Escape, cancel, or after confirm. */
  onClose: () => void;
  /** Headline. */
  title: string;
  /** Supporting copy. */
  description?: string;
  /** Confirm button label. Defaults to `'Confirm'`. */
  confirmLabel?: string;
  /** Cancel button label. Defaults to `'Cancel'`. */
  cancelLabel?: string;
  /** Confirm handler. The dialog closes after it runs (sync). */
  onConfirm?: () => void;
  /** Cancel handler. Runs in addition to `onClose`. */
  onCancel?: () => void;
  /**
   * Style the confirm button as destructive (negative color). Defaults to
   * `false`.
   */
  destructive?: boolean;
  /** Render only the confirm button (no cancel). Defaults to `false`. */
  hideCancel?: boolean;
  /**
   * Tap-outside / Escape dismisses. Defaults to `false` — alert dialogs are
   * usually blocking until answered.
   */
  dismissible?: boolean;
  cardStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  hideCancel?: boolean;
  dismissible?: boolean;
}
