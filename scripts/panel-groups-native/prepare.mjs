import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = realpathSync(process.env.BLOOM_SOURCE_ROOT ?? path.join(here, '../..'));
const files = [
  'src/app-shell/AppShellPanelLayout.tsx',
  'src/app-shell/panel-layout.ts',
  'src/app-shell/panel-layout-types.ts',
  'src/app-shell/panel-motion.ts',
  'src/app-shell/use-panel-exit-completion.ts',
  'src/dialog/Dialog.tsx',
  'src/dialog/Dialog.web.tsx',
  'src/bottom-sheet/BottomSheetBase.tsx',
];
const hashes = Object.fromEntries(
  files
    .filter((file) => existsSync(path.join(root, file)))
    .map((file) => [
      file,
      createHash('sha256')
        .update(readFileSync(path.join(root, file)))
        .digest('hex'),
    ]),
);
if (!hashes['src/app-shell/AppShellPanelLayout.tsx'])
  throw new Error('Bloom source checkout required');
const identity = createHash('sha256').update(JSON.stringify(hashes)).digest('hex');
const link = path.join(here, '.source');
rmSync(link, { force: true });
symlinkSync(path.join(root, 'src'), link, 'dir');
writeFileSync(
  path.join(here, 'build.json'),
  JSON.stringify({ sourceRoot: root, identity, files: hashes }, null, 2) + '\n',
);
console.log(`Native fixture source: ${identity.slice(0, 8)}`);
