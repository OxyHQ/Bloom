/** @jest-environment node */
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

it('interpolates recovered 3D pose and camera blocks without changing materials or ordinary frames', () => {
  execFileSync(
    process.execPath,
    ['--test', 'scripts/test-avatar-pose-transition.mjs'],
    {
      cwd: resolve(__dirname, '../../..'),
    },
  );
});
