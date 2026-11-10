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
 *  - each key goes on from the option the keys last chose until the host's focus
 *    has landed on it: keys read before JavaScript hears the focus move (several
 *    pressed while the page the first chose renders) each move one further, so
 *    eight ↓ choose eight options down, in order;
 *  - the focus FOLLOWS THE CHOICE: once the group's value is the option asked
 *    for (at once for a local value; when it lands for one the platform keeps,
 *    as a session preference is), that option is the group's stop and the
 *    accessibility focus moves to it, which the host's keyboard focus follows
 *    while its ring shows. The screen reader says the option once, chosen; it
 *    never hears the option first unchosen and then its new state. A value the
 *    owner refuses leaves the focus where it was.
 *
 * With `activation: 'manual'` (a chooser whose choice changes what follows it,
 * as a Mac's login window chooses whose password it asks for, and WAI-ARIA's
 * manual activation), the arrows move the keyboard focus alone: the option
 * focused is the group's stop while the keyboard is in the group, and Space or
 * Return (the host's press of the focused control) chooses it. Leaving the
 * group makes the chosen option the stop again.
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
  /**
   * `follow` (the default): an arrow chooses the next option, the focus
   * following the choice. `manual`: an arrow moves the focus alone, and a press
   * of the focused option (Space, Return) chooses it.
   */
  activation?: 'follow' | 'manual';
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
  /**
   * Brings the keyboard into the group at option `value`, as an arrow reaching
   * it does: chosen (`follow`) and focused once the choice lands, or focused
   * alone (`manual`). For a control outside the group that hands the keyboard
   * to it: a search field's ↓ into the list of its results. Nothing off a
   * native platform keyboard.
   */
  focusItem: (value: Value) => void;
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
  // The option a key chose, until the group's value is it and the host's focus landed on it.
  const pending = useRef<Value | undefined>(undefined);
  // Manual activation: the option the arrows moved to, the group's stop until the
  // keyboard leaves it from there.
  const [moved, setMoved] = useState<Value | undefined>(undefined);
  const manual = options.activation === 'manual';

  // The option chosen stays `pending` until the host's focus lands on it (its `onFocus`): a key
  // read before JavaScript hears that move goes on from the option chosen, never from the one the
  // focus is leaving. A loaded host read seven ↓ in the turn that moved the focus for the first,
  // and each chose the row the first had chosen: eight presses, one move.
  const focusOption = useCallback((target: Value) => {
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
    const at = manual && moved !== undefined ? moved : value;
    stop =
      all.length === 0
        ? at
        : (
            all.find((item) => item.value === at) ??
            all.find((item) => item.value === value) ??
            all[0]
          )?.value;
  }

  const stopRef = useRef(stop);
  stopRef.current = stop;

  useEffect(() => {
    if (!active || focused === undefined) return undefined;
    return addWindowKeyHandler(keyboard, FOCUSED_CONTROL_KEYS, (event, textEntry) => {
      if (textEntry || hasOpenFloatingSurface() || event.altKey || event.ctrlKey || event.metaKey) {
        return false;
      }
      const { orientation, homeEnd, wrap, rtl, select, activation } = latest.current;
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
      // Manual: the option becomes the stop, and the focus goes to it once it is.
      if (activation === 'manual') setMoved(target);
      else if (latest.current.value === target) focusOption(target);
      else select(target);
      return true;
    });
  }, [active, keyboard, focused, focusOption]);

  // Manual: the option moved to is focusable in this commit; the focus goes to it.
  useLayoutEffect(() => {
    if (moved !== undefined && pending.current === moved) focusOption(moved);
  }, [moved, focusOption]);

  // The choice landed: the focus follows it in the same commit, so the host
  // and the screen reader see the option chosen and focused together.
  useLayoutEffect(() => {
    if (pending.current !== undefined && value === pending.current) focusOption(pending.current);
  }, [value, focusOption]);

  // The keyboard left the group: a choice still on its way takes no focus.
  useEffect(() => {
    if (focused === undefined) pending.current = undefined;
  }, [focused]);

  // Each option's props are the same object for as long as what they say is the same (whether it
  // is the stop), and its handlers the same functions for as long as the group lives: an option
  // memoized by its owner (a settings rail's row) draws again only when it gains or loses the
  // stop, and its host view's ref is never detached and attached again at a render.
  const handlers = useRef(new Map<string, Omit<NativeRovingItemProps, 'focusable'>>());
  const given = useRef(new Map<string, NativeRovingItemProps>());
  const itemProps = useCallback(
    (item: Value, itemDisabled = false): NativeRovingItemProps => {
      if (!active) return NONE;
      let own = handlers.current.get(item);
      if (own === undefined) {
        own = {
          onFocus: () => {
            focusedRef.current = item;
            // The focus is where the keys chose: they go on from it now.
            if (pending.current === item) pending.current = undefined;
            setFocused(item);
          },
          onBlur: () => {
            if (focusedRef.current === item) focusedRef.current = undefined;
            setFocused((current) => (current === item ? undefined : current));
            // Leaving the group from the option moved to: the chosen one is the stop again.
            setMoved((current) => (current === item ? undefined : current));
          },
          ref: (node: unknown) => {
            if (node == null) nodes.current.delete(item);
            else nodes.current.set(item, node);
          },
        };
        handlers.current.set(item, own);
      }
      const focusable = !itemDisabled && item === stop;
      const key = `${focusable ? 1 : 0}${item}`;
      let props = given.current.get(key);
      if (props === undefined) {
        props = { focusable, ...own };
        given.current.set(key, props);
      }
      return props;
    },
    [active, stop],
  );

  const focusItem = useCallback(
    (target: Value) => {
      if (!active) return;
      pending.current = target;
      if (latest.current.activation === 'manual') {
        // Already the group's stop: focusable now, so the focus goes to it at once.
        if (stopRef.current === target) focusOption(target);
        else setMoved(target);
      } else if (latest.current.value === target) focusOption(target);
      else latest.current.select(target);
    },
    [active, focusOption],
  );

  return { stop, itemProps, focusItem };
}
