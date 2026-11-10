/**
 * A desktop platform's text and colour (`useDesktopPlatform()`): the desktop
 * text styles (13px body, tracking per size), the four label levels, and
 * neutral surfaces whatever the accent. Off a desktop platform each is what
 * it was.
 */
import type React from 'react';
import { StyleSheet } from 'react-native';
import { render, renderHook } from '@testing-library/react-native';

import { PlatformSurfaceProvider } from '../platform-surface/context';
import type { PlatformSurfaceAdapter } from '../platform-surface/types';
import { isDesktopPlatform } from '../platform-surface/use-desktop-platform';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { getPresetVars } from '../theme/preset-vars';
import { LABEL_ALPHA, resolveLabelColors } from '../theme/label-colors';
import { buildTheme } from '../theme/build-theme';
import { useTheme } from '../theme/use-theme';
import { parseRgba } from '../theme/color-utils';
import { contrastRatio, mixColors } from '../styles/color-contrast';
import { Text } from '../typography/Typography';
import { TypographyScope } from '../typography/TypographyScope';
import { TYPE_SCALE } from '../typography/scale';
import {
  DESKTOP_TEXT_STYLES,
  DESKTOP_TYPE_SCALE,
  desktopTracking,
  resolveTypeScale,
} from '../typography/desktop-scale';

const WINDOW: PlatformSurfaceAdapter = { platform: 'desktop', capabilities: new Set(['window']) };
const SHELL: PlatformSurfaceAdapter = { platform: 'desktop', capabilities: new Set(['pointer']) };
const POPUPS: PlatformSurfaceAdapter = {
  platform: 'popups',
  capabilities: new Set(['popup-surface']),
};

function on(
  adapter: PlatformSurfaceAdapter | null,
  preset: 'oxy' | 'teal' = 'oxy',
  mode: 'light' | 'dark' = 'light',
) {
  return ({ children }: { children: React.ReactNode }) => (
    <PlatformSurfaceProvider value={adapter}>
      <BloomThemeProvider fonts={false} mode={mode} colorPreset={preset}>
        {children}
      </BloomThemeProvider>
    </PlatformSurfaceProvider>
  );
}

describe('a desktop platform', () => {
  it('is a window or a shell a pointer drives, never a phone or popups alone', () => {
    expect(isDesktopPlatform(WINDOW)).toBe(true);
    expect(isDesktopPlatform(SHELL)).toBe(true);
    expect(isDesktopPlatform(POPUPS)).toBe(false);
    expect(isDesktopPlatform(null)).toBe(false);
  });
});

describe('the desktop text styles', () => {
  it('set the body at 13/16 with negative tracking, the headline bold', () => {
    expect(DESKTOP_TEXT_STYLES.body).toEqual({
      fontSize: 13,
      lineHeight: 16,
      letterSpacing: -0.08,
      fontWeight: '400',
    });
    expect(DESKTOP_TEXT_STYLES.headline.fontWeight).toBe('700');
    expect(DESKTOP_TEXT_STYLES['title-2'].letterSpacing).toBe(-0.43);
  });

  it('track each size by the table, looser below 12 and tighter through the titles', () => {
    expect(desktopTracking(10)).toBe(0.12);
    expect(desktopTracking(12)).toBe(0);
    expect(desktopTracking(13)).toBe(-0.08);
    expect(desktopTracking(19)).toBe(-0.44);
    expect(desktopTracking(40)).toBe(0.38);
  });

  it('map the ramp onto the roles and keep each step apart from the one below', () => {
    expect(DESKTOP_TYPE_SCALE['body-regular'].fontSize).toBe(13);
    expect(DESKTOP_TYPE_SCALE['body-semibold'].fontWeight).toBe('600');
    expect(DESKTOP_TYPE_SCALE['body-2-regular'].fontSize).toBe(12);
    expect(DESKTOP_TYPE_SCALE['caption-1-regular'].fontSize).toBe(11);
    // The hero steps keep their size.
    expect(DESKTOP_TYPE_SCALE['display-1-bold']).toEqual(TYPE_SCALE['display-1-bold']);
    const order = ['caption-2', 'caption-1', 'body-2', 'body', 'title-3', 'title-2', 'title-1'];
    for (let i = 1; i < order.length; i++) {
      expect(DESKTOP_TYPE_SCALE[`${order[i]}-regular` as 'body-regular'].fontSize).toBeGreaterThan(
        DESKTOP_TYPE_SCALE[`${order[i - 1]}-regular` as 'body-regular'].fontSize,
      );
    }
    expect(resolveTypeScale('body-regular', false)).toBe(TYPE_SCALE['body-regular']);
  });

  it('are what Text draws a variant in on a desktop platform, and only there', () => {
    const desktop = render(<Text variant="body-regular">Hello</Text>, { wrapper: on(WINDOW) });
    const style = StyleSheet.flatten(desktop.getByText('Hello').props.style);
    expect(style.fontSize).toBe(13);
    expect(style.letterSpacing).toBe(-0.08);

    const phone = render(<Text variant="body-regular">Hello</Text>, { wrapper: on(null) });
    expect(StyleSheet.flatten(phone.getByText('Hello').props.style).fontSize).toBe(14);

    const scoped = render(
      <TypographyScope scale="desktop">
        <Text variant="body-regular">Hello</Text>
      </TypographyScope>,
      { wrapper: on(null) },
    );
    expect(StyleSheet.flatten(scoped.getByText('Hello').props.style).fontSize).toBe(13);
  });

  it('set titles in the sans face on a desktop platform', () => {
    const desktop = render(<Text variant="title-2-semibold">Title</Text>, { wrapper: on(WINDOW) });
    expect(StyleSheet.flatten(desktop.getByText('Title').props.style).fontFamily).toBe('Inter');
  });
});

describe('the label levels', () => {
  it('are the ink at four alphas', () => {
    const theme = buildTheme('teal', 'light');
    const labels = resolveLabelColors(theme);
    expect(labels.label).toBe(theme.colors.text);
    expect(parseRgba(labels.secondary)?.a).toBe(LABEL_ALPHA.secondary);
    expect(parseRgba(labels.tertiary)?.a).toBe(LABEL_ALPHA.tertiary);
    expect(parseRgba(labels.quaternary)?.a).toBe(LABEL_ALPHA.quaternary);
    expect(labels.secondary).not.toBe(labels.tertiary);
  });

  it('keep the secondary level at 4.5:1 on the page and every surface rung, in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      for (const surfaces of ['tinted', 'neutral'] as const) {
        const theme = buildTheme(
          'oxy',
          mode,
          false,
          surfaces === 'neutral' ? { surfaces } : undefined,
        );
        const c = theme.colors;
        for (const fill of [c.background, c.backgroundSecondary, c.backgroundTertiary, c.card]) {
          const secondary = mixColors(fill, c.text, LABEL_ALPHA.secondary);
          expect(contrastRatio(secondary, fill)).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });
});

function chroma(rgb: string) {
  const c = parseRgba(rgb)!;
  return Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b);
}

describe('neutral surfaces', () => {
  it('draw the page, surfaces, text and boundaries in greys of no hue, the accent unchanged', () => {
    for (const mode of ['light', 'dark'] as const) {
      const tinted = getPresetVars('oxy', mode);
      const neutral = getPresetVars('oxy', mode, { surfaces: 'neutral' });
      for (const token of [
        '--background',
        '--surface',
        '--popover',
        '--card',
        '--muted',
        '--foreground',
        '--muted-foreground',
        '--border',
      ]) {
        expect(chroma(neutral[token]!)).toBeLessThanOrEqual(2);
      }
      expect(chroma(tinted['--background']!)).toBeGreaterThan(4);
      expect(neutral['--primary']).toBe(tinted['--primary']);
      expect(neutral['--ring']).toBe(tinted['--ring']);
    }
  });

  it('are the default on a desktop platform, and tinted stays the default elsewhere', () => {
    const desktop = renderHook(() => useTheme(), { wrapper: on(WINDOW) }).result.current;
    const phone = renderHook(() => useTheme(), { wrapper: on(null) }).result.current;
    expect(chroma(desktop.colors.background)).toBeLessThanOrEqual(2);
    expect(chroma(phone.colors.background)).toBeGreaterThan(4);
    expect(desktop.colors.primary).toBe(phone.colors.primary);
  });

  it('can be asked for or declined by the provider', () => {
    const declined = renderHook(() => useTheme(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <PlatformSurfaceProvider value={WINDOW}>
          <BloomThemeProvider fonts={false} mode="dark" colorPreset="oxy" surfaces="tinted">
            {children}
          </BloomThemeProvider>
        </PlatformSurfaceProvider>
      ),
    }).result.current;
    expect(chroma(declined.colors.background)).toBeGreaterThan(4);
  });
});
