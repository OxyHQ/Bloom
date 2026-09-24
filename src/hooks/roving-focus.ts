/**
 * The keyboard half of the WAI-ARIA composite widgets — tabs, radio groups and
 * listboxes — on WEB, where react-native-web supplies none of it.
 *
 * Three gaps, all measured in a browser against `Tabs`, `SegmentedControl` and
 * `Select`, and all silent: the markup carries the right `role` and state, so
 * nothing in a DOM snapshot says the widget cannot be operated.
 *
 *  - EVERY option was its own tab stop. react-native-web gives each `Pressable`
 *    `tabIndex=0`, so a five-tab strip cost five Tab presses to walk past.
 *  - ARROW KEYS did nothing. A composite widget is ONE tab stop whose options
 *    are reached with the arrows; without them the only route is Tab.
 *  - SPACE did nothing on a `tab`, `radio` or `option`. react-native-web's
 *    press responder (`PressResponder.isValidKeyPress`) activates on Space only
 *    for `role="button"` or a real `<button>`; any other role answers Enter
 *    alone.
 *
 * WHY THE DOM, NOT PROPS. The group has to know which of its options is
 * selected, which are disabled, and in which ORDER they sit on screen — and it
 * receives its options as `children` it did not create. The DOM already holds
 * all three (`aria-selected` / `aria-checked`, `aria-disabled`, document order),
 * so this module reads them there instead of growing a second registry that
 * could disagree with what is rendered. Every function is a no-op without a
 * DOM, and every caller gates on `Platform.OS === 'web'`, so native is
 * untouched.
 *
 * Activation goes through `element.click()`: that is the press the option's own
 * `onPress` already hears (react-native-web routes `click` to `onPress`), so a
 * key and a pointer select through exactly one code path.
 */
import { useLayoutEffect } from 'react';
import { Platform } from 'react-native';

const IS_WEB = Platform.OS === 'web';

/** Which arrow pair moves between the options. */
export type RovingOrientation = 'horizontal' | 'vertical' | 'both';

/** Where a key asks focus to go. */
export type RovingMove = 'next' | 'prev' | 'first' | 'last';

export interface RovingKeyOptions {
  orientation: RovingOrientation;
  /** Home/End jump to the ends (tabs and listboxes; a radio group has none). */
  homeEnd?: boolean;
}

/** The move a key asks for, or `null` for a key this widget does not own. */
export function rovingMove(key: string, { orientation, homeEnd = true }: RovingKeyOptions): RovingMove | null {
  const horizontal = orientation !== 'vertical';
  const vertical = orientation !== 'horizontal';
  switch (key) {
    case 'ArrowRight':
      return horizontal ? 'next' : null;
    case 'ArrowLeft':
      return horizontal ? 'prev' : null;
    case 'ArrowDown':
      return vertical ? 'next' : null;
    case 'ArrowUp':
      return vertical ? 'prev' : null;
    case 'Home':
      return homeEnd ? 'first' : null;
    case 'End':
      return homeEnd ? 'last' : null;
    default:
      return null;
  }
}

export function isSpaceKey(key: string): boolean {
  return key === ' ' || key === 'Spacebar';
}

function isDisabled(element: HTMLElement): boolean {
  return (
    element.getAttribute('aria-disabled') === 'true' ||
    (element as HTMLElement & { disabled?: boolean }).disabled === true
  );
}

/**
 * The options that belong to `container`, in document order.
 *
 * `owner`, when given, is the selector of the group itself: an option whose
 * nearest such ancestor is NOT `container` belongs to a nested group and is
 * skipped, so a radio group inside a tab panel inside a tab strip never
 * mistakes the inner options for its own.
 */
export function rovingItems(
  container: Element | null,
  selector: string,
  { owner, includeDisabled = false }: { owner?: string; includeDisabled?: boolean } = {},
): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (element) =>
      (includeDisabled || !isDisabled(element)) &&
      (owner === undefined || element.parentElement?.closest(owner) === container),
  );
}

/**
 * The option a move lands on. `wrap` carries the last option round to the first
 * (tabs, radio groups); a listbox stops at its ends.
 */
export function rovingTarget(
  items: readonly HTMLElement[],
  current: Element | null,
  move: RovingMove,
  wrap: boolean,
): HTMLElement | null {
  const count = items.length;
  if (count === 0) return null;
  if (move === 'first') return items[0] ?? null;
  if (move === 'last') return items[count - 1] ?? null;
  const index = current ? items.indexOf(current as HTMLElement) : -1;
  if (index < 0) return (move === 'next' ? items[0] : items[count - 1]) ?? null;
  const step = move === 'next' ? 1 : -1;
  const next = index + step;
  if (next >= 0 && next < count) return items[next] ?? null;
  return wrap ? (items[(next + count) % count] ?? null) : (items[index] ?? null);
}

/**
 * Exactly ONE tab stop: the selected option, or — when nothing is selected, or
 * the selected option is disabled — the first enabled one, so the group stays
 * reachable. Every other option takes `tabIndex=-1`: still focusable by the
 * arrows, skipped by Tab.
 */
export function applyRovingTabIndex(
  container: Element | null,
  selector: string,
  isSelected: (element: HTMLElement) => boolean,
  owner?: string,
): void {
  const all = rovingItems(container, selector, { owner, includeDisabled: true });
  const enabled = all.filter((element) => !isDisabled(element));
  const stop = enabled.find(isSelected) ?? enabled[0];
  for (const element of all) {
    const wanted = element === stop ? 0 : -1;
    if (element.tabIndex !== wanted) element.tabIndex = wanted;
  }
}

/**
 * Keep the group's roving tab stop in step with its selection.
 *
 * Runs after EVERY render of the group, without deps, because the group
 * re-renders whenever an option's selection or `disabled` changes (both arrive
 * through the group's own props or its children), and a layout effect runs
 * after the children have committed the attributes it reads. It writes the DOM
 * only where a value differs, so an idle re-render costs one query.
 */
export function useRovingTabIndex(
  getContainer: () => Element | null,
  selector: string,
  isSelected: (element: HTMLElement) => boolean,
  owner?: string,
): void {
  useLayoutEffect(() => {
    if (!IS_WEB) return;
    applyRovingTabIndex(getContainer(), selector, isSelected, owner);
  });
}

/**
 * The shared keydown for a tab strip or radio group option. Returns whether it
 * handled the key (and so prevented its default).
 *
 * - Arrows (per `orientation`), and Home/End where `homeEnd`, move focus with
 *   wrap-around. With `activate: 'follow'` (automatic activation) the option
 *   focused is also selected; with `'manual'` only focus moves and Enter or
 *   Space selects.
 * - Space selects the focused option — the key react-native-web drops.
 */
export function handleRovingKeyDown(
  event: { key: string; currentTarget: unknown; preventDefault: () => void },
  {
    selector,
    owner,
    orientation,
    homeEnd,
    activate,
  }: RovingKeyOptions & { selector: string; owner: string; activate: 'follow' | 'manual' },
): boolean {
  const current = event.currentTarget as HTMLElement | null;
  if (!current || typeof current.closest !== 'function') return false;
  if (isSpaceKey(event.key)) {
    if (isDisabled(current)) return false;
    // Space scrolls the page by default; the option answers it instead.
    event.preventDefault();
    current.click();
    return true;
  }
  const move = rovingMove(event.key, { orientation, homeEnd });
  if (move === null) return false;
  const container = current.closest(owner);
  const target = rovingTarget(rovingItems(container, selector, { owner }), current, move, true);
  if (!target) return false;
  event.preventDefault();
  target.focus();
  if (activate === 'follow' && target !== current) target.click();
  return true;
}
