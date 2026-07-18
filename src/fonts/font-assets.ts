// Platform-neutral default font asset map — deliberately empty.
//
// The real map is Metro-only (`font-assets.native.ts`): it is built from
// `require('./assets/*.ttf')` asset requires, which are meaningless outside
// Metro and fatal inside an ES module, where `require` is not defined. This
// default therefore carries no asset requires at all, per the platform-split
// rule in AGENTS.md — anything with platform-specific behaviour ships
// `.native.ts` + `.web.ts` + a clean default `.ts` that no bundler can choke
// on.
//
// Who lands here: any consumer whose bundler does no platform-extension
// resolution. In practice that is the `"import"` export condition — Node ESM,
// SSR, and prerender passes. They get an empty map and load no fonts, which is
// correct: there is no native font registry to load them into. Metro takes
// `font-assets.native.ts`, and the web barrel names `./font-assets.web`
// outright.
import type { FontAssetMap } from './tokens';

export const FONT_ASSETS: FontAssetMap = {};
