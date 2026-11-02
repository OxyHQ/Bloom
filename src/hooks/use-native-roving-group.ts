/**
 * The keyboard half of a composite widget — a radio group, a segmented
 * control, a selection list — on a NATIVE host that gives Bloom the window's
 * keys (`PlatformKeyboard`, OxyOS's Bloom host): what `hooks/roving-focus.ts`
 * does in the DOM, through the platform's own keyboard focus.
 *
 * The host's keyboard focus (Full Keyboard Access) moves with Tab through every
 * view React Native would let the keyboard focus (`focusable`). A composite is
 * ONE stop, as a Mac's segmented control, radio group and sidebar are and as
 * WAI-ARIA's radio-group, tabs and listbox patterns require:
 *
 *  - only the chosen option is `focusable` (the first enabled one when none is
 *    chosen, or the chosen one is disabled), so Tab lands on it and goes on
 *    past the group;
 *  - while one of the options has the keyboard focus (its `onFocus`, from the
 *    host), the arrows of the group's orientation — and Home and End where it
 *    has them — choose the next option. They are the focused control's keys,
 *    offered before the application's own (`FOCUSED_CONTROL_KEYS`), so a list's
 *    arrows behind never take them;
 *  - the focus FOLLOWS THE CHOICE: once the group's value is the option asked
 *    for (at once for a local value; when it lands for one the platform keeps,
 *    as a session preference is), that option is the group's stop and the
 *    accessibility focus moves to it, which the host's keyboard focus follows
 *    while its ring shows. The screen reader says the option once, chosen; it
 *    never hears the option first unchosen and then its new state. A value the
 *    owner refuses leaves the focus where it was.
 *
 * NATIVE WITH A PLATFORM KEYBOARD ONLY. On the web the DOM does all of this
 * (`roving-focus.ts`); on iOS and Android without an adapter there is no
 * window key to hear, so every option stays focusable there, as before.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { hasOpenFloatingSurface } from '../floating/escape-stack';
import { addWindowKeyHandler, FOCUSED_CONTROL_KEYS } from '../kbd/window-keys';
import { usePlatformKeyboard } from '../platform-surface/context';
import { IS_WEB } from '../styles/platform';
import { rovingMove, type RovingOrientation } from './roving-focus';

/** One option of the group, in the order the keys walk (`next` is the following one). */
export interface NativeRovingItem<Value extends string> {
  value: Value;
  disabled?: boolean;
}

export interface NativeRovingGroupOptions<Value extends string> {
  /**
   * The options in the order `next` walks them, read when a key comes: for a
   * row laid out left to right, in visual order (then `rtl` stays false).
   */
  items: () => readonly NativeRovingItem<Value>[];
  /** The chosen option, if any. */
  value: Value | undefined;
  /** Chooses an option, as a press of it does. */
  select: (value: Value) => void;
  orientation: RovingOrientation;
  /** Home and End go to the ends (tabs and lists; a radio group has none). */
  homeEnd?: boolean;
  /** Past the last option is the first (radio groups, tabs); a list stops at its ends. */
  wrap: boolean;
  /** ← is `next` (a right-to-left row whose `items` are in logical order). */
  rtl?: boolean;
  /** The whole group is disabled: no option is a stop. */
  disabled?: boolean;
}

/** What each option's host view takes: spread it onto the `Pressable`. */
export interface NativeRovingItemProps {
  focusable?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  ref?: (node: unknown) => void;
}

const NONE: NativeRovingItemProps = {};

/** The options a key can reach. */
function enabledItems<Value extends string>(
  options: NativeRovingGroupOptions<Value>,
): NativeRovingItem<Value>[] {
  return options.disabled ? [] : options.items().filter((item) => !item.disabled);
}

type HostInstance = Parameters<typeof AccessibilityInfo.sendAccessibilityEvent>[0];

export function useNativeRovingGroup<Value extends string>(
  options: NativeRovingGroupOptions<Value>,
): {
  /** The option that is the group's one Tab stop, if any. */
  stop: Value | undefined;
  /** The props of option `value`'s host view (none off a native platform keyboard). */
  itemProps: (value: Value, disabled?: boolean) => NativeRovingItemProps;
} {
  const keyboard = usePlatformKeyboard();
  const active = !IS_WEB && keyboard !== null;
  const latest = useRef(options);
  latest.current = options;
  const nodes = useRef(new Map<string, unknown>());
  // The option with the keyboard focus, as the host says (`onFocus`, `onBlur`).
  const [focused, setFocused] = useState<Value | undefined>(undefined);
  const focusedRef = useRef<Value | undefined>(undefined);
  focusedRef.current = focused;
  // The option a key chose, until the group's value is it and the focus moved there.
  const pending = useRef<Value | undefined>(undefined);

  const focusOption = useCallback((target: Value) => {
    pending.current = undefined;
    const node = nodes.current.get(target);
    if (node != null) AccessibilityInfo.sendAccessibilityEvent(node as HostInstance, 'focus');
  }, []);

  const { value, disabled } = options;
  // Computed from the options each render: a child's disabled state is part of
  // them. Options not known yet (a group whose options register as they are
  // laid out) leave the chosen one the stop.
  let stop: Value | undefined;
  if (active && !disabled) {
    const all = enabledItems(options);
    stop = all.length === 0 ? value : (all.find((item) => item.value === value) ?? all[0])?.value;
  }

  useEffect(() => {
    if (!active || focused === undefined) return undefined;
    return addWindowKeyHandler(keyboard, FOCUSED_CONTROL_KEYS, (event, textEntry) => {
      if (textEntry || hasOpenFloatingSurface() || event.altKey || event.ctrlKey || event.metaKey) {
        return false;
      }
      const { orientation, homeEnd, wrap, rtl, select } = latest.current;
      const move = rovingMove(event.key, { orientation, homeEnd, rtl });
      if (move === null || event.shiftKey) return false;
      const all = enabledItems(latest.current);
      if (all.length === 0) return false;
      const from = pending.current ?? focusedRef.current;
      const index = all.findIndex((item) => item.value === from);
      let next: number;
      if (move === 'first') next = 0;
      else if (move === 'last') next = all.length - 1;
      else {
        next = index + (move === 'next' ? 1 : -1);
        if (index < 0) next = move === 'next' ? 0 : all.length - 1;
        else if (next < 0 || next >= all.length)
          next = wrap ? (next + all.length) % all.length : index;
      }
      const target = all[next]?.value;
      // The key is the group's even at its end: it goes nowhere else.
      if (target === undefined || target === from) return true;
      pending.current = target;
      if (latest.current.value === target) focusOption(target);
      else select(target);
      return true;
    });
  }, [active, keyboard, focused, focusOption]);

  // The choice landed: the focus follows it in the same commit, so the host
  // and the screen reader see the option chosen and focused together.
  useLayoutEffect(() => {
    if (pending.current !== undefined && value === pending.current) focusOption(pending.current);
  }, [value, focusOption]);

  // The keyboard left the group: a choice still on its way takes no focus.
  useEffect(() => {
    if (focused === undefined) pending.current = undefined;
  }, [focused]);

  const itemProps = useCallback(
    (item: Value, itemDisabled = false): NativeRovingItemProps => {
      if (!active) return NONE;
      return {
        focusable: !itemDisabled && item === stop,
        onFocus: () => setFocused(item),
        onBlur: () => setFocused((current) => (current === item ? undefined : current)),
        ref: (node: unknown) => {
          if (node == null) nodes.current.delete(item);
          else nodes.current.set(item, node);
        },
      };
    },
    [active, stop],
  );

  return { stop, itemProps };
}
