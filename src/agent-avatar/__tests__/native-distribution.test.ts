import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';

const root = resolve(__dirname, '../../..');

it('ships native avatar rendering inside Bloom without a separate package contract', () => {
  const formerName = ['@oxy.so/bloom', 'avatar', 'native'].join('-');
  const formerDirectory = ['packages', ['avatar', 'native'].join('-')].join('/');
  expect(existsSync(join(root, formerDirectory))).toBe(false);
  const config = JSON.parse(readFileSync(join(root, 'expo-module.config.json'), 'utf8'));
  expect(config).toEqual({
    platforms: ['android'],
    android: { modules: ['so.oxy.bloom.avatargpu.AvatarGPUModule'] },
  });
  const excluded = new Set([
    '.git',
    '.local',
    '.worktrees',
    '.claude',
    'node_modules',
    'lib',
    'storybook-static',
  ]);
  const violations: string[] = [];
  function visit(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (excluded.has(entry.name)) continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (
        entry.isFile() &&
        /\.(?:[cm]?[jt]sx?|json|mdx?|gradle|kt|ya?ml|lock)$/.test(entry.name)
      ) {
        const content = readFileSync(path, 'utf8');
        if (content.includes(formerName) || content.includes(formerDirectory))
          violations.push(relative(root, path));
      }
    }
  }
  visit(root);
  expect(violations).toEqual([]);
});
