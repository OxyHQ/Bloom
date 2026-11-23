# Changelog

## 1.0.0

First release. Bloom's native lens material for Android 13+: the overlay, refraction and motion that menus, selects and prominent controls use when the app's binary has this module (an Expo module; rebuild the app after installing it). `@oxy.so/bloom` 23 resolves it lazily as an optional peer and keeps its own material where it is absent; apps do not import it directly.

Parts come from expo-glass-custom-menu under the MIT licence, with Bloom's changes kept as patches; see `NOTICE`.
