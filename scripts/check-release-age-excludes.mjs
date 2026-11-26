#!/usr/bin/env node

/**
 * The install quarantine (`minimumReleaseAge` in `bunfig.toml`) is for
 * THIRD-PARTY packages. Oxy's own packages are exempt, because publishing one
 * and bumping its consumer in the same session is the normal workflow.
 *
 * Bun matches `minimumReleaseAgeExcludes` by EXACT name: a scope glob
 * ("@oxy.so/*") is accepted by the parser and silently matches nothing. So the
 * exemption is a list of names, and this check keeps it honest. It fails when:
 *
 *   - `bun.lock` resolves a first-party package from the registry and the list
 *     does not name it (its next bump would be refused for a week);
 *   - the list names a package outside the first-party scopes (that would take
 *     a third-party package out of the quarantine), or a glob.
 *
 * The first-party scopes are below. Every Oxy repo with the quarantine carries
 * this check and the same list of names in its `bunfig.toml`; a new
 * first-party package is added to that list in each of them.
 *
 * Usage: node scripts/check-release-age-excludes.mjs [repo root]
 */

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** npm scopes Oxy publishes under. Every package in them is first-party. */
export const FIRST_PARTY_SCOPES = [
  '@alia-codea',
  '@alia.onl',
  '@clarity.surf',
  '@crowdsource.you',
  '@fairco.in',
  '@gemies',
  '@goway.to',
  '@kaana.ai',
  '@mercaria.co',
  '@oxy.so',
  '@peable.to',
  '@syra.fm',
  '@vibbr.co',
];

/** Unscoped first-party packages. */
export const FIRST_PARTY_NAMES = ['create-oxy-app'];

export function isFirstParty(name) {
  if (FIRST_PARTY_NAMES.includes(name)) return true;
  const slash = name.indexOf('/');
  return name.startsWith('@') && slash > 0 && FIRST_PARTY_SCOPES.includes(name.slice(0, slash));
}

/** The names in `minimumReleaseAgeExcludes`, or null when there is no quarantine. */
export function readExcludes(bunfig) {
  const toml = bunfig.replace(/#.*$/gm, '');
  if (!/^\s*minimumReleaseAge\s*=/m.test(toml)) return null;
  const list = /^\s*minimumReleaseAgeExcludes\s*=\s*\[([^\]]*)\]/m.exec(toml);
  if (!list) return [];
  return [...list[1].matchAll(/"([^"]+)"|'([^']+)'/g)].map((match) => match[1] ?? match[2]);
}

/** Names of the packages `bun.lock` resolves from a registry (not workspaces, files or git). */
export function registryPackages(lockText) {
  const lock = JSON.parse(lockText.replace(/,(\s*[}\]])/g, '$1'));
  const names = new Set();
  for (const entry of Object.values(lock.packages ?? {})) {
    const [id, registry] = entry;
    if (typeof id !== 'string' || typeof registry !== 'string') continue;
    const at = id.lastIndexOf('@');
    if (at <= 0 || !/^\d/.test(id.slice(at + 1))) continue;
    names.add(id.slice(0, at));
  }
  return names;
}

export function checkReleaseAgeExcludes({ bunfig, lock }) {
  const excludes = readExcludes(bunfig);
  if (excludes === null) return [];
  const problems = [];
  for (const name of excludes) {
    if (name.includes('*')) {
      problems.push(
        `${name} is a glob, which bun accepts and matches against nothing; list exact names`,
      );
    } else if (!isFirstParty(name)) {
      problems.push(`${name} is exempt from the quarantine but is not a first-party package`);
    }
  }
  const listed = new Set(excludes);
  for (const name of [...registryPackages(lock)].sort()) {
    if (isFirstParty(name) && !listed.has(name)) {
      problems.push(
        `${name} is first-party and comes from the registry, but is not in minimumReleaseAgeExcludes`,
      );
    }
  }
  return problems;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(process.argv[2] ?? '.');
  const problems = checkReleaseAgeExcludes({
    bunfig: readFileSync(join(root, 'bunfig.toml'), 'utf8'),
    lock: readFileSync(join(root, 'bun.lock'), 'utf8'),
  });
  if (problems.length > 0) {
    console.error('bunfig.toml minimumReleaseAgeExcludes:');
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error(
      'First-party packages are listed by exact name; see scripts/check-release-age-excludes.mjs.',
    );
    process.exit(1);
  }
  console.log(
    'bunfig.toml minimumReleaseAgeExcludes covers every first-party package in bun.lock.',
  );
}
