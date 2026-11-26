/**
 * The React Compiler's lint (eslint-plugin-react-hooks 7: `refs`,
 * `preserve-manual-memoization`…) told what the language's views are. It reads
 * source as written, where a view's constructor and its modifiers are calls it
 * knows nothing of: it assumes a call may run a handler it is given while
 * rendering (`.onPress(() => ref.current?.focus())` is a ref read in render)
 * and may mutate an argument (a memoised value handed to `CallScreen(title, …)`
 * breaks the memoisation). A view is data, as a JSX element is: its
 * constructor and every modifier keep their arguments without calling or
 * mutating them, as JSX keeps its props. This gives the compiler that type
 * for every constructor the language's entries export
 * (`spec/entries.generated.json`), so the lint reads a chain as it reads JSX.
 * A ref read in render (`Text(String(ref.current))`) is still one.
 *
 *   // eslint.config.js
 *   const { withLanguageTypes } = require('@oxy.so/bloom-language-compiler/eslint');
 *   const reactHooks = withLanguageTypes(require('eslint-plugin-react-hooks'));
 *   // plugins: { 'react-hooks': reactHooks }, rules as before
 *
 * ESLint takes no function in a rule's options (it clones them), so the type
 * is handed to each rule as it runs: the plugin's own rules, the same names,
 * with the compiler's options carrying it (`environment.moduleTypeProvider`).
 */
const { readFileSync } = require('node:fs');
const path = require('node:path');

const LANGUAGE_MODULE = '@oxy.so/bloom-language';

/** How deep a chain of modifiers keeps the view's type (a chain longer than this is read as any call). */
const CHAIN_DEPTH = 32;

// As JSX does with its props: each argument is frozen, and the view is a new frozen value.
const KEEPS_ITS_ARGUMENTS = {
  receiver: '@receiver',
  params: [],
  rest: '@rest',
  returns: '@returns',
  temporaries: [],
  effects: [
    { kind: 'Freeze', value: '@rest', reason: 'jsx-captured' },
    { kind: 'Create', into: '@returns', value: 'frozen', reason: 'jsx-captured' },
  ],
};

/** A constructor or a modifier: it keeps its arguments and returns a view. */
function viewCall(depth) {
  return {
    kind: 'function',
    positionalParams: [],
    restParam: 'freeze',
    calleeEffect: 'read',
    returnType:
      depth === 0
        ? { kind: 'type', name: 'Any' }
        : { kind: 'object', properties: { '*': viewCall(depth - 1) } },
    returnValueKind: 'frozen',
    noAlias: true,
    aliasing: KEEPS_ITS_ARGUMENTS,
  };
}

/** Each of the language's entries, as a module whose constructors (`Text`, `Rating`…) make views. */
function languageModules(languagePackage) {
  const { entries } = JSON.parse(
    readFileSync(path.join(languagePackage, 'spec/entries.generated.json'), 'utf8'),
  );
  const view = viewCall(CHAIN_DEPTH);
  return new Map(
    Object.entries(entries).map(([entry, names]) => [
      entry === '.' ? LANGUAGE_MODULE : `${LANGUAGE_MODULE}/${entry}`,
      {
        kind: 'object',
        properties: Object.fromEntries(
          names.filter((name) => /^[A-Z]/.test(name)).map((name) => [name, view]),
        ),
      },
    ]),
  );
}

/**
 * The React Compiler's `environment` with the language's types
 * (`moduleTypeProvider`), for the compiler's own options. `languagePackage` is
 * the installed `@oxy.so/bloom-language` (found from the working directory by
 * default).
 */
function languageEnvironment(
  languagePackage = path.dirname(
    require.resolve(`${LANGUAGE_MODULE}/package.json`, { paths: [process.cwd(), __dirname] }),
  ),
) {
  const modules = languageModules(languagePackage);
  const constructors = [...modules.values()].flatMap((module) => Object.keys(module.properties));
  return {
    moduleTypeProvider: (name) => modules.get(name) ?? null,
    // A constructor is called, not rendered as a component (`capitalized-calls`).
    validateNoCapitalizedCalls: constructors,
  };
}

/** The plugin's two rules that do not run the compiler, and take options of their own. */
const NOT_THE_COMPILER = new Set(['rules-of-hooks', 'exhaustive-deps']);

/**
 * `reactHooks` (eslint-plugin-react-hooks 7) with each of its compiler rules
 * run with the language's types, over any compiler options the app gives the
 * rule; `rules-of-hooks` and `exhaustive-deps` are as they are.
 */
function withLanguageTypes(reactHooks, languagePackage) {
  const environment = languageEnvironment(languagePackage);
  const rules = Object.fromEntries(
    Object.entries(reactHooks.rules).map(([name, rule]) => [
      name,
      NOT_THE_COMPILER.has(name)
        ? rule
        : {
            ...rule,
            create(context) {
              const own = context.options[0] ?? {};
              const allowed = own.environment?.validateNoCapitalizedCalls ?? [];
              const options = [
                {
                  ...own,
                  environment: {
                    ...own.environment,
                    ...environment,
                    validateNoCapitalizedCalls: [
                      ...allowed,
                      ...environment.validateNoCapitalizedCalls,
                    ],
                  },
                },
              ];
              return rule.create(Object.create(context, { options: { value: options } }));
            },
          },
    ]),
  );
  return { ...reactHooks, rules };
}

module.exports = { languageEnvironment, withLanguageTypes };
