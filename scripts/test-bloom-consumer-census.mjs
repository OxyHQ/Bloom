import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('./audit-bloom-consumers.mjs', import.meta.url));
test('keeps remote source, dirty manifests and per-workspace installed artifacts distinct', () => {
  const root = mkdtempSync(join(tmpdir(), 'bloom-consumers-census-'));
  const repo = join(root, 'Consumer');
  function write(path, data) {
    const target = join(repo, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, typeof data === 'string' ? data : JSON.stringify(data));
  }
  function git(...args) {
    return execFileSync('git', ['-C', repo, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  }
  try {
    mkdirSync(repo);
    git('init', '--quiet');
    write('package.json', {
      name: 'consumer',
      workspaces: { catalog: { '@oxy.so/bloom': '1.2.3' } },
      dependencies: { '@oxy.so/bloom': 'catalog:' },
    });
    write('app/package.json', { name: 'app', dependencies: { '@oxy.so/bloom': '1.2.3' } });
    write('app/Screen.tsx', 'import { Screen } from "@oxy.so/bloom/screen";');
    write('bun.lock', '{"packages":{"@oxy.so/bloom":["@oxy.so/bloom@1.2.3"]}}');
    write('bun.lockb', 'binary fixture');
    write('docs/audits/old/package.json', {
      name: 'historical',
      dependencies: { '@oxy.so/bloom': '0.1.0' },
    });
    git('add', '.');
    git(
      '-c',
      'user.name=Fixture',
      '-c',
      'user.email=fixture@example.invalid',
      'commit',
      '--quiet',
      '-m',
      'source',
    );
    const sha = git('rev-parse', 'HEAD');
    git('update-ref', 'refs/remotes/origin/main', sha);
    git('symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/main');
    write('app/package.json', { name: 'app', dependencies: { '@oxy.so/bloom': '9.9.9' } });
    write('node_modules/@oxy.so/bloom/package.json', { version: '1.0.0' });
    write('app/node_modules/@oxy.so/bloom/package.json', { version: '2.0.0' });
    const report = JSON.parse(execFileSync(process.execPath, [script, root], { encoding: 'utf8' }));
    const result = report.repositories[0];
    assert.equal(result.packages.length, 2);
    assert.equal(result.sha, sha);
    assert.equal(result.fetch, 'not requested; ref may be stale');
    const app = result.packages.find((item) => item.name === 'app');
    const parent = result.packages.find((item) => item.name === 'consumer');
    assert.equal(app.declarations.dependencies, '1.2.3');
    assert.equal(app.localDeclaration.dependencies, '9.9.9');
    assert.equal(app.installed.version, '2.0.0');
    assert.equal(parent.installed.version, '1.0.0');
    assert.equal(parent.catalog, '1.2.3');
    assert.deepEqual(result.locks.find((item) => item.path === 'bun.lock').versions, ['1.2.3']);
    assert.equal(
      result.locks.find((item) => item.path === 'bun.lockb').status,
      'binary lock: not decoded',
    );
    assert.deepEqual(result.ownershipCandidates, ['app/Screen.tsx']);
    assert.equal(result.distributedBinary, 'unknown');
    assert.equal(result.android, 'not run');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('refreshes a stale remote ref before discovering a new consumer', () => {
  const root = mkdtempSync(join(tmpdir(), 'bloom-consumers-remote-'));
  const remote = join(root, 'remote.git');
  const writer = join(root, '.writer');
  const consumer = join(root, 'Consumer');
  const run = (...args) =>
    execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  try {
    run('init', '--bare', '--initial-branch=main', remote);
    run('clone', remote, writer);
    mkdirSync(join(writer, 'docs/audits/old'), { recursive: true });
    writeFileSync(join(writer, 'package.json'), '{"name":"consumer"}');
    writeFileSync(
      join(writer, 'docs/audits/old/package.json'),
      '{"dependencies":{"@oxy.so/bloom":"0.1.0"}}',
    );
    run('-C', writer, 'add', '.');
    run(
      '-C',
      writer,
      '-c',
      'user.name=Fixture',
      '-c',
      'user.email=fixture@example.invalid',
      'commit',
      '-m',
      'before adoption',
    );
    run('-C', writer, 'push', 'origin', 'main');
    run('clone', remote, consumer);
    const stale = JSON.parse(execFileSync(process.execPath, [script, root], { encoding: 'utf8' }));
    assert.equal(stale.repositories.length, 0, 'historical manifests alone are not consumers');
    assert.equal(stale.skipped[0].fetch, 'not requested; ref may be stale');
    writeFileSync(
      join(writer, 'package.json'),
      '{"name":"consumer","dependencies":{"@oxy.so/bloom":"17.22.0"}}',
    );
    writeFileSync(join(writer, 'Screen.tsx'), 'import { Screen } from "@oxy.so/bloom/screen";');
    run('-C', writer, 'add', '.');
    run(
      '-C',
      writer,
      '-c',
      'user.name=Fixture',
      '-c',
      'user.email=fixture@example.invalid',
      'commit',
      '-m',
      'adopt Bloom',
    );
    run('-C', writer, 'push', 'origin', 'main');
    const expected = run('-C', writer, 'rev-parse', 'HEAD');
    const fresh = JSON.parse(
      execFileSync(process.execPath, [script, root, '--fetch'], { encoding: 'utf8' }),
    );
    assert.equal(fresh.repositories.length, 1);
    assert.equal(fresh.repositories[0].sha, expected);
    assert.equal(fresh.repositories[0].fetch, 'succeeded');
    assert.notEqual(fresh.repositories[0].checkoutSha, expected);
    assert.deepEqual(fresh.repositories[0].ownershipCandidates, ['Screen.tsx']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
