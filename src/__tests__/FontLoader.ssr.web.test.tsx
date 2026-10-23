/** @jest-environment jsdom */
import { act, useId } from 'react';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { Platform } from 'react-native';
import { FontLoader } from '../fonts/FontLoader';
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

it('adopts server font rules before removing their node and preserves hydrated text', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  host.innerHTML = renderToString(<Fixture />);
  const heading = host.querySelector('h1');
  const style = host.querySelector('[data-bloom-server-style="bloom-fonts"]');
  const serverCss = style?.textContent;
  const recoveries: unknown[] = [];
  const removedWithFonts: boolean[] = [];
  const removeChild = host.removeChild.bind(host);
  const removal = jest.spyOn(host, 'removeChild').mockImplementation((node) => {
    if (node === style)
      removedWithFonts.push(sheets.adopted().some((s) => s.cssText === serverCss));
    return removeChild(node);
  });
  let root: Root | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(host, <Fixture />, { onRecoverableError: (e) => recoveries.push(e) });
    });
    expect(recoveries).toEqual([]);
    expect(host.querySelector('h1')).toBe(heading);
    expect(host.querySelector('[data-bloom-server-style]')).toBeNull();
    expect(removedWithFonts).toEqual([true]);
    expect(sheets.adopted()).toHaveLength(1);
    expect(sheets.adopted()[0]?.cssText).toBe(serverCss);
    await act(async () => root?.render(<Fixture />));
    expect(sheets.adopted()).toHaveLength(1);
    expect(sheets.adopted()[0]?.replaceSyncCalls).toBe(1);
  } finally {
    removal.mockRestore();
    await act(async () => root?.unmount());
    host.remove();
  }
  // Font faces are document resources, retained for later provider mounts.
  expect(sheets.adopted()).toHaveLength(1);
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
