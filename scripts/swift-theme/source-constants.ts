/**
 * Constants the Swift generators read from a theme module's SOURCE TEXT instead of importing it,
 * because importing would load what the module also exports: `label-colors.ts` defines its
 * `useLabelColors` hook beside `LABEL_ALPHA`, and that hook's import chain is the whole provider.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** `export const LABEL_ALPHA = { … } as const;` from src/theme/label-colors.ts. */
export function labelAlpha(
  repoRoot: string,
): Record<'label' | 'secondary' | 'tertiary' | 'quaternary', number> {
  const source = readFileSync(join(repoRoot, 'src/theme/label-colors.ts'), 'utf8');
  const body = /export const LABEL_ALPHA = (\{[\s\S]*?\}) as const;/.exec(source)?.[1];
  if (body === undefined) throw new Error('src/theme/label-colors.ts: no LABEL_ALPHA');
  const json = body.replace(/([A-Za-z_]\w*)\s*:/g, '"$1":').replace(/,(\s*\})/g, '$1');
  const value = JSON.parse(json) as Record<string, number>;
  for (const key of ['label', 'secondary', 'tertiary', 'quaternary']) {
    if (typeof value[key] !== 'number') throw new Error(`LABEL_ALPHA.${key} is not a number`);
  }
  return value as Record<'label' | 'secondary' | 'tertiary' | 'quaternary', number>;
}
