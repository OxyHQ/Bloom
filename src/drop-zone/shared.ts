import type { DragAction, DropData, DropKind, DroppedFile } from '../platform-surface/types';

/** The media types each kind is carried as, the most faithful first. */
export const KIND_TYPES: Readonly<Record<'files' | 'text' | 'url' | 'html', readonly string[]>> = {
  files: ['text/uri-list'],
  url: ['text/uri-list', 'text/x-moz-url'],
  text: ['text/plain;charset=utf-8', 'text/plain'],
  html: ['text/html'],
};

/** The actions a target supports, its preferred one first (`DropZoneProps`). */
export function orderedActions(
  actions: readonly DragAction[] | undefined,
  preferred: DragAction | undefined,
): readonly DragAction[] {
  const supported = actions && actions.length > 0 ? actions : (['copy'] as const);
  if (!preferred || !supported.includes(preferred)) return supported;
  return [preferred, ...supported.filter((action) => action !== preferred)];
}

/**
 * The kinds of `accept` a drag offering `types` carries (HTML5's
 * `DataTransfer.types`: `Files` for a browser's files, media types otherwise).
 */
export function offeredKinds(accept: readonly DropKind[], types: readonly string[]): DropKind[] {
  const offered = new Set(types.map((type) => type.toLowerCase()));
  return accept.filter((kind) => {
    if (kind === 'files') return offered.has('files') || offered.has('text/uri-list');
    if (kind === 'url') return offered.has('text/uri-list') || offered.has('text/x-moz-url');
    if (kind === 'text')
      return offered.has('text/plain') || offered.has('text/plain;charset=utf-8');
    if (kind === 'html') return offered.has('text/html');
    return offered.has(kind.toLowerCase());
  });
}

/** The URIs of a `text/uri-list` (RFC 2483): one a line, `#` lines comments. */
export function uriList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

/** A `file://` URI's file: its name, decoded, from the last part of its path. */
export function fileOfUri(uri: string): DroppedFile {
  const path = uri.replace(/^file:\/\/[^/]*/, '').replace(/\/+$/, '');
  const last = path.slice(path.lastIndexOf('/') + 1);
  let name = last;
  try {
    name = decodeURIComponent(last);
  } catch {
    // A malformed escape keeps the name as written.
  }
  return { name, uri };
}

/**
 * The content of a drop, of the kinds `accept` takes, from what each media
 * type received holds (`received`) and the browser's files (`files`, the web).
 */
export function dropData(
  accept: readonly DropKind[],
  received: Readonly<Record<string, string>>,
  files: readonly DroppedFile[] = [],
): DropData {
  const uris = uriList(
    received['text/uri-list'] ?? received['text/x-moz-url']?.split('\n')[0] ?? '',
  );
  const takes = (kind: DropKind) => accept.includes(kind);
  const fileUris = uris.filter((uri) => uri.toLowerCase().startsWith('file:'));
  const urls = uris.filter((uri) => !uri.toLowerCase().startsWith('file:'));
  const text = received['text/plain;charset=utf-8'] ?? received['text/plain'];
  const html = received['text/html'];
  const other: Record<string, string> = {};
  for (const kind of accept) {
    if (kind in KIND_TYPES) continue;
    const value = received[kind];
    if (value !== undefined) other[kind] = value;
  }
  return {
    files: takes('files') ? [...files, ...fileUris.map(fileOfUri)] : [],
    urls: takes('url') ? urls : [],
    ...(takes('text') && text !== undefined ? { text } : {}),
    ...(takes('html') && html !== undefined ? { html } : {}),
    other,
  };
}

/** HTML5's `effectAllowed` as actions. */
export function allowedActions(effectAllowed: string | undefined): DragAction[] {
  switch (effectAllowed) {
    case 'copy':
      return ['copy'];
    case 'move':
      return ['move'];
    case 'link':
      return ['link'];
    case 'copyMove':
      return ['copy', 'move'];
    case 'copyLink':
      return ['copy', 'link'];
    case 'linkMove':
      return ['move', 'link'];
    case 'none':
      return [];
    default:
      // `all`, and `uninitialized` (a drag from outside the page): every action.
      return ['copy', 'move', 'link'];
  }
}

/**
 * The action a drop would take: one the person forces with a modifier
 * (Option/Alt a copy, Command/Meta a move, both a link, as macOS), if both
 * sides allow it; else the target's preferred one the source allows; else
 * none.
 */
export function chosenAction(
  supported: readonly DragAction[],
  allowed: readonly DragAction[],
  modifiers: { readonly altKey?: boolean; readonly metaKey?: boolean } = {},
): DragAction | null {
  const both = supported.filter((action) => allowed.includes(action));
  const forced: DragAction | null =
    modifiers.altKey && modifiers.metaKey
      ? 'link'
      : modifiers.altKey
        ? 'copy'
        : modifiers.metaKey
          ? 'move'
          : null;
  if (forced) return both.includes(forced) ? forced : null;
  return both[0] ?? null;
}
