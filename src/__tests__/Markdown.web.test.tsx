/**
 * @jest-environment jsdom
 */

// The document through the REAL react-native-web: the elements, roles and
// attributes a browser (and a screen reader) actually gets.

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Markdown } from '../markdown';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        {ui}
      </BloomThemeProvider>,
    );
  });
  return container;
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('Markdown on web', () => {
  it('draws headings as heading elements with their level', () => {
    const dom = mount(<Markdown>{'# One\n\n### Three'}</Markdown>);
    expect(dom.querySelector('h1')?.textContent).toBe('One');
    expect(dom.querySelector('h3')?.textContent).toBe('Three');
  });

  it('draws lists as list / listitem with the text hanging beside its marker', () => {
    const dom = mount(<Markdown>{'1. one\n2. two\n   - nested'}</Markdown>);
    const lists = dom.querySelectorAll('ul, ol, [role="list"]');
    expect(lists).toHaveLength(2);
    const items = dom.querySelectorAll('li, [role="listitem"]');
    expect(items).toHaveLength(3);
    expect(items[0]?.textContent).toBe('1.one');
    expect(items[2]?.textContent).toBe('◦nested');
  });

  it('draws inline marks as nested text, and inline code as <code>', () => {
    const dom = mount(<Markdown>{'a **b** *c* ~~d~~ `e`'}</Markdown>);
    expect(dom.textContent).toBe('a b c d e');
    expect(dom.querySelector('code')?.textContent).toBe('e');
  });

  it('draws a link as an anchor and hands its URL to onLinkPress instead of following it', () => {
    const onLinkPress = jest.fn();
    const dom = mount(<Markdown onLinkPress={onLinkPress}>{'[docs](https://x.dev/a)'}</Markdown>);
    const anchor = dom.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('https://x.dev/a');
    expect(anchor?.getAttribute('target')).toBe('_blank');
    expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    act(() => {
      anchor?.dispatchEvent(click);
    });
    expect(onLinkPress).toHaveBeenCalledWith('https://x.dev/a');
    expect(click.defaultPrevented).toBe(true);
  });

  it('draws an unsafe link as plain text and raw HTML as text', () => {
    const dom = mount(
      <Markdown>{'[x](javascript:alert(1)) <img src=x onerror=alert(1)>'}</Markdown>,
    );
    expect(dom.querySelector('a')).toBeNull();
    expect(dom.querySelector('img')).toBeNull();
    expect(dom.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('draws a fenced block with the code family and keeps a streaming tail closed', () => {
    const dom = mount(<Markdown streaming>{'Run:\n\n```ts\nconst a = 1'}</Markdown>);
    expect(dom.textContent).toContain('const a = 1');
    expect(dom.textContent).not.toContain('```');
  });

  it('draws a streaming half-open bold without its markers', () => {
    const dom = mount(<Markdown streaming>{'so **bold'}</Markdown>);
    expect(dom.textContent).toBe('so bold');
  });

  it('draws a table with row and cell roles', () => {
    const dom = mount(<Markdown>{'| a | b |\n|---|---|\n| 1 | 2 |'}</Markdown>);
    expect(dom.querySelectorAll('[role="row"]')).toHaveLength(2);
    expect(dom.querySelectorAll('[role="columnheader"]')).toHaveLength(2);
    expect(dom.querySelectorAll('[role="cell"]')).toHaveLength(2);
  });

  it('draws a task item with an announced state', () => {
    const dom = mount(<Markdown>{'- [x] done\n- [ ] todo'}</Markdown>);
    const states = Array.from(dom.querySelectorAll('[role="img"]')).map((n) =>
      n.getAttribute('aria-label'),
    );
    expect(states).toEqual(['Completed', 'Not completed']);
  });
});
