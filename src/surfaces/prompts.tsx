import React, { useCallback, useState } from 'react';
import { View } from 'react-native';

import { ActionRow } from '../dialog/DialogContent';
import type { DialogAction } from '../dialog/types';
import { TextFieldInput } from '../text-field';
import { present } from './surface-store';
import type {
  AlertButton,
  SurfaceConfirmOptions,
  SurfaceControls,
  SurfacePromptOptions,
} from './types';

/**
 * The three built-in surfaces: `alert`, `confirm`, `prompt`.
 *
 * They are implemented AS surfaces — each calls `present(...)`, so each STACKS
 * on top of whatever is already open. That is the whole reason they live here
 * instead of behind module-scope FIFO queues of their own (`dialog/alert-store`
 * and `alert-dialog/confirm-store`, both removed): a one-at-a-time queue
 * answers "which surface is on top" by arrival order into its OWN queue, which
 * cannot layer over a surface it does not know about — the same reason a
 * per-component `zIndex` constant cannot order overlays (`src/overlay/stack.ts`).
 * The visible consequence of the change: two `alert()` calls in a row now stack
 * rather than queue.
 *
 * Chrome — headline, supporting copy and the button row — is the shared
 * `Dialog`'s own declarative `title` / `description` / `actions`, so these can
 * never drift from a hand-mounted `<Dialog>` in spacing, typography or button
 * palette, and the title/description carry the `aria-labelledby` /
 * `aria-describedby` ids the Dialog wires up.
 *
 * Buttons carry `shouldCloseOnPress: false` and dismiss through the SURFACE's
 * own `dismiss(result)` rather than the underlying `Dialog`'s `close()`. Both
 * halves matter: the value flows back through the `present()` promise, and the
 * store resolves IMMEDIATELY on the press (the exit animation that follows is
 * cosmetic), so an `await confirm(...)` is not held up by an animation.
 */

/** Map an alert button's style onto the shared action row's colour vocabulary. */
function actionColor(style: AlertButton['style']): DialogAction['color'] {
  if (style === 'destructive') return 'destructive';
  if (style === 'cancel') return 'cancel';
  return 'default';
}

/**
 * Show a Bloom-styled alert. Mirrors React Native's
 * `Alert.alert(title, message?, buttons?)` signature, so existing call sites
 * migrate by changing the import only. With no buttons, a single `OK` is
 * rendered.
 *
 * ```tsx
 * import { alert } from '@oxyhq/bloom';
 *
 * alert('Sign out?', 'You will need to enter your password to sign in again.', [
 *   { text: 'Cancel', style: 'cancel' },
 *   { text: 'Sign out', style: 'destructive', onPress: doSignOut },
 * ]);
 * ```
 */
export function alert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
): void {
  const resolved: AlertButton[] =
    buttons && buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default' }];

  // The surface is pure chrome — no children at all.
  void present(() => null, {
    placement: 'center',
    title,
    description: message,
    label: title,
    actions: (surface) =>
      resolved.map((button) => ({
        label: button.text,
        color: actionColor(button.style),
        shouldCloseOnPress: false,
        onPress: () => {
          surface.dismiss();
          button.onPress?.();
        },
      })),
  });
}

/**
 * Present a confirm surface stacked on top of anything currently open. Resolves
 * `true` on confirm, `false` on cancel OR on backdrop/Escape/back dismissal.
 */
export function confirm(options: SurfaceConfirmOptions): Promise<boolean> {
  return present<unknown>(() => null, {
    placement: options.placement ?? 'center',
    dismissOnBackdrop: options.dismissible ?? true,
    title: options.title,
    description: options.description,
    label: options.title,
    actions: (surface) => {
      const actions: DialogAction[] = [
        {
          label: options.confirmLabel ?? 'Confirm',
          color: options.destructive ? 'destructive' : 'default',
          shouldCloseOnPress: false,
          onPress: () => surface.dismiss(true),
          testID: 'bloom-surface-confirm-confirm',
        },
      ];
      if (!options.hideCancel) {
        actions.push({
          label: options.cancelLabel ?? 'Cancel',
          color: 'cancel',
          shouldCloseOnPress: false,
          onPress: () => surface.dismiss(false),
          testID: 'bloom-surface-confirm-cancel',
        });
      }
      return actions;
    },
    // A backdrop / Escape / back dismissal resolves `undefined`, which the
    // mapping below reads as "not confirmed".
  }).then((result) => result === true);
}

/**
 * The prompt's body. Unlike `alert`/`confirm` this cannot be pure presentation
 * config: its buttons read the live input value, which is component state, so
 * the row is rendered here — through the SAME `ActionRow` the Dialog's own
 * `actions` prop renders, at the same position (last child).
 */
function PromptSurface({
  options,
  surface,
}: {
  options: SurfacePromptOptions;
  surface: SurfaceControls;
}) {
  const [value, setValue] = useState(options.defaultValue ?? '');
  const onSubmit = useCallback(() => surface.dismiss(value), [surface, value]);

  const actions: DialogAction[] = [
    {
      label: options.confirmLabel ?? 'OK',
      color: 'default',
      shouldCloseOnPress: false,
      onPress: onSubmit,
      testID: 'bloom-surface-prompt-confirm',
    },
    {
      label: options.cancelLabel ?? 'Cancel',
      color: 'cancel',
      shouldCloseOnPress: false,
      onPress: () => surface.dismiss(null),
      testID: 'bloom-surface-prompt-cancel',
    },
  ];

  return (
    <>
      <TextFieldInput
        label={options.inputLabel ?? options.title}
        placeholder={options.placeholder}
        value={value}
        onChangeText={setValue}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        testID="bloom-surface-prompt-input"
      />
      <View style={{ paddingTop: 16 }}>
        <ActionRow actions={actions} />
      </View>
    </>
  );
}

/**
 * Present a prompt surface stacked on top of anything currently open. Resolves
 * the entered string on submit, or `null` on cancel OR backdrop/Escape/back
 * dismissal.
 */
export function prompt(options: SurfacePromptOptions): Promise<string | null> {
  return present<unknown>(
    (surface) => <PromptSurface options={options} surface={surface} />,
    {
      placement: options.placement ?? 'center',
      dismissOnBackdrop: options.dismissible ?? true,
      title: options.title,
      description: options.description,
      label: options.title,
    },
  ).then((result) => (typeof result === 'string' ? result : null));
}
