/**
 * The type-scale tokens resolve to the intended line-height on NATIVE.
 *
 * Runs the consumer's real native pipeline over the shipped
 * `design-tokens/theme.css`: Tailwind v4 (`@tailwindcss/node`) emits
 * `.text-body { line-height: var(--tw-leading, var(--text-body--line-height)) }`,
 * react-native-css's compiler turns that into a native style descriptor, and
 * react-native-css's own `Text` resolves it at render time.
 *
 * The runtime `lineHeight` resolver multiplies ANY number by the font-size (it
 * cannot tell a px number from a unitless ratio once `var()` has inlined it).
 * With the old px tokens `text-body` rendered `{ fontSize: 15, lineHeight: 330 }`
 * on Android — 22 × 15 — which blew every text row in a className-styled screen
 * up to ~15× its height. Tailwind's own scale (`text-sm`) was never affected
 * because its token is a unitless `calc(1.25 / 0.875)`; Bloom's now takes the
 * same form.
 *
 * lightningcss is pinned to 1.30.1 in `package.json#overrides` for the same
 * reason every Oxy app pins it: react-native-css 3.0.x cannot deserialize
 * lightningcss 1.32's AST ("expected an object-like struct named Specifier").
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { render } from '@testing-library/react-native';

import { TYPOGRAPHY, type TypeRoleName } from '../design-tokens/scales';

// react-native-css's built files, addressed by path: the package `exports`
// hide them, and Jest applies neither Metro's `.native.js` platform extension
// nor exceptions to the repo-wide mapper on its own.
const RN_CSS_DIST = join(
  __dirname,
  '..',
  '..',
  'node_modules',
  'react-native-css',
  'dist',
  'commonjs',
);

// The package root re-exports `./runtime`, which Metro resolves to
// `runtime.native.js` on a device and Jest resolves to the WEB runtime (which
// only forwards `className`). Pin the native one.
jest.mock('react-native-css', () => jest.requireActual(join(RN_CSS_DIST, 'runtime.native.js')));

// The repo-wide mapper points `react-native-css/native-internal` at an inert
// in-memory mock (for BloomThemeProvider suites). This suite needs the REAL
// runtime, whose root-variable families live there.
jest.mock('react-native-css/native-internal', () =>
  jest.requireActual(join(RN_CSS_DIST, 'native-internal', 'index.js')),
);

// The repo's react-native mock (mapped) plus the one native the
// react-native-css runtime touches at import time.
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  PlatformColor: (...names: string[]) => ({ semantic: names }),
}));

const ROLES =Object.keys(TYPOGRAPHY) as TypeRoleName[];

async function buildTailwindCss(candidates: string[]): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { compile } = require('@tailwindcss/node') as typeof import('@tailwindcss/node');
  const themeCss = readFileSync(join(__dirname, '..', 'design-tokens', 'theme.css'), 'utf8');
  const input = [
    '@import "tailwindcss/theme.css" layer(theme);',
    '@import "tailwindcss/utilities.css" layer(utilities);',
    themeCss,
  ].join('\n');
  const compiler = await compile(input, {
    base: join(__dirname, '..', '..'),
    onDependency: () => {},
  });
  return compiler.build(candidates);
}

function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.map(flattenStyle));
  }
  return (style as Record<string, unknown> | null | undefined) ?? {};
}

describe('type-scale line-height on native (Tailwind v4 → react-native-css)', () => {
  let resolved: Record<string, Record<string, unknown>>;

  beforeAll(async () => {
    const candidates = [...ROLES.map((role) => `text-${role}`), 'text-sm'];
    const css = await buildTailwindCss(candidates);

    /* eslint-disable @typescript-eslint/no-require-imports */
    const { compile } = require('react-native-css/compiler') as typeof import('react-native-css/compiler');
    const { StyleCollection } = require('react-native-css/native') as {
      StyleCollection: { inject(stylesheet: unknown): void };
    };
    const { Text } = require('react-native-css/components/Text') as {
      Text: React.ComponentType<{ className: string; testID: string; children: string }>;
    };
    /* eslint-enable @typescript-eslint/no-require-imports */

    StyleCollection.inject(compile(css, {}).stylesheet());

    const screen = render(
      <>
        {candidates.map((className) => (
          <Text key={className} className={className} testID={className}>
            Aa
          </Text>
        ))}
      </>,
    );

    resolved = {};
    for (const className of candidates) {
      resolved[className] = flattenStyle(screen.getByTestId(className).props.style);
    }
  });

  it.each(ROLES)('text-%s renders its px line-height, not line-height × font-size', (role) => {
    const { size, lineHeight } = TYPOGRAPHY[role];
    expect(resolved[`text-${role}`]).toEqual(
      expect.objectContaining({ fontSize: size, lineHeight }),
    );
  });

  it('agrees with Tailwind’s own scale, which was never affected (control)', () => {
    const style = resolved['text-sm']!;
    expect(style.fontSize).toEqual(expect.any(Number));
    // Tailwind's text-sm is 1.25 / 0.875 of its font-size.
    expect(style.lineHeight).toBeCloseTo(((style.fontSize as number) * 1.25) / 0.875, 1);
  });
});
