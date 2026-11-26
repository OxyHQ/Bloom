import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const PACKAGE = join(__dirname, '../..');

/** The renderer table a fresh module registry ends with, after loading `load`. */
function controlsAfter(load: () => void): (kind: string) => unknown {
  let controlOf: (kind: string) => unknown = () => undefined;
  jest.isolateModules(() => {
    load();
    controlOf = require('../controls/draw').controlOf;
  });
  return controlOf;
}

describe('the language’s entries', () => {
  it('the root draws no family until the family’s entry is imported', () => {
    const root = controlsAfter(() => require('../index'));
    expect(root('areaChartCard')).toBeUndefined();
    expect(root('textField')).toBeUndefined();
    expect(root('list')).toBeUndefined();
    // Overlays: the renderer draws a view's presentations itself, so their family is the root's.
    expect(root('connectionStatus')).toBeDefined();

    const charts = controlsAfter(() => {
      require('../index');
      require('../entries/chart-cards');
    });
    expect(charts('areaChartCard')).toBeDefined();
    expect(charts('textField')).toBeUndefined();
  });

  it('the exports map, the entry table, the compiler’s modules and the suites’ barrel are current', () => {
    const script = join(PACKAGE, 'scripts/generate-entries.mjs');
    expect(() =>
      execFileSync(process.execPath, [script, '--check'], { stdio: 'pipe' }),
    ).not.toThrow();
  });
});
