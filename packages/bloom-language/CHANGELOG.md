# Changelog

## 1.0.0

First release. Bloom's UI language: views as functions, modifiers chained in order (order means nesting), every value a Bloom token. It draws Bloom's own React Native and web components, with parity against hand-written Bloom on native and web, light and dark. See `docs/bloom-language.mdx` in the Bloom repository.

### Compatibility

- Requires `@oxy.so/bloom` 23.0.0 or newer, React 19, React Native 0.81 or newer and Reanimated 4.6 or newer. `expo-router` (for `@oxy.so/bloom-language/router`), `expo-glass-effect`, `@expo/ui` and `expo-blur` are optional peers for the platform components.
- iOS is type-checked and covered by the Jest parity suites but not yet verified on a device.

### Added

- The core: the node model, `view()`, the environment and custom modifiers, over one spec (runtime tables, the web stylesheet and the compiler's tables, generated from `spec/language.json`).
- Layout, text, icons, material and glass, buttons, avatars, inputs, platform components, navigation (`@oxy.so/bloom-language/router`), overlays and feedback, app chrome, images, containers, and Bloom's generic and product components as language nodes.
- Variants, the motion engine's modifiers and gestures, and interop with plain React Native and Bloom JSX.
- The spec (`spec/language.json`) and the className table (`codemod/classnames.generated.json`) ship with the package, for `@oxy.so/bloom-language-codemod` to read the language the app installs.
- Pair it with `@oxy.so/bloom-language-compiler` for build-time hoisting and chain checks, and with `@oxy.so/bloom-data` for data and state.
