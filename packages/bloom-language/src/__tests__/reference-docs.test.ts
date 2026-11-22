import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

/**
 * The generated reference (docs/bloom-language-{nodes,modifiers,tokens}.mdx)
 * says exactly what the spec and the types say: a spec or type change that
 * did not regenerate it fails here.
 */
describe('the language reference', () => {
  it('is current', () => {
    const script = join(__dirname, '../../scripts/generate-reference.mjs');
    expect(() =>
      execFileSync(process.execPath, [script, '--check'], { stdio: 'pipe' }),
    ).not.toThrow();
  });
});
