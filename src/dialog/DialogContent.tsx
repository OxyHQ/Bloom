import React, { useCallback, useEffect, useLayoutEffect, useState, type ComponentRef } from 'react';
import {
  AccessibilityInfo,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';

import { Text } from '../typography';

import { useTheme } from '../theme/use-theme';
import { ScreenScope } from '../layout';
import { Button } from '../button';
import type { ButtonProps } from '../button/types';
import { useAccessibilityFocus } from '../hooks/use-accessibility-focus';
import { usePlatformKeyboard } from '../platform-surface/context';
import { useDesktopPlatform } from '../platform-surface/use-desktop-platform';
import { resolveLabelColors } from '../theme/label-colors';
import { DESKTOP_TEXT_STYLES } from '../typography/desktop-scale';
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
  icon,
  actions,
  children,
}: {
  titleId: string;
  descriptionId: string;
  title?: string;
  description?: string;
  /** Drawn above the title (`DialogProps.icon`). */
  icon?: React.ReactNode;
  actions?: DialogAction[];
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  const desktop = useDesktopPlatform();
  if (desktop) {
    return (
      <DesktopDialogBody
        titleId={titleId}
        descriptionId={descriptionId}
        title={title}
        description={description}
        icon={icon}
        actions={actions}
      >
        {children}
      </DesktopDialogBody>
    );
  }
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
      {icon != null ? <View style={{ paddingBottom: 12 }}>{icon}</View> : null}
      {children}
      {actions && actions.length > 0 ? <ActionRow actions={actions} /> : null}
    </ScreenScope>
  );
}

/**
 * A desktop platform's alert (`useDesktopPlatform()`): one layout for every
 * dialog drawn from the declarative `title`/`description`/`actions`, whether
 * an `AlertDialog`, a `confirm()`/`alert()` surface or an application's own
 * `Dialog`. Left-aligned: the icon (an application's own, or a caution
 * symbol) on top at {@link DESKTOP_ALERT_ICON_SIZE}, the title in the desktop
 * `headline` style, the message in `callout` in the secondary label colour,
 * then the buttons ({@link ActionRow}, desktop order).
 */
function DesktopDialogBody({
  titleId,
  descriptionId,
  title,
  description,
  icon,
  actions,
  children,
}: {
  titleId: string;
  descriptionId: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: DialogAction[];
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  const labels = resolveLabelColors(theme);
  return (
    <ScreenScope>
      {icon != null ? (
        <View
          testID="bloom-dialog-icon"
          style={{
            width: DESKTOP_ALERT_ICON_SIZE,
            height: DESKTOP_ALERT_ICON_SIZE,
            marginBottom: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
      ) : null}
      {title ? (
        <Text
          nativeID={titleId}
          style={{
            ...DESKTOP_TEXT_STYLES.headline,
            color: labels.label,
            paddingBottom: description ? 6 : 16,
          }}
        >
          {title}
        </Text>
      ) : null}
      {description ? (
        <Text
          nativeID={descriptionId}
          style={{ ...DESKTOP_TEXT_STYLES.callout, color: labels.secondary, paddingBottom: 16 }}
        >
          {description}
        </Text>
      ) : null}
      {children}
      {actions && actions.length > 0 ? <ActionRow actions={actions} /> : null}
    </ScreenScope>
  );
}

/** Whether `children` renders anything: a dialog with none is its declarative chrome alone. */
export function hasChildren(children: React.ReactNode): boolean {
  let any = false;
  React.Children.forEach(children, (child) => {
    if (child !== null && child !== undefined && child !== false && child !== '') any = true;
  });
  return any;
}

/** A desktop alert's icon: an application's icon or a caution symbol, this many px square. */
export const DESKTOP_ALERT_ICON_SIZE = 56;

/**
 * A desktop alert's width (`Dialog` without children, on a desktop platform):
 * narrow, so the title wraps to two short lines rather than running across.
 */
export const DESKTOP_ALERT_WIDTH = 280;

/** A desktop alert's button height: a desktop's compact push button. */
export const DESKTOP_ACTION_HEIGHT = 28;

/** The least width of a desktop alert's button, so a short `OK` is still a target. */
export const DESKTOP_ACTION_MIN_WIDTH = 72;

/**
 * Which of `actions` is the DEFAULT button on a desktop: the one that asks for
 * the initial focus, else the first that is not a cancel. -1 when none is
 * (every action is a cancel: `Done`, `Close`).
 */
export function desktopDefaultAction(actions: readonly DialogAction[]): number {
  const focused = actions.findIndex((action) => action.initialFocus === true);
  if (focused >= 0) return focused;
  return actions.findIndex((action) => (action.color ?? 'default') !== 'cancel');
}

/**
 * Which of `actions` the keyboard and the screen reader start on, on a desktop:
 * the one that asks for it, else the default button, as a Mac's alert starts on
 * its default button. Off a desktop only an action that asks is focused; its
 * stack's first button is where a reader begins, and there that is the
 * caller's first action, while a desktop's row puts the default last.
 */
export function desktopInitialFocus(actions: readonly DialogAction[]): number {
  const asked = actions.findIndex((action) => action.initialFocus === true);
  return asked >= 0 ? asked : desktopDefaultAction(actions);
}

/**
 * The buttons in a desktop's order. `row`: leading to trailing, the default
 * LAST, so it sits at the trailing edge with the others (Cancel) before it.
 * `stack`: top to bottom, the default FIRST, Cancel at the bottom. The others
 * keep the order the caller gave them.
 */
export function desktopActionOrder(
  actions: readonly DialogAction[],
  layout: 'row' | 'stack',
): DialogAction[] {
  const index = desktopDefaultAction(actions);
  if (index < 0) return [...actions];
  const others = actions.filter((_, i) => i !== index);
  const primary = actions[index]!;
  return layout === 'row' ? [...others, primary] : [primary, ...others];
}

export function ActionRow({ actions }: { actions: DialogAction[] }) {
  const desktop = useDesktopPlatform();
  if (desktop) return <DesktopActionRow actions={actions} />;
  return (
    <View style={{ width: '100%', gap: 8, justifyContent: 'flex-end' }}>
      {actions.map((action, idx) => (
        <ActionButton key={`${action.label}-${idx}`} action={action} />
      ))}
    </View>
  );
}

/**
 * A desktop's buttons: each as wide as its label (at least
 * {@link DESKTOP_ACTION_MIN_WIDTH}), side by side at the trailing edge with
 * the default last; stacked full width with the default on top when there are
 * three or more, or when two do not fit side by side.
 */
function DesktopActionRow({ actions }: { actions: DialogAction[] }) {
  const [room, setRoom] = useState(0);
  const [needed, setNeeded] = useState(0);
  const stacked = actions.length >= 3 || (room > 0 && needed > room);
  const ordered = desktopActionOrder(actions, stacked ? 'stack' : 'row');
  const focused = actions[desktopInitialFocus(actions)];
  return (
    <View
      testID="bloom-dialog-actions"
      onLayout={(event: LayoutChangeEvent) => setRoom(event.nativeEvent.layout.width)}
      style={{ width: '100%' }}
    >
      {stacked ? (
        <View style={{ gap: 8 }}>
          {ordered.map((action, idx) => (
            <ActionButton
              key={`${action.label}-${idx}`}
              action={action}
              desktop="stack"
              focus={action === focused}
            />
          ))}
        </View>
      ) : (
        <View
          // Sized by its buttons, never shrunk: its width is what the row needs,
          // which the alert compares with its own to decide to stack.
          onLayout={(event: LayoutChangeEvent) => setNeeded(event.nativeEvent.layout.width)}
          style={{ flexDirection: 'row', alignSelf: 'flex-end', flexShrink: 0, gap: 8 }}
        >
          {ordered.map((action, idx) => (
            <ActionButton
              key={`${action.label}-${idx}`}
              action={action}
              desktop="row"
              focus={action === focused}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function ActionButton({
  action,
  desktop,
  focus = false,
}: {
  action: DialogAction;
  /** A desktop's button (`DesktopActionRow`): beside the others, or one of a stack. */
  desktop?: 'row' | 'stack';
  /** The initial focus though the action does not ask for it: a desktop's default button. */
  focus?: boolean;
}) {
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
  const initialFocus = action.initialFocus === true || focus;
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
      {...(desktop ? DESKTOP_ACTION_APPEARANCE : ACTION_APPEARANCE)[color]}
      size={desktop ? 'sm' : 'lg'}
      disabled={action.disabled}
      loading={action.loading}
      onPress={() => handlePress()}
      accessibilityLabel={action.label}
      testID={action.testID}
      style={
        desktop === 'row'
          ? { height: DESKTOP_ACTION_HEIGHT, minWidth: DESKTOP_ACTION_MIN_WIDTH, flexShrink: 0 }
          : desktop === 'stack'
            ? { height: DESKTOP_ACTION_HEIGHT, width: '100%' }
            : { width: '100%' }
      }
    >
      {action.label}
    </Button>
  );
}

/**
 * A desktop's buttons: the default filled with the accent, the others quiet
 * outlined buttons rather than tinted fills, so the accent is the one colour
 * in the alert. Destructive keeps its colour.
 */
const DESKTOP_ACTION_APPEARANCE: Record<
  DialogActionColor,
  Pick<ButtonProps, 'appearance' | 'tone'>
> = {
  default: { appearance: 'solid', tone: 'accent' },
  cancel: { appearance: 'outline', tone: 'neutral' },
  destructive: { appearance: 'solid', tone: 'danger' },
};

/** Dialog actions use the same semantic recipe as standalone buttons. */
const ACTION_APPEARANCE: Record<DialogActionColor, Pick<ButtonProps, 'appearance' | 'tone'>> = {
  default: { appearance: 'solid', tone: 'accent' },
  cancel: { appearance: 'subtle', tone: 'neutral' },
  destructive: { appearance: 'solid', tone: 'danger' },
};
