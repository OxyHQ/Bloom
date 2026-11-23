// node --test test/doc-links.test.cjs: every docs link the compiler, its
// adapters and the runtime's development messages can print is a heading of
// the docs page it names.
//
// A page that is not in docs/ yet is skipped with a message (the reference is
// generated and the tour written on another branch); a page that exists and
// lacks an anchor fails.
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { docLinks } = require('../js/native');

const REPO = path.join(__dirname, '..', '..', '..');
const DOCS_BASE = 'https://github.com/OxyHQ/Bloom/blob/main/docs/';
/** A link written in source: `bloom-language-<page>.mdx#<anchor>`, with or without the base. */
const WRITTEN = /\b(bloom-language-[a-z-]+\.mdx)#([\w-]+)/g;

/** Every file under `dir` with one of `extensions`, past folders `skip` names. */
function files(dir, extensions, skip) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return skip.includes(entry.name) ? [] : files(full, extensions, skip);
    return extensions.includes(path.extname(entry.name)) ? [full] : [];
  });
}

/** page → (anchor → where it is emitted). */
function emitted() {
  const pages = new Map();
  const add = (page, anchor, from) => {
    if (!pages.has(page)) pages.set(page, new Map());
    const anchors = pages.get(page);
    if (!anchors.has(anchor)) anchors.set(anchor, from);
  };
  for (const url of docLinks()) {
    assert.ok(url.startsWith(DOCS_BASE), `${url} points into the docs folder`);
    const [page, anchor] = url.slice(DOCS_BASE.length).split('#');
    add(page, anchor, 'the compiler');
  }
  const sources = [
    ...files(path.join(__dirname, '..', 'js'), ['.js'], []),
    ...files(
      path.join(REPO, 'packages', 'bloom-language', 'src'),
      ['.ts', '.tsx'],
      ['__tests__', 'generated'],
    ),
  ];
  for (const file of sources) {
    for (const [, page, anchor] of fs.readFileSync(file, 'utf8').matchAll(WRITTEN)) {
      add(page, anchor, path.relative(REPO, file));
    }
  }
  return pages;
}

/**
 * GitHub's heading anchors: lowercase; drop everything but letters, digits,
 * spaces, `-` and `_`; spaces to `-`; a repeated slug gets `-1`, `-2`…
 */
function anchors(markdown) {
  const found = new Set();
  const seen = new Map();
  let fenced = false;
  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    const heading = !fenced && /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    if (!heading) continue;
    const slug = heading[1]
      .toLowerCase()
      .replace(/[^\p{L}\p{N} _-]/gu, '')
      .replace(/ /g, '-');
    const count = seen.get(slug) ?? 0;
    seen.set(slug, count + 1);
    found.add(count === 0 ? slug : `${slug}-${count}`);
  }
  return found;
}

test('the slug rule matches GitHub', () => {
  const found = anchors(
    '# Liquid Glass rules\n## `childSpacing`\n```\n# not a heading\n```\n## Tokens\n## Tokens\n',
  );
  assert.deepEqual([...found], ['liquid-glass-rules', 'childspacing', 'tokens', 'tokens-1']);
});

for (const [page, wanted] of emitted()) {
  test(`every anchor linked into docs/${page} is a heading`, (t) => {
    const file = path.join(REPO, 'docs', page);
    if (!fs.existsSync(file)) {
      t.skip(
        `docs/${page} is not on this branch yet; its ${wanted.size} anchors are checked once it lands`,
      );
      return;
    }
    const headings = anchors(fs.readFileSync(file, 'utf8'));
    const missing = [...wanted].filter(([anchor]) => !headings.has(anchor));
    assert.deepEqual(
      missing.map(([anchor, from]) => `#${anchor} (from ${from})`),
      [],
      `docs/${page} has no heading for these anchors`,
    );
  });
}
