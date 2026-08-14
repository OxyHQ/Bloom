/**
 * Entry for `@oxyhq/bloom/scroll/expo-router` — the ONE module in the scroll
 * primitive that knows a router exists. Kept a barrel so the published entry
 * path stays stable while the adapter itself lives in a named module.
 */
export { expoRouterScrollAdapter } from './expo-router-adapter';
