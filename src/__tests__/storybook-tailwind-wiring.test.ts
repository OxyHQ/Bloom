import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * The Storybook harness's Tailwind pipeline, asserted as SOURCE.
 *
 * WHAT THIS CAN SEE, AND WHAT IT CANNOT.
 *
 * It can see the wiring being DELETED. It cannot see it being BROKEN: whether a
 * class resolves to the right value is a question only a real browser answers,
 * because the failure mode is a class name reaching the DOM with no rule behind
 * it. react-native-css's `styled()` stamps every `className` onto the element
 * via react-native-web's `$$css` escape hatch whether or not a stylesheet backs
 * it, so an unwired harness renders valid markup, throws nothing, logs nothing,
 * and keeps its colours (Bloom applies those inline). That is what makes
 * deletion the dangerous direction and worth a cheap gate: the harness would go
 * on reporting success over components whose entire layout stopped applying —
 * the same shape as the `fonts={false}` that covered the font system with
 * nothing for months.
 *
 * `nativewind` is asserted as an installed devDependency, not merely as a peer.
 * It is where the `web:` / `native:` / `ios:` / `android:` variants come from,
 * and `content-panel` is built out of `web:sticky` and `web:[clip-path:…]`.
 * (Uninstalling it also reddens `color-scope-nativewind.test.ts`, whose plain
 * `doMock` needs the specifier to resolve — but that suite would be satisfied
 * by any resolvable copy, so it is not a substitute for this assertion.)
 */

const ROOT = path.resolve(__dirname, '../..');
const read = (rel: string) => readFileSync(path.join(ROOT, rel), 'utf8');

describe('the Storybook Tailwind pipeline is wired', () => {
  it('has the stylesheet imported by the preview', () => {
    expect(read('.storybook/preview.tsx')).toContain("import './tailwind.css'");
  });

  it('registers @tailwindcss/vite in the Storybook Vite config', () => {
    const main = read('.storybook/main.ts');
    expect(main).toContain("from '@tailwindcss/vite'");
    expect(main).toContain('plugins: [tailwindcss()]');
  });

  it('compiles the same stylesheet a consumer compiles', () => {
    const css = read('.storybook/tailwind.css');
    // The four upstream layers, in the order `@oxyhq/app-preset/css/base.css`
    // and the website's `src/index.css` use. `utilities.css` must stay
    // UNLAYERED — layered, it loses to react-native-web's unlayered reset.
    expect(css).toContain('@import "tailwindcss/theme.css" layer(theme);');
    expect(css).toContain('@import "tailwindcss/preflight.css" layer(base);');
    expect(css).toContain('@import "tailwindcss/utilities.css";');
    expect(css).toContain('@import "nativewind/theme";');
    // Bloom's own token vocabulary: `rounded-radius-28`, `p-space-8`,
    // `text-body`, `bg-fill`, `shadow-s` and the colour roles all come from it.
    expect(css).toContain('@import "../src/design-tokens/theme.css";');
    // Bloom drives dark mode with a class, so the stock media-query variant
    // would ignore both `BloomThemeProvider`'s mode and Storybook's toolbar.
    expect(css).toContain('@custom-variant dark (&:where(.dark, .dark *));');
    // Without a source glob Tailwind generates nothing Bloom uses. Suites are
    // excluded because bob keeps them out of `lib/`: a class named only in a
    // test would resolve in the harness and in no consumer, which is the one
    // direction in which the harness can lie. Removing the exclusion measured
    // as four extra utilities generated from this file's own assertions.
    expect(css).toContain('@source "../src/**/*.{ts,tsx}";');
    expect(css).toContain('@source not "../src/**/__tests__/**/*";');
  });

  it('installs the packages that stylesheet resolves against', () => {
    const pkg = JSON.parse(read('package.json')) as {
      devDependencies: Record<string, string | undefined>;
    };
    expect(pkg.devDependencies.tailwindcss).toBeDefined();
    expect(pkg.devDependencies['@tailwindcss/vite']).toBeDefined();
    expect(pkg.devDependencies.nativewind).toBeDefined();
  });
});
