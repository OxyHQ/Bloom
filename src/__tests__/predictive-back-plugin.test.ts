jest.mock('expo/config-plugins', () => ({
  withGradleProperties: (_config: unknown, apply: unknown) => apply,
}));
const plugin = require('../../app.plugin.js') as (
  config: object,
  options?: { predictiveBack: boolean },
) => (mod: { modResults: { type: string; key: string; value: string }[] }) => {
  modResults: { type: string; key: string; value: string }[];
};
const sourceBuild = {
  plugins: [['expo-build-properties', { android: { buildReactNativeFromSource: true } }]],
};

it('requires an explicit source build before enabling the typed native ownership bridge', () => {
  expect(() => plugin({}, { predictiveBack: true })).toThrow('buildReactNativeFromSource');
  expect(() =>
    plugin(
      { plugins: [['expo-build-properties', { android: { buildReactNativeFromSource: false } }]] },
      { predictiveBack: true },
    ),
  ).toThrow('buildReactNativeFromSource');
});

it('accepts shared source-build configuration while respecting an explicit Android override', () => {
  expect(() =>
    plugin(
      { plugins: [['expo-build-properties', { buildReactNativeFromSource: true }]] },
      { predictiveBack: true },
    ),
  ).not.toThrow();
  expect(() =>
    plugin(
      {
        plugins: [
          [
            'expo-build-properties',
            { buildReactNativeFromSource: true, android: { buildReactNativeFromSource: false } },
          ],
        ],
      },
      { predictiveBack: true },
    ),
  ).toThrow('buildReactNativeFromSource');
});

it('does not remove an independent native stack opt-in when Bloom was not enabled', () => {
  const input = {
    modResults: [{ type: 'property', key: 'rnscreens.nativeBackOwnershipEnabled', value: 'true' }],
  };
  expect(plugin({})(input).modResults).toEqual([
    { type: 'property', key: 'rnscreens.nativeBackOwnershipEnabled', value: 'true' },
  ]);
});

it('is idempotent and removes its own opt-in when disabled', () => {
  const input = { modResults: [{ type: 'property', key: 'unrelated', value: 'keep' }] };
  const apply = plugin(sourceBuild, { predictiveBack: true });
  expect(apply(apply(input)).modResults).toEqual([
    { type: 'property', key: 'unrelated', value: 'keep' },
    { type: 'property', key: 'bloom.predictiveBackEnabled', value: 'true' },
    { type: 'property', key: 'rnscreens.nativeBackOwnershipEnabled', value: 'true' },
  ]);
  expect(plugin({})(input).modResults).toEqual([
    { type: 'property', key: 'unrelated', value: 'keep' },
  ]);
});
