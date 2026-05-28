/**
 * @jest-environment jsdom
 */

const CSS_VAR_NAME = '--css-interop-darkMode';

interface RNMock {
  Platform: { OS: 'ios' | 'android' | 'web' | 'windows' | 'macos' };
}

describe('initCssInteropDarkMode', () => {
  beforeEach(() => {
    jest.resetModules();
    document.documentElement.style.removeProperty(CSS_VAR_NAME);
  });

  it('sets the --css-interop-darkMode CSS variable on the document root when on web', () => {
    expect(document.documentElement.style.getPropertyValue(CSS_VAR_NAME)).toBe('');

    jest.isolateModules(() => {
      const rn = require('react-native') as RNMock;
      rn.Platform.OS = 'web';
      // Importing the module triggers the side-effect initializer.
      require('../theme/init-css-interop');
    });

    expect(document.documentElement.style.getPropertyValue(CSS_VAR_NAME)).toBe('class dark');
  });

  it('does not clobber an explicit value already set by the host app', () => {
    document.documentElement.style.setProperty(CSS_VAR_NAME, 'media');

    jest.isolateModules(() => {
      const rn = require('react-native') as RNMock;
      rn.Platform.OS = 'web';
      require('../theme/init-css-interop');
    });

    expect(document.documentElement.style.getPropertyValue(CSS_VAR_NAME)).toBe('media');
  });

  it('is idempotent: subsequent calls to initCssInteropDarkMode() do not re-write', () => {
    jest.isolateModules(() => {
      const rn = require('react-native') as RNMock;
      rn.Platform.OS = 'web';
      const { initCssInteropDarkMode } = require('../theme/init-css-interop') as {
        initCssInteropDarkMode: () => void;
      };

      // First call ran on import. Clear the value to prove the second call
      // is a no-op (does not re-write).
      document.documentElement.style.removeProperty(CSS_VAR_NAME);
      initCssInteropDarkMode();

      expect(document.documentElement.style.getPropertyValue(CSS_VAR_NAME)).toBe('');
    });
  });

  it('skips the CSS variable on non-web platforms', () => {
    jest.isolateModules(() => {
      const rn = require('react-native') as RNMock;
      rn.Platform.OS = 'ios';
      require('../theme/init-css-interop');
    });

    expect(document.documentElement.style.getPropertyValue(CSS_VAR_NAME)).toBe('');
  });

  it('attempts to call StyleSheet.setFlag when react-native-css-interop exposes it', () => {
    const setFlag = jest.fn();

    jest.isolateModules(() => {
      const rn = require('react-native') as RNMock;
      rn.Platform.OS = 'web';
      jest.doMock(
        'react-native-css-interop',
        () => ({
          StyleSheet: { setFlag },
        }),
        { virtual: true },
      );

      require('../theme/init-css-interop');
    });

    expect(setFlag).toHaveBeenCalledTimes(1);
    expect(setFlag).toHaveBeenCalledWith('darkMode', 'class');
  });

  it('tolerates react-native-css-interop being absent (not a Bloom dep)', () => {
    jest.isolateModules(() => {
      const rn = require('react-native') as RNMock;
      rn.Platform.OS = 'web';
      jest.doMock(
        'react-native-css-interop',
        () => {
          throw new Error('Cannot find module');
        },
        { virtual: true },
      );

      expect(() => require('../theme/init-css-interop')).not.toThrow();
    });
  });

  it('does not throw if setFlag itself throws — warns instead', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const setFlag = jest.fn(() => {
      throw new Error('setFlag boom');
    });

    jest.isolateModules(() => {
      const rn = require('react-native') as RNMock;
      rn.Platform.OS = 'web';
      jest.doMock(
        'react-native-css-interop',
        () => ({
          StyleSheet: { setFlag },
        }),
        { virtual: true },
      );

      expect(() => require('../theme/init-css-interop')).not.toThrow();
    });

    expect(setFlag).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
