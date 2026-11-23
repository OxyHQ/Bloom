/**
 * `@oxy.so/bloom-language-codemod`: the className codemod as a library, for a
 * tool that drives it itself. The CLI (`bloom-language-codemod`) is the usual
 * way in (`docs/bloom-language-codemod.mdx` in the Bloom repository).
 */
export { overriddenClasses } from './overrides';
export { report } from './report';
export { loadTable, type Table } from './table';
export { type PackageRoots, tailwind } from './tailwind';
export {
  type FileResult,
  type Fixture,
  type TransformOptions,
  transformSource,
  type Unconverted,
} from './transform';
