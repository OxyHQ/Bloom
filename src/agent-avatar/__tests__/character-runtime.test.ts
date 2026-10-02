/** @jest-environment node */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { characterHtml, scriptJson } from '../character-html';

const root = resolve(__dirname, '../../..');
describe('optional character runtime', () => {
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
    const module = readFileSync(resolve(folder, 'orbit-characters.mjs'), 'utf8');
    const data = readFileSync(resolve(folder, 'orbit-characters.data'));
    const files = [...module.matchAll(/filename:"\/orbit\/renders\/studio\/(eyes|shapes)\/([^"/]+)@3x\.png",start:(\d+),end:(\d+)/g)];
    expect(files).toHaveLength(20);
    for (const [, category, name, start, end] of files)
      expect(readFileSync(resolve(folder, 'thumbnails', category!, `${name}.png`)))
        .toEqual(data.subarray(Number(start), Number(end)));
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
