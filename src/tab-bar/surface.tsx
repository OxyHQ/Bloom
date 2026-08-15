/**
 * Ported from expo-glass-tabs v0.1.1 — src/glass-tab-bar.tsx
 * (MIT © 2026 David Mokos).
 *
 * NEUTRAL default variant of the tab bar's capsule surface: the non-glass one.
 *
 * This is the file resolved by everything that does NOT do React Native's
 * platform-extension resolution — a consumer's `tsc` (which follows Bloom's
 * `"react-native"` source export condition) and any non-Metro bundler reading
 * the published `lib/`. It therefore imports NOTHING platform-specific:
 * `expo-glass-effect` is native-only, and a static import of it from a file a
 * web bundler or a consumer's type-checker resolves would break module
 * resolution outright. Same three-way split, for the same reason, as
 * `theme/native-root-vars{,.native,.web}.ts`.
 *
 * The surface itself lives in `surface-solid.tsx`, because `surface.native.tsx`
 * renders it as its own fallback and cannot import this file to get it — Metro
 * resolves `./surface` back to `surface.native.tsx`, i.e. to itself. This module's
 * job is to give that one implementation the name every entry module imports.
 *
 * The variants — all three implement `TabBarSurfaceProps` exactly, so the entry
 * modules can swap them freely:
 *   - `surface.native.tsx` — iOS/Android (Metro), real `UIGlassEffect` glass, with
 *     the solid surface as its fallback;
 *   - `surface.web.tsx`    — web, a CSS `backdrop-filter`;
 *   - this file            — everywhere else, the opaque fallback alone.
 */
export { SolidTabBarSurface as TabBarSurface } from './surface-solid';
