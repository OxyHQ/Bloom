import type { StyleProp, ViewStyle } from 'react-native';

export type AlertDialogActionStyle = 'default' | 'cancel' | 'destructive';

export interface AlertDialogProps {
  /** Whether the dialog is open (controlled). */
  open: boolean;
  /** Close request — backdrop tap, Escape, cancel, or after confirm — as `onOpenChange(false)`. */
  onOpenChange: (open: boolean) => void;
  /** Headline. */
  title: string;
  /** Supporting copy. */
  description?: string;
  /** Confirm button label; `'Confirm'` in English. */
  confirmLabel?: string;
  /** Cancel button label; `'Cancel'` in English. */
  cancelLabel?: string;
  /** Confirm handler. The dialog closes after it runs (sync). */
  onConfirm?: () => void;
  /**
   * Cancel handler: the cancel button, and a dismissal no button answered
   * (Escape, the backdrop, Android Back), as a Mac's Escape presses an alert's
   * Cancel button. Runs in addition to `onOpenChange(false)`; never with
   * `hideCancel`.
   */
  onCancel?: () => void;
  /**
   * Style the confirm button as destructive (negative color). Defaults to
   * `false`.
   */
  destructive?: boolean;
  /** Render only the confirm button (no cancel). Defaults to `false`. */
  hideCancel?: boolean;
  /**
   * Tap-outside / Escape dismisses. Defaults to `true` — matching the shared
   * `Dialog` default and Mention's `ConfirmPrompt`. A backdrop / Escape
   * dismissal always resolves the confirm as cancelled (`false`), so it is
   * safe by default; pass `false` for a truly blocking confirm.
   */
  dismissible?: boolean;
  /**
   * The button the keyboard and the screen reader start on, as a Mac's alert's
   * default button: `'cancel'` where the safe answer is to cancel (a change on
   * trial that may have left the screen unreadable, reverted by Return).
   * Unset, they start on the dialog's first control, the confirm button.
   */
  defaultAction?: 'confirm' | 'cancel';
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
  /**
   * Tap-outside / Escape dismisses (resolving `false`). Defaults to `true`;
   * pass `false` for a blocking confirm that must be answered by a button.
   */
  dismissible?: boolean;
}
