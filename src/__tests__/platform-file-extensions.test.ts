import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A platform file and its default share an extension: `x.native.tsx` beside `x.tsx`, never
 * beside `x.ts`.
 *
 * Metro tries each source extension in turn and, within it, each platform:
 * `x.android.ts`, `x.native.ts`, `x.ts`, then `x.android.tsx`, … With an app's
 * `sourceExts` starting `ts, tsx` (Expo's default), `x.ts` is found before
 * `x.native.tsx` on a device, and the device runs the web's file. That drew every
 * `BloomImage` in Mention's Bloom build as nothing: `bloom-image-view-draw.ts`, the web's
 * no-op, won over `bloom-image-view-draw.native.tsx`, with no error.
 */
const SRC = join(__dirname, '..');
const PLATFORMS = ['native', 'android', 'ios', 'web'];

function files(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files(full, out);
    else if (/\.(tsx?|jsx?)$/.test(entry)) out.push(full);
  }
  return out;
}

describe('platform files', () => {
  it('share their default file’s extension', () => {
    const all = new Set(files(SRC));
    const mismatched: string[] = [];
    for (const file of all) {
      const match = /^(.*)\.([a-z]+)\.(tsx?|jsx?)$/.exec(file);
      if (!match || !PLATFORMS.includes(match[2] ?? '')) continue;
      const [, base, , ext] = match;
      for (const other of ['ts', 'tsx', 'js', 'jsx']) {
        if (other !== ext && all.has(`${base}.${other}`)) {
          mismatched.push(
            `${file.slice(SRC.length + 1)} beside ${base?.slice(SRC.length + 1)}.${other}`,
          );
        }
      }
    }
    expect(mismatched).toEqual([]);
  });
});
