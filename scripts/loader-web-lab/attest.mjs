import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const hash = (bytes, algorithm = 'sha256') =>
  createHash(algorithm)
    .update(bytes)
    .digest(algorithm === 'sha512' ? 'base64' : 'hex');
const registry = JSON.parse(readFileSync('artifacts/registry.json'));
const pack = JSON.parse(readFileSync('artifacts/pack.json'))[0];
const archive = readFileSync(`artifacts/${pack.filename}`);
if (`sha512-${hash(archive, 'sha512')}` !== registry.integrity)
  throw Error('Registry integrity mismatch');
const temporary = mkdtempSync(join(tmpdir(), 'bloom-loader-receipt-'));
try {
  execFileSync('tar', ['-xf', `artifacts/${pack.filename}`, '-C', temporary]);
  const files = [];
  function visit(relative = '') {
    for (const entry of readdirSync(join(temporary, 'package', relative), {
      withFileTypes: true,
    })) {
      const path = join(relative, entry.name);
      if (entry.isDirectory()) visit(path);
      else {
        const expected = hash(readFileSync(join(temporary, 'package', path)));
        const installed = hash(readFileSync(join('node_modules/@oxy.so/bloom', path)));
        if (installed !== expected) throw Error(`Installed content differs: ${path}`);
        files.push([path, expected]);
      }
    }
  }
  visit();
  files.sort((a, b) => a[0].localeCompare(b[0]));
  writeFileSync(
    'artifacts/receipt.json',
    JSON.stringify(
      {
        version: pack.version,
        integrity: registry.integrity,
        archiveSha256: hash(archive),
        installedFiles: files.length,
        installedTreeSha256: hash(JSON.stringify(files)),
        source: 'npm tarball, no source mirror',
        fixtureFiles: Object.fromEntries(
          [
            'src/main.tsx',
            'style.css',
            'index.html',
            'vite.config.mjs',
            'verify.mjs',
            'package.json',
          ].map((path) => [path, hash(readFileSync(path))]),
        ),
        compiler: false,
        lockSha256: hash(readFileSync('bun.lock')),
        platform: process.platform,
        arch: process.arch,
        node: process.version,
        host: execFileSync('uname', ['-sr'], { encoding: 'utf8' }).trim(),
      },
      null,
      2,
    ) + '\n',
  );
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
