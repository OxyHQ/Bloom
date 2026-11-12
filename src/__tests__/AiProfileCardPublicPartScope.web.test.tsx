/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { View } = jest.requireActual('react-native-web');
  return { ...base, __esModule: true, default: { ...base.default, View } };
});

import { AiProfileCard } from '../ai-profile-card';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type ResizeCallback = (entries: Array<{ target: Element }>) => void;
class TestResizeObserver {
  static instances: TestResizeObserver[] = [];
  readonly targets = new Set<Element>();

  constructor(private readonly callback: ResizeCallback) {
    TestResizeObserver.instances.push(this);
  }

  observe(target: Element) {
    this.targets.add(target);
  }

  unobserve(target: Element) {
    this.targets.delete(target);
  }

  disconnect() {
    this.targets.clear();
  }

  emit(target: Element) {
    this.callback([{ target }]);
  }
}

it('uses the card container width for responsive rows and keeps fixed recipe under scope', async () => {
  const originalWidth = Object.getOwnPropertyDescriptor(window, 'ResizeObserver');
  Object.defineProperty(window, 'ResizeObserver', {
    configurable: true,
    value: TestResizeObserver,
  });
  Object.defineProperty(document.documentElement, 'clientWidth', {
    configurable: true,
    value: 1024,
  });
  Object.defineProperty(document.documentElement, 'clientHeight', {
    configurable: true,
    value: 900,
  });
  TestResizeObserver.instances = [];
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  const stats = [
    { value: '9B', label: 'Lifetime tokens' },
    { value: '562M', label: 'Peak tokens' },
    { value: '12h', label: 'Longest task' },
    { value: '62', label: 'Top streak' },
  ];
  const renderCard = (size?: 'xs' | 'lg') =>
    act(() => {
      const card = <AiProfileCard testID="card" name="Maya" stats={stats} />;
      root.render(
        <BloomThemeProvider mode="light" fonts={false}>
          {size ? <BloomScope size={size}>{card}</BloomScope> : card}
        </BloomThemeProvider>,
      );
    });
  const required = <T extends Element>(selector: string) => {
    const element = host.querySelector<T>(selector);
    if (!element) throw new Error(`Missing expected AiProfileCard element: ${selector}`);
    return element;
  };
  const geometry = () => {
    const card = required<HTMLElement>('[data-testid="card"]');
    const cover = required<HTMLElement>('[data-testid="card-cover"]');
    const content = required<HTMLElement>('[data-testid="card-content"]');
    const rows = required<HTMLElement>('[data-testid="card-stats"]');
    return {
      card,
      coverHeight: cover.style.height,
      contentGap: content.style.gap,
      contentPadding: content.style.paddingLeft,
      rowCount: rows.children.length,
    };
  };
  try {
    renderCard();
    const initial = geometry();
    expect(initial).toMatchObject({
      coverHeight: '165px',
      contentGap: '15px',
      contentPadding: '16px',
      rowCount: 1,
    });
    Object.defineProperty(initial.card, 'offsetWidth', { configurable: true, value: 390 });
    Object.defineProperty(initial.card, 'offsetHeight', { configurable: true, value: 700 });
    const observer = TestResizeObserver.instances[0];
    if (!observer) throw new Error('AiProfileCard did not register its ResizeObserver');
    await act(async () => {
      observer.emit(initial.card);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(geometry().rowCount).toBe(2);
    Object.defineProperty(initial.card, 'offsetWidth', { configurable: true, value: 720 });
    await act(async () => {
      observer.emit(initial.card);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(geometry().rowCount).toBe(1);

    renderCard('xs');
    expect(geometry()).toMatchObject({
      coverHeight: initial.coverHeight,
      contentGap: initial.contentGap,
      contentPadding: initial.contentPadding,
      rowCount: 1,
    });
  } finally {
    act(() => root.unmount());
    host.remove();
    if (originalWidth) Object.defineProperty(window, 'ResizeObserver', originalWidth);
    else Reflect.deleteProperty(window, 'ResizeObserver');
  }
});
