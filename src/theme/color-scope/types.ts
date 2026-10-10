import type { CanonicalToken } from '../token-registry';

/** Exact cross-platform color values, keyed by Bloom's canonical token names. */
export type BloomColorScopeTokens = Readonly<Partial<Record<CanonicalToken, string>>>;
