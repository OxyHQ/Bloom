/**
 * iOS draws the system's material under floating surfaces only (Surface study,
 * phase 3, decision 2): a `UIVisualEffectView` (expo-blur's `BlurView`) under a
 * tint at the web's `SURFACE_TINT_OPACITY`. Android, in-flow surfaces, `composite`
 * fills and reduced transparency keep the one opaque view every native surface
 * paints. The floating callers are an equality: a new one is a decision.
 */
import React from 'react';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { SurfacePaint } from '../surface/SurfacePaint';
import { SURFACE_TINT_OPACITY } from '../surface/shared';
import { parseRgba } from '../theme/color-utils';
import { resolvedStyle } from './support/rendered-style';

const originalOS = Platform.OS;
afterEach(() => {
  Platform.OS = originalOS;
});

type Options = {
  floating?: boolean;
  composite?: boolean;
  mode?: 'light' | 'dark';
  reduce?: boolean;
  contrast?: boolean;
};

function paint({ floating = true, composite, mode = 'light', reduce, contrast }: Options = {}) {
  return render(
    <BloomThemeProvider
      fonts={false}
      mode={mode}
      reduceTransparency={reduce}
      increaseContrast={contrast}
    >
      <SurfacePaint
        testID="paint"
        fill="#f4f4f6"
        radius={20}
        floating={floating}
        composite={composite}
      />
    </BloomThemeProvider>,
  );
}

const blurs = (tree: ReturnType<typeof render>) => tree.UNSAFE_queryAllByType('BlurView' as never);

describe('on iOS', () => {
  beforeEach(() => {
    Platform.OS = 'ios';
  });

  it('a floating surface draws the system material under a translucent tint, the edge on top', () => {
    const tree = paint();
    const [blur] = blurs(tree);
    expect(blur?.props.tint).toBe('systemUltraThinMaterialLight');
    expect(blur?.props.intensity).toBe(100);
    const tint = resolvedStyle(tree.getByTestId('paint-tint').props.style);
    expect(parseRgba(String(tint.backgroundColor))?.a).toBeCloseTo(SURFACE_TINT_OPACITY, 2);
    expect(tint.boxShadow).toEqual(expect.any(String));
    const host = resolvedStyle(tree.getByTestId('paint').props.style);
    expect(host.overflow).toBe('hidden');
    expect(host.backgroundColor).toBeUndefined();
  });

  it('takes the dark material in the dark theme', () => {
    expect(blurs(paint({ mode: 'dark' }))[0]?.props.tint).toBe('systemUltraThinMaterialDark');
  });

  it('draws no blur and an opaque body with transparency reduced or contrast increased', () => {
    for (const options of [{ reduce: true }, { contrast: true }]) {
      const tree = paint(options);
      expect(blurs(tree)).toHaveLength(0);
      const style = resolvedStyle(tree.getByTestId('paint').props.style);
      expect(style.backgroundColor).toBe('#f4f4f6');
      if (options.contrast) expect(style.borderWidth).toBe(1);
    }
  });

  it('an in-flow surface, or a composite fill, keeps the one opaque view', () => {
    for (const options of [{ floating: false }, { composite: true }]) {
      const tree = paint(options);
      expect(blurs(tree)).toHaveLength(0);
      expect(resolvedStyle(tree.getByTestId('paint').props.style).backgroundColor).toBe('#f4f4f6');
    }
  });
});

it('Android never mounts a blur under a surface, floating or not', () => {
  Platform.OS = 'android';
  const tree = paint();
  expect(blurs(tree)).toHaveLength(0);
  expect(resolvedStyle(tree.getByTestId('paint').props.style).backgroundColor).toBe('#f4f4f6');
});

describe('the floating callers', () => {
  const FLOATING: Readonly<Record<string, string>> = {
    'blur/BlurIsland.tsx': 'Islands float over the content they group controls above.',
    'bottom-sheet/BottomSheetBase.tsx': "The sheet's panel, over the app in its own window.",
    'dialog/CenteredCard.tsx': "The centred dialog's card, over the dimmed app.",
    'dialog/Dialog.tsx': "The side and bottom dialogs' panel, over the dimmed app.",
    'floating/PopupPanel.tsx': "A menu's panel in the platform's popup, over whatever is beneath it.",
    'tab-bar/surface.tsx': "The tab bar's capsule (BottomBar's too), over scrolling content.",
    'toast/ToastContent.tsx': 'A toast, over whatever the app shows.',
    'tooltip/Tooltip.tsx': 'A tooltip bubble, over the content it explains.',
    'composer-panel/ComposerPopover.tsx': "The composer's popover, in a Modal over the app.",
  };

  function sources(dir: string, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) {
        if (name !== '__tests__') sources(path, out);
      } else if (/\.tsx$/.test(name) && !name.includes('.stories.')) out.push(path);
    }
    return out;
  }

  it('are exactly the surfaces that float, each with its reason', () => {
    const SRC = join(__dirname, '..');
    const found = sources(SRC)
      .filter((path) =>
        [...readFileSync(path, 'utf8').matchAll(/<SurfacePaint\b[^>]*>/g)].some((tag) =>
          /\bfloating\b/.test(tag[0]),
        ),
      )
      .map((path) => relative(SRC, path))
      .sort();
    expect(found.length).toBeGreaterThan(0);
    expect(found).toEqual(Object.keys(FLOATING).sort());
  });
});
