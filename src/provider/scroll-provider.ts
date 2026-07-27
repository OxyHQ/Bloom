/**
 * Native/default binding for the scroll-restoration provider used by
 * {@link BloomProvider}.
 *
 * `@oxyhq/bloom/scroll` is web-forked, so its `browser` export condition hands
 * web consumers the real implementation while native gets the no-op. A compiled
 * `lib/module/provider/index.js` cannot benefit from that condition (it imports
 * a relative path, not the package subpath), so the platform choice is made
 * here by FILENAME instead: Metro picks `scroll-provider.web.ts` on web, and
 * every web bundler that resolves `.web.js` picks the compiled sibling. Same
 * mechanism the toast engine uses for `ToastHost.native.tsx`.
 */
export { ScrollRestorationProvider } from '../scroll';
