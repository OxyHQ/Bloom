import React, { useCallback, useEffect, useLayoutEffect, type ComponentRef } from 'react';
import { AccessibilityInfo, View, type GestureResponderEvent } from 'react-native';

import { Text } from '../typography';

import { useTheme } from '../theme/use-theme';
import { ScreenScope } from '../layout';
import { Button } from '../button';
import type { ButtonProps } from '../button/types';
import { useAccessibilityFocus } from '../hooks/use-accessibility-focus';
import { usePlatformKeyboard } from '../platform-surface/context';
import { IS_WEB } from '../styles/platform';
import { useDialogContext } from './context';
import type { DialogAction, DialogActionColor } from './types';

/**
 * Shared dialog content primitives used by every `<Dialog>` placement on both
 * platforms — the centered panel, the side-sheets, and the `BottomSheet`-backed
 * bottom placement. Keeping them here is the single source of truth for the
 * declarative `title` / `description` / `actions` chrome, so the surfaces never
 * drift in spacing, typography, or action-button behaviour.
 */

/**
 * Renders the dialog's body: optional declarative title + description, any
 * `children`, then the action row. The `titleId`/`descriptionId` are wired by
 * the caller onto the dialog role element for `aria-labelledby` /
 * `aria-describedby`.
 */
export function DialogBody({
  titleId,
  descriptionId,
  title,
  description,
  actions,
  children,
}: {
  titleId: string;
  descriptionId: string;
  title?: string;
  description?: string;
  actions?: DialogAction[];
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    // A dialog is its own screen: chrome inside it claims THIS surface's top
    // edge and follows THIS surface's scroller, not the page's underneath
    // (`layout/screen-scope.tsx`).
    <ScreenScope>
      {title ? (
        // Bloom's `Text`, not react-native's: the raw one renders in whatever
        // font the platform picks and takes no theme colour, so every dialog
        // title in the library was the system face while the rest of the surface
        // was Bloom's. The sizes stay explicit — the typography ROLES
        // (`H1`…`H6`, `P`) carry family and weight, not a size ramp.
        <Text
          nativeID={titleId}
          style={{
            fontSize: 22,
            fontWeight: '600',
            paddingBottom: description ? 4 : 16,
            lineHeight: 30,
          }}
        >
          {title}
        </Text>
      ) : null}
      {description ? (
        <Text
          nativeID={descriptionId}
          style={{
            fontSize: 16,
            color: theme.colors.textSecondary,
            paddingBottom: 16,
            lineHeight: 22,
          }}
        >
          {description}
        </Text>
      ) : null}
      {children}
      {actions && actions.length > 0 ? <ActionRow actions={actions} /> : null}
    </ScreenScope>
  );
}

export function ActionRow({ actions }: { actions: DialogAction[] }) {
  return (
    <View style={{ width: '100%', gap: 8, justifyContent: 'flex-end' }}>
      {actions.map((action, idx) => (
        <ActionButton key={`${action.label}-${idx}`} action={action} />
      ))}
    </View>
  );
}

function ActionButton({ action }: { action: DialogAction }) {
  const { close } = useDialogContext();
  // The default button: the keyboard and the screen reader start on it, as a
  // Mac's alert starts on its default button.
  //  - A native host that gives Bloom the window's keys (OxyOS's) moves its
  //    keyboard with the focus asked in the commit that mounts the dialog, as a
  //    roving group's (`use-native-roving-group.ts`): asked then, the dialog
  //    starts on it rather than on its first control, and is said once.
  //  - iOS and Android drop a focus asked before the view is laid out: asked
  //    once it is (`useAccessibilityFocus`).
  //  - The web: it focuses itself as it mounts, which the modal's own focus
  //    (`ModalKeyboard`, a frame later) then keeps.
  const initialFocus = action.initialFocus === true;
  const keyboard = usePlatformKeyboard();
  const inCommit = !IS_WEB && keyboard !== null;
  const ref = useAccessibilityFocus<ComponentRef<typeof Button>>(initialFocus && !inCommit);
  useLayoutEffect(() => {
    if (!initialFocus || !inCommit || ref.current == null) return;
    AccessibilityInfo.sendAccessibilityEvent(
      ref.current as unknown as Parameters<typeof AccessibilityInfo.sendAccessibilityEvent>[0],
      'focus',
    );
  }, [initialFocus, inCommit, ref]);
  useEffect(() => {
    if (!IS_WEB || !initialFocus) return;
    (ref.current as unknown as HTMLElement | null)?.focus?.({ preventScroll: true });
  }, [initialFocus, ref]);
  const color: DialogActionColor = action.color ?? 'default';
  const shouldCloseOnPress = action.shouldCloseOnPress ?? true;

  // `shouldCloseOnPress` (default true) is the ONLY switch, for every colour.
  // `cancel` used to bypass it — on the premise that a cancel button must always
  // dismiss — which made it the one action a caller could not own the dismissal
  // of. That is exactly what a surface needs: the surface stack dismisses
  // through its OWN `dismiss(result)` so the value reaches the `present()`
  // promise, and the entry's `'closing'` status is what runs the exit animation.
  // The default is unchanged, so a caller that says nothing still gets
  // dismiss-on-press.
  //
  // `Button`'s own `onPress` carries no event, so the press is captured through
  // `onClick` on web as well; `onPress` still receives the event where one exists.
  const handlePress = useCallback(
    (e?: GestureResponderEvent) => {
      // `Button` already refuses a press while `loading`; this is the same
      // refusal at the action, so nothing that reaches the handler another way
      // can close the dialog or run the work twice.
      if (action.loading) return;
      const onPress = action.onPress;
      const event = e as GestureResponderEvent;
      if (shouldCloseOnPress) {
        close(onPress ? () => onPress(event) : undefined);
      } else {
        onPress?.(event);
      }
    },
    [action.loading, action.onPress, close, shouldCloseOnPress],
  );

  // Bloom's own `Button`, so a dialog's actions are the same control as every
  // other button in the library: the gradient/secondary/danger recipe,
  // its states and its focus ring, rather than a private pill.
  return (
    <Button
      ref={ref}
      {...ACTION_APPEARANCE[color]}
      size="lg"
      disabled={action.disabled}
      loading={action.loading}
      onPress={() => handlePress()}
      accessibilityLabel={action.label}
      testID={action.testID}
      style={{ width: '100%' }}
    >
      {action.label}
    </Button>
  );
}

/** Dialog actions use the same semantic recipe as standalone buttons. */
const ACTION_APPEARANCE: Record<DialogActionColor, Pick<ButtonProps, 'appearance' | 'tone'>> = {
  default: { appearance: 'solid', tone: 'accent' },
  cancel: { appearance: 'subtle', tone: 'neutral' },
  destructive: { appearance: 'solid', tone: 'danger' },
};
