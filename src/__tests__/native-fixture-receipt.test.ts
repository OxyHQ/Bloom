/** @jest-environment node */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

it('hashes the local native fixture when Bloom source comes from another checkout', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'bloom-fixture-receipt-'));
  try {
    const fixture = join(temporary, 'fixture');
    const source = join(temporary, 'source');
    mkdirSync(fixture, { recursive: true });
    mkdirSync(join(source, 'src/app-shell'), { recursive: true });
    mkdirSync(join(source, 'scripts/panel-groups-native'), { recursive: true });
    writeFileSync(join(source, 'src/app-shell/AppShellPanelLayout.tsx'), 'selected Bloom renderer');
    writeFileSync(
      join(source, 'scripts/panel-groups-native/PanelSessionLab.tsx'),
      'uncompiled other fixture',
    );
    for (const name of [
      'PanelSessionLab.tsx',
      'DetailDialogLab.tsx',
      'PanelGroupsLab.tsx',
      'index.js',
      'app.config.js',
      'babel.config.js',
      'metro.config.js',
      'global.css',
    ]) {
      writeFileSync(join(fixture, name), `actual local ${name}`);
    }
    writeFileSync(
      join(fixture, 'prepare.mjs'),
      readFileSync(resolve('scripts/panel-groups-native/prepare.mjs')),
    );
    execFileSync(process.execPath, [join(fixture, 'prepare.mjs')], {
      env: { ...process.env, BLOOM_SOURCE_ROOT: source },
      stdio: 'pipe',
    });
    const receipt = JSON.parse(readFileSync(join(fixture, 'build.json'), 'utf8'));
    expect(receipt.fixtureRoot).toBe(fixture);
    expect(receipt.sourceRoot).toBe(source);
    expect(receipt.files['fixture/PanelSessionLab.tsx']).toBe(
      createHash('sha256').update('actual local PanelSessionLab.tsx').digest('hex'),
    );
    expect(receipt.files['src/app-shell/AppShellPanelLayout.tsx']).toBe(
      createHash('sha256').update('selected Bloom renderer').digest('hex'),
    );
    expect(receipt.files['scripts/panel-groups-native/PanelSessionLab.tsx']).toBeUndefined();
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
