import * as ReactNative from 'react-native';
import { VariableContextProvider } from 'react-native-css';

import {
  buildNativePresetStyle,
  buildScopeVars,
  getVariableContextProvider,
} from '../theme/color-scope/style-builder';

/**
 * `BloomColorScope` publishes a preset's CSS vars through react-native-css's
 * `VariableContext`. `react-native-css` is a REQUIRED peer, so the one thing
 * that can still go wrong silently is IDENTITY: a provider from a second copy
 * of the package publishes into a context the app's className components never
 * read. The first case pins that the scope hands out the very export the app
 * imports.
 */

const originalOS = ReactNative.Platform.OS;

afterEach(() => {
  ReactNative.Platform.OS = originalOS;
});

describe('BloomColorScope variable publishing', () => {
  it('uses react-native-css’s own VariableContextProvider on native', () => {
    ReactNative.Platform.OS = 'ios';
    expect(getVariableContextProvider()).toBe(VariableContextProvider);
  });

  it('forwards the whole scope payload through vars() on native', () => {
    ReactNative.Platform.OS = 'android';
    const style = buildNativePresetStyle('blue', 'dark') as Record<string, string>;
    // Not just "defined": the record must carry the canonical tokens plus the
    // Tailwind `--color-*` aliases, which is the whole payload of a scope.
    // An empty `vars({})` would otherwise read as a working scope.
    expect(style['--primary']).toMatch(/^rgb/);
    expect(style['--color-primary']).toBe(style['--primary']);
  });

  it('publishes nothing through the context on web, where the vars go on documentElement', () => {
    ReactNative.Platform.OS = 'web';
    expect(getVariableContextProvider()).toBeNull();
    expect(buildNativePresetStyle('blue', 'light')).toBeUndefined();
  });

  it('builds the same token map on every platform', () => {
    const scope = buildScopeVars('green', 'light');
    expect(scope['--primary']).toMatch(/^rgb/);
    expect(scope['--color-primary']).toBe(scope['--primary']);
  });
});
