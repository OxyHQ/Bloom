/**
 * The trigger side of every anchored Bloom surface — the counterpart of
 * `overlay/OverlayRoot`, and the reason `Popover`, `DropdownMenu`,
 * `ContextMenu` and `Menubar` no longer each carry their own render-prop
 * trigger.
 *
 * `asChild` is Radix/shadcn's composition escape hatch and this is a faithful
 * port of it: with `asChild`, the caller's SINGLE element child becomes the
 * trigger and receives the open handler plus the a11y props; without it, the
 * children render inside Bloom's own `Pressable`. Handlers the child already
 * carries are COMPOSED, not replaced — `<Trigger asChild><Button onPress={log}
 * /></Trigger>` still logs, then opens.
 *
 * Internal: reachable only through `floating/index.ts`, which is itself absent
 * from `package.json#exports` and from the root barrel, for the same reason as
 * `overlay/dropdown-placement` — the families build on it and it is not public
 * API.
 *
 * The anchor ref goes on a WRAPPER `View`, never on the child. Merging a ref
 * into a cloned element means owning ref composition for an element type we
 * know nothing about; wrapping measures the same box and costs one node.
 * `alignSelf: 'flex-start'` keeps that wrapper from stretching across its
 * parent, which would anchor the surface to the row rather than to the control.
 */
import React, { Children, cloneElement, Fragment, isValidElement, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useRestoreAccessibilityFocus } from '../hooks/use-accessibility-focus';
import { mergeRefs } from '../hooks/merge-refs';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import type { TriggerHandleProps } from './types';

export interface TriggerSlotProps {
  /** Render the single child as the trigger instead of wrapping it. */
  asChild?: boolean;
  children?: React.ReactNode;
  /** Open handler + a11y state, merged onto whatever ends up rendering. */
  handle: TriggerHandleProps;
  /** Measured by the web forks to position the surface. Unused on native. */
  anchorRef?: React.RefObject<View | null>;
  /** Classes for the wrapper box — the node the parent lays out. */
  className?: string;
  /** Style for the wrapper box. The child styles itself. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Merge `handle` into the caller's element. `Children.only` throws on zero or
 * several children, which is the right failure: `asChild` has no meaning for a
 * fragment, and silently picking the first child is how a trigger ends up
 * un-pressable with nothing logged.
 *
 * ── A FRAGMENT PASSES `isValidElement` AND DROPS EVERY PROP ─────────────────
 *
 * `Children.only` accepts `<>{child}</>` — a fragment IS one child, and it IS a
 * valid element — and `cloneElement` on it succeeds, returning a fragment
 * carrying an `onPress` and an `aria-expanded` that React then discards,
 * because a fragment renders no host node to put them on. Nothing throws. The
 * trigger is simply dead, and the caller's most likely next move is to wrap it
 * in another fragment. So it is rejected here, by name, with the fix in the
 * message.
 */
function cloneTrigger(
  children: React.ReactNode,
  handle: TriggerHandleProps,
): React.ReactElement {
  const child = Children.only(children);
  if (!isValidElement<TriggerHandleProps>(child)) {
    throw new Error(
      'A trigger with `asChild` needs a single React element child. Drop `asChild` to let Bloom render the pressable.',
    );
  }
  if (child.type === Fragment) {
    throw new Error(
      'A trigger with `asChild` cannot clone a fragment — it renders no element, so the press handler and the a11y state would be dropped silently. Pass the control itself as the single child.',
    );
  }
  const childProps = child.props;
  // A disabled trigger must not OPEN, and the child's own `disabled` is where a
  // caller most naturally writes that — a disabled `Pressable` child rather than
  // the family's trigger. Composing unconditionally left the guard to whatever
  // element the caller passed: a real `Pressable` swallows the press, a plain
  // `View` or a custom control that forwards `onPress` does not, so `disabled`
  // held or leaked depending on the child's type. Read both sides here instead.
  const isDisabled = handle.disabled === true || childProps.disabled === true;
  return cloneElement(child, {
    ...handle,
    // Compose rather than overwrite: the child's own handler runs first, then
    // ours opens the surface.
    //
    // ── AND THE CHILD'S HANDLER CAN CANCEL THE OPEN ─────────────────────────
    //
    // `event.preventDefault()` in the child's own handler stops the surface
    // from opening. Composition needs an answer to "what if the first handler
    // decides this press should not do the second thing" — a trigger that has
    // just discovered the form is dirty, or that the row it belongs to was
    // removed — and without one the only way to express it is to stop using
    // `asChild` and rebuild the control.
    //
    // It is `preventDefault` rather than a Bloom-specific return value because
    // the event already carries it on BOTH platforms and both mean the same
    // thing by it: on web `onPress` is handed React's synthetic `click` event,
    // and on native the responder event is a React synthetic event too. One
    // consequence worth knowing on web: the same call also suppresses the
    // browser's own default for that click, so cancelling the open on an
    // anchor child cancels its navigation as well.
    onPress: isDisabled
      ? childProps.onPress
      : (event) => {
          childProps.onPress?.(event);
          if (event?.defaultPrevented) return;
          handle.onPress(event);
        },
    onLongPress:
      handle.onLongPress === undefined || isDisabled
        ? childProps.onLongPress
        : (event) => {
            childProps.onLongPress?.(event);
            if (event?.defaultPrevented) return;
            handle.onLongPress?.(event);
          },
    // A label the caller already wrote is more specific than the family's.
    accessibilityLabel: childProps.accessibilityLabel ?? handle.accessibilityLabel,
    disabled: isDisabled ? true : childProps.disabled,
  });
}

export function TriggerSlot({
  asChild = false,
  children,
  handle,
  anchorRef,
  className,
  style,
  testID,
}: TriggerSlotProps) {
  // Every family already tells the trigger whether its surface is open, through
  // `aria-expanded` — so the screen-reader focus restore is wired ONCE here
  // rather than in each of the four native forks, and any family added later
  // gets it by construction. Native-only inside the hook; on web the browser
  // owns focus.
  const ownRef = useRef<View | null>(null);
  useRestoreAccessibilityFocus(handle['aria-expanded'] === true, ownRef);

  return (
    <StyledView
      ref={mergeRefs([ownRef, anchorRef])}
      collapsable={false}
      className={className}
      style={[styles.wrap, style]}
      testID={testID}>
      {asChild ? (
        cloneTrigger(children, handle)
      ) : (
        <StyledPressable {...handle}>{children}</StyledPressable>
      )}
    </StyledView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
  },
});
