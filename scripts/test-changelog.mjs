// node --test scripts/test-changelog.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, test } from 'node:test';

import { bumpVersion, check, plan, readFragments, release } from './changelog.mjs';

let root;
const write = (path, text) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
};
const read = (path) => readFileSync(join(root, path), 'utf8');
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
const fragment = (pkg, bump, section, body) =>
  `---\npackage: '${pkg}'\nbump: ${bump}\nsection: ${section}\n---\n\n${body}\n`;
const setVersion = (dir, version) => {
  const path = join(dir, 'package.json');
  write(path, json({ ...JSON.parse(read(path)), version }));
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'bloom-changelog-'));
  write(
    'package.json',
    json({ name: '@oxy.so/bloom', version: '23.9.1', workspaces: ['packages/*'] }),
  );
  write('CHANGELOG.md', '# Changelog\n\n## 23.9.1\n\n### Fixed\n\n- Old.\n');
  write(
    'packages/bloom-language/package.json',
    json({ name: '@oxy.so/bloom-language', version: '1.7.0' }),
  );
  write('packages/bloom-language/CHANGELOG.md', '# Changelog\n\n## 1.7.0\n\n### Added\n\n- Old.\n');
  write(
    'packages/no-changelog/package.json',
    json({ name: '@oxy.so/no-changelog', version: '1.0.0' }),
  );
  write(
    'packages/private/package.json',
    json({ name: 'bloom-private', version: '0.1.0', private: true }),
  );
  write(
    'packages/bloom-language/npm/linux/package.json',
    json({ name: '@oxy.so/platform', version: '1.7.0' }),
  );
  write('changes/README.md', '# Fragments\n');
  git('init', '-q');
  git('add', '-A');
  git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'base');
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

test('a bump moves the right part', () => {
  assert.equal(bumpVersion('23.9.1', 'patch'), '23.9.2');
  assert.equal(bumpVersion('23.9.1', 'minor'), '23.10.0');
  assert.equal(bumpVersion('0.5.0', 'major'), '1.0.0');
});

test('a fragment names a known package, a bump, a section and a list item', () => {
  write('changes/good.md', fragment('@oxy.so/bloom', 'minor', 'Added', '- Good.'));
  write(
    'changes/bad.md',
    '---\npackage: @oxy.so/nope\nbump: huge\nsection: News\nextra: 1\n---\n\nNot a list item.\n',
  );
  write('changes/no-front.md', '- No fields.\n');
  write('changes/private.md', fragment('bloom-private', 'patch', 'Fixed', '- X.'));
  write('changes/platform.md', fragment('@oxy.so/platform', 'patch', 'Fixed', '- X.'));
  const { fragments, errors } = readFragments(root);
  assert.deepEqual(
    fragments.map((f) => f.file),
    [join('changes', 'good.md')],
  );
  assert.equal(errors.length, 4);
  const bad = errors.find((error) => error.includes('bad.md'));
  for (const part of [
    'unknown field extra',
    'package "@oxy.so/nope"',
    'bump "huge"',
    'section "News"',
    'list item',
  ])
    assert.ok(bad.includes(part), `${bad} names ${part}`);
  assert.ok(errors.some((error) => error.includes('no-front.md')));
  assert.ok(errors.some((error) => error.includes('"bloom-private" is none of')));
  assert.ok(errors.some((error) => error.includes('"@oxy.so/platform" is none of')));
});

test('the plan asks for the largest bump of a package', () => {
  write('changes/a.md', fragment('@oxy.so/bloom-language', 'patch', 'Fixed', '- A.'));
  write('changes/b.md', fragment('@oxy.so/bloom-language', 'minor', 'Added', '- B.'));
  const { releases, errors } = plan(root);
  assert.deepEqual(errors, []);
  assert.equal(releases.length, 1);
  assert.equal(releases[0].bump, 'minor');
  assert.equal(releases[0].wanted, '1.8.0');
});

test('a release compiles the fragments under the new versions and deletes them', () => {
  write('changes/halo.md', fragment('@oxy.so/bloom', 'minor', 'Added', '- Halo.'));
  write('changes/fix.md', fragment('@oxy.so/bloom', 'patch', 'Fixed', '- Fix one.\n- Fix two.'));
  write(
    'changes/own-screen.md',
    fragment('@oxy.so/bloom-language', 'minor', 'Added', '- Own screen.'),
  );
  write('changes/peer.md', fragment('@oxy.so/bloom-language', 'minor', 'Compatibility', '- Peer.'));

  assert.match(
    release(root).errors.join('\n'),
    /already released: bump its package\.json version first/,
  );
  setVersion('.', '23.9.2');
  setVersion('packages/bloom-language', '1.8.0');
  assert.match(
    release(root).errors.join('\n'),
    /ask for a minor \(23\.10\.0\), its package\.json is 23\.9\.2/,
  );
  assert.ok(existsSync(join(root, 'changes/halo.md')), 'a refused release changes nothing');
  setVersion('.', '23.10.0');

  assert.deepEqual(release(root).errors, []);
  assert.equal(
    read('CHANGELOG.md'),
    '# Changelog\n\n## 23.10.0\n\n`@oxy.so/bloom-language` 1.8.0 ships beside it.\n\n### Added\n\n- Halo.\n\n### Fixed\n\n- Fix one.\n- Fix two.\n\n## 23.9.1\n\n### Fixed\n\n- Old.\n',
  );
  assert.equal(
    read('packages/bloom-language/CHANGELOG.md'),
    '# Changelog\n\n## 1.8.0\n\n### Compatibility\n\n- Peer.\n\n### Added\n\n- Own screen.\n\n## 1.7.0\n\n### Added\n\n- Old.\n',
  );
  assert.deepEqual(readFragments(root).fragments, []);
  assert.ok(existsSync(join(root, 'changes/README.md')));
});

test('a release of a package with no CHANGELOG.md yet writes its first one', () => {
  write('changes/first.md', fragment('@oxy.so/no-changelog', 'minor', 'Added', '- First.'));
  setVersion('packages/no-changelog', '1.1.0');
  assert.deepEqual(release(root).errors, []);
  assert.equal(
    read('packages/no-changelog/CHANGELOG.md'),
    '# Changelog\n\n## 1.1.0\n\n### Added\n\n- First.\n',
  );
});

test('check: a CHANGELOG edit outside a release fails, a release passes, a fragment passes', () => {
  write('changes/x.md', fragment('@oxy.so/bloom', 'patch', 'Fixed', '- X.'));
  assert.deepEqual(check(root, 'HEAD').errors, []);

  write('CHANGELOG.md', '# Changelog\n\n## Unreleased\n\n- New.\n\n## 23.9.1\n');
  const { errors } = check(root, 'HEAD');
  assert.ok(
    errors.some((error) => /CHANGELOG\.md changed, but @oxy\.so\/bloom stays 23\.9\.1/.test(error)),
  );
  assert.ok(errors.some((error) => /"## Unreleased" section/.test(error)));

  write('CHANGELOG.md', '# Changelog\n\n## 23.9.2\n\n### Fixed\n\n- X.\n\n## 23.9.1\n');
  setVersion('.', '23.9.2');
  assert.deepEqual(check(root, 'HEAD').errors, []);

  write('packages/bloom-language/CHANGELOG.md', '# Changelog\n\n## 1.7.0\n\n- Edited.\n');
  assert.match(
    check(root, 'HEAD').errors.join('\n'),
    /packages\/bloom-language\/CHANGELOG\.md changed, but @oxy\.so\/bloom-language stays 1\.7\.0/,
  );
});

test('check: moving an old entry out of a CHANGELOG into a fragment passes', () => {
  write(
    'CHANGELOG.md',
    '# Changelog\n\n## Unreleased\n\n### Added\n\n- Pending.\n\n## 23.9.1\n\n### Fixed\n\n- Old.\n',
  );
  git(
    '-c',
    'user.name=t',
    '-c',
    'user.email=t@t',
    'commit',
    '-q',
    '-a',
    '-m',
    'an Unreleased section',
  );
  write('CHANGELOG.md', '# Changelog\n\n## 23.9.1\n\n### Fixed\n\n- Old.\n');
  write('changes/pending.md', fragment('@oxy.so/bloom', 'minor', 'Added', '- Pending.'));
  assert.deepEqual(check(root, 'HEAD').errors, []);
});

test('check: a base it cannot diff against is an error, not a pass', () => {
  assert.match(check(root, 'HEAD~5').errors.join('\n'), /cannot diff against HEAD~5/);
});
