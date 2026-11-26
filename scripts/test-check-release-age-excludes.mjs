#!/usr/bin/env node

/**
 * Fixture tests for `check-release-age-excludes.mjs`: each case breaks one
 * thing and the gate must say so, and the cases that must pass do.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { checkReleaseAgeExcludes } from './check-release-age-excludes.mjs';

const bunfig = (excludes) =>
  [
    '[install]',
    '# A comment that names "@evil/pkg" is not an exclude.',
    'minimumReleaseAge = 604800',
    `minimumReleaseAgeExcludes = [\n${excludes.map((name) => `  "${name}",`).join('\n')}\n]`,
  ].join('\n');

const lock = (entries) =>
  JSON.stringify({ lockfileVersion: 1, workspaces: {}, packages: entries }, null, 2).replace(
    /\n(\s*)}/g,
    ',\n$1}',
  );

const registry = (name, version) => [`${name}@${version}`, '', {}, 'sha512-x'];

test('passes when every registry first-party package is listed', () => {
  const problems = checkReleaseAgeExcludes({
    bunfig: bunfig(['@oxy.so/bloom', '@gemies/sdk']),
    lock: lock({
      '@oxy.so/bloom': registry('@oxy.so/bloom', '23.9.0'),
      'node_modules/@gemies/sdk': registry('@gemies/sdk', '10.0.0'),
      react: registry('react', '19.2.3'),
    }),
  });
  assert.deepEqual(problems, []);
});

test('fails on a registry first-party package missing from the list', () => {
  const problems = checkReleaseAgeExcludes({
    bunfig: bunfig(['@oxy.so/bloom']),
    lock: lock({
      '@oxy.so/bloom': registry('@oxy.so/bloom', '23.9.0'),
      '@oxy.so/bloom-data': registry('@oxy.so/bloom-data', '0.1.2'),
      'create-oxy-app': registry('create-oxy-app', '0.10.0'),
    }),
  });
  assert.equal(problems.length, 2);
  assert.match(problems[0], /@oxy\.so\/bloom-data/);
  assert.match(problems[1], /create-oxy-app/);
});

test('fails when the list exempts a third-party package', () => {
  const problems = checkReleaseAgeExcludes({
    bunfig: bunfig(['@oxy.so/bloom', 'react']),
    lock: lock({}),
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^react /);
});

test('fails on a scope glob, which bun silently ignores', () => {
  const problems = checkReleaseAgeExcludes({
    bunfig: bunfig(['@oxy.so/*']),
    lock: lock({ '@oxy.so/core': registry('@oxy.so/core', '7.55.0') }),
  });
  assert.equal(problems.length, 2);
});

test('ignores workspace, root, file and git sources', () => {
  const problems = checkReleaseAgeExcludes({
    bunfig: bunfig([]),
    lock: lock({
      '@oxy.so/bloom': ['@oxy.so/bloom@root:', {}],
      '@oxy.so/core': ['@oxy.so/core@workspace:packages/core'],
      '@oxy.so/services': ['@oxy.so/services@file:../services', {}],
      '@oxy.so/utils': ['@oxy.so/utils@github:OxyHQ/utils#abc', {}, 'OxyHQ-utils-abc'],
    }),
  });
  assert.deepEqual(problems, []);
});

test('does nothing in a repo without the quarantine', () => {
  const problems = checkReleaseAgeExcludes({
    bunfig: '[install]\nlinker = "hoisted"\n',
    lock: lock({ '@oxy.so/core': registry('@oxy.so/core', '7.55.0') }),
  });
  assert.deepEqual(problems, []);
});
