import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * `@oxy.so/bloom-text/model` is platform-free: a server reads it (Nilo's API
 * projects documents with it). One import of React Native anywhere it reaches,
 * even of a type, hands every consumer React Native's globals.
 */
describe('@oxy.so/bloom-text/model', () => {
  it('reaches no React Native, not even for a type', () => {
    const src = join(__dirname, '..');
    const seen = new Set<string>();
    const offenders: string[] = [];
    const visit = (file: string) => {
      if (seen.has(file)) return;
      seen.add(file);
      const code = readFileSync(join(src, `${file}.ts`), 'utf8');
      for (const match of code.matchAll(/from '([^']+)'/g)) {
        const specifier = match[1] as string;
        if (specifier.startsWith('./')) visit(specifier.slice(2));
        else if (/^react-native|^react$|^expo/.test(specifier))
          offenders.push(`${file}: ${specifier}`);
      }
    };
    visit('model');
    expect(offenders).toEqual([]);
    expect(seen.size).toBeGreaterThan(3);
  });
});
