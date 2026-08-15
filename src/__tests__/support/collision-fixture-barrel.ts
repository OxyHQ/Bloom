/**
 * A barrel that DELIBERATELY offers one name from two declarations, so that
 * `barrel-name-collisions.test.ts` can prove its detector fires. It reproduces
 * the shipped `Item` shape: a star export carrying `Item` from `item/`, and an
 * explicit re-export binding that same name to a different component.
 *
 * Nothing imports this at runtime. bob's `exclude` keeps it out of `lib/`, and
 * `files: ["src", …]` does ship it inside the tarball's `src/` like the other
 * test files there — but no entry point reaches it, so no bundler links it, and
 * `package.json#exports` never names it.
 *
 * The `Card` lines below are the other half of the
 * control: one name offered twice from ONE declaration, which the detector must
 * stay quiet about — otherwise its cheapest fix would be deleting a legitimate
 * redundant re-export.
 */
export * from '../../item';
export { Card as Item } from '../../card';
export { Card } from '../../card';
export * from '../../card';
