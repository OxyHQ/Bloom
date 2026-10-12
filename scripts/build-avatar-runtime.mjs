/** Build the standalone browser engine with lazy external geometry/motion.
 * Use an application entry: Vite library mode inlines binary assets regardless
 * of assetsInlineLimit, defeating per-recipe loading and caching. */
import { build } from 'vite';
import { resolve } from 'node:path';
import { readFile, readdir, rm, cp, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const output = resolve(process.env.AVATAR_RUNTIME_OUTPUT || '.local/character-runtime-build');
if (!output.startsWith(resolve('.local') + '/'))
  throw Error('Build and verify the runtime under .local before installing it');
await build({
  configFile: false,
  base: './',
  publicDir: false,
  build: {
    outDir: output,
    emptyOutDir: true,
    target: 'es2022',
    assetsInlineLimit: 0,
    rollupOptions: {
      preserveEntrySignatures: 'strict',
      input: resolve('runtime/avatar-runtime.ts'),
      output: {
        entryFileNames: 'runtime.mjs',
        chunkFileNames: 'chunks/[name]-[hash].mjs',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
for (const directory of [output, resolve(output, 'chunks')])
  for (const file of await readdir(directory)) {
    assert(!/\.(wasm|data)$/.test(file), 'Native runtime must not ship');
    if (!file.endsWith('.mjs')) continue;
    const code = await readFile(resolve(directory, file), 'utf8');
    assert(
      !/orbit-characters|editor-compatibility|legacy-engine/.test(code),
      `Old avatar renderer remains reachable in ${file}`,
    );
  }

// Only install a completely built, verified tree. Every file is generated;
// obsolete renderer assets and selector thumbnails cannot survive a build.
if (!process.env.AVATAR_RUNTIME_OUTPUT) {
  const destination = resolve('assets/character-runtime');
  for (const name of await readdir(destination))
    await rm(resolve(destination, name), { recursive: true, force: true });
  await cp(output, destination, { recursive: true });
  const files = {};
  async function inventory(directory, prefix = '') {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name),
        name = prefix + entry.name;
      if (entry.isDirectory()) await inventory(path, name + '/');
      else
        files[name] = createHash('sha256')
          .update(await readFile(path))
          .digest('hex');
    }
  }
  await inventory(destination);
  await writeFile(
    resolve(destination, 'manifest.json'),
    JSON.stringify({ version: 1, entry: 'runtime.mjs', files }, null, 2) + '\n',
  );
  await writeFile(
    resolve(destination, 'README.md'),
    '# Avatar runtime\n\nGenerated from `runtime/` by `bun run build:avatar-runtime`. Host this whole directory at `/bloom-character/`, or configure AgentAvatarProvider with the absolute URL of `runtime.mjs`. Geometry and motion load on demand; files under assets/ and chunks/ must keep their relative paths. Selectors render isolated parts through this engine. `manifest.json` pins every deployed file.\n\nThis is the sole avatar engine. It uses a shared WebGL scene per browser document, with no WASM, workers, SVG renderer or compatibility fallback. Native uses the same runtime through the optional WebView bridge.\n',
  );
}
