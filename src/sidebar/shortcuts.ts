/**
 * A shortcut as the sidebar displays it — `⌥⌃1`, `⌘K`, `Ctrl+Shift+P` — parsed
 * into what a `keydown` must carry. The label stays the single source: what the
 * hint says is what the key does.
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
