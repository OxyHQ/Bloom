// The words Bloom's lexer reads as keywords (`bloom_lang::KEYWORDS`) and its 2.0 contextual
// keywords (`bloom_lang::CONTEXTUAL_KEYWORDS`), read from crates/lang/src/lexer.rs: a word the
// compiler gains fails the tests of every highlighter (TextMate and Shiki here, highlight.js and
// Prism beside it) until its grammar marks it.
import { readFileSync } from 'node:fs';

const lexer = readFileSync(
  new URL('../../bloom-language-compiler/crates/lang/src/lexer.rs', import.meta.url),
  'utf8',
);

/** The strings of the lexer's `pub const <name>: &[&str] = &[…];`, or null when it has none. */
function lexerList(name) {
  const list = new RegExp(`pub const ${name}: &\\[&str\\] = &\\[([^\\]]*)\\];`).exec(lexer);
  return list ? [...list[1].matchAll(/"([^"]+)"/g)].map((word) => word[1]) : null;
}

export const KEYWORDS = lexerList('KEYWORDS');
if (!KEYWORDS?.length) throw new Error('crates/lang/src/lexer.rs has no KEYWORDS list');

// The lexer's list once it has one; until then, the list as the 2.0 lexer writes it.
export const CONTEXTUAL_KEYWORDS = lexerList('CONTEXTUAL_KEYWORDS') ?? [
  'actor',
  'any',
  'break',
  'catch',
  'class',
  'continue',
  'do',
  'extension',
  'fileprivate',
  'final',
  'func',
  'guard',
  'init',
  'internal',
  'private',
  'protocol',
  'public',
  'rethrows',
  'self',
  'some',
  'static',
  'switch',
  'throw',
  'throws',
  'try',
];

/** Every word a grammar must mark as a keyword (or as the literal or `self` it is). */
export const ALL_KEYWORDS = [...new Set([...KEYWORDS, ...CONTEXTUAL_KEYWORDS])].sort();
