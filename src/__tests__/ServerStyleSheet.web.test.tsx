/** @jest-environment jsdom */
import { act } from 'react';
import { renderToString } from 'react-dom/server';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { ServerStyleSheet } from '../styles/ServerStyleSheet';
import { ServerStyleContext, type ServerStylePolicy } from '../styles/context';
import { installConstructedStyleSheets } from './support/constructed-style-sheets';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Fixture({
  policy,
  css = '.workspace{width:380px}',
}: {
  policy?: ServerStylePolicy;
  css?: string;
}) {
  return (
    <ServerStyleContext.Provider value={policy}>
      <ServerStyleSheet id="ssr-regression" css={css} />
      <main>Workspace</main>
    </ServerStyleContext.Provider>
  );
}

describe('explicit server styles', () => {
  const sheets = installConstructedStyleSheets();
  let host: HTMLDivElement;
  let root: Root | undefined;
  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });
  afterEach(async () => {
    if (root) await act(async () => root?.unmount());
    root = undefined;
    host.remove();
  });
  afterAll(() => sheets.uninstall());

  it('emits no inline stylesheet unless the host opts in', () => {
    expect(renderToString(<Fixture />)).not.toContain('<style');
    expect(renderToString(<Fixture policy="inline" />)).toContain('.workspace{width:380px}');
  });

  it.each(['inline', { nonce: 'server-policy-nonce' }] as const)(
    'retains nodes while adopting and retiring server CSS for %j',
    async (policy) => {
      const fixture = <Fixture policy={policy} />;
      host.innerHTML = renderToString(fixture);
      const style = host.querySelector('style');
      expect(style?.textContent).toBe('.workspace{width:380px}');
      expect(style?.getAttribute('nonce')).toBe(typeof policy === 'object' ? policy.nonce : null);
      const original = host.querySelector('main');
      const errors: unknown[] = [];
      await act(async () => {
        root = hydrateRoot(host, fixture, { onRecoverableError: (error) => errors.push(error) });
      });
      expect(host.querySelector('main')).toBe(original);
      expect(host.querySelector('style')).toBeNull();
      expect(errors).toEqual([]);
      expect(sheets.adopted().some((sheet) => sheet.cssText === '.workspace{width:380px}')).toBe(
        true,
      );
      await act(async () =>
        root?.render(<Fixture policy={policy} css=".workspace{width:520px}" />),
      );
      expect(host.querySelector('main')).toBe(original);
      expect(host.querySelector('style')).toBeNull();
      expect(sheets.adopted().some((sheet) => sheet.cssText === '.workspace{width:520px}')).toBe(
        true,
      );
      expect(sheets.adopted().some((sheet) => sheet.cssText === '.workspace{width:380px}')).toBe(
        false,
      );
    },
  );

  it('does not inject an inline sheet on a client-only mount', async () => {
    await act(async () => {
      root = createRoot(host);
      root.render(<Fixture policy="inline" />);
    });
    expect(host.querySelector('style')).toBeNull();
    expect(sheets.adopted().some((sheet) => sheet.cssText === '.workspace{width:380px}')).toBe(
      true,
    );
  });

  it('keeps CSS text from escaping the server style element', () => {
    host.innerHTML = renderToString(
      <Fixture policy="inline" css={'a{content:"</style><script>evil()</script>"}'} />,
    );
    expect(host.querySelectorAll('style')).toHaveLength(1);
    expect(host.querySelector('script')).toBeNull();
    expect(host.querySelector('main')?.textContent).toBe('Workspace');
  });
});
