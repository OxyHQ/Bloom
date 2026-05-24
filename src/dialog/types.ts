import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';

/**
 * Imperative open/close handle returned by `useDialogControl`.
 *
 * Consumers receive an instance of `DialogControlProps`, which is a stable
 * object whose `open`/`close` methods proxy to whichever `Dialog` instance
 * has currently registered itself via the internal ref. Re-rendering the
 * dialog under the same control does not break the handle.
 */
export type DialogControlRefProps = {
  open: () => void;
  close: (callback?: () => void) => void;
};

export type DialogControlProps = DialogControlRefProps & {
  id: string;
  ref: React.RefObject<DialogControlRefProps | null>;
};

export type DialogContextProps = {
  close: DialogControlProps['close'];
  isWithinDialog: boolean;
};

/**
 * Color of a declarative `DialogAction`. Maps to bloom's theme palette:
 *
 * - `'default'`  -> theme primary (filled CTA)
 * - `'cancel'`   -> theme secondary (auto-dismiss, no `onPress` required)
 * - `'destructive'` -> theme negative
 */
export type DialogActionColor = 'default' | 'cancel' | 'destructive';

export type DialogAction = {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  color?: DialogActionColor;
  disabled?: boolean;
  /**
   * Defaults to `true`. When `true`, the dialog closes (and runs the close
   * animation) before `onPress` is invoked, which gives the surrounding
   * screen transition a chance to start before the action's side effects
   * (navigation, network, etc.) kick in. Set `false` to keep the dialog
   * mounted (e.g. while an async confirmation is in flight).
   */
  shouldCloseOnPress?: boolean;
  testID?: string;
};

/**
 * Props accepted by the unified `<Dialog>` component.
 *
 * Three usage modes — pick whichever fits the call site:
 *
 *   1. **Declarative (`title` / `description` / `actions`).** Most common
 *      confirm/cancel surface. Bloom renders the title, description and
 *      action row for you.
 *
 *   2. **Custom children.** Pass any JSX as `children` and bloom renders it
 *      verbatim inside the dialog frame. Combine with `title` to keep the
 *      header consistent.
 *
 *   3. **Imperative `alert()`.** Bypass the JSX layer entirely — see the
 *      module-level `alert()` helper.
 */
export type DialogProps = React.PropsWithChildren<{
  control: DialogControlProps;
  /** Fires after the dialog has finished closing. */
  onClose?: () => void;
  testID?: string;
  /** Optional dialog header text. Rendered above `description` / `children`. */
  title?: string;
  /** Optional supporting copy, rendered below the title. */
  description?: string;
  /**
   * Optional action row. When provided, bloom renders the appropriate
   * confirm/cancel/destructive buttons for you. Order is preserved.
   */
  actions?: DialogAction[];
  /**
   * Style overrides applied to the inner content container on native (the
   * floating bottom-sheet card) and to the modal panel on web.
   */
  style?: StyleProp<ViewStyle>;
  /** Accessibility label, applied to the dialog role on web. */
  label?: string;
}>;

/**
 * Web-only options. Native uses bloom's `BottomSheet` underneath which has
 * its own positioning model.
 */
export type DialogWebOptions = {
  alignCenter?: boolean;
};
