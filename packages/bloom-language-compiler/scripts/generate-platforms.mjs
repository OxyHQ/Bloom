#!/usr/bin/env node
/**
 * After `napi create-npm-dirs` (bun run generate:platforms): each platform
 * package also ships its bloomc binary and the licence.
 */
import { copyFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { platformPackages, ROOT, withCli } from './platform-packages.mjs';

for (const { platform, dir, manifest } of platformPackages()) {
  writeFileSync(
    join(dir, 'package.json'),
    `${JSON.stringify(withCli(manifest, platform), null, 2)}\n`,
  );
  copyFileSync(join(ROOT, 'LICENSE'), join(dir, 'LICENSE'));
}
