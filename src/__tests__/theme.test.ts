import {
  APP_COLOR_PRESETS,
  APP_COLOR_NAMES,
  HEX_TO_APP_COLOR,
  hexToAppColorName,
} from '../theme/color-presets';
import type { Theme, ThemeColors, ThemeMode } from '../theme/types';

describe('Theme system', () => {
  describe('color presets', () => {
    it('has all named presets defined', () => {
      for (const name of APP_COLOR_NAMES) {
        expect(APP_COLOR_PRESETS[name]).toBeDefined();
        expect(APP_COLOR_PRESETS[name]!.name).toBe(name);
        expect(APP_COLOR_PRESETS[name]!.hex).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });

    it('each preset has both light and dark color variables', () => {
      const requiredVars = [
        '--background',
        '--foreground',
        '--surface',
        '--primary',
        '--border',
        '--muted',
        '--muted-foreground',
        '--destructive',
        '--input',
      ];

      for (const name of APP_COLOR_NAMES) {
        const preset = APP_COLOR_PRESETS[name]!;
        for (const v of requiredVars) {
          expect(preset.light[v]).toBeDefined();
          expect(preset.dark[v]).toBeDefined();
        }
      }
    });

    it('light and dark variants have different values', () => {
      for (const name of APP_COLOR_NAMES) {
        const preset = APP_COLOR_PRESETS[name]!;
        // Background should differ between light and dark
        expect(preset.light['--background']).not.toBe(preset.dark['--background']);
      }
    });
  });

  describe('hexToAppColorName', () => {
    it('maps known hex values to correct color names', () => {
      expect(hexToAppColorName('#005c67')).toBe('teal');
      expect(hexToAppColorName('#1d9bf0')).toBe('blue');
      expect(hexToAppColorName('#10b981')).toBe('green');
      expect(hexToAppColorName('#ef4444')).toBe('red');
      expect(hexToAppColorName('#c46ede')).toBe('oxy');
    });

    it('is case-insensitive', () => {
      expect(hexToAppColorName('#005C67')).toBe('teal');
      expect(hexToAppColorName('#1D9BF0')).toBe('blue');
    });

    it('defaults to teal for unknown hex values', () => {
      expect(hexToAppColorName('#000000')).toBe('teal');
      expect(hexToAppColorName('#ffffff')).toBe('teal');
      expect(hexToAppColorName('#123456')).toBe('teal');
    });
  });

  describe('HEX_TO_APP_COLOR mapping', () => {
    it('has a hex entry for every named preset', () => {
      const mappedNames = new Set(Object.values(HEX_TO_APP_COLOR));
      for (const name of APP_COLOR_NAMES) {
        expect(mappedNames.has(name)).toBe(true);
      }
    });

    it('hex keys match the preset hex values', () => {
      for (const [hex, name] of Object.entries(HEX_TO_APP_COLOR)) {
        const preset = APP_COLOR_PRESETS[name];
        expect(preset).toBeDefined();
        expect(preset!.hex.toLowerCase()).toBe(hex.toLowerCase());
      }
    });
  });

  describe('Theme type shape', () => {
    it('supports light and dark modes with isDark/isLight flags', () => {
      const lightTheme: Theme = {
        mode: 'light',
        isDark: false,
        isLight: true,
        colors: createMockColors(),
      };
      expect(lightTheme.isDark).toBe(false);
      expect(lightTheme.isLight).toBe(true);

      const darkTheme: Theme = {
        mode: 'dark',
        isDark: true,
        isLight: false,
        colors: createMockColors(),
      };
      expect(darkTheme.isDark).toBe(true);
      expect(darkTheme.isLight).toBe(false);
    });

    it('ThemeMode includes all expected variants', () => {
      const modes: ThemeMode[] = ['light', 'dark', 'system', 'adaptive'];
      expect(modes).toHaveLength(4);
    });
  });
});

function createMockColors(): ThemeColors {
  return {
    background: '#fff',
    backgroundSecondary: '#f5f5f5',
    backgroundTertiary: '#eee',
    text: '#000',
    textSecondary: '#666',
    textTertiary: '#999',
    border: '#ccc',
    borderLight: '#ddd',
    primary: '#005c67',
    primaryLight: '#e0f7fa',
    primaryDark: '#003d44',
    secondary: '#005c67',
    tint: '#005c67',
    icon: '#666',
    iconActive: '#005c67',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    primarySubtle: '#e0f7fa',
    primarySubtleForeground: '#003d44',
    negative: '#B91C1C',
    negativeForeground: '#FFFFFF',
    negativeSubtle: '#fef2f2',
    negativeSubtleForeground: '#B91C1C',
    contrast50: '#f5f5f5',
    card: '#f5f5f5',
    shadow: 'rgba(0,0,0,0.1)',
    overlay: 'rgba(0,0,0,0.5)',
  };
}
