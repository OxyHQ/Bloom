import { Platform } from 'react-native';

/**
 * A shortcut as the sidebar displays it — `⌥⌃1`, `⌘K`, `Ctrl+Shift+P` — parsed
 * into what a `keydown` must carry. The label stays the single source: what the
 * hint says is what the key does.
 *
 * `Mod` is the platform's command modifier: ⌘ (meta) on Apple platforms, Ctrl
 * elsewhere. A label that names it is DRAWN for the platform too — `Mod+K`
 * reads `⌘K` on a Mac and `Ctrl+K` on Windows — so one label serves both.
 */
export interface SidebarShortcut {
  key: string;
  meta: boolean;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
}

const GLYPHS: Record<string, keyof Omit<SidebarShortcut, 'key'>> = {
  '⌘': 'meta',
  '⌃': 'ctrl',
  '⌥': 'alt',
  '⇧': 'shift',
};

const WORDS: Record<string, keyof Omit<SidebarShortcut, 'key'>> = {
  cmd: 'meta',
  command: 'meta',
  meta: 'meta',
  ctrl: 'ctrl',
  control: 'ctrl',
  alt: 'alt',
  option: 'alt',
  opt: 'alt',
  shift: 'shift',
};

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

const APPLE_GLYPHS: Record<string, string> = {
  mod: '⌘',
  cmd: '⌘',
  command: '⌘',
  meta: '⌘',
  ctrl: '⌃',
  control: '⌃',
  alt: '⌥',
  option: '⌥',
  opt: '⌥',
  shift: '⇧',
};

/**
 * The label as the hint draws it. A label naming `Mod` is spelled for the
 * platform — Apple glyphs run together (`Mod+Shift+P` → `⌘⇧P`), elsewhere the
 * words stay (`Ctrl+Shift+P`); any other label is drawn as written.
 */
export function displayShortcut(label: string): string {
  const parts = label.split('+').map((part) => part.trim());
  if (!parts.some((part) => part.toLowerCase() === 'mod')) return label;
  if (isApplePlatform()) {
    const key = parts.pop() ?? '';
    return parts.map((part) => APPLE_GLYPHS[part.toLowerCase()] ?? part).join('') + key;
  }
  return parts.map((part) => (part.toLowerCase() === 'mod' ? 'Ctrl' : part)).join('+');
}

/** `undefined` when the label names no key. */
export function parseShortcut(label: string): SidebarShortcut | undefined {
  const shortcut: SidebarShortcut = { key: '', meta: false, ctrl: false, alt: false, shift: false };
  let rest = label.trim();
  // Leading glyph modifiers (`⌥⌃1`).
  while (rest.length > 1 && GLYPHS[rest[0]!]) {
    shortcut[GLYPHS[rest[0]!]!] = true;
    rest = rest.slice(1);
  }
  // Word modifiers (`Ctrl+Shift+P`); the last part is the key.
  const parts = rest.split('+').map((part) => part.trim());
  const key = parts.pop() ?? '';
  for (const part of parts) {
    if (part.toLowerCase() === 'mod') {
      shortcut[isApplePlatform() ? 'meta' : 'ctrl'] = true;
      continue;
    }
    const modifier = WORDS[part.toLowerCase()] ?? GLYPHS[part];
    if (!modifier) return undefined;
    shortcut[modifier] = true;
  }
  if (!key) return undefined;
  shortcut.key = key.toLowerCase();
  return shortcut;
}

/**
 * The key a `keydown` names, layout- and modifier-independent where it can be:
 * Option+1 types `¡` on a Mac, so digits and letters are read from `code`.
 */
function eventKey(event: KeyboardEvent): string {
  const code =
    /^(?:Digit|Numpad)(\d)$/.exec(event.code ?? '') ?? /^Key([A-Z])$/.exec(event.code ?? '');
  return (code ? code[1]! : event.key).toLowerCase();
}

export function matchesShortcut(event: KeyboardEvent, shortcut: SidebarShortcut): boolean {
  return (
    event.metaKey === shortcut.meta &&
    event.ctrlKey === shortcut.ctrl &&
    event.altKey === shortcut.alt &&
    event.shiftKey === shortcut.shift &&
    eventKey(event) === shortcut.key
  );
}
