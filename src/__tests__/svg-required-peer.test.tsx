import React from 'react';
import { render } from '@testing-library/react-native';

import { Avatar } from '../avatar';
import { AnimatedCheck } from '../animated-check';
import { SpinnerIcon } from '../loading/SpinnerIcon';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

/**
 * `react-native-svg` is a REQUIRED peer, so every surface that draws with it
 * draws with it — there is no "SVG missing" state to fall back from, and the
 * three fallbacks that used to exist (a circle instead of the squircle clip, an
 * `ActivityIndicator` instead of the spinner, a Unicode `✓` instead of the
 * draw-on check) were unreachable-by-design branches that a broken lazy loader
 * turned into the ONLY reachable branches on every device.
 *
 * These cases pin the SVG output as the one rendered result. They are honest
 * about their limits: they would have passed before the fix too, because jest
 * resolves a dynamic `require` that Metro cannot. Their job is to stop a
 * fallback branch being reintroduced; the gate against the load shape itself is
 * the static scan in `optional-peer-imports.test.ts`.
 */

/** Every host-element type in a rendered tree, in document order. */
function elementTypes(node: unknown, out: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const child of node) elementTypes(child, out);
    return out;
  }
  if (!node || typeof node !== 'object') return out;
  const element = node as { type?: unknown; children?: unknown };
  if (typeof element.type === 'string') out.push(element.type);
  if (element.children) elementTypes(element.children, out);
  return out;
}

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal" fonts={false}>
      {ui}
    </BloomThemeProvider>,
  );
}

describe('surfaces backed by the required react-native-svg peer', () => {
  it('clips a squircle avatar with an SVG path, never the circle fallback', () => {
    const { toJSON } = renderWithTheme(
      <Avatar shape="squircle" uri="https://cloud.oxy.so/avatar.png" size={48} />,
    );
    const types = elementTypes(toJSON());

    // The clip is the whole point of the shape: `Svg > Defs > ClipPath > Path`
    // feeding a clipped `<Image href>`.
    expect(types).toEqual(expect.arrayContaining(['Svg', 'Defs', 'ClipPath', 'Path', 'SvgImage']));
  });

  it('draws the spinner blades as SVG rects, never an ActivityIndicator', () => {
    const { toJSON } = render(<SpinnerIcon size={26} color="#111111" />);
    const types = elementTypes(toJSON());

    expect(types).toContain('Svg');
    // Eight blades with the opacity trail — a count, so a partially rendered
    // spinner cannot pass as a whole one.
    expect(types.filter((type) => type === 'Rect')).toHaveLength(8);
    expect(types).not.toContain('ActivityIndicator');
  });

  it('draws the animated check as an SVG ring and path, never a Unicode glyph', () => {
    const { toJSON } = renderWithTheme(<AnimatedCheck size={48} />);
    const types = elementTypes(toJSON());

    expect(types).toEqual(expect.arrayContaining(['Svg', 'Circle', 'Path']));
    expect(types).not.toContain('Text');
  });
});
