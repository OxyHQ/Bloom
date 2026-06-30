/**
 * @jest-environment jsdom
 */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { getByText, queryByText } from '@testing-library/dom';
import '@testing-library/jest-dom';

import { VirtualList } from '../list/index.web';

// `@tanstack/react-virtual` measures rows via ResizeObserver + getBoundingClientRect,
// neither of which jsdom implements with a real layout engine. Stub both so the
// window virtualizer computes a deterministic, non-empty range against jsdom's
// default 768px-tall window — exactly the path that regressed in production
// (rows present, wrapper sized, but `getVirtualItems()` came back empty).
class ResizeObserverStub {
  constructor(_cb: ResizeObserverCallback) {}
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver = ResizeObserverStub;

const ROW_HEIGHT = 64;

beforeAll(() => {
  jest
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockImplementation((): DOMRect => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: ROW_HEIGHT,
      width: 0,
      height: ROW_HEIGHT,
      toJSON: () => ({}),
    }));
});

afterAll(() => {
  jest.restoreAllMocks();
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement): HTMLElement {
  act(() => {
    root.render(ui);
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

interface Row {
  id: string;
  label: string;
}

describe('VirtualList (web)', () => {
  it('mounts EVERY row of a short list in the first viewport (the empty-rows regression)', () => {
    const data: Row[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(i),
      label: `Row ${i}`,
    }));

    const c = mount(
      <VirtualList<Row>
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <span>{item.label}</span>}
        ListHeaderComponent={<div>List header</div>}
      />,
    );

    expect(getByText(c, 'List header')).toBeTruthy();
    for (const row of data) {
      expect(getByText(c, row.label)).toBeTruthy();
    }
  });

  it('renders the header + empty slot (and no rows) when data is empty', () => {
    const c = mount(
      <VirtualList<Row>
        data={[]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <span>{item.label}</span>}
        ListHeaderComponent={<div>List header</div>}
        ListEmptyComponent={<div>Nothing here</div>}
      />,
    );

    expect(getByText(c, 'List header')).toBeTruthy();
    expect(getByText(c, 'Nothing here')).toBeTruthy();
    expect(queryByText(c, 'Row 0')).toBeNull();
  });

  it('supports a thunk slot for the header', () => {
    const c = mount(
      <VirtualList<Row>
        data={[{ id: 'a', label: 'Only row' }]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <span>{item.label}</span>}
        ListHeaderComponent={() => <div>Thunk header</div>}
      />,
    );

    expect(getByText(c, 'Thunk header')).toBeTruthy();
    expect(getByText(c, 'Only row')).toBeTruthy();
  });
});
