/**
 * @jest-environment jsdom
 *
 * `OutlineNav` through the REAL react-native-web.
 *
 * The property this suite exists for is the one a screenshot cannot show and a
 * props test cannot reach: a list that is visually indented and STRUCTURALLY
 * FLAT renders identically to a correctly nested one. So the nesting is read out
 * of the emitted DOM — a `list` inside a `listitem` inside a `list` — and the
 * tree builder is walked directly over the ragged level sequences real documents
 * have.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { OutlineNav } from '../outline-nav';
import { buildOutlineTree, compactHeadings, outlineProgress } from '../outline-nav/shared';
import type { OutlineHeading } from '../outline-nav';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        {ui}
      </BloomThemeProvider>,
    );
  });
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

function byTestId(id: string): HTMLElement {
  const el = document.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

function maybe(id: string): HTMLElement | null {
  const el = document.querySelector(`[data-testid="${id}"]`);
  return el instanceof HTMLElement ? el : null;
}

/**
 * Direct children matching a role. jsdom's `:scope` is unreliable inside
 * `querySelectorAll`, and the whole point here is the DIRECT relationship —
 * a descendant query would read a flat list as a nested one.
 */
function childrenWithRole(el: Element, role: string): HTMLElement[] {
  return Array.from(el.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement && child.getAttribute('role') === role,
  );
}

function click(el: HTMLElement) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

const HEADINGS: OutlineHeading[] = [
  { id: 'a', label: 'One', level: 1 },
  { id: 'b', label: 'One point one', level: 2 },
  { id: 'c', label: 'One point one point one', level: 3 },
  { id: 'd', label: 'One point two', level: 2 },
  { id: 'e', label: 'Two', level: 1 },
];

describe('buildOutlineTree', () => {
  it('nests by level and keeps document order', () => {
    const tree = buildOutlineTree(HEADINGS);
    expect(tree.map((n) => n.heading.id)).toEqual(['a', 'e']);
    expect(tree[0]!.children.map((n) => n.heading.id)).toEqual(['b', 'd']);
    expect(tree[0]!.children[0]!.children.map((n) => n.heading.id)).toEqual(['c']);
  });

  it('parents to the nearest SMALLER level, so a skipped level is not a lost subtree', () => {
    const skipped: OutlineHeading[] = [
      { id: 'a', label: 'A', level: 1 },
      { id: 'b', label: 'B', level: 3 },
      { id: 'c', label: 'C', level: 3 },
    ];
    const tree = buildOutlineTree(skipped);
    expect(tree).toHaveLength(1);
    expect(tree[0]!.children.map((n) => n.heading.id)).toEqual(['b', 'c']);
  });

  it('gives a document that opens deep two roots rather than losing the first', () => {
    const ragged: OutlineHeading[] = [
      { id: 'a', label: 'A', level: 3 },
      { id: 'b', label: 'B', level: 3 },
      { id: 'c', label: 'C', level: 1 },
      { id: 'd', label: 'D', level: 2 },
    ];
    const tree = buildOutlineTree(ragged);
    expect(tree.map((n) => n.heading.id)).toEqual(['a', 'b', 'c']);
    expect(tree[2]!.children.map((n) => n.heading.id)).toEqual(['d']);
  });

  it('reads an empty document as an empty tree', () => {
    expect(buildOutlineTree([])).toEqual([]);
  });
});

describe('outlineProgress', () => {
  it('puts the first heading above zero and the last at one', () => {
    expect(outlineProgress(HEADINGS, 'a')).toBeCloseTo(1 / 5);
    expect(outlineProgress(HEADINGS, 'e')).toBe(1);
  });

  it('answers zero for nothing to measure, rather than guessing', () => {
    expect(outlineProgress(HEADINGS, undefined)).toBe(0);
    expect(outlineProgress(HEADINGS, 'not-a-heading')).toBe(0);
    expect(outlineProgress([], 'a')).toBe(0);
  });
});

describe('compactHeadings', () => {
  it('drops the levels below the cut, in order', () => {
    expect(compactHeadings(HEADINGS, 2).map((h) => h.id)).toEqual(['a', 'b', 'd', 'e']);
    expect(compactHeadings(HEADINGS, 1).map((h) => h.id)).toEqual(['a', 'e']);
  });
});

describe('it renders a real list', () => {
  it('nests a list inside a listitem inside a list', () => {
    mount(<OutlineNav headings={HEADINGS} testID="o" />);
    const nav = byTestId('o');
    const outer = nav.querySelector('[role="list"]');
    expect(outer).not.toBeNull();
    // It is a real <ul>/<li>, not a div wearing a role.
    expect(outer!.tagName).toBe('UL');
    const items = childrenWithRole(outer!, 'listitem');
    expect(items.map((li) => li.tagName)).toEqual(['LI', 'LI']);

    // The nesting, not a padding: the child list is INSIDE the parent's item.
    const inner = childrenWithRole(items[0]!, 'list');
    expect(inner).toHaveLength(1);
    expect(childrenWithRole(inner[0]!, 'listitem')).toHaveLength(2);

    // …and three levels deep, so the recursion is real.
    const deepest = childrenWithRole(childrenWithRole(inner[0]!, 'listitem')[0]!, 'list');
    expect(deepest).toHaveLength(1);
    expect(childrenWithRole(deepest[0]!, 'listitem')).toHaveLength(1);

    // The second root has no nested list at all — a flat render would give it one.
    expect(childrenWithRole(items[1]!, 'list')).toHaveLength(0);
  });

  it('indents each nested list rather than each row', () => {
    mount(<OutlineNav headings={HEADINGS} testID="o" />);
    const lists = byTestId('o').querySelectorAll('[role="list"]');
    expect(getComputedStyle(lists[0] as HTMLElement).marginLeft).not.toBe('14px');
    expect(getComputedStyle(lists[1] as HTMLElement).marginLeft).toBe('14px');
    expect(getComputedStyle(lists[2] as HTMLElement).marginLeft).toBe('14px');
    // The ROW's own left padding is the rail's, and it is the same at every level.
    expect(getComputedStyle(byTestId('o-row-a')).paddingLeft).toBe(
      getComputedStyle(byTestId('o-row-c')).paddingLeft,
    );
  });

  it('names the region and every row', () => {
    mount(<OutlineNav headings={HEADINGS} testID="o" />);
    expect(byTestId('o').getAttribute('aria-label')).toBe('On this page');
    expect(byTestId('o').getAttribute('role')).toBe('navigation');
    expect(byTestId('o-row-c').getAttribute('aria-label')).toBe('One point one point one');
    expect(byTestId('o-row-c').getAttribute('role')).toBe('link');
  });
});

describe('the current heading', () => {
  it('is aria-current, not aria-selected, and only one is', () => {
    mount(<OutlineNav headings={HEADINGS} activeId="d" testID="o" />);
    expect(byTestId('o-row-d').getAttribute('aria-current')).toBe('location');
    expect(byTestId('o-row-d').getAttribute('aria-selected')).toBeNull();
    expect(byTestId('o-row-a').getAttribute('aria-current')).toBeNull();
    expect(byTestId('o').querySelectorAll('[aria-current]')).toHaveLength(1);
  });

  it('marks nothing when the reader is nowhere', () => {
    mount(<OutlineNav headings={HEADINGS} testID="o" />);
    expect(byTestId('o').querySelectorAll('[aria-current]')).toHaveLength(0);
  });
});

describe('it emits rather than jumps', () => {
  it('hands the whole heading back on a press', () => {
    const onSelect = jest.fn();
    mount(<OutlineNav headings={HEADINGS} onSelect={onSelect} testID="o" />);
    click(byTestId('o-row-c'));
    expect(onSelect).toHaveBeenCalledWith({ id: 'c', label: 'One point one point one', level: 3 });
  });
});

describe('a heading with an href', () => {
  const LINKED: OutlineHeading[] = HEADINGS.map((h) => ({ ...h, href: `#${h.id}` }));

  it('is a real anchor to it', () => {
    mount(<OutlineNav headings={LINKED} testID="o" />);
    const row = byTestId('o-row-c');
    expect(row.tagName).toBe('A');
    expect(row.getAttribute('href')).toBe('#c');
  });

  it('keeps a plain press for the app: onSelect runs and the browser does not follow', () => {
    const onSelect = jest.fn();
    mount(<OutlineNav headings={LINKED} onSelect={onSelect} testID="o" />);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    act(() => {
      byTestId('o-row-c').dispatchEvent(event);
    });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('leaves a modified click to the browser', () => {
    const onSelect = jest.fn();
    mount(<OutlineNav headings={LINKED} onSelect={onSelect} testID="o" />);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true });
    act(() => {
      byTestId('o-row-c').dispatchEvent(event);
    });
    expect(onSelect).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('stays a plain row without one', () => {
    mount(<OutlineNav headings={HEADINGS} testID="o" />);
    expect(byTestId('o-row-c').tagName).not.toBe('A');
  });
});

describe('the progress bar', () => {
  it('is a real progressbar with a name and a spoken reading', () => {
    mount(<OutlineNav headings={HEADINGS} activeId="d" testID="o" />);
    const bar = byTestId('o-progress');
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-label')).toBe('On this page');
    expect(bar.getAttribute('aria-valuenow')).toBe('0.8');
    expect(bar.getAttribute('aria-valuetext')).toBe('Heading 4 of 5');
  });

  it('measures against the COMPACT list when the deep levels are dropped', () => {
    mount(<OutlineNav headings={HEADINGS} activeId="d" variant="compact" testID="o" />);
    expect(byTestId('o-progress').getAttribute('aria-valuetext')).toBe('Heading 3 of 4');
  });

  it('takes a value the app measured itself, over the derived one', () => {
    mount(<OutlineNav headings={HEADINGS} activeId="a" progress={0.42} testID="o" />);
    expect(byTestId('o-progress').getAttribute('aria-valuenow')).toBe('0.42');
  });

  it('can be left out', () => {
    mount(<OutlineNav headings={HEADINGS} hideProgress testID="o" />);
    expect(maybe('o-progress')).toBeNull();
  });
});

describe('the two variants', () => {
  it('draws a title and 36-tall rows in full', () => {
    mount(<OutlineNav headings={HEADINGS} testID="o" />);
    expect(byTestId('o-title').textContent).toBe('On this page');
    expect(getComputedStyle(byTestId('o-row-a')).minHeight).toBe('36px');
  });

  it('drops the title, reaches the touch size, and cuts the deep levels in compact', () => {
    mount(<OutlineNav headings={HEADINGS} variant="compact" testID="o" />);
    expect(maybe('o-title')).toBeNull();
    expect(getComputedStyle(byTestId('o-row-a')).minHeight).toBe('44px');
    expect(maybe('o-row-c')).toBeNull();
    expect(maybe('o-row-b')).not.toBeNull();
  });

  it('cuts at the level it was told to', () => {
    mount(<OutlineNav headings={HEADINGS} variant="compact" compactMaxLevel={1} testID="o" />);
    expect(maybe('o-row-b')).toBeNull();
    expect(maybe('o-row-e')).not.toBeNull();
  });

  it('draws everything in full, whatever the compact cut says', () => {
    mount(<OutlineNav headings={HEADINGS} compactMaxLevel={1} testID="o" />);
    expect(maybe('o-row-c')).not.toBeNull();
  });

  it('renders an empty outline without a row', () => {
    mount(<OutlineNav headings={[]} testID="o" />);
    expect(byTestId('o').querySelectorAll('[role="listitem"]')).toHaveLength(0);
  });
});
