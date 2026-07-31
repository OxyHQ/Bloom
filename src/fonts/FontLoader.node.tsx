import React from 'react';

export interface FontLoaderProps {
  /** Ignored — there is nothing to load. Kept so the API matches every platform. */
  enabled: boolean;
  /** Ignored — nothing is ever pending, so children render immediately. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Node font loader: a pass-through.
 *
 * There is no font registry to load into and no document to inject
 * `@font-face` rules on, so the correct behaviour is to render children and
 * stay out of the way — the same thing `FontLoader.tsx` ends up doing under
 * Node once `applyFontFaces()` hits its `typeof document === 'undefined'`
 * guard.
 *
 * It exists as a separate file rather than reusing that one because
 * `FontLoader.tsx` imports `./apply-font-faces.web` outright, which reaches
 * `font-urls.web`'s `.woff2` imports. Node hands a `.woff2` to the JS parser,
 * so merely LOADING that module is fatal — the guard inside the function never
 * gets a chance to run. Reached only through the `node` export condition on
 * `./fonts`; see `scripts/generate-platform-exports.mjs` for why conditions
 * are the only lever available here.
 */
export function FontLoader({ children }: FontLoaderProps) {
  return <>{children}</>;
}
