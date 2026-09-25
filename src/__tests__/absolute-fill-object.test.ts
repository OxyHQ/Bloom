// A source gate for `StyleSheet.absoluteFillObject`, which React Native 0.85
// removed. Bloom's own dev tree still runs an older RN, where it exists, so
// nothing here failed; in an app on 0.85+ the lookup is `undefined`, and
// spreading `undefined` is silently nothing. The box keeps no position and no
// insets.
//
// That is how the settings modal shipped a ZERO-HEIGHT centring box on
// Android. The panel inside still painted (nothing clips it) and still took
// touches, but Android treats every view under a zero-area ancestor as not
// visible to the user, so TalkBack and UI Automator saw none of the modal —
// only the backdrop's full-screen "Close" (OxyHQ/Mention#1126).
//
// The jest mock no longer offers the property either, so a use that slips past
// this scan renders the same broken layout under test as on a device.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { StyleSheet } from 'react-native';

const SRC = join(__dirname, '..');

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === '__tests__' || entry === 'node_modules') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      sourceFiles(full, out);
    } else if (/\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe('StyleSheet.absoluteFillObject', () => {
  const files = sourceFiles(SRC);

  // Vacuity floor: a broken traversal would otherwise report a clean sweep.
  it('scans the whole source tree', () => {
    expect(files.length).toBeGreaterThan(200);
    expect(files.some((f) => f.endsWith(join('settings-modal', 'SettingsModal.tsx')))).toBe(true);
  });

  it('is never read — spell the insets out, or use StyleSheet.absoluteFill', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(/StyleSheet\s*\.\s*absoluteFillObject\b/g)) {
        // Prose that NAMES the removed property sits in a comment on its line.
        const lineStart = source.lastIndexOf('\n', match.index) + 1;
        const before = source.slice(lineStart, match.index);
        if (/\/\/|^\s*\*/.test(before)) continue;
        const line = source.slice(0, match.index).split('\n').length;
        offenders.push(`${file.slice(SRC.length + 1)}:${line}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('is absent from the react-native mock, as it is from RN 0.85+', () => {
    expect((StyleSheet as unknown as Record<string, unknown>).absoluteFillObject).toBeUndefined();
    expect(StyleSheet.absoluteFill).toBeDefined();
  });
});
