/**
 * The slash menu's items and search, platform-free.
 *
 * An item either changes the current block's type (when the block is empty,
 * as Notion does) or inserts a block after it, or runs an application action
 * (upload an image, create a database).
 */
export type SlashAction =
  | { kind: 'block'; type: string; props?: Record<string, unknown> }
  | { kind: 'custom'; id: string };

export interface SlashItem {
  id: string;
  label: string;
  description?: string;
  /** Extra search terms, in any language the app supports. */
  keywords?: readonly string[];
  /** Section the item is listed under. */
  group: string;
  action: SlashAction;
}

/**
 * Whether `/` was just typed where a command can start: at the beginning of
 * the text or after whitespace. Returns the offset of the slash.
 */
export function slashTriggerAt(text: string, insertedAt: number, inserted: string): number | null {
  if (inserted !== '/') return null;
  const before = insertedAt === 0 ? '' : text.charAt(insertedAt - 1);
  return before === '' || /\s/.test(before) ? insertedAt : null;
}

/**
 * The query typed after the slash at `slashAt`, up to `caret`, or null when
 * the menu should close (slash deleted, caret moved before it, or whitespace
 * typed).
 */
export function slashQuery(text: string, slashAt: number, caret: number): string | null {
  if (text.charAt(slashAt) !== '/' || caret <= slashAt) return null;
  const query = text.slice(slashAt + 1, caret);
  return /\s/.test(query) ? null : query;
}

function normalize(value: string): string {
  return value.toLocaleLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Items matching `query`, best first: a label prefix beats a keyword prefix,
 * which beats a match anywhere. Equal scores keep the given order. An empty
 * query returns every item.
 */
export function filterSlashItems(items: readonly SlashItem[], query: string): SlashItem[] {
  const q = normalize(query.trim());
  if (!q) return [...items];
  const scored: { item: SlashItem; score: number; index: number }[] = [];
  items.forEach((item, index) => {
    const label = normalize(item.label);
    const keywords = (item.keywords ?? []).map(normalize);
    let score = 0;
    if (label.startsWith(q)) score = 100;
    else if (keywords.some((k) => k.startsWith(q))) score = 80;
    else if (label.includes(q)) score = 60;
    else if (keywords.some((k) => k.includes(q))) score = 40;
    if (score > 0) scored.push({ item, score, index });
  });
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.map((s) => s.item);
}
