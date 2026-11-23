/** The web: a server-rendered page carries the language's sheets, as Bloom's own (`ssrStyles`). */
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { ServerStyleContext } from '../../../../src/styles/context';
import { LIGHT, PaintContext } from './support/bloom-theme';
import { HStack, Text, VStack } from '../primitives';
import { LanguageStyles, toElement } from '../render';
import { COLORS } from '../generated/spec.generated';
import { WEB_CLASS, WEB_SHEET } from '../generated/web-sheet.generated';
import { adoptInk, inkClass, languageSheets } from '../web-sheet';

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: { OS: 'web', select: <T,>(spec: { web?: T; default?: T }) => spec.web ?? spec.default },
}));

// The stand-in hosts are lower-case names react-dom warns of; nothing else is silenced.
const consoleError = console.error;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (String(args[0]).includes('is using incorrect casing')) return;
    consoleError(...args);
  });
});

const serve = (element: ReturnType<typeof toElement>, policy?: 'inline') =>
  renderToString(
    createElement(
      ServerStyleContext.Provider,
      { value: policy },
      createElement(PaintContext.Provider, { value: LIGHT }, element),
    ),
  );
const styled = (...children: ReturnType<typeof toElement>[]) =>
  createElement(LanguageStyles, null, ...children);

describe('server-rendered HTML', () => {
  it('holds the generated sheet and the variant sheets the tree drew, once, after it', () => {
    const html = serve(
      styled(
        toElement(
          VStack(
            Text('a'),
            HStack(Text('b'))
              .onPress(() => {})
              .when('hovered', (v) => v.background('surface')),
          ).when('md', (v) => v.padding('lg')),
        ),
      ),
      'inline',
    );
    const ids = [...html.matchAll(/data-bloom-server-style="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toEqual(['bloom-language', 'bloom-language-md', 'bloom-language-hovered']);
    expect(html.indexOf('data-bloom-server-style')).toBeGreaterThan(html.indexOf('>b<'));
    expect(html).toContain(WEB_SHEET.slice(0, 200));
  });

  it('holds the ink classes and the inks drawn, the inks last', () => {
    const base = WEB_CLASS['backgroundColor:@primary'] as string;
    const ink = 'var(--bl-primary-50)';
    expect(inkClass(base, 'primary/50', COLORS.primary.web, ink)).toBe(`${base}-primary-50`);
    adoptInk('--bl-primary-50', `color-mix(in srgb, ${COLORS.primary.web} 50%, transparent)`);
    // The variant sheets an earlier render drew sit between them.
    const sheets = languageSheets();
    const ids = sheets.map(([id]) => id);
    expect(ids.slice(0, 2)).toEqual(['bloom-language', 'bloom-language-ink-classes']);
    expect(ids[ids.length - 1]).toBe('bloom-language-ink');
    expect(sheets[1]?.[1]).toContain(`.${base}-primary-50`);
    expect(sheets[sheets.length - 1]?.[1]).toContain('--bl-primary-50:color-mix(');
  });

  it('one inside another writes nothing, and no policy writes nothing', () => {
    const html = serve(styled(toElement(Text('a')), styled(toElement(Text('b')))), 'inline');
    expect(html.match(/data-bloom-server-style="bloom-language"/g)).toHaveLength(1);
    expect(serve(styled(toElement(VStack(Text('x')))))).not.toContain('data-bloom-server-style');
    // A language tree on its own writes no sheet: the app's root `LanguageStyles` does.
    expect(serve(toElement(VStack(Text('y'))), 'inline')).not.toContain('data-bloom-server-style');
  });
});
