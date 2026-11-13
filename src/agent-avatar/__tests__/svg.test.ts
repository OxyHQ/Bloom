import { avatarCharacterInColor, renderAgentAvatarSvg, vectorFrameToSvg } from '../svg';

describe('@oxy.so/bloom/agent-avatar/svg', () => {
  it('draws a character at rest as one SVG document, through the avatar crop', async () => {
    const svg = await renderAgentAvatarSvg({ preset: 'blue_beret' }, { size: 640 });
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640"')).toBe(
      true,
    );
    expect(svg).toContain('viewBox="52 70 216 216"');
    expect((svg.match(/<path /g) ?? []).length).toBeGreaterThan(3);
    expect(svg.endsWith('</svg>')).toBe(true);
  });

  it('paints the character in the colour it is given', async () => {
    const red = await renderAgentAvatarSvg(
      avatarCharacterInColor({ preset: 'blue_beret' }, '#ff0000'),
    );
    const blue = await renderAgentAvatarSvg({ preset: 'blue_beret' });
    expect(red).not.toEqual(blue);
    expect(red.toLowerCase()).toContain('#ff0000');
  });

  it('puts a background behind the character only when asked', async () => {
    const plain = await renderAgentAvatarSvg({ preset: 'blue_beret' });
    const white = await renderAgentAvatarSvg({ preset: 'blue_beret' }, { background: '#ffffff' });
    expect(plain).not.toContain('<rect');
    expect(white).toContain('<rect x="52" y="70" width="216" height="216" fill="#ffffff"/>');
  });

  it('escapes what it writes into attributes', () => {
    const svg = vectorFrameToSvg({
      viewBox: '0 0 10 10',
      paths: [{ id: 'a"b', d: 'M0 0Z', fill: '"><script>', opacity: 1, fillOpacity: 1 }],
    });
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&quot;&gt;&lt;script&gt;');
  });
});

describe('the svg entry runs where React cannot', () => {
  const fs = require('node:fs') as typeof import('node:fs');
  const path = require('node:path') as typeof import('node:path');
  /** App-only packages: a server that renders a picture must neither import nor install them. */
  const APP_ONLY =
    /^(react-native|@react-native|expo|@expo|nativewind|lottie|@lottiefiles|@shopify)/;

  it('reaches no React, React Native or native module through its imports', () => {
    const seen = new Set<string>();
    const external = new Set<string>();
    const visit = (file: string) => {
      if (seen.has(file)) return;
      seen.add(file);
      const source = fs.readFileSync(file, 'utf8');
      // Static imports and re-exports, dynamic imports and requires, in either quote.
      const specifiers = source.matchAll(
        /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|^\s*import\s+)(['"])([^'"]+)\1/gm,
      );
      for (const match of specifiers) {
        const spec = match[2];
        if (!spec) continue;
        if (!spec.startsWith('.')) {
          external.add(spec);
          continue;
        }
        const base = path.resolve(path.dirname(file), spec);
        const next = [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`].find(
          (candidate) => fs.existsSync(candidate),
        );
        if (next) visit(next);
      }
    };
    visit(path.resolve(__dirname, '../svg/index.ts'));
    expect(seen.size).toBeGreaterThan(10);
    expect([...seen].filter((file) => file.endsWith('.tsx'))).toEqual([]);
    expect(
      [...external].filter((spec) => /^(react|react-dom)(\/|$)/.test(spec) || APP_ONLY.test(spec)),
    ).toEqual([]);
  });

  it('depends on nothing of React Native or Expo: a server installs it with peers omitted', () => {
    // Peers are the app's to provide (React Native, Expo, NativeWind's react-native-css). A hard
    // dependency is installed everywhere, so none may be an app-only package or require one.
    const manifest = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../../package.json'), 'utf8'),
    ) as { dependencies?: Record<string, string> };
    for (const name of Object.keys(manifest.dependencies ?? {})) {
      expect(name).not.toMatch(APP_ONLY);
      const dependency = JSON.parse(
        fs.readFileSync(require.resolve(`${name}/package.json`), 'utf8'),
      ) as {
        peerDependencies?: Record<string, string>;
        peerDependenciesMeta?: Record<string, { optional?: boolean }>;
      };
      const itsRequired = Object.keys(dependency.peerDependencies ?? {}).filter(
        (peer) => !dependency.peerDependenciesMeta?.[peer]?.optional,
      );
      expect({ name, peers: itsRequired.filter((peer) => APP_ONLY.test(peer)) }).toEqual({
        name,
        peers: [],
      });
    }
  });
});

describe('a character’s picture', () => {
  const { argbFromHex } =
    require('../../theme/color-engine/color-utils') as typeof import('../../theme/color-engine/color-utils');
  const { Hct } =
    require('../../theme/color-engine/hct') as typeof import('../../theme/color-engine/hct');
  const { ratioOfTones } =
    require('../../theme/color-engine/contrast') as typeof import('../../theme/color-engine/contrast');
  const { avatarPictureBackground, renderAgentAvatarPicture } =
    require('../svg') as typeof import('../svg');
  const tone = (hex: string) => Hct.fromInt(argbFromHex(hex)).tone;

  it.each([
    '#4778ff',
    '#ff0000',
    '#000000',
    '#111827',
    '#ffffff',
    '#fff9c4',
    '#ffeb3b',
    '#00ff00',
    '#7f7f7f',
    '#b6d80d',
  ])('stands %s on a tint of its own hue it can be seen against', (body) => {
    const background = avatarPictureBackground(body);
    expect(ratioOfTones(tone(body), tone(background))).toBeGreaterThanOrEqual(1.25);
  });

  it('is a much, much lighter tint of the colour, light colours too', () => {
    // A lime (a gemie's own colour in production) stays on a pale tint, never on a dark one.
    for (const body of ['#4778ff', '#ff0000', '#000000', '#2e7d32', '#6a1b9a', '#b6d80d']) {
      expect(tone(avatarPictureBackground(body))).toBeGreaterThanOrEqual(96);
    }
  });

  it('goes darker only for a body nearly as light as the tint', () => {
    for (const body of ['#ffffff', '#fff9c4']) {
      expect(tone(avatarPictureBackground(body))).toBeLessThan(tone(body));
    }
  });

  it('paints the character in the colour, on that tint, with room for a circular crop', async () => {
    const svg = await renderAgentAvatarPicture({ preset: 'blue_beret' }, '#ff0000', { size: 640 });
    const background = avatarPictureBackground('#ff0000');
    expect(svg).toContain(`fill="${background}"`);
    expect(svg.toLowerCase()).toContain('#ff0000');
    // The avatar crop (52 70 216 216) grown by an eighth of itself on each side, centred.
    const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1]?.split(' ').map(Number) ?? [];
    expect(viewBox[2]).toBeGreaterThan(216 * 1.2);
    expect((viewBox[0] ?? 0) + (viewBox[2] ?? 0) / 2).toBeCloseTo(52 + 108, 1);
    expect((viewBox[1] ?? 0) + (viewBox[3] ?? 0) / 2).toBeCloseTo(70 + 108, 1);
  });

  it('takes a Bloom preset key as the colour too', async () => {
    const svg = await renderAgentAvatarPicture({ preset: 'blue_beret' }, 'lagoon');
    expect(svg).toContain('<rect');
  });
});
