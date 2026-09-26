// Bloom's icon set is Remix Icon (Remix Icon License 1.0, `remix/LICENSE.txt`),
// one file per icon under `remix/`. The few brand marks Remix lacks come from
// Simple Icons (CC0 1.0) under `simple-icons/`. Old Bloom icon names map to
// their Remix equivalents in `remix-mapping.json`;
// `scripts/migrate-icons-to-remix.mjs` rewrites an app's imports.
export type { IconStyle, Props } from './shared';
export type { BloomIconComponent } from './icon-component';
export type { BloomIconPaint, BloomIconRenderer } from './render-icon';
export { resolveIconSlot } from './render-icon';
export { sizes, useCommonSVGProps } from './shared';
export * from './remix';
export * from './simple-icons';
