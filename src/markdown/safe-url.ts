/** Characters a browser ignores inside a URL, which is how `java\tscript:` gets through a naive check. */
// biome-ignore lint/suspicious/noControlCharactersInRegex: the control characters are the point
const INVISIBLE = /[\u0000- \u007f-\u009f​-‍⁠﻿]/g;
const SCHEME = /^([a-z][a-z0-9+.-]*):/i;

/**
 * The URL when a link may point at it, otherwise `undefined`: `http(s):`,
 * `mailto:` and relative references (`/a`, `a/b`, `#top`). Every other scheme
 * (`javascript:`, `data:`, `vbscript:`, `file:`…) and a protocol-relative
 * `//host` are refused.
 */
export function safeUrl(url: string): string | undefined {
  const trimmed = url.trim();
  const probe = trimmed.replace(INVISIBLE, '');
  if (probe === '') return undefined;
  const scheme = SCHEME.exec(probe);
  if (scheme) return /^(https?|mailto)$/i.test(scheme[1] ?? '') ? trimmed : undefined;
  return /^[/\\]{2}/.test(probe) ? undefined : trimmed;
}
