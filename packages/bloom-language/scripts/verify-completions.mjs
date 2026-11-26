#!/usr/bin/env node
/**
 * What an editor completes inside a modifier's quotes: the TypeScript
 * language service's completions at `Button('Save').size('|')` and the like
 * must be exactly the spec's token set for that node, no more and no fewer.
 * It reads the package's own sources through its tsconfig, as an editor does.
 *
 * Run by the package's `typescript` script.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { tokenSetsOf, withoutComment } from './token-sets.mjs';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(packageRoot, 'package.json'));
const ts = require('typescript');
const spec = JSON.parse(readFileSync(join(packageRoot, 'spec/language.json'), 'utf8'));
const sets = tokenSetsOf(spec);
const nodes = withoutComment(spec.nodes);
const colors = [...sets.color, ...sets.color.flatMap((c) => sets.opacity.map((o) => `${c}/${o}`))];

/** `|` is the cursor; `expected` the completions it must offer. */
const CASES = [
  { code: "Button('Save').size('|')", expected: sets[nodes.button.size] },
  { code: "Button('Save').style('|')", expected: sets[nodes.button.style] },
  { code: "Button('Save').density('|')", expected: nodes.button.densities },
  { code: "Avatar('x').size('|')", expected: sets.avatarSize },
  { code: "HStack().spacing('|')", expected: sets.space },
  // The first argument is a padding or, in the two-argument overload, an edge.
  { code: "HStack().padding('|')", expected: [...sets.padding, ...sets.edge] },
  { code: "HStack().padding('horizontal', '|')", expected: sets.padding },
  { code: "Text('').font('|')", expected: sets.font },
  { code: "Text('').foreground('|')", expected: colors },
  { code: "VStack().glass(regular.tint('|'))", expected: sets.colorRole },
  // A navigation node and a product node: their own sets.
  { code: "Sidebar().size('|')", expected: sets[nodes.sidebar.size] },
  { code: "Sidebar().variant('|')", expected: sets.sidebarVariant },
  { code: "Lockup('Title').size('|')", expected: sets[nodes.lockup.size] },
  { code: "Lockup('Title').shape('|')", expected: sets[nodes.lockup.shape] },
];

const fixture = join(packageRoot, 'src/__completions__.ts');
const header =
  "import { Avatar, Button, HStack, Sidebar, Text, VStack, regular } from './index';\n" +
  "import { Lockup } from './entries/lockup';\n";
let text = header;
const cursors = [];
CASES.forEach(({ code }, index) => {
  const line = `export const _${index} = `;
  cursors.push(text.length + line.length + code.indexOf('|'));
  text += `${line}${code.replace('|', '')};\n`;
});
// `.glass(|)` takes a glass value, no string: its parameter is what an editor shows.
const glassAt = text.length + 'export const _glass = VStack().glass('.length;
text += 'export const _glass = VStack().glass();\n';

const config = ts.parseJsonConfigFileContent(
  ts.readConfigFile(join(packageRoot, 'tsconfig.json'), ts.sys.readFile).config,
  ts.sys,
  packageRoot,
);
const service = ts.createLanguageService(
  {
    getScriptFileNames: () => [fixture],
    getScriptVersion: () => '1',
    getScriptSnapshot: (file) => {
      if (file === fixture) return ts.ScriptSnapshot.fromString(text);
      const source = ts.sys.readFile(file);
      return source === undefined ? undefined : ts.ScriptSnapshot.fromString(source);
    },
    getCurrentDirectory: () => packageRoot,
    getCompilationSettings: () => config.options,
    getDefaultLibFileName: ts.getDefaultLibFilePath,
    fileExists: (file) => file === fixture || ts.sys.fileExists(file),
    readFile: (file) => (file === fixture ? text : ts.sys.readFile(file)),
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
  },
  ts.createDocumentRegistry(),
);

let failed = 0;
CASES.forEach(({ code, expected }, index) => {
  const completions = service.getCompletionsAtPosition(fixture, cursors[index], {});
  const offered = new Set(completions?.entries.map((entry) => entry.name) ?? []);
  const want = new Set(expected);
  const missing = [...want].filter((name) => !offered.has(name));
  const extra = [...offered].filter((name) => !want.has(name));
  if (missing.length > 0 || extra.length > 0) {
    failed += 1;
    console.error(
      `${code}: missing [${missing.slice(0, 10).join(', ')}], extra [${extra.slice(0, 10).join(', ')}]`,
    );
  }
});
const help = service.getSignatureHelpItems(fixture, glassAt, {});
const glassParam = help?.items[help.selectedItemIndex]?.parameters[0];
const glassText = glassParam?.displayParts.map((part) => part.text).join('');
if (glassText !== 'value?: GlassValue') {
  failed += 1;
  console.error(`VStack().glass(|): parameter is ${glassText}, not value?: GlassValue`);
}
if (failed > 0) process.exit(1);
console.log(`completions are each node's own tokens (${CASES.length + 1} cases)`);
