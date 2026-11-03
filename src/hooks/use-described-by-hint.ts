/**
 * `aria-describedby` on NATIVE: the described texts become the control's
 * `accessibilityHint`.
 *
 * On the web a control's description is a list of ids, and the browser reads
 * the text of each element it names (`aria-describedby`). React Native has no
 * such association: the prop is dropped before it reaches the platform, so a
 * field's helper text and its error were never said with the field on iOS,
 * Android or OxyOS. The one thing every native platform does say with a control
 * is its HINT (VoiceOver's help, TalkBack's hint, OxyOS's hint after the
 * element), so the descriptions are joined into it, which is what an
 * accessibility description IS on those platforms.
 *
 * ## How an id becomes a text
 *
 * Bloom's `Text` given a `nativeID` publishes its text under that id on native
 * (`typography/DescriptionSource.tsx`), as a DOM element is findable by its id.
 * A control resolves its id list here and subscribes to those ids, so a
 * description that changes, appears or goes is said as it now is. A Field's
 * description, its error, a card form box's message, a tag field's hint: each is
 * a Bloom `Text` with an id, so every family that wires `aria-describedby`
 * through Field membership says its description on native without wiring
 * anything of its own.
 *
 * ## The order, and the caller's own hint
 *
 * `[caller's hint, ...the described texts in aria-describedby's order, tooltip]`,
 * joined with a space as the web's accessible description joins its list. The
 * caller's `accessibilityHint` comes FIRST and is never replaced: it says what
 * activating the control does (the dock's "to open its menu, press Up Arrow"),
 * which is the hint's own meaning, and a caller always outranks a container
 * (`docs/field.mdx`). A text equal to the control's NAME is dropped, as a
 * browser drops a description that repeats the name, and so is a text already
 * said: a dock icon whose tooltip is its name says its name once.
 *
 * ## A tooltip is its trigger's help
 *
 * On a Mac a control's help tag IS its help (AXHelp): VoiceOver says it after
 * the control. `TooltipTrigger` publishes its tooltip's text here
 * (`TooltipDescriptionContext`), and a control resolving its hint through this
 * hook (Bloom's `Button`, every Field member) says it after itself, unless it is
 * the control's own name.
 *
 * ## The web
 *
 * Unchanged: the web keeps `aria-describedby` and reads the texts itself, so the
 * hook returns the caller's hint untouched (react-native-web drops
 * `accessibilityHint`; `Button`'s web fork uses it as `title`). Nothing is
 * subscribed and no text is published there.
 */
import { createContext, useCallback, useContext, useSyncExternalStore } from 'react';

import { IS_WEB } from '../styles/platform';

type Listener = () => void;

/** Each id's published text: the latest publisher's, so an id named twice says its newest text. */
const texts = new Map<string, { text: string; owner: object }[]>();
const listeners = new Map<string, Set<Listener>>();

function notify(id: string) {
  const subscribed = listeners.get(id);
  if (subscribed) for (const listener of [...subscribed]) listener();
}

/**
 * Publish `text` as the description `id` names, until the returned function is
 * called. NATIVE only (the web reads the element itself); `DescriptionSource`
 * calls it for every Bloom `Text` that carries a `nativeID`.
 */
export function publishDescription(id: string, text: string): () => void {
  const owner = {};
  const entries = texts.get(id) ?? [];
  entries.push({ text, owner });
  texts.set(id, entries);
  notify(id);
  return () => {
    const current = texts.get(id);
    if (!current) return;
    const rest = current.filter((entry) => entry.owner !== owner);
    if (rest.length > 0) texts.set(id, rest);
    else texts.delete(id);
    notify(id);
  };
}

/** The text published under `id`, or `undefined` when nothing on screen carries it. */
export function describedText(id: string): string | undefined {
  const entries = texts.get(id);
  return entries?.[entries.length - 1]?.text;
}

function subscribeIds(ids: readonly string[], listener: Listener): () => void {
  for (const id of ids) {
    let set = listeners.get(id);
    if (!set) {
      set = new Set();
      listeners.set(id, set);
    }
    set.add(listener);
  }
  return () => {
    for (const id of ids) {
      const set = listeners.get(id);
      if (!set) continue;
      set.delete(listener);
      if (set.size === 0) listeners.delete(id);
    }
  };
}

/** The ids of an `aria-describedby` list, in order. */
function idsOf(describedBy: string | undefined): string[] {
  if (!describedBy) return [];
  return describedBy.split(/\s+/).filter((id) => id.length > 0);
}

/** How two texts are compared: the same words, whatever their case and spacing. */
function normalized(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLocaleLowerCase();
}

/**
 * The hint that says `parts` after a control named `name`: each part trimmed,
 * the empty ones, the name and the repeats left out, joined with a space.
 */
export function joinDescription(
  parts: readonly (string | undefined | null)[],
  name?: string,
): string | undefined {
  const said = new Set<string>();
  if (name) said.add(normalized(name));
  const kept: string[] = [];
  for (const part of parts) {
    if (typeof part !== 'string') continue;
    const text = part.replace(/\s+/g, ' ').trim();
    if (text.length === 0) continue;
    const key = normalized(text);
    if (said.has(key)) continue;
    said.add(key);
    kept.push(text);
  }
  return kept.length > 0 ? kept.join(' ') : undefined;
}

/**
 * The text of the tooltip around a control (`TooltipTrigger`), as the help its
 * trigger says after itself on native. `undefined` outside a tooltip.
 */
export const TooltipDescriptionContext = createContext<string | undefined>(undefined);
TooltipDescriptionContext.displayName = 'BloomTooltipDescriptionContext';

export interface DescribedByHintInput {
  /** The `aria-describedby` id list the control carries on the web. */
  describedBy?: string;
  /** The caller's own `accessibilityHint`. Said first, never replaced. */
  hint?: string;
  /** The control's accessible name: a description equal to it is not said again. */
  name?: string;
}

function useNativeDescribedByHint({
  describedBy,
  hint,
  name,
}: DescribedByHintInput): string | undefined {
  const tooltip = useContext(TooltipDescriptionContext);
  // The ids as one string, so the subscription and the snapshot change only when
  // the LIST does, not each render's array.
  const key = idsOf(describedBy).join(' ');
  const subscribe = useCallback(
    (listener: Listener) => (key ? subscribeIds(key.split(' '), listener) : () => {}),
    [key],
  );
  // A string snapshot: equal texts are equal snapshots, so a republished text
  // that did not change re-renders nothing. `\u0000` cannot occur in a text.
  const getSnapshot = useCallback(
    () =>
      key
        ? key
            .split(' ')
            .map((id) => describedText(id) ?? '')
            .join('\u0000')
        : '',
    [key],
  );
  const described = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return joinDescription([hint, ...(described ? described.split('\u0000') : []), tooltip], name);
}

function useWebDescribedByHint({ hint }: DescribedByHintInput): string | undefined {
  return hint;
}

/**
 * The `accessibilityHint` a control described by `describedBy` carries.
 *
 * ```tsx
 * const hint = useDescribedByHint({ describedBy, hint: accessibilityHint, name: label });
 * <Pressable aria-describedby={describedBy} accessibilityHint={hint} />
 * ```
 *
 * On native: the caller's hint, then the text of each element the list names
 * (a Bloom `Text` with that `nativeID`), then the tooltip around the control,
 * without the name or repeats, kept in step as they change. On the web: the
 * caller's hint alone, because the web reads `aria-describedby` itself.
 */
export const useDescribedByHint: (input: DescribedByHintInput) => string | undefined = IS_WEB
  ? useWebDescribedByHint
  : useNativeDescribedByHint;
