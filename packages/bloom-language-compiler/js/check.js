#!/usr/bin/env node
/**
 * `bloom-lang-check [--tsc] [--project <dir>] [paths…]`: `bloomc check`, for
 * an app's `typecheck` script (`tsc --noEmit && bloom-lang-check --tsc`). With
 * `--tsc` every `.bloom` file of the project (the working directory, or
 * `--project`) is emitted and checked by the project's own `tsc`, and each
 * error in emitted code is reported at the `.bloom` span that wrote it. Exits
 * non-zero on any error.
 */
const { run } = require('./bloomc');

if (require.main === module) {
  run(['check', ...process.argv.slice(2)]).then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      console.error(`bloom-lang-check: ${error.message}`);
      process.exitCode = 2;
    },
  );
}
