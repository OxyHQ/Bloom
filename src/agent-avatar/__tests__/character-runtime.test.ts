/** @jest-environment node */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { characterHtml, scriptJson } from '../character-html';

const root = resolve(__dirname, '../../..');
describe('optional character runtime', () => {
  it('uses shape-owned centers and sizes across donor styles while ignoring historical spacing', () => {
    execFileSync(
      process.execPath,
      ['--test', 'scripts/test-avatar-shape-faces.mjs'],
      { cwd: root },
    );
  });
  it('ships exact source contours and retains the canonical recipe on all migrated bodies', () => {
    execFileSync(
      process.execPath,
      ['--test', 'scripts/test-avatar-migrated-contours.mjs'],
      { cwd: root },
    );
  });
  it('retains original unnamed material paint through a valid editable palette backing', () => {
    execFileSync(
      process.execPath,
      ['--test', 'scripts/test-avatar-original-paint.mjs'],
      { cwd: root },
    );
  });
  it('places a single native eye on each face and leaves unselected geometry untouched', () => {
    execFileSync(
      process.execPath,
      ['--test', 'scripts/test-avatar-cyclops.mjs'],
      { cwd: root },
    );
  });
  it('builds outward Clippo tube geometry with actual open holes and bounded native records', () => {
    execFileSync(
      process.execPath,
      ['--test', 'scripts/test-avatar-clippo-geometry.mjs'],
      { cwd: root },
    );
  });
  it('resolves Clippo and authored defaults while honoring independent saved overrides', () => {
    execFileSync(
      process.execPath,
      ['--test', 'scripts/test-avatar-character-recipe.mjs'],
      { cwd: root },
    );
  });
  it('retains commands across replacement and in-place appearance preparation without replay after pause', () => {
    execFileSync(
      process.execPath,
      ['--test', 'scripts/test-avatar-managed-commands.mjs'],
      { cwd: root },
    );
  });
  it('preserves complete authored-part records and activity payloads while rejecting malformed geometry', () => {
    execFileSync(
      process.execPath,
      ['--test', 'scripts/test-avatar-authored-parts.mjs'],
      { cwd: root },
    );
  });
  it('verifies the original controller ABI and rejects stale or unsupported native pointers', () => {
    execFileSync(
      process.execPath,
      ['--test', 'scripts/test-avatar-controller-mode.mjs'],
      { cwd: root },
    );
  });
  it('caches GL method dispatch without freezing live drawing-buffer properties', () => {
    execFileSync(
      process.execPath,
      ['--test', 'scripts/test-avatar-gl-dispatch.mjs'],
      { cwd: root },
    );
  });
  it('reuses exact contour preparation without aliasing appearances or transferable buffers', () => {
    execFileSync(
      process.execPath,
      ['--test', 'scripts/test-avatar-preparation-cache.mjs'],
      { cwd: root },
    );
  });
  it('retains the preparation turn while worker and cached replies await GPU completion', () => {
    execFileSync(
      process.execPath,
      ['--test', 'scripts/test-avatar-preparation-delivery.mjs'],
      { cwd: root },
    );
  });
  it('checks shared render errors before publication without losing setup probes', () => {
    execFileSync(
      process.execPath,
      ['--test', 'scripts/test-avatar-render-errors.mjs'],
      { cwd: root },
    );
  });
  it('serializes cold preparation and cleans up both capped and shared leases', () => {
    execFileSync(
      process.execPath,
      ['--test', 'scripts/test-avatar-render-budget.mjs'],
      { cwd: root },
    );
  });
  it('admits preparation owners in order and cancels queued owners without leaking a turn', () => {
    execFileSync(
      process.execPath,
      ['--test', 'scripts/test-avatar-preparation-scope.mjs'],
      { cwd: root },
    );
  });
  it('preserves the recovered binary runtime against its independent integrity manifest', () => {
    const folder = resolve(root, 'assets/character-runtime');
    const manifest = JSON.parse(
      readFileSync(resolve(folder, 'integrity.json'), 'utf8'),
    ) as Record<string, string>;
    expect(Object.keys(manifest)).toHaveLength(4);
    for (const [name, digest] of Object.entries(manifest))
      expect(
        createHash('sha256')
          .update(readFileSync(resolve(folder, name)))
          .digest('hex'),
      ).toBe(digest);
  });
  it('uses the beta’s original eye and shape thumbnails without redrawing them', () => {
    const folder = resolve(root, 'assets/character-runtime');
    const module = readFileSync(
      resolve(folder, 'orbit-characters.mjs'),
      'utf8',
    );
    const data = readFileSync(resolve(folder, 'orbit-characters.data'));
    const files = [
      ...module.matchAll(
        /filename:"\/orbit\/renders\/studio\/(eyes|shapes)\/([^"/]+)@3x\.png",start:(\d+),end:(\d+)/g,
      ),
    ];
    expect(files).toHaveLength(20);
    for (const [, category, name, start, end] of files)
      expect(
        readFileSync(resolve(folder, 'thumbnails', category!, `${name}.png`)),
      ).toEqual(data.subarray(Number(start), Number(end)));
  });
  it('keeps saved appearance strings from terminating the native module script', () => {
    const payload = {
      config: {
        character: { preset: '</script><script>unexpected()</script>' },
      },
    };
    const escaped = scriptJson(payload);
    expect(JSON.parse(escaped)).toEqual(payload);
    expect(escaped).not.toContain('<');
    const html = characterHtml(
      'https://example.test/runtime.mjs?x=</script>',
      payload,
    );
    expect(html.match(/<script\b/g)).toHaveLength(1);
    expect(html.match(/<\/script>/g)).toHaveLength(1);
  });
  it('ships the external assets alongside the package instead of bundling them into the root import', () => {
    const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
    expect(pkg.files).toContain('assets/character-runtime');
    expect(pkg.peerDependenciesMeta['react-native-webview']).toEqual({
      optional: true,
    });
  });
});
