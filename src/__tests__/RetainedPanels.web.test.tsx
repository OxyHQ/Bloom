/**
 * @jest-environment jsdom
 *
 * `panelLayout.retain` on the web: an iframe in a panel must never leave the
 * document (removing it is what reloads its page), whatever happens to the
 * panels' order, stacks or visibility.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { AppShell } from '../app-shell/index.web';
import type { AppShellPanelDefinition } from '../app-shell/panel-layout-types';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let movedFrames = 0;
let observer: MutationObserver;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  movedFrames = 0;
  observer = new MutationObserver(tally);
  observer.observe(container, { childList: true, subtree: true });
});
function tally(records: MutationRecord[]) {
  for (const record of records)
    for (const node of [...record.removedNodes, ...record.addedNodes])
      if (
        node instanceof Element &&
        [node, ...node.querySelectorAll('iframe')].some(
          (el) => el.tagName === 'IFRAME' && el.getAttribute('title') !== 'c',
        )
      )
        movedFrames++;
}
afterEach(() => {
  observer.disconnect();
  act(() => root.unmount());
  container.remove();
});

const page = (id: string) => <iframe title={id} data-testid={`frame-${id}`} src="about:blank" />;

function render(
  panels: Omit<AppShellPanelDefinition, 'content'>[],
  spans?: Record<string, number>,
) {
  act(() =>
    root.render(
      <BloomThemeProvider mode="light">
        <AppShell
          testID="shell"
          variant="feed"
          scroll="fixed"
          header={null}
          contentMaxWidth="none"
          panelLayout={{
            mode: 'split',
            flow: 'bounded',
            retain: true,
            gap: 7,
            spans,
            panels: panels.map((panel) => ({ ...panel, content: page(panel.id) })),
          }}
        />
      </BloomThemeProvider>,
    ),
  );
}

const frame = (id: string) =>
  container.querySelector<HTMLIFrameElement>(`[data-testid="frame-${id}"]`)!;
const host = (id: string) =>
  container.querySelector<HTMLElement>(`[data-testid="shell-panels-retained-${id}"]`)!;
const hostOrder = () =>
  [...container.querySelectorAll<HTMLElement>('[data-testid^="shell-panels-retained-"]')]
    .map((node) => node.dataset.testid!)
    .filter((name) => !name.includes('divider'))
    .map((name) => name.replace('shell-panels-retained-', ''))
    .filter((name) => name !== '');

describe('retained panels on the web', () => {
  it('never takes an iframe out of the document when panels reorder, stack, hide and come back', () => {
    render([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    const frames = { a: frame('a'), b: frame('b'), c: frame('c') };
    observer.takeRecords();
    movedFrames = 0;
    expect(hostOrder()).toEqual(['a', 'b', 'c']);

    render([{ id: 'c' }, { id: 'a' }, { id: 'b' }]);
    render([{ id: 'c' }, { id: 'a', stack: 's' }, { id: 'b', stack: 's' }]);
    render([{ id: 'c' }, { id: 'a', visible: false }, { id: 'b' }]);
    render([{ id: 'b' }, { id: 'a' }]);
    render([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);

    tally(observer.takeRecords());
    expect(movedFrames).toBe(0);
    expect(frame('a')).toBe(frames.a);
    expect(frame('b')).toBe(frames.b);
    expect(frame('c').isConnected).toBe(true);
    expect(hostOrder().slice(0, 2)).toEqual(['a', 'b']);
  });

  it('lays a reordered panel out by geometry, not by its place in the tree', () => {
    render([{ id: 'a' }, { id: 'b' }]);
    expect(host('a').style.left).toBe('0%');
    render([{ id: 'b' }, { id: 'a' }]);
    expect(hostOrder()).toEqual(['a', 'b']);
    expect(host('b').style.left).toBe('0%');
    expect(host('a').style.left).toBe('50%');
    expect(host('a').style.marginLeft).toBe('3.5px');
  });

  it('keeps a hidden panel at the full size of the region, invisible and inert, never display:none', () => {
    render([{ id: 'a' }, { id: 'b', visible: false }]);
    const hidden = host('b');
    expect(hidden.style.visibility).toBe('hidden');
    expect(hidden.style.display).not.toBe('none');
    expect([hidden.style.top, hidden.style.bottom, hidden.style.left, hidden.style.right]).toEqual([
      '0px',
      '0px',
      '0px',
      '0px',
    ]);
    expect(hidden.getAttribute('aria-hidden')).toBe('true');
    expect(hidden.hasAttribute('inert')).toBe(true);
    expect(host('a').style.right).toBe('0%');
  });
});
