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
 * Internal: deliberately NOT re-exported from any barrel, for the same reason
 * as `overlay/dropdown-placement` — the four families import it directly and it
 * is not public API.
 *
 * The anchor ref goes on a WRAPPER `View`, never on the child. Merging a ref
 * into a cloned element means owning ref composition for an element type we
 * know nothing about; wrapping measures the same box and costs one node.
 * `alignSelf: 'flex-start'` keeps that wrapper from stretching across its
 * parent, which would anchor the surface to the row rather than to the control.
 */
import React, { Children, cloneElement, isValidElement, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useRestoreAccessibilityFocus } from '../hooks/use-accessibility-focus';
import { mergeRefs } from '../hooks/merge-refs';
import { StyledPressable } from '../styles/styled-primitives';
import type { TriggerHandleProps } from './types';

export interface TriggerSlotProps {
  /** Render the single child as the trigger instead of wrapping it. */
  asChild?: boolean;
  children?: React.ReactNode;
  /** Open handler + a11y state, merged onto whatever ends up rendering. */
  handle: TriggerHandleProps;
  /** Measured by the web forks to position the surface. Unused on native. */
  anchorRef?: React.RefObject<View | null>;
  /** Style for the wrapper box. The child styles itself. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Merge `handle` into the caller's element. `Children.only` throws on zero or
 * several children, which is the right failure: `asChild` has no meaning for a
 * fragment, and silently picking the first child is how a trigger ends up
 * un-pressable with nothing logged.
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
  const childProps = child.props;
  return cloneElement(child, {
    ...handle,
    // Compose rather than overwrite: the child's own handler runs first, then
    // ours opens the surface.
    onPress: (event) => {
      childProps.onPress?.(event);
      handle.onPress(event);
    },
    onLongPress:
      handle.onLongPress === undefined
        ? childProps.onLongPress
        : (event) => {
            childProps.onLongPress?.(event);
            handle.onLongPress?.(event);
          },
    // A label the caller already wrote is more specific than the family's.
    accessibilityLabel: childProps.accessibilityLabel ?? handle.accessibilityLabel,
    disabled: handle.disabled === true ? true : childProps.disabled,
  });
}

export function TriggerSlot({
  asChild = false,
  children,
  handle,
  anchorRef,
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
    <View
      ref={mergeRefs([ownRef, anchorRef])}
      collapsable={false}
      style={[styles.wrap, style]}
      testID={testID}>
      {asChild ? (
        cloneTrigger(children, handle)
      ) : (
        <StyledPressable {...handle}>{children}</StyledPressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
  },
});
