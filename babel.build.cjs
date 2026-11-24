// The Babel config bob builds published JS targets with (`configFile` in the
// `react-native-builder-bob` targets of the root package, bloom-data,
// bloom-text and bloom-editor): bob's own preset, with the React Compiler first.
//
// Apps' React Compiler never reaches Bloom: babel-preset-expo skips files under
// node_modules, so a component is memoized only if its package shipped it
// compiled. The options are the ones Expo runs app code with (target 19,
// `infer`, an error leaves the function as written instead of failing the
// build), function outlining included.
// `react/compiler-runtime` is part of React 19, which every consumer runs.
//
// Outlining moves a lambda that captures nothing of its component to module
// scope, and the compiler takes the parameters of a function a component is
// built inside for globals: a lambda in a component a factory built
// (`createSettingsSelect(parts)`) was moved out of the factory and threw
// `SelectItem is not defined`. 23.5.0 to 23.7.0 built with outlining off for
// it. Components are defined at module scope, and verify-react-compiler.mjs
// fails on an outlined function that uses a name only a function binds.
//
// bloom-language does not build with it: its hosts call app bodies that call
// hooks, and a memoized call skips them (docs/verification.mdx).
//
// scripts/verify-react-compiler.mjs reads this config and fails the build when
// lib/ is not what the compiler makes of src/.
module.exports = {
  presets: ['react-native-builder-bob/babel-preset'],
  plugins: [['babel-plugin-react-compiler', { target: '19', panicThreshold: 'none' }]],
};
