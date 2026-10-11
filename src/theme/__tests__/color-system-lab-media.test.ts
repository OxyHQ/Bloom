import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const storySource = readFileSync(resolve(__dirname, '..', 'ColorSystemLab.stories.tsx'), 'utf8');
const contentSource = readFileSync(
  resolve(__dirname, '../../../templates/social/SocialContent.tsx'),
  'utf8',
);

function mediaViolations(source: string): string[] {
  const violations: string[] = [];

  if (/cloud\.oxy\.so/i.test(source)) violations.push('hardcoded-cloud-cdn');
  // LinkPreviewCard's destination is navigation; only its thumbnail is media.
  const mediaSource = source.replace(/<LinkPreviewCard\b[\s\S]*?\/>/g, (card) =>
    card.replace(/\burl="https?:[^"]*"/g, ''),
  );
  if (/https?:\/\//i.test(mediaSource)) violations.push('hardcoded-remote-url');
  if (/source\s*=\s*\{\{\s*uri\s*:/i.test(source)) violations.push('raw-uri-source');

  return violations;
}

describe('Color System Playground media ownership', () => {
  it('uses local avatar fallback and deterministic illustrations without remote media', () => {
    expect(storySource).toContain("title: 'Foundations/Color System Playground'");
    expect((contentSource.match(/<(?:Avatar|ContactRow)\b/g) ?? []).length).toBeGreaterThanOrEqual(
      3,
    );
    expect(
      (contentSource.match(/(?:source|avatar)=\{defaultAvatarSource\}/g) ?? []).length,
    ).toBeGreaterThanOrEqual(3);
    expect((contentSource.match(/<PostIllustration\b/g) ?? []).length).toBe(2);
    expect(contentSource).toContain('<LinkPreviewCard');
    expect(contentSource).toContain("new URL('./assets/books.svg', import.meta.url)");
    expect(contentSource).toContain('image={booksCover}');
    expect(mediaViolations(storySource + contentSource)).toEqual([]);
    expect(storySource).toContain('<SocialTemplate');
    expect(storySource).not.toContain('function ThemePreview');
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
