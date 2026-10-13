import { safeUrl } from './safe-url';
import type { MarkdownInline } from './types';

/** A run of `*`, `_` or `~` waiting to be paired by `pairDelimiters`. */
interface Delimiter {
  type: 'delimiter';
  char: '*' | '_' | '~';
  count: number;
  /** The run's length as written; the "multiple of 3" rule reads it. */
  original: number;
  canOpen: boolean;
  canClose: boolean;
}

type Token = MarkdownInline | Delimiter;

const ESCAPABLE = /[!-/:-@[-`{-~]/;
const PUNCTUATION = /[!-/:-@[-`{-~¡-¿ -⁯]/;
const WHITESPACE = /\s/;
const BARE_URL = /https?:\/\/[^\s<]+/y;

const isDelimiter = (token: Token): token is Delimiter => token.type === 'delimiter';

/** A character that is not there (`''`, past either end of the text) counts as whitespace. */
const isSpace = (char: string): boolean => char === '' || WHITESPACE.test(char);
const isPunct = (char: string): boolean => PUNCTUATION.test(char);

/**
 * Inline Markdown to a tree: emphasis, strong, strikethrough, code spans, links,
 * images (as a link carrying the alt text), bare URLs, escapes and hard breaks.
 * Raw HTML is not special, so it stays text. The delimiter pairing is CommonMark's.
 *
 * `streaming` is for text that is still arriving: a trailing unclosed span
 * (`**bold`, `` `code ``, `[label](https://`) is closed implicitly rather than
 * left as raw markers.
 */
export function parseInline(source: string, streaming = false): MarkdownInline[] {
  return readInline(source, streaming, false);
}

function readInline(source: string, streaming: boolean, insideLink: boolean): MarkdownInline[] {
  const tokens = tokenize(source, streaming, insideLink);
  pairDelimiters(tokens);
  if (streaming) closeTrailingDelimiters(tokens);
  return finish(tokens);
}

function tokenize(source: string, streaming: boolean, insideLink: boolean): Token[] {
  const tokens: Token[] = [];
  let text = '';
  const flush = () => {
    if (text) tokens.push({ type: 'text', value: text });
    text = '';
  };
  let i = 0;

  while (i < source.length) {
    const char = source.charAt(i);

    if (char === '\\') {
      const next = source.charAt(i + 1);
      if (next === '\n') {
        flush();
        tokens.push({ type: 'break' });
        i += 2;
      } else if (next !== undefined && ESCAPABLE.test(next)) {
        text += next;
        i += 2;
      } else {
        text += char;
        i += 1;
      }
    } else if (char === '\n') {
      flush();
      tokens.push({ type: 'break' });
      i += 1;
    } else if (char === '`') {
      const span = readCodeSpan(source, i, streaming);
      if (span) {
        flush();
        tokens.push({ type: 'code', value: span.value });
        i = span.end;
      } else {
        const run = runLength(source, i, '`');
        text += source.slice(i, i + run);
        i += run;
      }
    } else if (!insideLink && (char === '[' || (char === '!' && source.charAt(i + 1) === '['))) {
      // An image is not fetched: it reads as a link carrying its alt text.
      const link = readLink(source, char === '!' ? i + 1 : i, streaming);
      if (link) {
        flush();
        tokens.push(...buildLink(link));
        i = link.end;
      } else {
        text += char;
        i += 1;
      }
    } else if (char === '*' || char === '_' || char === '~') {
      const count = runLength(source, i, char);
      if (char === '~' && count !== 2) {
        text += source.slice(i, i + count);
      } else {
        flush();
        tokens.push(delimiterAt(source, i, count, char));
      }
      i += count;
    } else if (!insideLink && char === 'h' && !isWordChar(source.charAt(i - 1))) {
      const url = readBareUrl(source, i);
      if (url) {
        flush();
        tokens.push(...makeLink(url, [{ type: 'text', value: url }]));
        i += url.length;
      } else {
        text += char;
        i += 1;
      }
    } else {
      text += char;
      i += 1;
    }
  }
  flush();
  return tokens;
}

const isWordChar = (char: string): boolean => /\w/.test(char);

function runLength(source: string, from: number, char: string): number {
  let end = from;
  while (source.charAt(end) === char) end += 1;
  return end - from;
}

/** The code span opening at `from`, or `undefined` when no run closes it. */
function readCodeSpan(
  source: string,
  from: number,
  streaming: boolean,
): { value: string; end: number } | undefined {
  const length = runLength(source, from, '`');
  let search = from + length;
  while (true) {
    const next = source.indexOf('`', search);
    if (next === -1) break;
    const closing = runLength(source, next, '`');
    if (closing === length) {
      return { value: spanText(source.slice(from + length, next)), end: next + closing };
    }
    search = next + closing;
  }
  return streaming
    ? { value: spanText(source.slice(from + length)), end: source.length }
    : undefined;
}

/** Line breaks read as spaces, and one space is trimmed from each side when both are there. */
function spanText(raw: string): string {
  const flat = raw.replace(/\n/g, ' ');
  return flat.length > 2 && flat.startsWith(' ') && flat.endsWith(' ') && flat.trim() !== ''
    ? flat.slice(1, -1)
    : flat;
}

function delimiterAt(
  source: string,
  from: number,
  count: number,
  char: Delimiter['char'],
): Delimiter {
  const before = source.charAt(from - 1);
  const after = source.charAt(from + count);
  const leftFlanking = !isSpace(after) && (!isPunct(after) || isSpace(before) || isPunct(before));
  const rightFlanking = !isSpace(before) && (!isPunct(before) || isSpace(after) || isPunct(after));
  const intraword = char === '_';
  return {
    type: 'delimiter',
    char,
    count,
    original: count,
    canOpen: leftFlanking && (!intraword || !rightFlanking || isPunct(before)),
    canClose: rightFlanking && (!intraword || !leftFlanking || isPunct(after)),
  };
}

interface LinkMatch {
  label: string;
  /** `undefined` while the destination is still being typed (streaming). */
  url: string | undefined;
  end: number;
}

/** `[label](destination "title")` opening at `from`. */
function readLink(source: string, from: number, streaming: boolean): LinkMatch | undefined {
  const closeBracket = findClosingBracket(source, from);
  if (closeBracket === -1 || source.charAt(closeBracket + 1) !== '(') return undefined;
  const label = source.slice(from + 1, closeBracket);
  const unfinished: LinkMatch | undefined = streaming
    ? { label, url: undefined, end: source.length }
    : undefined;

  let i = skipSpaces(source, closeBracket + 2);
  let url: string;
  if (source.charAt(i) === '<') {
    const end = source.indexOf('>', i);
    if (end === -1) return unfinished;
    url = source.slice(i + 1, end);
    i = end + 1;
  } else {
    const start = i;
    let depth = 0;
    while (i < source.length && !WHITESPACE.test(source.charAt(i))) {
      if (source.charAt(i) === '\\') i += 1;
      else if (source.charAt(i) === '(') depth += 1;
      else if (source.charAt(i) === ')') {
        if (depth === 0) break;
        depth -= 1;
      }
      i += 1;
    }
    url = source.slice(start, i);
  }
  i = skipSpaces(source, i);
  if (source.charAt(i) === '"' || source.charAt(i) === "'") {
    const end = source.indexOf(source.charAt(i), i + 1);
    if (end === -1) return unfinished;
    i = skipSpaces(source, end + 1);
  }
  if (source.charAt(i) === ')')
    return { label, url: url.replace(/\\([!-/:-@[-`{-~])/g, '$1'), end: i + 1 };
  return i >= source.length ? unfinished : undefined;
}

function skipSpaces(source: string, from: number): number {
  let i = from;
  while (i < source.length && WHITESPACE.test(source.charAt(i))) i += 1;
  return i;
}

/** The `]` matching the `[` at `from`, past nested brackets and escapes; `-1` if it never closes. */
function findClosingBracket(source: string, from: number): number {
  let depth = 0;
  for (let i = from; i < source.length; i += 1) {
    const char = source.charAt(i);
    if (char === '\\') i += 1;
    else if (char === '[') depth += 1;
    else if (char === ']') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function buildLink(link: LinkMatch): MarkdownInline[] {
  const children = readInline(link.label, false, true);
  if (link.url === undefined) return children;
  const labelled: MarkdownInline[] =
    children.length > 0 ? children : [{ type: 'text', value: link.url }];
  return makeLink(link.url, labelled);
}

/** A link when `url` is safe; otherwise only its label, as plain content. */
function makeLink(url: string, children: MarkdownInline[]): MarkdownInline[] {
  const safe = safeUrl(url);
  return safe ? [{ type: 'link', url: safe, children }] : children;
}

/** A bare `https://…` with the punctuation that ends a sentence (or closes a span) left off. */
function readBareUrl(source: string, from: number): string | undefined {
  BARE_URL.lastIndex = from;
  const match = BARE_URL.exec(source);
  if (!match) return undefined;
  let url = match[0];
  while (true) {
    const last = url[url.length - 1];
    const unbalanced = last === ')' && count(url, ')') > count(url, '(');
    if (!unbalanced && !/[.,;:!?*_~'"]/.test(last ?? '')) break;
    url = url.slice(0, -1);
  }
  return url.length > 'https://'.length ? url : undefined;
}

const count = (value: string, char: string): number => value.split(char).length - 1;

/** CommonMark's "process emphasis": pairs closers with the nearest fitting opener. */
function pairDelimiters(tokens: Token[]): void {
  let closerIndex = 0;
  while (closerIndex < tokens.length) {
    const closer = tokens[closerIndex];
    if (!closer || !isDelimiter(closer) || !closer.canClose || closer.count === 0) {
      closerIndex += 1;
      continue;
    }
    const openerIndex = findOpener(tokens, closerIndex, closer);
    if (openerIndex === -1) {
      closerIndex += 1;
      continue;
    }
    const opener = tokens[openerIndex] as Delimiter;
    const used = opener.count >= 2 && closer.count >= 2 ? 2 : 1;
    const inner = tokens.slice(openerIndex + 1, closerIndex);
    const node: MarkdownInline = {
      type: closer.char === '~' ? 'delete' : used === 2 ? 'strong' : 'emphasis',
      children: finish(inner),
    };
    opener.count -= used;
    closer.count -= used;
    tokens.splice(openerIndex + 1, inner.length, node);
    closerIndex = openerIndex + 2;
    if (closer.count === 0) tokens.splice(closerIndex, 1);
    if (opener.count === 0) {
      tokens.splice(openerIndex, 1);
      closerIndex -= 1;
    }
  }
}

function findOpener(tokens: Token[], closerIndex: number, closer: Delimiter): number {
  for (let i = closerIndex - 1; i >= 0; i -= 1) {
    const opener = tokens[i];
    if (
      !opener ||
      !isDelimiter(opener) ||
      opener.char !== closer.char ||
      !opener.canOpen ||
      opener.count === 0
    ) {
      continue;
    }
    // `~~` pairs only with `~~`; the "multiple of 3" rule keeps `*a**b*` from pairing across the run.
    if (closer.char === '~') return i;
    const both = opener.canClose || closer.canOpen;
    const sum = opener.original + closer.original;
    if (both && sum % 3 === 0 && !(opener.original % 3 === 0 && closer.original % 3 === 0))
      continue;
    return i;
  }
  return -1;
}

/**
 * Streaming: whatever is still open at the end of the text is closed there.
 * A delimiter with nothing after it yet is dropped (it is half a marker).
 */
function closeTrailingDelimiters(tokens: Token[]): void {
  const last = tokens[tokens.length - 1];
  if (last && isDelimiter(last)) tokens.pop();
  const openerIndex = tokens.findIndex(
    (token) => isDelimiter(token) && token.canOpen && token.count > 0,
  );
  if (openerIndex === -1) return;
  const opener = tokens[openerIndex] as Delimiter;
  const rest = tokens.splice(openerIndex + 1);
  closeTrailingDelimiters(rest);
  const children = finish(rest);
  tokens.pop();
  let node: MarkdownInline;
  if (opener.char === '~') node = { type: 'delete', children };
  else if (opener.count >= 2) node = { type: 'strong', children };
  else node = { type: 'emphasis', children };
  if (opener.char !== '~' && opener.count === 3) node = { type: 'emphasis', children: [node] };
  tokens.push(node);
}

/** Unpaired delimiters become the characters they were; neighbouring text merges. */
function finish(tokens: Token[]): MarkdownInline[] {
  const out: MarkdownInline[] = [];
  for (const token of tokens) {
    const node: MarkdownInline = isDelimiter(token)
      ? { type: 'text', value: token.char.repeat(token.count) }
      : token;
    const last = out[out.length - 1];
    if (node.type === 'text' && last?.type === 'text') last.value += node.value;
    else out.push(node.type === 'text' ? { ...node } : node);
  }
  return out;
}
