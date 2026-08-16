/**
 * POSITIVE CONTROL for scripts/verify-consumer-typecheck.mjs.
 *
 * This file is deliberately WRONG in exactly the way the verifier exists to
 * catch: it reaches a Node-only property off a value whose type under a
 * consumer's program is `number`. The verifier compiles it INSIDE the same
 * consumer-shaped program it uses for the real run and fails if the error is
 * not reported — because a probe whose module resolution quietly collapsed to
 * `any` reports a clean run that is indistinguishable from a genuinely clean
 * one.
 *
 * It lives outside `src/` on purpose, and all three consequences are wanted:
 * tsconfig.json only includes `src`, so Bloom's own typecheck never sees it;
 * bob only compiles `src`, so it never reaches `lib/`; and `package.json#files`
 * does not list `scripts/`, so it never ships to a consumer.
 *
 * If a legitimate change ever makes this file compile clean, the verifier goes
 * red and the fix is to pick a new control of the SAME class — not to delete
 * the assertion.
 */

const timer = setTimeout(() => {}, 0);

// TS2339 under the consumer program (`number` has no `unref`); accepted under
// Bloom's own tsconfig, where @types/node types this as `NodeJS.Timeout`.
timer.unref();
