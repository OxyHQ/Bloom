/**
 * The WEB sub-menu: a FLYOUT panel beside its trigger row.
 *
 * WEB ONLY — imported by the `.web.tsx` menu forks and nothing else, which is
 * why it can name `FloatingPanel` (itself web-only) outright. The native
 * counterpart is `menu-sub-inline.tsx`; each family's platform fork picks one.
 * There is no `Platform.OS` branch, because a runtime branch would drag
 * `react-dom` and the web portal into every native bundle.
 *
 * What a flyout needs beyond an inline disclosure, and where each part lives:
 *
 *  - **Position.** `overlay/dropdown-placement` with `side="right"`, so the
 *    panel fits-flips-clamps HORIZONTALLY and aligns vertically against the row.
 *    Near the right edge of the window it flips to the left of the row on its
 *    own; there is no second positioner here.
 *  - **Stack rank.** Taken by the `OverlayRoot` inside `FloatingPanel`, on
 *    mount, like every other surface. The sub-panel mounts AFTER the root panel,
 *    so it paints above it by construction and carries no `zIndex`.
 *  - **Hover intent.** Opening on hover is easy; staying open while the pointer
 *    travels diagonally from the row to the panel is the part that needs a
 *    delay. Leaving either surface SCHEDULES a close, entering either CANCELS
 *    it, and the delay is long enough (`CLOSE_DELAY_MS`) to cross the gap.
 *  - **Keyboard.** Right opens and moves into the panel, Left and Escape leave
 *    it. Escape is handled here in the CAPTURE phase with
 *    `stopImmediatePropagation`, which is the only way the INNERMOST surface
 *    wins: every `FloatingPanel` listens on `document`, and `stopPropagation`
 *    does nothing between two listeners on the same node.
 *
 * The panel is deliberately `dismissible={false} modal={false}`. A modal
 * sub-panel would lay its own full-screen backdrop over the root menu, so
 * clicking a row of the PARENT menu would only dismiss the sub; and a dismissible
 * one would install the competing Escape handler this file exists to order.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useControllableState } from '../hooks/use-controllable-state';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon } from '../icons/Chevron';
import { Item } from '../item';
import { useTheme } from '../theme/use-theme';
import {
  DEFAULT_SIDE_OFFSET,
  MENU_MIN_WIDTH,
  PANEL_PADDING,
  ROW_ICON_SIZE,
} from './constants';
import { FloatingPanel } from './FloatingPanel';
import { rowShapeStyles, splitChildren, useRowStyle } from './shared';
import { useAnchorRect } from './use-anchor-rect';
import type {
  MenuSubContentProps,
  MenuSubParts,
  MenuSubProps,
  MenuSubTriggerProps,
} from './types';

/**
 * How long the panel survives after the pointer leaves the row or the panel.
 *
 * The pointer's path from the row's label to the panel's first item is
 * DIAGONAL, and it crosses the gap between the two surfaces where neither is
 * hovered. Radix solves this with a grace-area polygon; a delay is the smaller
 * mechanism that covers the same failure, and 300ms is long enough for a
 * deliberate diagonal at any reasonable pointer speed while still feeling
 * immediate when the user genuinely moves away.
 */
const CLOSE_DELAY_MS = 300;

/**
 * The one node a DOM listener can be attached to per surface.
 *
 * react-native-web resolves a `View` ref to the DOM element itself, but the RN
 * types do not say so — reading through the two methods actually needed keeps
 * this honest and makes a non-DOM ref (a jsdom stub, a native build that
 * reached this file by accident) answer `null` instead of throwing.
 */
type DomNode = {
  addEventListener: HTMLElement['addEventListener'];
  removeEventListener: HTMLElement['removeEventListener'];
  contains: HTMLElement['contains'];
  querySelector: HTMLElement['querySelector'];
};

function domNode(node: View | null): DomNode | null {
  const element = node as unknown as Partial<DomNode> | null;
  if (
    typeof element?.addEventListener !== 'function' ||
    typeof element.removeEventListener !== 'function' ||
    typeof element.contains !== 'function' ||
    typeof element.querySelector !== 'function'
  ) {
    return null;
  }
  return element as DomNode;
}

/** The first focusable descendant, so Right lands ON the panel's first row. */
function focusFirstItem(node: DomNode | null): void {
  const first = node?.querySelector<HTMLElement>('[role="menuitem"], [role="menuitemcheckbox"], [role="checkbox"], [role="radio"]');
  first?.focus?.();
}

interface SubFlyoutContextValue {
  open: boolean;
  setOpen: (next: boolean) => void;
  /** The trigger row's wrapper, measured to anchor the panel. */
  triggerRef: React.RefObject<View | null>;
  /** Cancel a scheduled close — the pointer arrived on one of the two surfaces. */
  keepOpen: () => void;
  /** Schedule a close — the pointer left one of them, and may be crossing to the other. */
  closeSoon: () => void;
  /** Close now and put focus back on the trigger row (Left, Escape). */
  closeAndRefocus: () => void;
}

const SubFlyoutContext = React.createContext<SubFlyoutContextValue | null>(null);
SubFlyoutContext.displayName = 'BloomMenuSubFlyoutContext';

function useSubFlyout(): SubFlyoutContextValue {
  const value = React.useContext(SubFlyoutContext);
  if (!value) {
    throw new Error('A menu sub trigger and sub content must be rendered inside a menu sub.');
  }
  return value;
}

/** Build one family's flyout sub trio. `prefix` is used for nothing but `displayName`. */
export function createFlyoutMenuSub(prefix: string): MenuSubParts {
  function MenuSub({ children, open, defaultOpen = false, onOpenChange }: MenuSubProps) {
    const [isOpen, setOpen] = useControllableState<boolean>({
      value: open,
      defaultValue: defaultOpen,
      onChange: onOpenChange,
    });
    const triggerRef = useRef<View | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancelTimer = useCallback(() => {
      if (closeTimer.current !== null) {
        clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
    }, []);

    // A pending close outlives the component if the whole menu is dismissed
    // mid-delay, and would then call `setOpen` on an unmounted tree.
    useEffect(() => cancelTimer, [cancelTimer]);

    const keepOpen = useCallback(() => {
      cancelTimer();
      setOpen(true);
    }, [cancelTimer, setOpen]);

    const closeSoon = useCallback(() => {
      cancelTimer();
      closeTimer.current = setTimeout(() => {
        closeTimer.current = null;
        setOpen(false);
      }, CLOSE_DELAY_MS);
    }, [cancelTimer, setOpen]);

    const closeAndRefocus = useCallback(() => {
      cancelTimer();
      setOpen(false);
      const trigger = domNode(triggerRef.current);
      trigger?.querySelector<HTMLElement>('[role="menuitem"]')?.focus?.();
    }, [cancelTimer, setOpen]);

    const context = useMemo<SubFlyoutContextValue>(
      () => ({ open: isOpen, setOpen, triggerRef, keepOpen, closeSoon, closeAndRefocus }),
      [isOpen, setOpen, keepOpen, closeSoon, closeAndRefocus],
    );

    return <SubFlyoutContext.Provider value={context}>{children}</SubFlyoutContext.Provider>;
  }
  MenuSub.displayName = `${prefix}Sub`;

  function MenuSubTrigger({
    children,
    disabled = false,
    inset = false,
    leading,
    accessibilityLabel,
    style,
    testID,
  }: MenuSubTriggerProps) {
    const theme = useTheme();
    const sub = useSubFlyout();
    const rowStyle = useRowStyle();
    const { title, body } = splitChildren(children);
    const [node, setNode] = useState<View | null>(null);

    const attach = useCallback(
      (value: View | null) => {
        setNode(value);
        sub.triggerRef.current = value;
      },
      [sub.triggerRef],
    );

    // Hover and keyboard through DOM listeners on the wrapper rather than RN
    // props: `Item` renders its own `Pressable` and publishes neither
    // `onHoverIn` nor `onKeyDown`, and widening its prop surface for one
    // web-only caller is the wrong trade. `mouseenter`/`mouseleave` do not
    // bubble, so they describe THIS row and not the rows under the panel.
    useEffect(() => {
      const element = domNode(node);
      if (!element || disabled) return;

      const onEnter = () => sub.keepOpen();
      const onLeave = () => sub.closeSoon();
      const onKeyDown = (event: Event) => {
        const key = (event as KeyboardEvent).key;
        if (key !== 'ArrowRight' && key !== 'Enter' && key !== ' ') return;
        event.preventDefault();
        sub.keepOpen();
      };

      element.addEventListener('mouseenter', onEnter);
      element.addEventListener('mouseleave', onLeave);
      element.addEventListener('keydown', onKeyDown);
      return () => {
        element.removeEventListener('mouseenter', onEnter);
        element.removeEventListener('mouseleave', onLeave);
        element.removeEventListener('keydown', onKeyDown);
      };
    }, [node, disabled, sub]);

    return (
      <View ref={attach}>
        <Item
          title={title}
          disabled={disabled}
          role="menuitem"
          expanded={sub.open}
          leading={leading}
          // `text-foreground ml-auto size-4 shrink-0`, pointing RIGHT: on web the
          // sub-menu is beside the row, not under it, so an up/down disclosure
          // chevron would describe a relationship the panel does not have.
          trailing={
            <ChevronRightIcon
              width={ROW_ICON_SIZE}
              height={ROW_ICON_SIZE}
              fill={theme.colors.text}
            />
          }
          // A press toggles, so a pointer user who clicked rather than hovered
          // can shut it again, and a touch-web user can reach it at all.
          onPress={() => (sub.open ? sub.closeAndRefocus() : sub.keepOpen())}
          accessibilityLabel={accessibilityLabel}
          titleStyle={rowShapeStyles.rowText}
          // Upstream's sub-trigger is the one row with NO `gap-2`.
          style={[
            rowStyle,
            rowShapeStyles.subTrigger,
            inset ? rowShapeStyles.inset : null,
            style,
          ]}
          testID={testID}>
          {body}
        </Item>
      </View>
    );
  }
  MenuSubTrigger.displayName = `${prefix}SubTrigger`;

  function MenuSubContent({ children, style }: MenuSubContentProps) {
    const sub = useSubFlyout();
    const anchor = useAnchorRect(sub.triggerRef, sub.open);
    const [node, setNode] = useState<View | null>(null);

    useEffect(() => {
      const element = domNode(node);
      if (!element || !sub.open) return;

      const onEnter = () => sub.keepOpen();
      const onLeave = () => sub.closeSoon();
      const onKeyDown = (event: Event) => {
        const key = (event as KeyboardEvent).key;
        if (key !== 'ArrowLeft') return;
        event.preventDefault();
        sub.closeAndRefocus();
      };

      element.addEventListener('mouseenter', onEnter);
      element.addEventListener('mouseleave', onLeave);
      element.addEventListener('keydown', onKeyDown);
      return () => {
        element.removeEventListener('mouseenter', onEnter);
        element.removeEventListener('mouseleave', onLeave);
        element.removeEventListener('keydown', onKeyDown);
      };
    }, [node, sub]);

    // Escape, in the CAPTURE phase with `stopImmediatePropagation`. Every open
    // `FloatingPanel` has a bubble-phase `keydown` listener on `document`, and
    // `stopPropagation` does not stop a sibling listener on the same node — so
    // without this the sub and its parent menu would both close on one press.
    // Capture runs before bubble whatever the registration order, which is what
    // makes "innermost first" hold rather than "whichever mounted first".
    useEffect(() => {
      if (!sub.open || typeof document === 'undefined') return;
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') return;
        event.stopImmediatePropagation();
        sub.closeAndRefocus();
      };
      document.addEventListener('keydown', onKeyDown, true);
      return () => document.removeEventListener('keydown', onKeyDown, true);
    }, [sub]);

    // Move focus onto the panel once it has been placed, so Right genuinely
    // ENTERS the submenu rather than only opening it.
    useEffect(() => {
      if (!sub.open || !anchor) return;
      focusFirstItem(domNode(node));
    }, [sub.open, anchor, node]);

    return (
      <FloatingPanel
        open={sub.open}
        anchor={anchor}
        role="menu"
        // `min-w-[8rem]`, the same floor as a root panel: upstream's SubContent
        // takes the root panel's treatment verbatim.
        minWidth={MENU_MIN_WIDTH}
        side="right"
        // The panel's first row lines up with the trigger row it flew out of.
        align="start"
        sideOffset={DEFAULT_SIDE_OFFSET}
        dismissible={false}
        modal={false}
        onDismiss={sub.closeAndRefocus}
        style={style}>
        {/* Negative margin + matching padding so this listener box covers the
            panel's own `p-1` too. Without it the 4px inset is a ring where the
            pointer is over the panel but not over anything listening, and a
            pointer resting there would schedule a close. */}
        <View ref={setNode} style={styles.hitBox}>
          {children}
        </View>
      </FloatingPanel>
    );
  }
  MenuSubContent.displayName = `${prefix}SubContent`;

  return { Sub: MenuSub, SubTrigger: MenuSubTrigger, SubContent: MenuSubContent };
}

const styles = StyleSheet.create({
  hitBox: {
    margin: -PANEL_PADDING,
    padding: PANEL_PADDING,
  },
});
