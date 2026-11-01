import React, { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Checkbox } from '../checkbox';
import { hostElement } from '../floating/menu-keyboard';
import { ActionRow } from '../dialog/DialogContent';
import { COMMON_MESSAGES, useCommonMessages } from '../locale/common-messages';
import { pickMessages, useMessages } from '../locale/messages';
import type { DialogAction } from '../dialog/types';
import { TextFieldInput } from '../text-field';
import { SURFACES_MESSAGES } from './messages';
import { present, presentWithSignal } from './surface-store';
import type {
  AlertButton,
  SurfaceConfirmOptions,
  SurfaceControls,
  SurfacePromptOptions,
  SurfaceSuppressibleConfirmOptions,
  SurfaceSuppressibleConfirmResult,
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
 * import { alert } from '@oxy.so/bloom';
 *
 * alert('Sign out?', 'You will need to enter your password to sign in again.', [
 *   { text: 'Cancel', style: 'cancel' },
 *   { text: 'Sign out', style: 'destructive', onPress: doSignOut },
 * ]);
 * ```
 */
export function alert(title: string, message?: string, buttons?: AlertButton[]): void {
  // The surface is pure chrome — no children at all. The default button's
  // word is resolved where the surface renders, in the locale in effect there.
  void present(() => null, {
    placement: 'center',
    title,
    description: message,
    label: title,
    actions: (surface, locale) => {
      const resolved: AlertButton[] =
        buttons && buttons.length > 0
          ? buttons
          : [{ text: pickMessages(SURFACES_MESSAGES, locale).ok, style: 'default' }];
      return resolved.map((button) => ({
        label: button.text,
        color: actionColor(button.style),
        shouldCloseOnPress: false,
        onPress: () => {
          surface.dismiss();
          button.onPress?.();
        },
      }));
    },
  });
}

/**
 * Present a confirm surface stacked on top of anything currently open. Resolves
 * `true` on confirm, `false` on cancel OR on backdrop/Escape/back dismissal.
 */
export function confirm(options: SurfaceConfirmOptions): Promise<boolean> {
  return presentWithSignal<unknown>(
    () => null,
    {
      placement: options.placement ?? 'center',
      dismissOnBackdrop: options.dismissible ?? true,
      title: options.title,
      description: options.description,
      label: options.title,
      actions: (surface, locale) => {
        // Defaults resolve here, as the surface renders — `confirm()` itself runs
        // outside React and cannot read the provider's locale.
        const messages = pickMessages(SURFACES_MESSAGES, locale);
        const actions: DialogAction[] = [
          {
            label: options.confirmLabel ?? messages.confirm,
            color: options.destructive ? 'destructive' : 'default',
            shouldCloseOnPress: false,
            onPress: () => surface.dismiss(true),
            testID: 'bloom-surface-confirm-confirm',
          },
        ];
        if (!options.hideCancel) {
          actions.push({
            label: options.cancelLabel ?? pickMessages(COMMON_MESSAGES, locale).cancel,
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
    },
    options.signal,
  ).then((result) => result === true);
}

/**
 * The suppressible confirm's body: the checkbox, then the same button row
 * `confirm()` gets from the Dialog's `actions` — rendered here because the
 * buttons resolve the checkbox's live state.
 *
 * Enter confirms from anywhere in the surface but the button row (a focused
 * Cancel still means Cancel), as a desktop alert's default button does; initial focus
 * lands on the checkbox, the first control, so without this Enter would do
 * nothing. Space toggles the checkbox, Escape cancels through the Dialog.
 */
function SuppressibleConfirmSurface({
  options,
  surface,
  onSuppressedChange,
}: {
  options: SurfaceSuppressibleConfirmOptions;
  surface: SurfaceControls;
  onSuppressedChange: (suppressed: boolean) => void;
}) {
  const { messages } = useMessages(SURFACES_MESSAGES);
  const common = useCommonMessages();
  const [suppressed, setSuppressedState] = useState(options.suppressed ?? false);
  const setSuppressed = useCallback(
    (next: boolean) => {
      setSuppressedState(next);
      onSuppressedChange(next);
    },
    [onSuppressedChange],
  );
  const suppressedRef = useRef(suppressed);
  suppressedRef.current = suppressed;
  const answer = useCallback(
    (confirmed: boolean) =>
      surface.dismiss({
        confirmed,
        suppressed: suppressedRef.current,
      } satisfies SurfaceSuppressibleConfirmResult),
    [surface],
  );
  const bodyRef = useRef<ComponentRef<typeof View> | null>(null);
  const actionsRef = useRef<ComponentRef<typeof View> | null>(null);
  useEffect(() => {
    const body = hostElement(bodyRef.current);
    const panel = body?.closest('[role="dialog"]') ?? body;
    if (!panel) return undefined;
    const onKeyDown = (event: Event) => {
      const key = event as KeyboardEvent;
      if (key.key !== 'Enter' || key.defaultPrevented || key.isComposing) return;
      const target = key.target as Node | null;
      if (target && hostElement(actionsRef.current)?.contains(target)) return;
      key.preventDefault();
      answer(true);
    };
    panel.addEventListener('keydown', onKeyDown);
    return () => panel.removeEventListener('keydown', onKeyDown);
  }, [answer]);

  const actions: DialogAction[] = [
    {
      label: options.confirmLabel ?? messages.confirm,
      color: options.destructive ? 'destructive' : 'default',
      shouldCloseOnPress: false,
      onPress: () => answer(true),
      testID: 'bloom-surface-confirm-confirm',
    },
  ];
  if (!options.hideCancel) {
    actions.push({
      label: options.cancelLabel ?? common.cancel,
      color: 'cancel',
      shouldCloseOnPress: false,
      onPress: () => answer(false),
      testID: 'bloom-surface-confirm-cancel',
    });
  }

  return (
    <View ref={bodyRef}>
      <Checkbox
        checked={suppressed}
        onCheckedChange={setSuppressed}
        label={options.suppressionLabel}
        testID="bloom-surface-confirm-suppression"
      />
      <View ref={actionsRef} style={{ paddingTop: 16 }}>
        <ActionRow actions={actions} />
      </View>
    </View>
  );
}

/**
 * `confirm()` with a suppression checkbox ("Don't ask again") under the
 * description. Resolves whether it was confirmed AND the checkbox's state —
 * `suppressed` is reported however the surface closed, so a cancelled answer
 * can still be remembered.
 *
 * ```tsx
 * const { confirmed, suppressed } = await confirmWithSuppression({
 *   title: 'Close 12 tabs?',
 *   confirmLabel: 'Close tabs',
 *   suppressionLabel: "Don't ask again",
 * });
 * ```
 */
export function confirmWithSuppression(
  options: SurfaceSuppressibleConfirmOptions,
): Promise<SurfaceSuppressibleConfirmResult> {
  // A backdrop / Escape / back dismissal resolves no result, so the checkbox's
  // state is tracked as it changes rather than read from the answer.
  let suppressed = options.suppressed ?? false;
  const onSuppressedChange = (next: boolean) => {
    suppressed = next;
  };
  return presentWithSignal<unknown>(
    (surface) => (
      <SuppressibleConfirmSurface
        options={options}
        surface={surface}
        onSuppressedChange={onSuppressedChange}
      />
    ),
    {
      placement: options.placement ?? 'center',
      dismissOnBackdrop: options.dismissible ?? true,
      title: options.title,
      description: options.description,
      label: options.title,
    },
    options.signal,
  ).then((result) =>
    result && typeof result === 'object' && 'confirmed' in result
      ? (result as SurfaceSuppressibleConfirmResult)
      : { confirmed: false, suppressed },
  );
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
  const { messages } = useMessages(SURFACES_MESSAGES);
  const common = useCommonMessages();
  const [value, setValue] = useState(options.defaultValue ?? '');
  const onSubmit = useCallback(() => surface.dismiss(value), [surface, value]);

  const actions: DialogAction[] = [
    {
      label: options.confirmLabel ?? messages.ok,
      color: 'default',
      shouldCloseOnPress: false,
      onPress: onSubmit,
      testID: 'bloom-surface-prompt-confirm',
    },
    {
      label: options.cancelLabel ?? common.cancel,
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
        onValueChange={setValue}
        autoFocus
        selectTextOnFocus
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
  return present<unknown>((surface) => <PromptSurface options={options} surface={surface} />, {
    placement: options.placement ?? 'center',
    dismissOnBackdrop: options.dismissible ?? true,
    title: options.title,
    description: options.description,
    label: options.title,
  }).then((result) => (typeof result === 'string' ? result : null));
}
