// node --test test/: the registration as Shiki loads it, on both of Shiki's regex engines
// (Oniguruma's Wasm build, and the JavaScript one that pages without Wasm use), over every
// ```bloom and 2.0 ```swift block of the language spec, and the TextMate grammar's scope fixtures.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { createHighlighter } from 'shiki';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { failuresOf, fixtureNames, readFixture } from '../../bloom-vscode/test/scope-fixtures.mjs';
import bloom from '../index.js';

const root = new URL('..', import.meta.url).pathname;
const spec = readFileSync(join(root, '../../docs/bloom-lang-spec.mdx'), 'utf8');
const blocks = [...spec.matchAll(/^```(bloom|swift)\n([\s\S]*?)^```$/gm)].map((m) => m[2]);

test('the JSON file and the module are the same registration', () => {
  const json = JSON.parse(readFileSync(join(root, 'bloom.tmLanguage.json'), 'utf8'));
  assert.deepEqual(json, bloom);
  assert.equal(bloom.name, 'bloom');
  assert.equal(bloom.displayName, 'Bloom');
  assert.equal(bloom.scopeName, 'source.bloom');
});

for (const [engineName, engine] of [
  ['Oniguruma', undefined],
  ['JavaScript', createJavaScriptRegexEngine()],
]) {
  test(`Shiki (${engineName} engine) highlights every spec example`, async () => {
    const highlighter = await createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: [bloom],
      ...(engine ? { engine } : {}),
    });
    assert.ok(highlighter.getLoadedLanguages().includes('bloom'));
    assert.ok(blocks.length >= 9, `the spec has ${blocks.length} bloom/swift blocks`);
    for (const code of blocks) {
      const { tokens } = highlighter.codeToTokens(code, {
        lang: 'bloom',
        theme: 'github-dark',
        includeExplanation: true,
      });
      for (const token of tokens.flat()) {
        const scopes = token.explanation.flatMap((part) => part.scopes.map((s) => s.scopeName));
        assert.ok(!scopes.some((s) => s.startsWith('invalid.')), `invalid: ${token.content}`);
      }
    }

    // A 2.0 example, colour by colour: keywords, types, strings and interpolation differ.
    const code =
      'public func badge(_ count: Int) async throws -> String { "\\(title) (\\(count))" }';
    const { tokens } = highlighter.codeToTokens(code, { lang: 'bloom', theme: 'github-dark' });
    const color = (text) => tokens.flat().find((t) => t.content.trim() === text)?.color;
    assert.equal(color('public'), color('func'));
    assert.equal(color('func'), color('throws'));
    assert.notEqual(color('func'), color('badge'));
    assert.notEqual(color('func'), color('Int'));
    assert.notEqual(color('"'), color('title'));

    const html = highlighter.codeToHtml('@State private var n = 0', {
      lang: 'bloom',
      themes: { light: 'github-light', dark: 'github-dark' },
    });
    assert.match(html, /class="shiki shiki-themes github-light github-dark"/);
    assert.match(html, /<span style="[^"]*">@State<\/span>/);
    highlighter.dispose();
  });
}

// The TextMate grammar's scope fixtures (packages/bloom-vscode/test/fixtures), asserted through
// Shiki as they are through vscode-textmate: a regex the JavaScript engine reads differently from
// Oniguruma fails here.
for (const [engineName, engine] of [
  ['Oniguruma', undefined],
  ['JavaScript', createJavaScriptRegexEngine()],
]) {
  test(`Shiki (${engineName} engine) gives every scope the fixtures assert`, async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: [bloom],
      ...(engine ? { engine } : {}),
    });
    const failures = [];
    for (const name of fixtureNames()) {
      const fixture = readFixture(name);
      const { tokens } = highlighter.codeToTokens(
        fixture.code.map((line) => line.text).join('\n'),
        {
          lang: 'bloom',
          theme: 'github-dark',
          includeExplanation: true,
        },
      );
      const columns = tokens.map((line, index) => {
        const scopes = [];
        for (const token of line)
          for (const part of token.explanation)
            for (const _ of part.content) scopes.push(part.scopes.map((s) => s.scopeName));
        assert.equal(scopes.length, fixture.code[index].text.length, `${name}: line ${index + 1}`);
        return scopes;
      });
      failures.push(...failuresOf(name, fixture, columns));
    }
    highlighter.dispose();
    assert.deepEqual(failures, []);
  });
}
