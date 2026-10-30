/**
 * Key chords: a command's shortcut as it is DECLARED (`Mod+N`, `Mod+Shift+Z`),
 * how it is drawn on each platform (`⌘N` on a Mac, `Ctrl+N` elsewhere), and
 * whether a key press is it (OxyOS ADR 0021, decision 3).
 *
 * The grammar: `+`-separated modifiers, then one key.
 *  - Modifiers, any case, any order: `Mod` (the platform's command modifier:
 *    ⌘ on Apple platforms, Ctrl elsewhere, OxyOS included), `Ctrl`, `Alt`,
 *    `Shift`, `Meta` (⌘ on a Mac, the Windows or Super key elsewhere).
 *  - The key: one character (a letter in either case, a digit, a symbol), or
 *    a W3C `KeyboardEvent.key` name from `NAMED_KEYS` (`Enter`, `ArrowUp`,
 *    `F5`, …), with `Space` and `Plus` for those two characters (`Mod++` reads
 *    the same as `Mod+Plus`).
 *
 * Neutral: no DOM and no React. The key events it reads are W3C
 * `KeyboardEvent`'s fields, which React Native's own key events and an
 * adapter's `PlatformKeyboard` carry too.
 */
import { Platform } from 'react-native';

import type { PlatformKeyEvent } from '../platform-surface/types';

export interface Chord {
  /** A lower-case character, or a `NAMED_KEYS` name. */
  readonly key: string;
  readonly mod: boolean;
  readonly ctrl: boolean;
  readonly alt: boolean;
  readonly shift: boolean;
  readonly meta: boolean;
}

/** What a key press must carry for a chord on one platform. */
type Modifiers = Pick<Chord, 'ctrl' | 'alt' | 'shift' | 'meta'>;

const MODIFIERS = { mod: 'mod', ctrl: 'ctrl', alt: 'alt', shift: 'shift', meta: 'meta' } as const;

/** The key names a chord may use, as W3C `KeyboardEvent.key` spells them. */
const NAMED_KEYS = [
  'Enter',
  'Escape',
  'Tab',
  'Backspace',
  'Delete',
  'Insert',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  ...Array.from({ length: 24 }, (_, index) => `F${index + 1}`),
] as const;

const NAMED_BY_LOWER = new Map<string, string>(
  NAMED_KEYS.map((name) => [name.toLowerCase(), name]),
);

/** The keys a text field moves and deletes with, whatever the modifiers. */
const EDITING_KEYS = new Set([
  'Backspace',
  'Delete',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]);

/** A text field's clipboard and history chords (`textEntryKeeps`). */
const CLIPBOARD_AND_HISTORY: readonly Chord[] = [
  ...['c', 'x', 'v', 'a', 'z'].map((key) => ({ key, shift: false })),
  { key: 'z', shift: true },
].map(({ key, shift }) => ({ key, shift, mod: true, ctrl: false, alt: false, meta: false }));

/** Whether the command modifier is ⌘: macOS, iOS and iPadOS. */
export function isApplePlatform(): boolean {
  if (Platform.OS === 'ios' || Platform.OS === 'macos') return true;
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return false;
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform ??
    '';
  return /mac|iphone|ipad|ipod/i.test(platform) || /Mac OS X/.test(navigator.userAgent ?? '');
}

function parseKey(text: string): string | null {
  if (text.length === 1) return text === ' ' ? null : text.toLowerCase();
  const lower = text.toLowerCase();
  if (lower === 'space') return ' ';
  if (lower === 'plus') return '+';
  return NAMED_BY_LOWER.get(lower) ?? null;
}

/** A chord from its declared text, or null when the text is not one. */
export function parseChord(text: string): Chord | null {
  const match = /^((?:\s*[A-Za-z]+\s*\+)*)\s*(.+?)\s*$/.exec(text);
  if (!match) return null;
  const chord = { key: '', mod: false, ctrl: false, alt: false, shift: false, meta: false };
  for (const part of (match[1] ?? '').split('+')) {
    const name = part.trim().toLowerCase();
    if (!name) continue;
    const modifier = MODIFIERS[name as keyof typeof MODIFIERS];
    if (!modifier) return null;
    chord[modifier] = true;
  }
  const key = parseKey(match[2] ?? '');
  if (key === null) return null;
  chord.key = key;
  return chord;
}

function keyText(key: string): string {
  if (key === ' ') return 'Space';
  if (key === '+') return 'Plus';
  return key.length === 1 ? key.toUpperCase() : key;
}

/**
 * The chord in its one canonical spelling — `Mod+Ctrl+Alt+Shift+Meta+<Key>`,
 * the modifiers it has in that order, a letter in upper case — the spelling a
 * `PlatformMenuItem.shortcut` carries.
 */
export function chordText(chord: Chord): string {
  const parts: string[] = [];
  if (chord.mod) parts.push('Mod');
  if (chord.ctrl) parts.push('Ctrl');
  if (chord.alt) parts.push('Alt');
  if (chord.shift) parts.push('Shift');
  if (chord.meta) parts.push('Meta');
  parts.push(keyText(chord.key));
  return parts.join('+');
}

/** The modifiers the chord's key press carries on this platform: `Mod` resolved. */
function modifiersOf(chord: Chord, apple: boolean): Modifiers {
  return {
    ctrl: chord.ctrl || (chord.mod && !apple),
    alt: chord.alt,
    shift: chord.shift,
    meta: chord.meta || (chord.mod && apple),
  };
}

// i18n-exempt: key names, printed on the keys themselves.
const APPLE_KEYS: Record<string, string> = {
  Enter: '↩',
  Escape: '⎋',
  Tab: '⇥',
  Backspace: '⌫',
  Delete: '⌦',
  Home: '↖',
  End: '↘',
  PageUp: '⇞',
  PageDown: '⇟',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  ' ': 'Space',
  '+': '+',
};

// i18n-exempt: key names, printed on the keys themselves.
const OTHER_KEYS: Record<string, string> = {
  Escape: 'Esc',
  Delete: 'Del',
  Insert: 'Ins',
  PageUp: 'PgUp',
  PageDown: 'PgDn',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  ' ': 'Space',
  '+': '+',
};

/**
 * The chord as a menu row draws it. Apple platforms run the symbols together
 * in their own order (⌃⌥⇧⌘, then the key: `Mod+Shift+Z` → `⇧⌘Z`); elsewhere
 * the names are joined with `+` (`Ctrl+Shift+Z`).
 */
export function formatChord(chord: Chord, apple: boolean = isApplePlatform()): string {
  const { ctrl, alt, shift, meta } = modifiersOf(chord, apple);
  if (apple) {
    const key = APPLE_KEYS[chord.key] ?? keyText(chord.key);
    return `${ctrl ? '⌃' : ''}${alt ? '⌥' : ''}${shift ? '⇧' : ''}${meta ? '⌘' : ''}${key}`;
  }
  const parts: string[] = [];
  if (ctrl) parts.push('Ctrl');
  if (alt) parts.push('Alt');
  if (shift) parts.push('Shift');
  if (meta) parts.push('Meta');
  parts.push(OTHER_KEYS[chord.key] ?? keyText(chord.key));
  return parts.join('+');
}

/** A letter or a digit: Shift is part of what such a chord means. */
function isAlphanumeric(key: string): boolean {
  return /^[a-z0-9]$/.test(key);
}

/**
 * The keys a press can stand for. Its character (`event.key`) when that is a
 * plain ASCII one; the physical key (`code`) as well where the character is not
 * what the key is called: under Alt (a Mac's Option+N types `˜`), Shift with a
 * digit (`!` is Shift+1) and a non-Latin layout (`т` is the N key).
 */
function pressedKeys(event: PlatformKeyEvent): string[] {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  const code = event.code ?? '';
  const physical = /^Key([A-Z])$/.exec(code)?.[1]?.toLowerCase() ?? /^Digit(\d)$/.exec(code)?.[1];
  const ascii = key.length === 1 && key >= ' ' && key <= '~';
  if (physical === undefined || physical === key) return [key];
  if (ascii && !event.altKey && !(event.shiftKey && /^Digit/.test(code))) return [key];
  return [key, physical];
}

/** Whether `event` is the chord, on this platform. */
export function matchesChord(
  chord: Chord,
  event: PlatformKeyEvent,
  apple: boolean = isApplePlatform(),
): boolean {
  const wanted = modifiersOf(chord, apple);
  if (
    event.ctrlKey !== wanted.ctrl ||
    event.metaKey !== wanted.meta ||
    event.altKey !== wanted.alt ||
    // A symbol may need Shift to be typed at all (`?` on a US layout), so an
    // undeclared Shift does not stop one; a letter, digit or named key's does.
    (event.shiftKey !== wanted.shift &&
      (wanted.shift || chord.key.length > 1 || isAlphanumeric(chord.key)))
  ) {
    return false;
  }
  return pressedKeys(event).includes(chord.key);
}

/** Whether the press carries a command modifier (Ctrl, Alt or Meta; not Shift alone). */
export function hasCommandModifier(event: PlatformKeyEvent): boolean {
  return event.ctrlKey || event.metaKey || event.altKey;
}

/**
 * Whether a focused text field keeps this key rather than a menu's shortcut
 * taking it: what the field edits with.
 *  - Every key without Ctrl, Alt or Meta: typing, Enter, Tab, Escape, F-keys.
 *  - Moving and deleting (the arrows, Home, End, Page Up/Down, Backspace,
 *    Delete) with any modifiers: by word, by line.
 *  - Its clipboard and history: `Mod+C`, `Mod+X`, `Mod+V`, `Mod+A`, `Mod+Z`
 *    and `Mod+Shift+Z`.
 *  - On Apple platforms Option alone, which types characters (`⌥E` is the
 *    acute accent).
 */
export function textEntryKeeps(
  event: PlatformKeyEvent,
  apple: boolean = isApplePlatform(),
): boolean {
  if (!hasCommandModifier(event)) return true;
  if (EDITING_KEYS.has(event.key)) return true;
  if (apple && event.altKey && !event.ctrlKey && !event.metaKey) return true;
  return CLIPBOARD_AND_HISTORY.some((chord) => matchesChord(chord, event, apple));
}
