/**
 * A small JavaScript / TypeScript / JSX tokenizer. Bloom takes no highlighter
 * dependency, so this classifies exactly the token kinds the code palette
 * colours, the way Prism's `tsx` grammar does for everyday code:
 *
 *   keyword      import, export, const, function, return, type… and true/false
 *   operator     = === => ? : + - * / < > ! & |  (`:` included, as Prism's JS)
 *   string       '…' "…" and whole `…` template literals
 *   comment      // … and /* … *\/
 *   constant     ALL_CAPS identifiers, and numbers
 *   className    Capitalised identifiers and JSX tag names
 *   function     a declared function's name, or an identifier followed by `(`
 *   attrName     a JSX attribute name
 *   attrValue    a JSX attribute's quoted value
 *   punctuation  { } [ ] ( ) ; , . and a JSX tag's < </ > />
 *   plain        everything else
 *
 * Any other language is returned untokenised: one plain token per line. A
 * grammar that half-understands a language paints valid code as broken, which
 * is worse than no colour at all.
 */

import type { CodeLanguage, CodeToken, CodeTokenKind } from './types';

const HIGHLIGHTED = new Set<string>(['js', 'jsx', 'ts', 'tsx', 'javascript', 'typescript']);

/** Whether `language` is one `tokenizeCode` colours. */
export function isHighlightedLanguage(language: CodeLanguage | undefined): boolean {
  return language !== undefined && HIGHLIGHTED.has(language.toLowerCase());
}

const KEYWORDS = new Set([
  'abstract', 'as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
  'debugger', 'declare', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false',
  'finally', 'for', 'from', 'function', 'get', 'if', 'implements', 'import', 'in', 'instanceof',
  'interface', 'is', 'keyof', 'let', 'module', 'namespace', 'new', 'null', 'of', 'package',
  'private', 'protected', 'public', 'readonly', 'require', 'return', 'satisfies', 'set', 'static',
  'super', 'switch', 'this', 'throw', 'true', 'try', 'type', 'typeof', 'undefined', 'var', 'void',
  'while', 'with', 'yield',
]);

const OPERATOR = /\.\.\.|\?\?=?|\?\.|=>|[!=]==?|&&=?|\|\|=?|\*\*=?|<<=?|>>>?=?|\+\+|--|[-+*/%&|^!<>]=?|[~?:=]/y;
const IDENT = /[A-Za-z_$][\w$]*/y;
const TAG_NAME = /[A-Za-z_$][\w$.-]*/y;
const NUMBER = /0[xX][\da-fA-F_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?n?/y;

function matchAt(pattern: RegExp, source: string, at: number): string | undefined {
  pattern.lastIndex = at;
  return pattern.exec(source)?.[0];
}

/** Split into lines. A token spanning a line break (a comment, a template) is split with it. */
function toLines(tokens: CodeToken[]): CodeToken[][] {
  const lines: CodeToken[][] = [[]];
  for (const token of tokens) {
    const parts = token.text.split('\n');
    parts.forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part) lines[lines.length - 1]!.push({ kind: token.kind, text: part });
    });
  }
  return lines;
}

function tokenizeScript(source: string, marked: ReadonlySet<string>): CodeToken[] {
  const tokens: CodeToken[] = [];
  const push = (kind: CodeTokenKind, text: string) => {
    if (!text) return;
    const last = tokens[tokens.length - 1];
    if (last && last.kind === kind && (kind === 'plain' || kind === 'punctuation')) last.text += text;
    else tokens.push({ kind, text });
  };
  /** The last significant token, to tell a JSX `<` from a less-than. */
  const state: { last: CodeToken | null } = { last: null };
  const significant = (kind: CodeTokenKind, text: string) => {
    push(kind, text);
    state.last = { kind, text };
  };

  const stringEnd = (at: number, quote: string): number => {
    let j = at + 1;
    while (j < source.length) {
      const ch = source[j];
      if (ch === '\\') {
        j += 2;
        continue;
      }
      if (ch === quote) return j + 1;
      if (ch === '\n' && quote !== '`') return j;
      j += 1;
    }
    return source.length;
  };

  /** The previous non-whitespace run ends with `word`. */
  const precededBy = (at: number, word: string): boolean => {
    let j = at - 1;
    while (j >= 0 && /\s/.test(source[j]!)) j -= 1;
    return source.slice(Math.max(0, j - word.length + 1), j + 1) === word;
  };

  let i = 0;

  const readTag = () => {
    const closing = source[i + 1] === '/';
    significant('punctuation', closing ? '</' : '<');
    i += closing ? 2 : 1;
    const name = matchAt(TAG_NAME, source, i) ?? '';
    push('className', name);
    i += name.length;
    while (i < source.length) {
      const ch = source[i]!;
      if (ch === '/' && source[i + 1] === '>') {
        significant('punctuation', '/>');
        i += 2;
        return;
      }
      if (ch === '>') {
        significant('punctuation', '>');
        i += 1;
        return;
      }
      if (ch === '"' || ch === "'") {
        const end = stringEnd(i, ch);
        push('punctuation', ch);
        push('attrValue', source.slice(i + 1, end - 1));
        push('punctuation', source[end - 1] === ch ? ch : '');
        i = end;
        continue;
      }
      if (ch === '=') {
        push('punctuation', '=');
        i += 1;
        continue;
      }
      if (ch === '{') {
        // An embedded expression: code up to the matching brace.
        let depth = 0;
        let j = i;
        for (; j < source.length; j++) {
          if (source[j] === '{') depth++;
          else if (source[j] === '}' && --depth === 0) break;
        }
        push('punctuation', '{');
        for (const token of tokenizeScript(source.slice(i + 1, j), marked)) push(token.kind, token.text);
        if (j < source.length) push('punctuation', '}');
        i = j + 1;
        continue;
      }
      const ident = matchAt(IDENT, source, i);
      if (ident) {
        push('attrName', ident);
        i += ident.length;
        continue;
      }
      push('plain', ch);
      i += 1;
    }
  };

  while (i < source.length) {
    const ch = source[i]!;
    const next = source[i + 1];

    if (ch === '/' && next === '/') {
      const end = source.indexOf('\n', i);
      const stop = end === -1 ? source.length : end;
      push('comment', source.slice(i, stop));
      i = stop;
      continue;
    }
    if (ch === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      const stop = end === -1 ? source.length : end + 2;
      push('comment', source.slice(i, stop));
      i = stop;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      const end = stringEnd(i, ch);
      significant('string', source.slice(i, end));
      i = end;
      continue;
    }
    if (/\s/.test(ch)) {
      push('plain', ch);
      i += 1;
      continue;
    }
    if (ch === '<' && next !== undefined && /[A-Za-z/]/.test(next) && (next !== '/' || /[A-Za-z]/.test(source[i + 2] ?? ''))) {
      const prev = state.last;
      const afterValue =
        prev !== null &&
        (prev.kind === 'plain' ||
          prev.kind === 'constant' ||
          prev.kind === 'className' ||
          (prev.kind === 'punctuation' && /[)\]]$/.test(prev.text)));
      if (!afterValue) {
        readTag();
        continue;
      }
    }
    const number = /\d/.test(ch) ? matchAt(NUMBER, source, i) : undefined;
    if (number) {
      significant('constant', number);
      i += number.length;
      continue;
    }
    const ident = matchAt(IDENT, source, i);
    if (ident) {
      let j = i + ident.length;
      while (j < source.length && /\s/.test(source[j]!)) j += 1;
      const following = source[j];
      const afterDot = precededBy(i, '.');
      let kind: CodeTokenKind;
      if (marked.has(ident)) kind = 'className';
      else if (KEYWORDS.has(ident) && !afterDot) kind = 'keyword';
      else if (precededBy(i, 'function')) kind = 'function';
      else if (/^[A-Z][A-Z\d_]+$/.test(ident) || /^[A-Z]$/.test(ident)) kind = 'constant';
      else if (/^[A-Z]/.test(ident)) kind = 'className';
      else if (following === '(') kind = 'function';
      else kind = 'plain';
      significant(kind, ident);
      i += ident.length;
      continue;
    }
    if (/[{}[\]();,.]/.test(ch)) {
      significant('punctuation', ch);
      i += 1;
      continue;
    }
    const operator = matchAt(OPERATOR, source, i);
    if (operator) {
      significant('operator', operator);
      i += operator.length;
      continue;
    }
    push('plain', ch);
    i += 1;
  }
  return tokens;
}

/**
 * Split `source` into lines of tokens. `language` picks the grammar
 * (`js`/`jsx`/`ts`/`tsx` and their long names); anything else comes back as
 * plain lines. `highlight` names identifiers to paint as class names wherever
 * they appear.
 */
export function tokenizeCode(
  source: string,
  language: CodeLanguage | undefined,
  highlight: ReadonlyArray<string> = [],
): CodeToken[][] {
  if (!isHighlightedLanguage(language)) {
    return source.split('\n').map((line) => (line ? [{ kind: 'plain' as const, text: line }] : []));
  }
  return toLines(tokenizeScript(source, new Set(highlight)));
}
