/**
 * In this repository the language resolves `@oxy.so/bloom` to Bloom's root, the
 * package it is built and typechecked against.
 *
 * It once had its own `file:../..` devDependency on Bloom. While its peer range
 * (`>=23.0.0`) is not on the registry, bun installs such a dependency nested,
 * and writes the nested link as the spec's path relative to
 * `node_modules/@oxy.so/`: `../..`, the language itself. The language now takes
 * the workspace's one link to the root (`node_modules/@oxy.so/bloom`), as the
 * other packages do.
 */
import { realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';

const LANGUAGE = join(__dirname, '../..');
const BLOOM = join(LANGUAGE, '../..');

it("resolves @oxy.so/bloom to Bloom's root", () => {
  const resolved = require.resolve('@oxy.so/bloom/package.json', { paths: [LANGUAGE] });
  expect(realpathSync(dirname(resolved))).toBe(realpathSync(BLOOM));
});
