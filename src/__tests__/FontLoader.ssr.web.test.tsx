/** @jest-environment jsdom */
import { act, useId } from 'react';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { Platform } from 'react-native';
import { FontLoader } from '../fonts/FontLoader';
import { applyFontFaces } from '../fonts/apply-font-faces.web';
import { ServerStyleContext, type ServerStylePolicy } from '../styles/context';
import { dropStyleSheet } from '../styles/adopt-style-sheet';
import {
  installConstructedStyleSheets,
  type ConstructedStyleSheetsHarness,
} from './support/constructed-style-sheets';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const originalPlatform = Platform.OS;
let sheets: ConstructedStyleSheetsHarness;

function Content() {
  return <h1 id={useId()}>An already visible mailbox</h1>;
}

function Fixture({
  enabled = true,
  policy = 'inline',
}: {
  enabled?: boolean;
  policy?: ServerStylePolicy | null;
}) {
  return (
    <ServerStyleContext.Provider value={policy ?? undefined}>
      <FontLoader enabled={enabled} fallback={<p>Must not replace the mailbox</p>}>
        <Content />
      </FontLoader>
    </ServerStyleContext.Provider>
  );
}

beforeEach(() => {
  Platform.OS = 'web';
  sheets = installConstructedStyleSheets();
});

afterEach(() => {
  dropStyleSheet('bloom-fonts');
  sheets.uninstall();
  Platform.OS = originalPlatform;
});

it('publishes all font faces before server text without waiting for JavaScript', () => {
  const html = renderToString(<Fixture policy={{ nonce: 'host-font-nonce' }} />);
  const host = document.createElement('div');
  host.innerHTML = html;
  const style = host.querySelector('[data-bloom-server-style="bloom-fonts"]');
  expect(style?.getAttribute('nonce')).toBe('host-font-nonce');
  expect(style?.textContent?.match(/@font-face/g)).toHaveLength(4);
  for (const family of ['Inter', 'JetBrains Mono', 'BlomusModernus']) {
    expect(style?.textContent).toContain(`font-family: '${family}'`);
  }
  expect(style?.textContent).toContain('font-display: swap');
  expect(html.indexOf('@font-face')).toBeLessThan(html.indexOf('<h1'));
  expect(host.querySelector('h1')?.textContent).toBe('An already visible mailbox');
  expect(html).not.toContain('Must not replace');
  expect(sheets.adopted()).toHaveLength(0);
});

it('retains the loaded server font sheet through hydration without replacing its faces', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  host.innerHTML = renderToString(<Fixture policy={{ nonce: 'font-nonce' }} />);
  const heading = host.querySelector('h1');
  const style = host.querySelector('[data-bloom-server-style="bloom-fonts"]');
  const serverCss = style?.textContent;
  const recoveries: unknown[] = [];
  const serverSheet = (style as HTMLStyleElement).sheet;
  // Imperative and provider consumers may share a document, including before hydration.
  applyFontFaces();
  expect(sheets.adopted()).toHaveLength(0);
  let root: Root | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(host, <Fixture policy={{ nonce: 'font-nonce' }} />, {
        onRecoverableError: (e) => recoveries.push(e),
      });
    });
    expect(recoveries).toEqual([]);
    expect(host.querySelector('h1')).toBe(heading);
    expect(host.querySelector('[data-bloom-server-style]')).toBe(style);
    expect((style as HTMLStyleElement).sheet).toBe(serverSheet);
    expect(style?.textContent).toBe(serverCss);
    expect(style?.getAttribute('nonce')).toBe('font-nonce');
    applyFontFaces();
    expect(sheets.adopted()).toHaveLength(0);
    await act(async () => root?.render(<Fixture policy={{ nonce: 'font-nonce' }} />));
    expect(host.querySelector('[data-bloom-server-style]')).toBe(style);
    expect((style as HTMLStyleElement).sheet).toBe(serverSheet);
    expect(sheets.adopted()).toHaveLength(0);
  } finally {
    await act(async () => root?.unmount());
    host.remove();
  }
  expect(sheets.adopted()).toHaveLength(0);
});

it('preserves opt-out and client-only hosts without emitting unauthorized server styles', async () => {
  expect(renderToString(<Fixture enabled={false} />)).not.toContain('@font-face');
  expect(renderToString(<Fixture policy={null} />)).not.toContain('@font-face');
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(<Fixture policy={null} />));
    expect(host.querySelector('h1')?.textContent).toBe('An already visible mailbox');
    expect(host.querySelector('style')).toBeNull();
    expect(sheets.adopted()).toHaveLength(1);
    expect(sheets.adopted()[0]?.cssText).toContain('@font-face');
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});

it.each<ServerStylePolicy>(['inline', { nonce: 'font-nonce' }])(
  'uses constructed fonts for client-only mounts and remounts even with policy %p',
  async (policy) => {
    const host = document.createElement('div');
    document.body.append(host);
    try {
      for (let mount = 0; mount < 2; mount++) {
        const root = createRoot(host);
        try {
          await act(async () => root.render(<Fixture policy={policy} />));
          const styles = host.querySelectorAll('[data-bloom-server-style="bloom-fonts"]');
          expect(styles).toHaveLength(0);
          expect(sheets.adopted()).toHaveLength(1);
          expect(sheets.adopted()[0]?.replaceSyncCalls).toBe(1);
        } finally {
          await act(async () => root.unmount());
        }
        expect(host.querySelector('style')).toBeNull();
      }
    } finally {
      host.remove();
    }
  },
);
