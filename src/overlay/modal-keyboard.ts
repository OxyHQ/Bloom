/**
 * Keyboard plumbing for a web surface that takes over the screen — a dialog, a
 * drawer: which elements Tab may land on, wrapping Tab at the surface's edges,
 * and Escape. WEB ONLY; every export is inert without a DOM.
 *
 * ── WHY ESCAPE IS NOT A PLAIN `keydown` LISTENER ────────────────────────────
 *
 * react-native-web's `TextInput` calls `stopPropagation()` on EVERY keydown it
 * receives (its source cites RNW #612). React delegates events at the root or
 * portal container, so the stop happens there — below `document` and `window`.
 * A surface that listened for Escape on either never heard it while focus was
 * in one of its own text fields: a command palette, whose focus lives in its
 * search box, could not be dismissed from the keyboard at all.
 *
 * Listening in the CAPTURE phase alone is not the fix either: it runs before
 * the focused control, so a control that owns Escape (a tag field clearing its
 * highlight, a composer closing its suggestion list) would lose it to the
 * surface. So `listenForEscape` takes the key in three steps:
 *
 *  1. CAPTURE on `window`: the surface decides whether the key is its to take
 *     (`claim`). This is the only point where "an anchored menu is open above
 *     me" is still true — the floating Escape stack closes that menu during the
 *     bubble phase. A claimed key is remembered, nothing else happens yet.
 *  2. BUBBLE on `window`: the key arrived untouched — dismiss, unless something
 *     called `preventDefault()`.
 *  3. After dispatch, for a key that never reached the bubble listener: it is
 *     still dismissed when its target is an editable text field and nothing
 *     prevented its default, because that stop is react-native-web's, not a
 *     decision any control made. Any other stopped key was consumed on purpose
 *     (an inner popup) and is left alone. A control inside a text field that
 *     wants to KEEP Escape calls `preventDefault()` — the tag field and the
 *     composer already do.
 */
import { hasOpenFloatingSurface } from '../floating/escape-stack';

const FOCUSABLE = 'button, a[href], input, select, textarea, [tabindex]';

function hasDom(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function visible(element: HTMLElement): boolean {
  for (let current: HTMLElement | null = element; current; current = current.parentElement) {
    const style = getComputedStyle(current);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
  }
  return true;
}

/** The elements inside `node` that Tab can land on, in document order. */
export function tabbablesWithin(node: HTMLElement | null): HTMLElement[] {
  if (!node) return [];
  return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(':disabled, [aria-disabled="true"]') &&
      !element.closest('[hidden], [aria-hidden="true"], [inert]') &&
      visible(element),
  );
}

/** Initial focus must not scroll long content to an offscreen action. Tab still reaches every control. */
export function initialFocusWithin(node: HTMLElement): HTMLElement {
  const panel = node.getBoundingClientRect();
  return (
    tabbablesWithin(node).find((element) => {
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= panel.top &&
        rect.bottom <= panel.bottom &&
        rect.left >= panel.left &&
        rect.right <= panel.right
      );
    }) ?? node
  );
}

/**
 * Keep Tab inside `node`: from the last tabbable (or from outside) forward to
 * the first, from the first (or from outside) backward to the last. Returns
 * whether it moved focus. With no available controls, the focusable panel is
 * the fallback until its actions become available again.
 */
export function wrapTab(event: KeyboardEvent, node: HTMLElement | null): boolean {
  if (event.key !== 'Tab' || !node) return false;
  const items = tabbablesWithin(node);
  if (items.length === 0) {
    event.preventDefault();
    node.focus({ preventScroll: true });
    return true;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  const outside = active === node || !node.contains(active);
  if (event.shiftKey ? outside || active === first : outside || active === last) {
    event.preventDefault();
    (event.shiftKey ? last : first)?.focus();
    return true;
  }
  return false;
}

function isTextEntry(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== 'function') return false;
  const element = target as HTMLElement;
  if (element.isContentEditable) return true;
  if (element.tagName === 'TEXTAREA') return true;
  if (element.tagName !== 'INPUT') return false;
  const type = (element as HTMLInputElement).type;
  return ![
    'button',
    'checkbox',
    'radio',
    'range',
    'submit',
    'reset',
    'file',
    'color',
    'image',
  ].includes(type);
}

/**
 * Dismiss on Escape — see the file comment for the three steps. `claim` runs
 * in the capture phase and says whether this surface is the one the key is
 * for (the top-most, nothing anchored open above it). An open anchored
 * surface (a menu, a select's list) always keeps the key: it is the top layer
 * whatever the caller's own bookkeeping says.
 */
export function listenForEscape(claim: () => boolean, dismiss: () => void): () => void {
  if (!hasDom()) return () => undefined;
  let pending: KeyboardEvent | null = null;
  const timers = new Set<ReturnType<typeof setTimeout>>();

  const onCapture = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.isComposing || event.defaultPrevented) return;
    if (hasOpenFloatingSurface() || !claim()) return;
    pending = event;
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (pending !== event) return;
      pending = null;
      if (!event.defaultPrevented && isTextEntry(event.target)) dismiss();
    }, 0);
    timers.add(timer);
  };
  const onBubble = (event: KeyboardEvent) => {
    if (pending !== event) return;
    pending = null;
    if (event.defaultPrevented) return;
    event.preventDefault();
    dismiss();
  };

  window.addEventListener('keydown', onCapture, true);
  window.addEventListener('keydown', onBubble);
  return () => {
    window.removeEventListener('keydown', onCapture, true);
    window.removeEventListener('keydown', onBubble);
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    pending = null;
  };
}

/** A modal may begin closing before its opener stops being inert. */
export function restoreFocusWhenAvailable(
  target: HTMLElement,
  panel: HTMLElement | null,
): () => void {
  if (!hasDom()) return () => {};
  let observer: MutationObserver | undefined;
  let done = false;
  const cancel = () => {
    done = true;
    observer?.disconnect();
    document.removeEventListener('focusin', attempt);
  };
  function attempt() {
    if (done) return;
    if (!target.isConnected) {
      cancel();
      return;
    }
    const active = document.activeElement;
    // Closing must not steal a host's deliberate destination, or focus from a
    // subsequently opened modal. A removed focused panel leaves body active.
    if (active && active !== document.body && !panel?.contains(active)) {
      cancel();
      return;
    }
    if (target.closest('[inert]')) return;
    cancel();
    target.focus({ preventScroll: true });
  }
  observer = new MutationObserver(attempt);
  // Watch the actual inert boundary lifecycle, never an assumed exit duration.
  // Child changes also terminate the observer when its opener is removed.
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['inert'],
  });
  document.addEventListener('focusin', attempt);
  attempt();
  return cancel;
}
