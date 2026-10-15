/**
 * Segments ⇄ the HTML dialect the native input speaks.
 *
 * The input reads and writes `<html><p>…</p>…</html>` with the inline tags
 * `b`, `i`, `u`, `s`, `code`, `a href` and `mention`. HTML is only the wire
 * format to the input; the value is always `Segment[]`.
 *
 * The parser is a small whitelist tokenizer, not a DOM: it runs on Hermes,
 * where there is no DOM. Only the tags above become marks; any other tag is
 * dropped (its text is kept), attributes other than `href` and a mention's
 * own are ignored, and a link is kept only for safe schemes. Paragraph and
 * line breaks become `\n`.
 */
import { coalesceSegments } from './segments';
import type { MentionMark, Segment, TextMarks } from './types';

const SAFE_LINK = /^(https?:|mailto:|tel:|\/|#)/i;

/** Whether an href may be stored and rendered as a link. */
export function isSafeLink(href: string): boolean {
  return SAFE_LINK.test(href.trim());
}

function escapeText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;');
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (whole, body: string) => {
    if (body[0] === '#') {
      const code =
        body[1] === 'x' || body[1] === 'X'
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : whole;
    }
    return ENTITIES[body.toLowerCase()] ?? whole;
  });
}

function runToHtml(seg: Segment): string {
  let html = escapeText(seg.text);
  if (seg.code) html = `<code>${html}</code>`;
  if (seg.strike) html = `<s>${html}</s>`;
  if (seg.underline) html = `<u>${html}</u>`;
  if (seg.italic) html = `<i>${html}</i>`;
  if (seg.bold) html = `<b>${html}</b>`;
  if (seg.mention) {
    const attrs = Object.entries(seg.mention.attributes)
      .filter(([k]) => /^[a-z][a-z0-9_-]*$/i.test(k) && k !== 'text' && k !== 'indicator')
      .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
      .join('');
    html = `<mention text="${escapeAttr(seg.text)}" indicator="${escapeAttr(seg.mention.indicator)}"${attrs}>${html}</mention>`;
  }
  if (seg.link && isSafeLink(seg.link)) html = `<a href="${escapeAttr(seg.link)}">${html}</a>`;
  return html;
}

/** Serialize segments to the input's HTML. `\n` separates paragraphs. */
export function segmentsToHtml(segments: readonly Segment[]): string {
  const paragraphs: string[] = [''];
  for (const seg of segments) {
    const lines = seg.text.split('\n');
    lines.forEach((line, i) => {
      if (i > 0) paragraphs.push('');
      if (line.length > 0) paragraphs[paragraphs.length - 1] += runToHtml({ ...seg, text: line });
    });
  }
  return `<html>\n${paragraphs.map((p) => `<p>${p}</p>`).join('\n')}\n</html>`;
}

/** What follows a placeholder <br>: the end of its paragraph or of the input. */
const TRAILING_BREAK = /^\s*(<\/(p|h[1-6]|li|blockquote|codeblock|div|html|body)>|$)/i;

const PARAGRAPH_TAGS = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'li',
  'blockquote',
  'codeblock',
  'div',
]);
const MARK_TAGS = new Set([
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'del',
  'strike',
  'code',
  'a',
  'mention',
]);

interface OpenMark {
  tag: string;
  marks: TextMarks;
}

function parseAttributes(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const pattern = /([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const m of source.matchAll(pattern)) {
    const name = m[1];
    if (!name) continue;
    attrs[name.toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return attrs;
}

function markFor(tag: string, attrs: Record<string, string>): OpenMark | null {
  switch (tag) {
    case 'b':
    case 'strong':
      return { tag, marks: { bold: true } };
    case 'i':
    case 'em':
      return { tag, marks: { italic: true } };
    case 'u':
      return { tag, marks: { underline: true } };
    case 's':
    case 'del':
    case 'strike':
      return { tag, marks: { strike: true } };
    case 'code':
      return { tag, marks: { code: true } };
    case 'a': {
      const href = attrs.href;
      if (!href || !isSafeLink(href)) return { tag, marks: {} };
      return { tag, marks: { link: href } };
    }
    case 'mention': {
      const { text: _text, indicator, ...rest } = attrs;
      const mention: MentionMark = { indicator: indicator || '@', attributes: rest };
      return { tag, marks: { mention: mention } };
    }
    default:
      return null;
  }
}

/** Parse the input's HTML (or any HTML) into segments, keeping only known marks. */
export function htmlToSegments(html: string): Segment[] {
  const out: Segment[] = [];
  const open: OpenMark[] = [];
  let paragraphs = 0;
  let inParagraph = false;

  const emit = (raw: string) => {
    const text = decodeEntities(raw);
    if (text.length === 0) return;
    const seg: Segment = { text };
    for (const mark of open) Object.assign(seg, mark.marks);
    out.push(seg);
  };

  const startParagraph = () => {
    if (paragraphs > 0) out.push({ text: '\n' });
    paragraphs += 1;
    inParagraph = true;
  };

  // Script and style bodies are code, not text: drop them whole.
  const source = html.replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, '');
  const tokens = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>|<!--[\s\S]*?-->|([^<]+)|(<)/g;
  for (const m of source.matchAll(tokens)) {
    const [, closing, rawTag, attrSource, text, strayLt] = m;
    if (text !== undefined) {
      // Whitespace between block tags is formatting, not content.
      if (!inParagraph && text.trim() === '') continue;
      if (!inParagraph) startParagraph();
      emit(text);
      continue;
    }
    if (strayLt !== undefined) {
      if (!inParagraph) startParagraph();
      emit('<');
      continue;
    }
    if (!rawTag) continue;
    const tag = rawTag.toLowerCase();
    if (tag === 'br') {
      // A <br> that closes its paragraph is the placeholder editing surfaces
      // put in an empty or trailing line, not a line break.
      const rest = source.slice((m.index ?? 0) + m[0].length);
      if (TRAILING_BREAK.test(rest)) {
        if (!inParagraph) startParagraph();
        continue;
      }
      if (!inParagraph) startParagraph();
      out.push({ text: '\n' });
      continue;
    }
    if (PARAGRAPH_TAGS.has(tag)) {
      if (closing) inParagraph = false;
      else startParagraph();
      continue;
    }
    if (MARK_TAGS.has(tag)) {
      if (closing) {
        for (let i = open.length - 1; i >= 0; i -= 1) {
          if (open[i]?.tag === tag) {
            open.splice(i, 1);
            break;
          }
        }
      } else {
        const mark = markFor(tag, parseAttributes(attrSource ?? ''));
        if (mark) open.push(mark);
      }
    }
    // Any other tag (html, body, img, span, script…) is dropped; text inside
    // ordinary tags is still emitted by the text branch above.
  }

  return coalesceSegments(out);
}
