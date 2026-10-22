/** @jest-environment jsdom */
import React, { act, useEffect } from 'react';
import { renderToString } from 'react-dom/server';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';

let runtimeLanguage = 'en-US';
jest.mock('../locale/languages', () => ({
  ...jest.requireActual('../locale/languages'),
  runtimeLocale: () => runtimeLanguage,
}));
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomProvider } from '../provider/BloomProvider';
import { useBloomLocale } from '../locale/context';
import { COMMON_MESSAGES } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import * as translations from '../locale/translations';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const loadLanguage = translations.loadBloomLanguage;

describe('locale hydration and delayed translations', () => {
  let host: HTMLDivElement;
  let root: Root | undefined;
  let load: jest.SpyInstance;
  let consoleErrors: jest.SpyInstance;
  let mounts: number;
  let unmounts: number;

  function Content() {
    const { messages } = useMessages(COMMON_MESSAGES);
    const locale = useBloomLocale();
    useEffect(() => {
      mounts++;
      return () => {
        unmounts++;
      };
    }, []);
    return (
      <button data-testid="content">
        {locale}:{messages.cancel}
      </button>
    );
  }
  function Fixture({ waiting = false }: { waiting?: boolean }) {
    return (
      <BloomProvider
        fonts={false}
        mode="light"
        onFontsLoading={waiting ? <span>Loading</span> : undefined}
      >
        <Content />
      </BloomProvider>
    );
  }

  beforeEach(() => {
    runtimeLanguage = 'en-US';
    mounts = 0;
    unmounts = 0;
    translations.resetBloomTranslations();
    // Keep the language chunk pending beyond hydration. No timer can paper over
    // a subtree disappearing while the real network request is outstanding.
    load = jest
      .spyOn(translations, 'loadBloomLanguage')
      .mockImplementation(() => new Promise(() => {}));
    consoleErrors = jest.spyOn(console, 'error').mockImplementation(() => {});
    host = document.createElement('div');
    document.body.append(host);
  });
  afterEach(async () => {
    if (root) await act(async () => root?.unmount());
    root = undefined;
    host.remove();
    load.mockRestore();
    consoleErrors.mockRestore();
    translations.resetBloomTranslations();
  });

  it.each(['es-ES', 'ar', 'de-DE'])(
    'keeps the server node visible while %s loads',
    async (language) => {
      const fixture = <Fixture waiting />;
      host.innerHTML = renderToString(fixture);
      const original = host.querySelector('button');
      const serverText = original?.textContent;
      expect(serverText).toContain(':Cancel');
      runtimeLanguage = language;
      const errors: unknown[] = [];
      await act(async () => {
        root = hydrateRoot(host, fixture, { onRecoverableError: (error) => errors.push(error) });
      });
      expect(host.querySelector('button')).toBe(original);
      expect(original?.textContent).toBe(serverText);
      expect(load).toHaveBeenCalled();
      expect(mounts).toBe(1);
      expect(unmounts).toBe(0);
      expect(errors).toEqual([]);
      expect(
        consoleErrors.mock.calls.filter((call) => /hydrat|didn't match/i.test(String(call[0]))),
      ).toEqual([]);

      await act(async () => {
        await loadLanguage(language.split('-')[0] as 'es' | 'ar' | 'de');
      });
      expect(host.querySelector('button')).toBe(original);
      expect(original?.textContent).toMatch(new RegExp(`^${language}:`));
      expect(original?.textContent).not.toBe(`${language}:Cancel`);
      expect(mounts).toBe(1);
      expect(unmounts).toBe(0);
    },
  );

  it('renders content on a client-only mount when no loading screen was supplied', async () => {
    runtimeLanguage = 'es-ES';
    await act(async () => {
      root = createRoot(host);
      root.render(<Fixture />);
    });
    expect(host.querySelector('button')?.textContent).toBe('en:Cancel');
    expect(mounts).toBe(1);
    expect(unmounts).toBe(0);
  });

  it('honors an explicit loading screen for an automatic translated client-only mount', async () => {
    runtimeLanguage = 'es-ES';
    await act(async () => {
      root = createRoot(host);
      root.render(<Fixture waiting />);
    });
    expect(host.querySelector('button')).toBeNull();
    expect(host.textContent).toBe('Loading');
    await act(async () => {
      await loadLanguage('es');
    });
    expect(host.querySelector('button')?.textContent).toBe('es-ES:Cancelar');
    expect(mounts).toBe(1);
  });
});
