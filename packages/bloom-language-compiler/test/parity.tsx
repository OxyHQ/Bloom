import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement, type ReactElement } from 'react';
import TestRenderer, {
  act,
  type ReactTestRenderer,
  type ReactTestRendererJSON,
} from 'react-test-renderer';

import { DARK, LIGHT, PaintContext } from '../../bloom-language/src/__tests__/support/bloom-theme';

// The compiler's JS entry point (CommonJS, loading the native addon).
const { compileModule } = require('../js/compile') as {
  compileModule: (source: string, filename: string) => { code: string; hoisted: number } | null;
};

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const FIXTURES = join(__dirname, '../fixtures');

type Cases = Record<string, () => ReactElement>;
interface Fixture {
  cases: Cases;
  hoisted: number;
}

/**
 * Each fixture's compiled form, written beside it (`<name>.compiled.tsx`, git
 * ignored) so its relative imports resolve, and loaded through the same
 * transform as the original.
 */
function load(name: string): { interpreted: Fixture; compiled: Fixture; hoisted: number } {
  const path = join(FIXTURES, `${name}.tsx`);
  const output = compileModule(readFileSync(path, 'utf8'), path);
  const compiledPath = join(FIXTURES, `${name}.compiled.tsx`);
  writeFileSync(compiledPath, output?.code ?? readFileSync(path, 'utf8'));
  return {
    interpreted: require(path) as Fixture,
    compiled: require(compiledPath) as Fixture,
    hoisted: output?.hoisted ?? 0,
  };
}

/** A tree as committed, with functions named rather than compared by identity. */
function snapshot(renderer: ReactTestRenderer): unknown {
  return JSON.parse(
    JSON.stringify(renderer.toJSON() as ReactTestRendererJSON, (_key, value) =>
      typeof value === 'function' ? `[function ${value.name || 'anonymous'}]` : value,
    ),
  );
}

function mount(element: ReactElement, colors: Record<string, string>): ReactTestRenderer {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      createElement(PaintContext.Provider, { value: colors }, element),
    );
  });
  return renderer;
}

function update(
  renderer: ReactTestRenderer,
  element: ReactElement,
  colors: Record<string, string>,
) {
  act(() => renderer.update(createElement(PaintContext.Provider, { value: colors }, element)));
}

/**
 * Renders every case of every fixture both ways and compares the committed
 * trees: on mount, after a re-render with a fresh tree, and after a theme
 * switch. Any difference fails.
 */
export function describeParity(platform: string): void {
  const consoleError = console.error;
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      if (String(args[0]).includes('react-test-renderer is deprecated')) return;
      consoleError(...args);
    });
  });

  const names = readdirSync(FIXTURES)
    .filter((file) => file.endsWith('.tsx') && !file.endsWith('.compiled.tsx'))
    .map((file) => file.slice(0, -'.tsx'.length));

  it('has fixtures', () => expect(names.length).toBeGreaterThan(0));

  for (const name of names) {
    describe(`${name} (${platform})`, () => {
      const { interpreted, compiled, hoisted } = load(name);

      it(`the compiler hoists the ${interpreted.hoisted} static chains the fixture declares`, () => {
        expect(hoisted).toBe(interpreted.hoisted);
      });

      for (const [caseName, render] of Object.entries(interpreted.cases)) {
        it(`${caseName}: the same tree interpreted and compiled`, () => {
          const renderCompiled = compiled.cases[caseName] as () => ReactElement;
          const a = mount(render(), LIGHT);
          const b = mount(renderCompiled(), LIGHT);
          expect(snapshot(b)).toEqual(snapshot(a));
          update(a, render(), LIGHT);
          update(b, renderCompiled(), LIGHT);
          expect(snapshot(b)).toEqual(snapshot(a));
          update(a, render(), DARK);
          update(b, renderCompiled(), DARK);
          expect(snapshot(b)).toEqual(snapshot(a));
        });
      }
    });
  }
}
