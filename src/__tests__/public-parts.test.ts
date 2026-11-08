/** @jest-environment node */
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { derivePublicParts } from './support/public-parts';
import {
  PART_CLASSIFICATIONS,
  partClassificationKeys,
  renderPublicPartCensus,
} from './support/public-part-report';
import { REPO_ROOT } from './support/adoption-matrix';

it('resolves actual parts, aliases, namespaces, factories, platform sources and subset props', () => {
  mkdirSync(join(REPO_ROOT, '.local'), { recursive: true });
  const root = mkdtempSync(join(REPO_ROOT, '.local/public-parts-fixture-'));
  mkdirSync(join(root, 'src'));
  const write = (path: string, text: string) => writeFileSync(join(root, path), text);
  try {
    write(
      'package.json',
      JSON.stringify({
        exports: {
          '.': {
            'react-native': { default: './src/index.ts' },
            browser: { types: './lib/typescript/module/index.web.d.ts' },
          },
          './glyphs/*': { 'react-native': { default: './src/glyphs/*.tsx' } },
        },
      }),
    );
    mkdirSync(join(root, 'src/glyphs'));
    write('src/glyphs/Foo.tsx', 'export const Glyph = () => null;');
    write(
      'src/parts.tsx',
      `import {memo, forwardRef, Component} from 'react';
      type Size = Extract<'xs'|'sm'|'md'|'lg','sm'|'lg'>;
      export const Primary = memo((_props: {size?:Size}) => null);
      export const Forward = forwardRef<HTMLDivElement,{size?:'xs'|'md'}>(() => null);
      function factory(){return {Trigger: (_props:{size?:Size}) => null};}
      export const {Trigger} = factory();
      export class ClassPart extends Component<{size?:Size}>{ render(){ return null; } }
      export type TypeOnly = {size:Size};
      export const CONSTANT = 4;
      export function lowerPart(){return <div/>;}
      export function useFeature(){return 'sm';}
      export default function DefaultPart(){return null;}`,
    );
    write('src/split.tsx', 'export const Split = (_props:{size?:"sm"}) => null;');
    write('src/split.web.tsx', 'export const Split = (_props:{size?:"lg"}) => null;');
    write('src/only.tsx', 'export const Hidden = () => null;');
    write('src/type-star.ts', "export type * from './only';");
    write('src/web.tsx', 'export const WebPart = (_props:{size?:"md"}) => null;');
    write(
      'src/index.ts',
      `export * from './split'; export * from './type-star'; export type {Primary as TypeAlias} from './parts'; export {type Forward as TypeForward} from './parts'; export * from './parts'; export {Primary as Alias, Primary as tiny, Primary as _Primary, default} from './parts'; export * as Compound from './parts';`,
    );
    write(
      'src/index.web.ts',
      `export * from './split'; export * from './type-star'; export type {Primary as TypeAlias} from './parts'; export {type Forward as TypeForward} from './parts'; export * from './parts'; export {Primary as Alias, Primary as tiny, Primary as _Primary, default} from './parts'; export * as Compound from './parts'; export {WebPart} from './web';`,
    );
    const census = derivePublicParts(root);
    expect(census.unresolved).toEqual([]);
    const split = census.parts.find((part) => part.id.endsWith('#Split'))!;
    expect(split.declarations).toEqual(['src/split.tsx', 'src/split.web.tsx']);
    expect(split.props['native:size']?.literals).toEqual(['sm']);
    expect(split.props['web:size']?.literals).toEqual(['lg']);
    expect(census.parts.find((part) => part.id.endsWith('#Glyph'))?.routes).toContain(
      'native:./glyphs/Foo#Glyph',
    );
    const primary = census.parts.find((part) => part.id.endsWith('#Primary'))!;
    expect(primary.names).toEqual(['Alias', 'Compound.Primary', 'Primary', '_Primary', 'tiny']);
    expect(primary.props['native:size']?.literals).toEqual(['lg', 'sm']);
    expect(primary.props['web:size']?.literals).toEqual(['lg', 'sm']);
    expect(census.parts.map((part) => part.id.split('#')[1]).sort()).toEqual([
      'ClassPart',
      'Forward',
      'Glyph',
      'Primary',
      'Split',
      'Trigger',
      'WebPart',
      'default',
      'lowerPart',
    ]);
    expect(census.parts.find((part) => part.id.endsWith('#WebPart'))?.platforms).toEqual(['web']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}, 120_000);

const census = derivePublicParts();
it('classifies every resolved public identity exactly once, without stale exemptions', () => {
  expect(census.unresolved).toEqual([]);
  const keys = partClassificationKeys();
  expect(new Set(keys).size).toBe(keys.length);
  expect(keys).toEqual(census.parts.map((part) => part.id).sort());
  for (const group of Object.values(PART_CLASSIFICATIONS)) {
    expect(group.reason.length).toBeGreaterThan(40);
    expect(group.verification.length).toBeGreaterThan(20);
    if (group.status !== 'pending') expect(group.evidence.length).toBeGreaterThan(0);
    for (const file of group.evidence) expect(existsSync(join(REPO_ROOT, file))).toBe(true);
  }
});
it('keeps generated route/type/classification evidence identical to the current exported surface', () => {
  expect(readFileSync(join(REPO_ROOT, 'docs/public-parts.mdx'), 'utf8')).toBe(
    renderPublicPartCensus(census),
  );
});
it('resolves subset aliases for the named audit subjects without treating vocabulary as adoption', () => {
  for (const [name, expected] of [
    ['PresenceDot', ['lg', 'md', 'sm']],
    ['UnreadBadge', ['md', 'sm']],
    ['EnergyBadge', ['md', 'sm']],
    ['AudioWaveVisualizer', ['lg', 'md', 'sm']],
    ['Markdown', ['lg', 'md', 'sm']],
    ['CodeLines', ['md', 'sm']],
  ] as const) {
    const part = census.parts.find((row) => row.names.includes(name));
    expect(part?.props['native:size']?.literals).toEqual(expected);
    expect(part?.props['web:size']?.literals).toEqual(expected);
  }
});
