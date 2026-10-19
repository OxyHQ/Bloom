/**
 * Pasted HTML (a web page, Google Docs, Word, another Notion-style editor) as
 * block snapshots: headings, lists, to-dos, quotes, code, dividers, images,
 * tables and toggles, with bold, italic, underline, strike, inline code and
 * links on the text.
 *
 * There is no DOM on Hermes or in a server, so this is a small tolerant
 * parser of its own: a tokenizer builds an element tree (closing what HTML
 * leaves open, ignoring stray end tags), and the tree is read into blocks.
 * Anything it does not know keeps its text and drops its tag; scripts, styles
 * and comments are dropped whole, and only safe links are kept.
 */
import {
  coalesceSegments,
  isSafeLink,
  type Segment,
  type TextMarks,
} from '@oxy.so/bloom-text/model';
import type { Schema } from './schema';
import type { BlockSnapshot } from './snapshot';

interface Element {
  tag: string;
  attrs: Record<string, string>;
  children: Node[];
}
type Node = Element | string;

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);

/** Elements whose whole content is dropped. */
const DROPPED_TAGS = new Set(['script', 'style', 'head', 'title', 'template', 'noscript', 'svg']);

/** Elements that make or hold blocks; everything else is inline. */
const BLOCK_TAGS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'body',
  'center',
  'dd',
  'details',
  'dialog',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'html',
  'li',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'summary',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul',
]);

/** Opening one of these closes an open `p` (HTML's implied end tags). */
const CLOSES_P = new Set(
  [...BLOCK_TAGS].filter((t) => !['body', 'html', 'li', 'td', 'th', 'tr', 'dd', 'dt'].includes(t)),
);

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ensp: ' ',
  emsp: ' ',
  thinsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  laquo: '«',
  raquo: '»',
  bull: '•',
  middot: '·',
  copy: '©',
  reg: '®',
  trade: '™',
  times: '×',
  deg: '°',
  euro: '€',
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (whole, body: string) => {
    if (body[0] === '#') {
      const code =
        body[1] === 'x' || body[1] === 'X'
          ? Number.parseInt(body.slice(2), 16)
          : Number.parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : whole;
    }
    return ENTITIES[body.toLowerCase()] ?? whole;
  });
}

function parseAttributes(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const pattern = /([^\s=/"'<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const m of source.matchAll(pattern)) {
    const name = m[1];
    if (!name) continue;
    attrs[name.toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return attrs;
}

/** The element tree of `html`, under a root element. */
export function parseHtmlTree(html: string): Element {
  const root: Element = { tag: '#root', attrs: {}, children: [] };
  const stack: Element[] = [root];
  const top = () => stack[stack.length - 1] as Element;
  const closeTo = (tag: string, stopAt: readonly string[] = []) => {
    for (let i = stack.length - 1; i > 0; i -= 1) {
      const open = stack[i] as Element;
      if (stopAt.includes(open.tag)) return;
      if (open.tag === tag) {
        stack.length = i;
        return;
      }
    }
  };
  const isOpen = (tag: string, stopAt: readonly string[]) => {
    for (let i = stack.length - 1; i > 0; i -= 1) {
      const open = (stack[i] as Element).tag;
      if (open === tag) return true;
      if (stopAt.includes(open)) return false;
    }
    return false;
  };

  const source = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')
    .replace(/<![^>]*>/g, '')
    .replace(/<\?[^>]*>/g, '');
  const tokens = /<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|([^<]+)|(<)/g;
  let dropping: string | null = null;
  for (const m of source.matchAll(tokens)) {
    const [, closing, rawTag, attrSource = '', text, strayLt] = m;
    if (dropping) {
      if (closing && rawTag?.toLowerCase() === dropping) dropping = null;
      continue;
    }
    if (text !== undefined || strayLt !== undefined) {
      top().children.push(decodeEntities(text ?? '<'));
      continue;
    }
    if (!rawTag) continue;
    const tag = rawTag.toLowerCase().replace(/^.*:/, '');
    if (closing) {
      if (tag === 'p' && !isOpen('p', ['li', 'td', 'th', 'blockquote'])) {
        // `</p>` with no `<p>` open is an empty paragraph, as browsers read it.
        top().children.push({ tag: 'p', attrs: {}, children: [] });
        continue;
      }
      closeTo(tag);
      continue;
    }
    if (DROPPED_TAGS.has(tag)) {
      if (!/\/\s*$/.test(attrSource)) dropping = tag;
      continue;
    }
    // HTML's implied end tags: a block closes an open paragraph, an item
    // the previous item, a row the previous row, a cell the previous cell.
    if (CLOSES_P.has(tag) && isOpen('p', ['li', 'td', 'th', 'blockquote', 'div'])) closeTo('p');
    if (tag === 'li') closeTo('li', ['ul', 'ol']);
    if (tag === 'tr') closeTo('tr', ['table']);
    if (tag === 'td' || tag === 'th') {
      closeTo('td', ['tr', 'table']);
      closeTo('th', ['tr', 'table']);
    }
    if (tag === 'dt' || tag === 'dd') {
      closeTo('dt', ['dl']);
      closeTo('dd', ['dl']);
    }
    const element: Element = { tag, attrs: parseAttributes(attrSource), children: [] };
    top().children.push(element);
    if (!VOID_TAGS.has(tag) && !/\/\s*$/.test(attrSource)) stack.push(element);
  }
  return root;
}

/** A CSS declaration's value in a `style` attribute, lowercased. */
function styleOf(element: Element, property: string): string | undefined {
  const style = element.attrs.style;
  if (!style) return undefined;
  for (const declaration of style.split(';')) {
    const at = declaration.indexOf(':');
    if (at < 0) continue;
    if (declaration.slice(0, at).trim().toLowerCase() === property) {
      return declaration
        .slice(at + 1)
        .trim()
        .toLowerCase();
    }
  }
  return undefined;
}

/** The marks an inline element adds to (or, by its style, takes from) what it holds. */
function marksFor(element: Element, marks: TextMarks): TextMarks {
  const next: TextMarks = { ...marks };
  switch (element.tag) {
    case 'b':
    case 'strong':
      next.bold = true;
      break;
    case 'i':
    case 'em':
    case 'cite':
    case 'var':
      next.italic = true;
      break;
    case 'u':
    case 'ins':
      next.underline = true;
      break;
    case 's':
    case 'del':
    case 'strike':
      next.strike = true;
      break;
    case 'code':
    case 'kbd':
    case 'samp':
    case 'tt':
      next.code = true;
      break;
    case 'a': {
      const href = element.attrs.href?.trim();
      if (href && isSafeLink(href)) next.link = href;
      break;
    }
  }
  // Google Docs and Word say it with styles (and wrap a whole paste in a
  // `<b style="font-weight:normal">`).
  const weight = styleOf(element, 'font-weight');
  if (weight !== undefined) {
    const numeric = Number.parseInt(weight, 10);
    if (weight === 'bold' || weight === 'bolder' || numeric >= 600) next.bold = true;
    else if (weight === 'normal' || weight === 'lighter' || numeric > 0) delete next.bold;
  }
  const fontStyle = styleOf(element, 'font-style');
  if (fontStyle === 'italic' || fontStyle === 'oblique') next.italic = true;
  else if (fontStyle === 'normal') delete next.italic;
  const decoration = `${styleOf(element, 'text-decoration') ?? ''} ${styleOf(element, 'text-decoration-line') ?? ''}`;
  if (decoration.includes('line-through')) next.strike = true;
  if (decoration.includes('underline') && !next.link) next.underline = true;
  return next;
}

function isElement(node: Node): node is Element {
  return typeof node !== 'string';
}

function hasBlocks(element: Element): boolean {
  return element.children.some(
    (child) => isElement(child) && (BLOCK_TAGS.has(child.tag) || hasBlocks(child)),
  );
}

/** Options for `htmlToSnapshot`. */
export interface HtmlToSnapshotOptions {
  /**
   * The editor's schema: a block type it does not have becomes a paragraph
   * (an image it has no type for is dropped), and tables are kept as tables
   * only when it has `table`, `table_row` and `table_cell`.
   */
  schema?: Schema;
  /**
   * The block an image in the HTML becomes; null drops it. By default an
   * `image` block with `url` and `alt`, for an `http(s)` source only.
   */
  image?: (image: { src: string; alt: string }) => BlockSnapshot | null;
}

function defaultImage({ src, alt }: { src: string; alt: string }): BlockSnapshot | null {
  if (!/^https?:\/\//i.test(src)) return null;
  return { type: 'image', props: { url: src, ...(alt && { alt }) } };
}

/** Inline content as segments, whitespace not yet collapsed at the edges. */
interface Inline {
  segments: Segment[];
  /** Blocks found inside it (an image in a paragraph): they follow it. */
  hoisted: BlockSnapshot[];
}

class Reader {
  constructor(private readonly options: HtmlToSnapshotOptions) {}

  private has(type: string): boolean {
    const { schema } = this.options;
    return !schema || type in schema;
  }

  /** `type` when the schema has it, else a paragraph. */
  private typed(type: string): string {
    return this.has(type) ? type : 'paragraph';
  }

  private image(element: Element): BlockSnapshot | null {
    const src = element.attrs.src?.trim() ?? '';
    if (!src) return null;
    const block = (this.options.image ?? defaultImage)({ src, alt: element.attrs.alt ?? '' });
    if (!block || !this.has(block.type)) return null;
    return block;
  }

  /** The inline content of `nodes`, with `marks`; `pre` keeps whitespace. */
  inline(nodes: readonly Node[], marks: TextMarks, pre: boolean, out: Inline): void {
    for (const node of nodes) {
      if (!isElement(node)) {
        const text = pre ? node : node.replace(/[ \t\n\r\f]+/g, ' ');
        if (text) out.segments.push({ ...marks, text: text.replace(/ /g, ' ') });
        continue;
      }
      if (node.tag === 'br') {
        out.segments.push({ text: '\n' });
        continue;
      }
      if (node.tag === 'img') {
        const image = this.image(node);
        if (image) out.hoisted.push(image);
        else if (node.attrs.alt) out.segments.push({ ...marks, text: node.attrs.alt });
        continue;
      }
      if (node.tag === 'input') continue;
      if (BLOCK_TAGS.has(node.tag)) {
        // A block inside inline content (a `<p>` in a `<li>`, a `<div>` in a
        // quote) is a line of it.
        if (out.segments.length > 0) out.segments.push({ text: '\n' });
        this.inline(node.children, marks, pre || node.tag === 'pre', out);
        continue;
      }
      this.inline(node.children, marksFor(node, marks), pre, out);
    }
  }

  /** Segments of inline nodes, trimmed of the whitespace around lines. */
  text(nodes: readonly Node[], marks: TextMarks = {}, pre = false): Inline {
    const out: Inline = { segments: [], hoisted: [] };
    this.inline(nodes, marks, pre, out);
    return {
      segments: pre ? coalesceSegments(out.segments) : trimLines(out.segments),
      hoisted: out.hoisted,
    };
  }

  /**
   * The blocks of a list of nodes, under the marks of the inline elements
   * around them: runs of inline content become paragraphs.
   */
  blocks(nodes: readonly Node[], marks: TextMarks = {}): BlockSnapshot[] {
    const out: BlockSnapshot[] = [];
    let run: Node[] = [];
    const flush = () => {
      if (run.length === 0) return;
      const { segments, hoisted } = this.text(run, marks);
      run = [];
      if (segments.length > 0) out.push({ type: 'paragraph', text: segments });
      out.push(...hoisted);
    };
    for (const node of nodes) {
      if (isElement(node) && (BLOCK_TAGS.has(node.tag) || (hasBlocks(node) && node.tag !== 'a'))) {
        flush();
        out.push(...this.block(node, marks));
      } else if (isElement(node) && node.tag === 'img') {
        flush();
        const image = this.image(node);
        if (image) out.push(image);
      } else {
        run.push(node);
      }
    }
    flush();
    return out;
  }

  private withText(type: string, nodes: readonly Node[], marks: TextMarks): BlockSnapshot[] {
    const { segments, hoisted } = this.text(nodes, marks);
    return [{ type: this.typed(type), text: segments }, ...hoisted];
  }

  block(element: Element, marks: TextMarks): BlockSnapshot[] {
    switch (element.tag) {
      case 'h1':
        return this.withText('heading_1', element.children, marks);
      case 'h2':
        return this.withText('heading_2', element.children, marks);
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return this.withText('heading_3', element.children, marks);
      case 'p':
        if (hasBlocks(element)) return this.blocks(element.children, marks);
        return this.withText('paragraph', element.children, marks).filter(
          (b, i) => i > 0 || (b.text?.length ?? 0) > 0,
        );
      case 'hr':
        return this.has('divider') ? [{ type: 'divider' }] : [];
      case 'pre':
        return [this.code(element)];
      case 'blockquote':
        return this.withText('quote', element.children, marks);
      case 'ul':
      case 'ol':
        return this.list(element, marks);
      case 'li':
        return this.listItem(element, 'bulleted_list_item', marks);
      case 'table':
        return this.table(element, marks);
      case 'details':
        return this.details(element, marks);
      default:
        // Code laid out as lines of their own (a code editor's copy).
        if (styleOf(element, 'white-space')?.startsWith('pre')) return [this.code(element)];
        return this.blocks(
          element.children,
          BLOCK_TAGS.has(element.tag) ? marks : marksFor(element, marks),
        );
    }
  }

  private code(element: Element): BlockSnapshot {
    const { segments } = this.text(element.children, {}, true);
    const text = segments
      .map((s) => s.text)
      .join('')
      .replace(/\n$/, '');
    const codeChild = element.children.find((c): c is Element => isElement(c) && c.tag === 'code');
    const language = languageOf(element) ?? (codeChild ? languageOf(codeChild) : undefined);
    return {
      type: this.typed('code'),
      text: text ? [{ text }] : [],
      ...(language && { props: { language } }),
    };
  }

  private list(element: Element, marks: TextMarks): BlockSnapshot[] {
    const type = element.tag === 'ol' ? 'numbered_list_item' : 'bulleted_list_item';
    const out: BlockSnapshot[] = [];
    for (const child of element.children) {
      if (!isElement(child)) {
        if (child.trim()) out.push(...this.withText(type, [child], marks));
        continue;
      }
      if (child.tag === 'li') out.push(...this.listItem(child, type, marks));
      // A list nested straight in a list (not in an item) belongs to the item before it.
      else if ((child.tag === 'ul' || child.tag === 'ol') && out.length > 0) {
        const last = out[out.length - 1] as BlockSnapshot;
        last.children = [...(last.children ?? []), ...this.list(child, marks)];
      } else out.push(...this.block(child, marks));
    }
    return out;
  }

  /** An item: its text up to its first nested list or block, the rest its children. */
  private listItem(element: Element, listType: string, marks: TextMarks): BlockSnapshot[] {
    let checked = checkboxOf(element);
    const textNodes: Node[] = [];
    const rest: Node[] = [];
    for (const child of element.children) {
      const nestedBlock =
        isElement(child) &&
        (child.tag === 'ul' || child.tag === 'ol' || child.tag === 'pre' || child.tag === 'table');
      if (rest.length > 0 || nestedBlock) rest.push(child);
      else textNodes.push(child);
    }
    const { segments, hoisted } = this.text(textNodes, marks);
    let text = segments;
    // Markdown-style task items, as some sites write them: `[x] done`.
    const head = text[0]?.text ?? '';
    const task = /^\[( |x|X)\]\s+/.exec(head);
    if (checked === null && task) {
      checked = task[1] !== ' ';
      text = [
        { ...(text[0] as Segment), text: head.slice(task[0].length) },
        ...text.slice(1),
      ].filter((s) => s.text.length > 0);
    }
    const type = checked !== null && this.has('todo') ? 'todo' : this.typed(listType);
    const children = [...hoisted, ...this.blocks(rest, marks)];
    return [
      {
        type,
        text,
        ...(type === 'todo' && { props: { checked: checked === true } }),
        ...(children.length > 0 && { children }),
      },
    ];
  }

  private table(element: Element, marks: TextMarks): BlockSnapshot[] {
    const rows: Element[] = [];
    const collect = (node: Element) => {
      for (const child of node.children) {
        if (!isElement(child)) continue;
        if (child.tag === 'tr') rows.push(child);
        else if (child.tag !== 'table') collect(child);
      }
    };
    collect(element);
    const cellsOf = (row: Element) =>
      row.children.filter((c): c is Element => isElement(c) && (c.tag === 'td' || c.tag === 'th'));
    const asTable = this.has('table') && this.has('table_row') && this.has('table_cell');
    if (asTable) {
      const width = Math.max(1, ...rows.map((row) => cellsOf(row).length));
      return [
        {
          type: 'table',
          children: rows.map((row) => {
            const cells = cellsOf(row);
            return {
              type: 'table_row',
              children: Array.from({ length: width }, (_, i) => {
                const cell = cells[i];
                const text = cell ? this.text(cell.children, marks).segments : [];
                return { type: 'table_cell', text };
              }),
            };
          }),
        },
      ];
    }
    // Without tables, a row is a line of its cells' text.
    return rows.flatMap((row) => {
      const parts = cellsOf(row).map((cell) => this.text(cell.children, marks).segments);
      const text: Segment[] = [];
      parts.forEach((part, i) => {
        if (i > 0) text.push({ text: '\t' });
        text.push(...part);
      });
      const segments = coalesceSegments(text);
      return segments.length > 0 ? [{ type: 'paragraph', text: segments }] : [];
    });
  }

  private details(element: Element, marks: TextMarks): BlockSnapshot[] {
    const summary = element.children.find((c): c is Element => isElement(c) && c.tag === 'summary');
    const body = element.children.filter((c) => c !== summary);
    const children = this.blocks(body, marks);
    if (!this.has('toggle')) {
      return [...(summary ? this.withText('paragraph', summary.children, marks) : []), ...children];
    }
    return [
      {
        type: 'toggle',
        text: summary ? this.text(summary.children, marks).segments : [],
        props: { expanded: true },
        ...(children.length > 0 && { children }),
      },
    ];
  }
}

/** A code element's language, from `language-x` / `lang-x` classes or `data-language`. */
function languageOf(element: Element): string | undefined {
  const data = element.attrs['data-language'] ?? element.attrs.lang;
  if (data) return data.toLowerCase();
  const match = /(?:^|\s)(?:language|lang)-([\w+#.-]+)/.exec(element.attrs.class ?? '');
  return match?.[1]?.toLowerCase();
}

/** Whether a list item is a checked (true) or unchecked (false) task; null when it is not one. */
function checkboxOf(element: Element): boolean | null {
  if (element.attrs.role === 'checkbox' && element.attrs['aria-checked'] !== undefined) {
    return element.attrs['aria-checked'] === 'true';
  }
  const find = (node: Element, depth: number): Element | null => {
    for (const child of node.children) {
      if (!isElement(child)) {
        // Only a box before the item's text marks a task.
        if (child.trim()) return null;
        continue;
      }
      if (child.tag === 'ul' || child.tag === 'ol') return null;
      if (child.tag === 'input' && child.attrs.type?.toLowerCase() === 'checkbox') return child;
      // Notion's own HTML: `<div class="checkbox checkbox-on">` before the text.
      if (/\bcheckbox-(on|off)\b/.test(child.attrs.class ?? '')) return child;
      if (depth < 3) {
        const found = find(child, depth + 1);
        if (found) return found;
        if (child.children.some((c) => !isElement(c) && c.trim())) return null;
      }
    }
    return null;
  };
  const box = find(element, 0);
  if (!box) return null;
  if (box.tag === 'input') return 'checked' in box.attrs;
  return /\bcheckbox-on\b/.test(box.attrs.class ?? '');
}

/** Segments with the whitespace at the start and end of each line removed. */
function trimLines(segments: readonly Segment[]): Segment[] {
  const lines: Segment[][] = [[]];
  for (const segment of segments) {
    const parts = segment.text.split('\n');
    parts.forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part) (lines[lines.length - 1] as Segment[]).push({ ...segment, text: part });
    });
  }
  const trimmed = lines.map((line) => {
    const out = line.map((s) => ({ ...s }));
    // Collapse a space at the join of two runs, then trim the ends.
    for (let i = 1; i < out.length; i += 1) {
      const prev = out[i - 1] as Segment;
      const cur = out[i] as Segment;
      if (prev.text.endsWith(' ') && cur.text.startsWith(' ')) cur.text = cur.text.slice(1);
    }
    const first = out[0];
    if (first) first.text = first.text.replace(/^ +/, '');
    const last = out[out.length - 1];
    if (last) last.text = last.text.replace(/ +$/, '');
    return coalesceSegments(out);
  });
  // Drop empty lines at the start and end.
  while (trimmed.length > 1 && (trimmed[0] as Segment[]).length === 0) trimmed.shift();
  while (trimmed.length > 1 && (trimmed[trimmed.length - 1] as Segment[]).length === 0)
    trimmed.pop();
  const out: Segment[] = [];
  trimmed.forEach((line, i) => {
    if (i > 0) out.push({ text: '\n' });
    out.push(...line);
  });
  return coalesceSegments(out);
}

/**
 * Block snapshots for pasted HTML. Returns `[]` when it holds nothing
 * (whitespace, a lone comment).
 */
export function htmlToSnapshot(html: string, options: HtmlToSnapshotOptions = {}): BlockSnapshot[] {
  const reader = new Reader(options);
  return reader.blocks(parseHtmlTree(html).children);
}

/**
 * Whether a snapshot says no more than its plain text would: paragraphs
 * without marks. A paste like that is better read as text (its Markdown
 * prefixes make blocks).
 */
export function isPlainSnapshot(snapshot: readonly BlockSnapshot[]): boolean {
  return snapshot.every(
    (block) =>
      block.type === 'paragraph' &&
      !block.children?.length &&
      (block.text ?? []).every((segment) => Object.keys(segment).length === 1),
  );
}
