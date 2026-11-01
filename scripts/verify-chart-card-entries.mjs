// Verify the installed tarball rather than a source mirror. Run after `bun run build`.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scratch = mkdtempSync(join(tmpdir(), 'bloom-chart-consumer-'));
const consumer = join(scratch, 'consumer');
const modules = join(consumer, 'node_modules');
const names = ['bar-list', 'line', 'surface', 'header', 'stat-tiles'];
const run = (command, args, options = {}) =>
  execFileSync(command, args, {
    cwd: consumer,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    ...options,
  });

try {
  mkdirSync(join(modules, '@oxy.so'), { recursive: true });
  const pack = JSON.parse(
    execFileSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', scratch], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    }),
  )[0];
  const packedBloom = join(modules, '@oxy.so', 'bloom');
  mkdirSync(packedBloom);
  run('tar', ['-xzf', join(scratch, pack.filename), '--strip-components=1', '-C', packedBloom]);

  // The packed package remains distinct; peer dependencies come from this build's frozen install.
  for (const name of readdirSync(join(root, 'node_modules'))) {
    if (name === '@oxy.so' || name === '.bin') continue;
    symlinkSync(join(root, 'node_modules', name), join(modules, name), 'dir');
  }
  writeFileSync(join(consumer, 'package.json'), '{"name":"chart-entry-probe","private":true}\n');
  writeFileSync(
    join(consumer, 'probe.ts'),
    `import { BarListCard, type BarListCardProps, type BarListItem, type BarListTab } from '@oxy.so/bloom/chart-cards/bar-list';
import { LineChartCard, type LineChartCardProps, type LinePoint, type LineRange, type LineChartShape } from '@oxy.so/bloom/chart-cards/line';
import { ChartCardSurface, type ChartCardSurfaceProps } from '@oxy.so/bloom/chart-cards/surface';
import { ChartHeader, ChartHeadline, type ChartHeaderProps, type ChartHeadlineProps, type ChartDelta } from '@oxy.so/bloom/chart-cards/header';
import { ChartStatTiles, type ChartStatTile, type ChartStatTilesProps } from '@oxy.so/bloom/chart-cards/stat-tiles';
import * as all from '@oxy.so/bloom/chart-cards';
type Assert<T extends true> = T;
type NonAny<T> = 0 extends (1 & T) ? false : true;
type Check = [Assert<NonAny<BarListCardProps>>, Assert<NonAny<BarListItem>>, Assert<NonAny<BarListTab>>,
  Assert<NonAny<LineChartCardProps>>, Assert<NonAny<LinePoint>>, Assert<NonAny<LineRange>>, Assert<NonAny<LineChartShape>>,
  Assert<NonAny<ChartCardSurfaceProps>>, Assert<NonAny<ChartHeaderProps>>, Assert<NonAny<ChartHeadlineProps>>,
  Assert<NonAny<ChartDelta>>, Assert<NonAny<ChartStatTile>>, Assert<NonAny<ChartStatTilesProps>>];
const components: [typeof all.BarListCard, typeof all.LineChartCard, typeof all.ChartCardSurface,
  typeof all.ChartHeader, typeof all.ChartHeadline, typeof all.ChartStatTiles] =
  [BarListCard, LineChartCard, ChartCardSurface, ChartHeader, ChartHeadline, ChartStatTiles];
export type { Check }; export { components };
`,
  );
  const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  for (const [label, module, moduleResolution, customConditions] of [
    ['legacy', 'commonjs', 'node', []],
    ['node16', 'node16', 'node16', []],
    ['web', 'esnext', 'bundler', []],
    ['react-native', 'esnext', 'bundler', ['react-native']],
  ]) {
    writeFileSync(
      join(consumer, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          module,
          moduleResolution,
          ...(customConditions.length ? { customConditions } : {}),
          noEmit: true,
          strict: true,
          skipLibCheck: true,
          target: 'ES2022',
          types: [],
        },
        files: ['probe.ts'],
      }),
    );
    const trace = run(process.execPath, [tsc, '-p', 'tsconfig.json', '--traceResolution']);
    for (const name of names) {
      if (!trace.includes(`/chart-cards/${name}.d.ts`)) {
        throw new Error(`${label} did not resolve the packaged ${name} declaration`);
      }
    }
    console.log(`[chart-consumer] ${label}: all focused declarations resolved`);
  }
  for (const [label, options, suffix] of [
    ['require', [], '/lib/commonjs/chart-cards/'],
    ['browser', ['--conditions=browser'], '/lib/module/chart-cards/'],
    ['react-native', ['--conditions=react-native'], '/src/chart-cards/'],
  ]) {
    for (const name of names) {
      const specifier = `@oxy.so/bloom/chart-cards/${name}`;
      const program =
        label === 'require'
          ? `console.log(require.resolve(${JSON.stringify(specifier)}))`
          : `console.log(import.meta.resolve(${JSON.stringify(specifier)}))`;
      const result = run(process.execPath, [
        ...options,
        ...(label === 'require' ? [] : ['--input-type=module']),
        '-e',
        program,
      ]);
      if (!result.includes(suffix + name + (label === 'react-native' ? '.ts' : '.js'))) {
        throw new Error(`${label} resolved ${specifier} to ${result.trim()}`);
      }
    }
    console.log(`[chart-consumer] ${label}: all focused runtime targets resolved`);
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
