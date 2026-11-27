// node --test test/eslint.test.cjs: the React Compiler's lint (eslint-plugin-react-hooks 7, its
// own rules, run on source as written) reads a chain as it reads JSX once it has the language's
// types (`js/eslint.js`): a handler that reads a ref, given to a modifier or in a constructor's
// options, and a memoised value given to a constructor, pass; a ref read while rendering is still one.
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { Linter } = require('eslint');
const reactHooks = require('eslint-plugin-react-hooks');

const { withLanguageTypes } = require('../js/eslint');

const LANGUAGE = path.join(__dirname, '../../bloom-language');
// Every compiler rule at error, as an app's config turns them on.
const COMPILER_RULES = Object.keys(reactHooks.rules).filter(
  (name) => name !== 'rules-of-hooks' && name !== 'exhaustive-deps',
);

/** The compiler rules' findings for `source` (JavaScript as written), through `plugin`. */
function lint(source, plugin = reactHooks) {
  return new Linter()
    .verify(
      source,
      [
        {
          files: ['**/*.js'],
          languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
          plugins: { 'react-hooks': plugin },
          rules: Object.fromEntries(COMPILER_RULES.map((name) => [`react-hooks/${name}`, 'error'])),
        },
      ],
      'screen.js',
    )
    .map(({ ruleId, message }) => `${ruleId}: ${message.split('\n')[0]}`);
}

const typed = withLanguageTypes(reactHooks, LANGUAGE);

const IMPORTS = `import { useCallback, useMemo, useRef } from 'react';
import { Button, HStack, Text, toElement } from '@oxy.so/bloom-language';
import { CallScreen } from '@oxy.so/bloom-language/call-ui';
import { MessageContextMenu } from '@oxy.so/bloom-language/chat-composer';
import { TextField } from '@oxy.so/bloom-language/inputs';
`;

const CASES = {
  'a handler that reads a ref, given to a modifier': [
    'refs',
    `export function Play() {
  const ref = useRef(null);
  return toElement(Button(Text('Play')).onPress(() => { ref.current?.play(); }));
}`,
  ],
  'a memoised handler that reads a ref, down a chain': [
    'refs',
    `export function Play() {
  const ref = useRef(null);
  const play = useCallback(() => ref.current?.play(), []);
  return toElement(HStack(Button(Text('Play')).onPress(play).padding('md')).padding('lg').onLongPress(play));
}`,
  ],
  'a handler that reads a ref, given to .onSubmit()': [
    'refs',
    `export function Search() {
  const ref = useRef(null);
  const submit = useCallback(() => ref.current?.blur(), []);
  return toElement(TextField(['', () => {}], 'Search').onSubmit(submit));
}`,
  ],
  'a handler that writes a ref, in a constructor’s options': [
    'refs',
    `export function Menu({ open }) {
  const ref = useRef(null);
  const onSelect = useCallback((id) => { ref.current = id; }, []);
  const options = { open, onSelect };
  return toElement(MessageContextMenu([], options));
}`,
  ],
  'a memoised value and what is derived from its inputs, given to a constructor': [
    'preserve-manual-memoization',
    `export function Call({ ids, t, person }) {
  const someone = t('someone');
  const title = ids.length === 0 ? someone : ids.map((id) => person(id) ?? someone).join(', ');
  const participants = useMemo(() => ids.map((id) => ({ id, name: person(id) ?? someone })), [ids, person, someone]);
  return toElement(HStack(CallScreen(title, { participants })));
}`,
  ],
};

for (const [name, [rule, body]] of Object.entries(CASES)) {
  test(`${name}: ${rule} as written, read as JSX with the language's types`, () => {
    const untyped = lint(IMPORTS + body);
    assert.ok(
      untyped.some((finding) => finding.startsWith(`react-hooks/${rule}:`)),
      untyped.join('\n'),
    );
    assert.deepEqual(lint(IMPORTS + body, typed), []);
  });
}

test('a ref read while rendering is still one', () => {
  const body = `export function Count() {
  const ref = useRef(0);
  return toElement(Text(String(ref.current)));
}`;
  const found = lint(IMPORTS + body, typed);
  assert.ok(
    found.some((finding) => finding.startsWith('react-hooks/refs:')),
    found.join('\n'),
  );
});
