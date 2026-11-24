/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parseSync, transformSync, traverse } from '@babel/core';

/**
 * What the React Compiler makes of the components it must leave as written.
 *
 * bob builds lib/ with `babel.build.cjs`, which runs the React Compiler; Jest
 * runs src/ through ts-jest, which does not, so the suite cannot see what the
 * compiler changes. It keeps a value computed during render until that value's
 * inputs change, and it cannot see an input that changes without one:
 *
 * - an Avatar's resolver can return a refreshed URL for the same id (its own
 *   test, "retries when the same ID resolves to a different URI"), so the
 *   resolver is called on every render;
 * - a calendar's today, a tooltip's viewport and the loaded languages without
 *   a LocaleProvider are read while rendering;
 * - a skeleton shape reads the clock once per driver in a `useMemo`, which the
 *   compiler drops for a string result and recomputes on every render.
 *
 * And it moved a lambda inside a component built by a factory to module scope,
 * where the factory's parameter it used did not exist (`SelectItem is not
 * defined` from every SettingsSelect), so function outlining is off.
 *
 * Each case compiles the real source with the build's config, as bob does.
 */
const ROOT = join(__dirname, '..', '..');

/**
 * The build's React Compiler plugin and options, from `babel.build.cjs` itself.
 * bob's own preset is an ES module, which Jest's VM cannot load; the compiler
 * runs first on the TypeScript source either way, so its output is the same.
 */
const BUILD = require(join(ROOT, 'babel.build.cjs')) as { plugins: [string, object][] };
const COMPILER = BUILD.plugins.find(([name]) => name === 'babel-plugin-react-compiler');

function build(file: string): string {
  if (!COMPILER) throw new Error('babel.build.cjs does not run babel-plugin-react-compiler');
  const path = join(ROOT, 'src', file);
  const result = transformSync(readFileSync(path, 'utf8'), {
    filename: path,
    cwd: ROOT,
    babelrc: false,
    configFile: false,
    presets: [['@babel/preset-typescript', { isTSX: path.endsWith('.tsx'), allExtensions: true }]],
    plugins: [[require.resolve(COMPILER[0]), COMPILER[1]]],
  });
  return result?.code ?? '';
}

/** The compiled source of the function or `const` named `name`. */
function functionNamed(code: string, name: string): string {
  const ast = parseSync(code, {
    babelrc: false,
    configFile: false,
    sourceType: 'module',
    parserOpts: { plugins: ['jsx'] },
  });
  if (!ast) throw new Error('the compiled output does not parse');
  let found: string | undefined;
  traverse(ast, {
    Function(path) {
      const node = path.node;
      const id =
        'id' in node && node.id
          ? node.id.name
          : path.parentPath.isVariableDeclarator() && path.parentPath.node.id.type === 'Identifier'
            ? path.parentPath.node.id.name
            : undefined;
      if (id === name && found === undefined) found = code.slice(node.start ?? 0, node.end ?? 0);
    },
  });
  if (found === undefined) throw new Error(`${name} is not in the compiled output`);
  return found;
}

const MEMO_CACHE = /\b_c\d*\(\d+\)/;

describe('the React Compiler in the build', () => {
  it('compiles a component (the control: the cases below are not vacuous)', () => {
    expect(build('button/Button.tsx')).toMatch(MEMO_CACHE);
  });

  it.each([
    ['avatar/Avatar.tsx', 'useResolvedAvatarUri', 'imageResolver?.(sourceValue, variant)'],
    ['date-picker/Calendar.tsx', 'CalendarFrame', 'dayKey(today())'],
    ['tooltip/Tooltip.web.tsx', 'TooltipBubble', 'window.innerWidth'],
    ['locale/messages.ts', 'useMessages', 'getBloomTranslations()'],
    ['skeleton/Skeleton.tsx', 'useShapeMotion', 'useMemo('],
  ])('leaves %s %s as written, so it reads %s on every render', (file, name, read) => {
    const body = functionNamed(build(file), name);
    expect(body).toContain(read);
    expect(body).not.toMatch(MEMO_CACHE);
  });

  it('memoizes the Avatar itself', () => {
    expect(functionNamed(build('avatar/Avatar.tsx'), 'AvatarComponent')).toMatch(MEMO_CACHE);
  });

  it.each(['settings-modal/create-settings-select.tsx', 'select/SelectField.tsx'])(
    'keeps the lambdas of a component a factory builds in that factory (%s)',
    (file) => {
      const code = build(file);
      expect(code).toMatch(MEMO_CACHE);
      // Outlined lambdas are module-level `_temp` functions.
      expect(code).not.toMatch(/^function _temp/m);
    },
  );
});
