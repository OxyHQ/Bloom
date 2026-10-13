import type {
  MarkdownBlock,
  MarkdownColumnAlign,
  MarkdownListItem,
  MarkdownSegment,
} from './types';

const HEADING = /^ {0,3}(#{1,6})[ \t]+(\S.*?)(?:[ \t]+#+)?[ \t]*$/;
const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const QUOTE = /^ {0,3}>/;
const FENCE = /^( {0,3})(`{3,}|~{3,})[ \t]*([^\s`]*)(.*)$/;
const LIST_MARKER = /^( *)([-+*]|\d{1,9}[.)])( +|$)(.*)$/;
const TASK = /^\[([ xX])\](?:[ \t]+|$)/;
const TABLE_DELIMITER = /^ {0,3}\|?[ \t]*:?-+:?[ \t]*(?:\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/;
const HARD_BREAK = /( {2,}|\\)$/;

const at = (lines: readonly string[], index: number): string => lines[index] ?? '';
const isBlank = (line: string): boolean => line.trim() === '';

/**
 * Splits a document into its top-level blocks. `previous` is the result of the
 * last call: a block whose source lines are unchanged comes back as the SAME
 * object, so appending text re-reads only the blocks it touched (in practice,
 * the last one).
 */
export function parseMarkdown(
  text: string,
  previous: readonly MarkdownSegment[] = [],
): MarkdownSegment[] {
  const lines = splitLines(text);
  const segments: MarkdownSegment[] = [];
  let i = 0;
  while (i < lines.length) {
    if (isBlank(at(lines, i))) {
      i += 1;
      continue;
    }
    const { block, next } = readBlock(lines, i);
    const source = lines.slice(i, next).join('\n').trimEnd();
    const before = previous[segments.length];
    segments.push(before?.source === source ? before : { source, block });
    i = next;
  }
  return segments;
}

function splitLines(text: string): string[] {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/^\t+/, (tabs) => '    '.repeat(tabs.length)));
}

function readBlocks(lines: string[]): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    if (isBlank(at(lines, i))) {
      i += 1;
      continue;
    }
    const { block, next } = readBlock(lines, i);
    blocks.push(block);
    i = next;
  }
  return blocks;
}

interface Read {
  block: MarkdownBlock;
  /** The first line after the block. */
  next: number;
}

function readBlock(lines: string[], i: number): Read {
  const line = at(lines, i);
  const fence = fenceOpening(line);
  if (fence) return readFence(lines, i, fence);
  const heading = HEADING.exec(line);
  if (heading) {
    const [, hashes = '', text = ''] = heading;
    const level = hashes.length as 1 | 2 | 3 | 4 | 5 | 6;
    return { block: { type: 'heading', level, text }, next: i + 1 };
  }
  if (RULE.test(line)) return { block: { type: 'rule' }, next: i + 1 };
  if (QUOTE.test(line)) return readQuote(lines, i);
  if (LIST_MARKER.test(line)) return readList(lines, i);
  if (isTableStart(lines, i)) return readTable(lines, i);
  return readParagraph(lines, i);
}

interface Fence {
  indent: number;
  marker: string;
  language: string;
}

function fenceOpening(line: string): Fence | undefined {
  const match = FENCE.exec(line);
  if (!match) return undefined;
  const [, indent = '', marker = '', language = '', rest = ''] = match;
  // A backtick fence's info string cannot hold a backtick: that is inline code.
  if (marker.startsWith('`') && rest.includes('`')) return undefined;
  return { indent: indent.length, marker, language };
}

/** A fence runs to its closing line, or to the end of the text while it is still being written. */
function readFence(lines: string[], i: number, fence: Fence): Read {
  const closing = new RegExp(
    `^ {0,3}${fence.marker[0] === '`' ? '`' : '~'}{${fence.marker.length},}[ \\t]*$`,
  );
  const code: string[] = [];
  let next = i + 1;
  while (next < lines.length && !closing.test(at(lines, next))) {
    code.push(at(lines, next).replace(new RegExp(`^ {0,${fence.indent}}`), ''));
    next += 1;
  }
  return {
    block: {
      type: 'code',
      ...(fence.language ? { language: fence.language } : null),
      code: code.join('\n'),
    },
    next: Math.min(next + 1, lines.length),
  };
}

function readQuote(lines: string[], i: number): Read {
  const inner: string[] = [];
  let next = i;
  while (next < lines.length && QUOTE.test(at(lines, next))) {
    inner.push(at(lines, next).replace(/^ {0,3}> ?/, ''));
    next += 1;
  }
  return { block: { type: 'quote', children: readBlocks(inner) }, next };
}

/** Whether a line opens a block that may interrupt a paragraph. */
function interruptsParagraph(lines: string[], i: number): boolean {
  const line = at(lines, i);
  if (fenceOpening(line) || HEADING.test(line) || RULE.test(line) || QUOTE.test(line)) return true;
  const marker = markerAt(line);
  // An empty item, or a number other than 1, reads as the sentence continuing.
  if (marker && marker.first !== '' && (!marker.ordered || marker.number === 1)) return true;
  return isTableStart(lines, i);
}

function readParagraph(lines: string[], i: number): Read {
  let text = at(lines, i).trim();
  let previous = at(lines, i);
  let next = i + 1;
  while (next < lines.length && !isBlank(at(lines, next)) && !interruptsParagraph(lines, next)) {
    text += (HARD_BREAK.test(previous) ? '\n' : ' ') + at(lines, next).trim();
    previous = at(lines, next);
    next += 1;
  }
  return { block: { type: 'paragraph', text }, next };
}

interface Marker {
  indent: number;
  ordered: boolean;
  /** The column where the item's own lines begin. */
  contentIndent: number;
  first: string;
  number: number;
}

function markerAt(line: string): Marker | undefined {
  const match = LIST_MARKER.exec(line);
  if (!match) return undefined;
  const [, spaces = '', bullet = '', gap = '', rest = ''] = match;
  const ordered = /\d/.test(bullet);
  // Five or more spaces after a marker is an indented block, not a wide gap.
  const width = gap.length > 4 || rest === '' ? 1 : gap.length;
  return {
    indent: spaces.length,
    ordered,
    contentIndent: spaces.length + bullet.length + width,
    first: rest,
    number: ordered ? parseInt(bullet, 10) : 1,
  };
}

const indentOf = (line: string): number => line.length - line.trimStart().length;

function readList(lines: string[], i: number): Read {
  const head = markerAt(at(lines, i)) as Marker;
  const items: MarkdownListItem[] = [];
  let next = i;

  while (next < lines.length) {
    // Blank lines between items do not end the list; whatever follows them decides.
    if (isBlank(at(lines, next))) {
      const ahead = nextNonBlank(lines, next);
      if (ahead === -1) break;
      next = ahead;
    }
    const marker = markerAt(at(lines, next));
    if (!marker || marker.ordered !== head.ordered || marker.indent > head.indent + 3) break;
    const body: string[] = [marker.first];
    next += 1;

    while (next < lines.length) {
      const line = at(lines, next);
      if (isBlank(line)) {
        const ahead = nextNonBlank(lines, next);
        if (ahead === -1 || !continuesItem(at(lines, ahead), marker, head)) break;
        body.push(...lines.slice(next, ahead).map(() => ''));
        next = ahead;
        continue;
      }
      if (continuesItem(line, marker, head)) {
        body.push(line.slice(Math.min(indentOf(line), marker.contentIndent)));
      } else if (
        // Wrapped text with no indent still belongs to the line above it.
        !isBlank(at(lines, next - 1)) &&
        !markerAt(line) &&
        !interruptsParagraph(lines, next)
      ) {
        body.push(line.trim());
      } else {
        break;
      }
      next += 1;
    }

    const task = TASK.exec(marker.first);
    if (task) body[0] = marker.first.slice(task[0].length);
    items.push({
      ...(task ? { checked: task[1] !== ' ' } : null),
      children: readBlocks(body),
    });
  }

  return {
    block: { type: 'list', ordered: head.ordered, start: head.number, items },
    next,
  };
}

const nextNonBlank = (lines: string[], from: number): number =>
  lines.findIndex((line, index) => index > from && !isBlank(line));

/** A line that belongs inside `item`: indented under its text, or a marker nested deeper than the list. */
function continuesItem(line: string, item: Marker, list: Marker): boolean {
  const indent = indentOf(line);
  if (indent >= item.contentIndent) return true;
  return indent > list.indent && markerAt(line) !== undefined;
}

function splitRow(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  for (let i = 0; i < line.length; i += 1) {
    if (line[i] === '\\' && line[i + 1] === '|') {
      cell += '|';
      i += 1;
    } else if (line[i] === '|') {
      cells.push(cell);
      cell = '';
    } else {
      cell += line[i];
    }
  }
  cells.push(cell);
  const trimmed = cells.map((value) => value.trim());
  // A leading or trailing pipe is a border, not an empty cell.
  if (line.trim().startsWith('|')) trimmed.shift();
  if (line.trim().endsWith('|') && !line.trim().endsWith('\\|')) trimmed.pop();
  return trimmed;
}

function isTableStart(lines: string[], i: number): boolean {
  const header = at(lines, i);
  const delimiter = at(lines, i + 1);
  if (delimiter === undefined || !header.includes('|') || !TABLE_DELIMITER.test(delimiter)) {
    return false;
  }
  return splitRow(header).length === splitRow(delimiter).length;
}

function alignOf(cell: string): MarkdownColumnAlign | undefined {
  const left = cell.startsWith(':');
  const right = cell.endsWith(':');
  if (left && right) return 'center';
  return right ? 'right' : left ? 'left' : undefined;
}

function readTable(lines: string[], i: number): Read {
  const header = splitRow(at(lines, i));
  const align = splitRow(at(lines, i + 1)).map(alignOf);
  const rows: string[][] = [];
  let next = i + 2;
  while (next < lines.length && !isBlank(at(lines, next)) && !interruptsParagraph(lines, next)) {
    const cells = splitRow(at(lines, next));
    rows.push(header.map((_, column) => cells[column] ?? ''));
    next += 1;
  }
  return { block: { type: 'table', align, header, rows }, next };
}
