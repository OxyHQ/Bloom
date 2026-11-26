/**
 * Web parity of the corpus: each region as the app draws it (NativeWind's web
 * runtime hands the classes to react-native-web, the app's Tailwind sheet in
 * the document) and as the codemod wrote it, compared as DOM and the CSS that
 * reaches each element.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { webTree } from '../../bloom-language/parity/support/web';
import { CORPUS, loadCorpus } from './support/corpus';
import { insertRules, jsdomRules, normalizeWeb } from './support/web-css';

const { cases, css } = loadCorpus();
const results: Record<string, boolean> = {};

beforeAll(() => {
  insertRules(jsdomRules(css));
});

afterAll(() => {
  if (!process.env.CODEMOD_CORPUS) return;
  writeFileSync(join(CORPUS, 'parity-web.json'), `${JSON.stringify(results, null, 1)}\n`);
  // The language's colours at an opacity as it declared them (web-sheet.ts, adoptInk),
  // for the Chrome check: jsdom drops the percentage of a color-mix(), Chrome computes it.
  writeFileSync(join(CORPUS, 'language-ink.css'), `${languageInk()}\n`);
});

function languageInk(): string {
  const sheets: CSSStyleSheet[] = [...Array.from(document.styleSheets)];
  const adopted = (document as Document & { adoptedStyleSheets?: CSSStyleSheet[] })
    .adoptedStyleSheets;
  if (adopted) sheets.push(...adopted);
  return sheets
    .flatMap((sheet) => Array.from(sheet.cssRules))
    .filter((rule) => rule.cssText.includes('--bl-'))
    .map((rule) => rule.cssText)
    .join('\n');
}

describe.each(['light', 'dark'] as const)('%s', (scheme) => {
  it.each(cases.map((c) => [c.name, c] as const))('%s', (name, c) => {
    const before = normalizeWeb(webTree(c.before(), scheme));
    const after = normalizeWeb(webTree(c.after(), scheme));
    results[`${scheme} ${name}`] = JSON.stringify(before) === JSON.stringify(after);
    expect(after).toEqual(before);
  });
});

/**
 * The theme's variables as the document declares them in each scheme, for
 * the Chrome check of colours at an opacity (`scripts/verify-colors-chrome.mjs`):
 * jsdom drops a `color-mix()` of a variable, Chrome computes it.
 */
function variablesAt(probe: Element): Record<string, string> {
  const chain: Element[] = [];
  for (let at: Element | null = probe; at; at = at.parentElement) chain.unshift(at);
  const out: Record<string, string> = {};
  const sheets: CSSStyleSheet[] = [...Array.from(document.styleSheets)];
  const adopted = (document as Document & { adoptedStyleSheets?: CSSStyleSheet[] })
    .adoptedStyleSheets;
  if (adopted) sheets.push(...adopted);
  const visit = (list: CSSRuleList) => {
    for (const rule of Array.from(list)) {
      if ('selectorText' in rule) {
        const style = rule as CSSStyleRule;
        for (const element of chain) {
          let hits = false;
          try {
            hits = element.matches(style.selectorText);
          } catch {}
          if (!hits) continue;
          for (let i = 0; i < style.style.length; i++) {
            const name = style.style[i] as string;
            if (name.startsWith('--')) out[name] = style.style.getPropertyValue(name).trim();
          }
        }
      } else if ('cssRules' in rule) visit((rule as CSSGroupingRule).cssRules);
    }
  };
  for (const sheet of sheets) visit(sheet.cssRules);
  for (const element of chain) {
    const inline = (element as HTMLElement).style;
    if (!inline) continue;
    for (let i = 0; i < inline.length; i++) {
      const name = inline[i] as string;
      if (name.startsWith('--')) out[name] = inline.getPropertyValue(name).trim();
    }
  }
  return out;
}

if (process.env.CODEMOD_CORPUS) {
  it('records the theme’s variables for the Chrome check', () => {
    const { BloomThemeProvider } =
      require('@oxy.so/bloom/theme') as typeof import('@oxy.so/bloom/theme');
    const { createRoot } = require('react-dom/client') as typeof import('react-dom/client');
    const { act } = require('react') as typeof import('react');
    const variables: Record<string, Record<string, string>> = {};
    for (const scheme of ['light', 'dark'] as const) {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      act(() =>
        root.render(
          <BloomThemeProvider fonts={false} mode={scheme}>
            <div data-probe="" />
          </BloomThemeProvider>,
        ),
      );
      variables[scheme] = variablesAt(container.querySelector('[data-probe]') as Element);
      act(() => root.unmount());
      container.remove();
    }
    writeFileSync(join(CORPUS, 'theme-variables.json'), `${JSON.stringify(variables, null, 1)}\n`);
  });
}
