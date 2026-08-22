import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const storySource = readFileSync(resolve(__dirname, '..', 'ColorSystemLab.stories.tsx'), 'utf8');

function mediaViolations(source: string): string[] {
  const violations: string[] = [];

  if (/cloud\.oxy\.so/i.test(source)) violations.push('hardcoded-cloud-cdn');
  if (/https?:\/\//i.test(source)) violations.push('hardcoded-remote-url');
  if (/source\s*=\s*\{\{\s*uri\s*:/i.test(source)) violations.push('raw-uri-source');

  return violations;
}

describe('Color System Playground media ownership', () => {
  it('uses local avatar fallback and deterministic illustrations without remote media', () => {
    expect(storySource).toContain("title: 'Theme/Color System Playground'");
    expect((storySource.match(/<Image\b/g) ?? []).length).toBeGreaterThanOrEqual(5);
    expect((storySource.match(/source=\{defaultAvatarSource\}/g) ?? []).length).toBeGreaterThanOrEqual(5);
    expect((storySource.match(/<PostIllustration\b/g) ?? []).length).toBe(3);
    expect(mediaViolations(storySource)).toEqual([]);
  });

  it('detects both a hardcoded Oxy CDN value and a raw remote Image source', () => {
    const hardcodedCdn = `${storySource}\nconst remote = 'https://cloud.oxy.so/file-id';`;
    const rawRemote = `${storySource}\n<Image source={{ uri: 'https://images.example.test/post' }} />`;

    expect(mediaViolations(hardcodedCdn)).toEqual(
      expect.arrayContaining(['hardcoded-cloud-cdn', 'hardcoded-remote-url']),
    );
    expect(mediaViolations(rawRemote)).toEqual(
      expect.arrayContaining(['hardcoded-remote-url', 'raw-uri-source']),
    );
  });
});
