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
  'src/app-shell/panel-session.tsx',
  'src/app-shell/panel-layout.ts',
  'src/app-shell/panel-layout-types.ts',
  'src/app-shell/panel-motion.ts',
  'src/app-shell/use-panel-exit-completion.ts',
  'src/dialog/Dialog.tsx',
  'src/dialog/Dialog.web.tsx',
  'src/dialog/DetailDialog.tsx',
  'src/dialog/DetailDialogBase.tsx',
  'src/dialog/DetailDialogMotion.tsx',
  'src/dialog/DetailDialogSection.tsx',
  'src/bottom-sheet/BottomSheetBase.tsx',
];
// The fixture can select another Bloom worktree. Its entry/components still
// compile from HERE, so they must never be hashed from BLOOM_SOURCE_ROOT.
const fixtureFiles = [
  'PanelSessionLab.tsx',
  'DetailDialogLab.tsx',
  'PanelGroupsLab.tsx',
  'index.js',
  'app.config.js',
  'babel.config.js',
  'metro.config.js',
  'global.css',
  'package.json',
  'bun.lock',
];
const inputs = [
  ...files
    .filter((file) => existsSync(path.join(root, file)))
    .map((file) => [file, path.join(root, file)]),
  ...fixtureFiles.map((file) => [`fixture/${file}`, path.join(here, file)]),
];
const hashes = Object.fromEntries(
  inputs.map(([name, filename]) => [
    name,
    createHash('sha256').update(readFileSync(filename)).digest('hex'),
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
  `${JSON.stringify({ sourceRoot: root, fixtureRoot: here, identity, files: hashes }, null, 2)}\n`,
);
console.log(`Native fixture source: ${identity.slice(0, 8)}`);
