/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { AddressList } from '../address';
import { BloomScope } from '../appearance';
import type { BloomContentDensity, BloomSize } from '../appearance';
import { Button } from '../button';
import { Item } from '../item';
import { Portal, PortalOutlet, PortalProvider } from '../portal/Portal.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const DEFAULT_LABEL = 'Default';
const ACTION_LABEL = 'Edit';
type AddressDensity = BloomContentDensity;
const SECTION = {
  id: 'saved',
  title: 'Saved',
  entries: [
    {
      id: 'home',
      title: 'Home',
      subtitle: '12 Example Street',
      meta: '1.2 km',
      badge: (
        <BloomScope size="sm">
          <Button testID="nested-badge" accessibilityLabel="Default badge">
            {DEFAULT_LABEL}
          </Button>
        </BloomScope>
      ),
      action: (
        <Portal>
          <Button testID="portal-action" accessibilityLabel="Address action">
            {ACTION_LABEL}
          </Button>
        </Portal>
      ),
      testID: 'home-row',
    },
  ],
};

function Subject({
  outerSize,
  outerContentDensity,
  listSize,
  listDensity,
  rowSize,
  rowDensity,
}: {
  outerSize?: BloomSize;
  outerContentDensity?: BloomContentDensity;
  listSize?: BloomSize;
  listDensity?: AddressDensity;
  rowSize?: BloomSize;
  rowDensity?: AddressDensity;
}) {
  return (
    <BloomThemeProvider fonts={false}>
      <PortalProvider>
        <BloomScope size={outerSize} contentDensity={outerContentDensity}>
          <AddressList
            size={listSize}
            density={listDensity}
            sections={[
              {
                ...SECTION,
                entries: SECTION.entries.map((entry) => ({
                  ...entry,
                  size: rowSize,
                  density: rowDensity,
                })),
              },
            ]}
            onSelect={() => undefined}
            testID="addresses"
          />
        </BloomScope>
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>
  );
}

it.each([
  {
    name: 'default md',
    props: {},
    listGap: 16,
    tile: 40,
    title: 16,
    action: 36,
    paddingVertical: 10,
  },
  {
    name: 'nearest xs',
    props: { outerSize: 'xs' as const },
    listGap: 12,
    tile: 32,
    title: 13,
    action: 24,
    paddingVertical: 10,
  },
  {
    name: 'explicit list sm over lg',
    props: { outerSize: 'lg' as const, listSize: 'sm' as const },
    listGap: 14,
    tile: 36,
    title: 14,
    action: 32,
    paddingVertical: 10,
  },
  {
    name: 'explicit row lg over list xs',
    props: { outerSize: 'xs' as const, rowSize: 'lg' as const },
    listGap: 12,
    tile: 48,
    title: 18,
    action: 44,
    paddingVertical: 10,
  },
  {
    name: 'compact content density within lg scope',
    props: { outerSize: 'lg' as const, outerContentDensity: 'compact' as const },
    listGap: 20,
    tile: 40,
    title: 18,
    action: 44,
    paddingVertical: 6,
  },
  {
    name: 'explicit list comfortable density over compact scope',
    props: {
      outerSize: 'lg' as const,
      outerContentDensity: 'compact' as const,
      listDensity: 'comfortable' as const,
    },
    listGap: 20,
    tile: 48,
    title: 18,
    action: 44,
    paddingVertical: 10,
  },
  {
    name: 'explicit row compact density over comfortable list',
    props: { listDensity: 'comfortable' as const, rowDensity: 'compact' as const },
    listGap: 16,
    tile: 32,
    title: 16,
    action: 36,
    paddingVertical: 6,
  },
])(
  'applies $name to AddressList and AddressRow',
  ({ props, listGap, tile, title, action, paddingVertical }) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      act(() => root.render(<Subject {...props} />));
      expect(host.querySelector<HTMLElement>('[data-testid="addresses"]')?.style.gap).toBe(
        `${listGap}px`,
      );
      expect(host.querySelector<HTMLElement>('[data-testid="home-row-tile"]')?.style.width).toBe(
        `${tile}px`,
      );
      expect(
        host.querySelector<HTMLElement>('[data-testid="home-row-title"]')?.style.fontSize,
      ).toBe(`${title}px`);
      expect(host.querySelector<HTMLElement>('[data-testid="home-row"]')?.style.paddingTop).toBe(
        `${paddingVertical}px`,
      );
      expect(
        document.body.querySelector<HTMLElement>('[data-testid="portal-action"]')?.style.height,
      ).toBe(`${action}px`);
      expect(host.querySelector<HTMLElement>('[data-testid="nested-badge"]')?.style.height).toBe(
        '32px',
      );
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  },
);

it('scales AddressList loading and empty states under local scope', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <BloomScope size="xs">
            <AddressList sections={[]} loading loadingRows={1} testID="loading" />
          </BloomScope>
        </BloomThemeProvider>,
      ),
    );
    expect(host.querySelector<HTMLElement>('[data-testid="loading"]')?.style.gap).toBe('12px');
    expect(
      host.querySelector<HTMLElement>('[data-testid="loading-placeholder-0"]')?.style.paddingLeft,
    ).toBe('12px');
    expect(
      host.querySelector<HTMLElement>('[data-testid="loading-placeholder-0"]')?.style.paddingRight,
    ).toBe('12px');

    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <BloomScope size="lg">
            <AddressList sections={[]} testID="empty" />
          </BloomScope>
        </BloomThemeProvider>,
      ),
    );
    const empty = host.querySelector<HTMLElement>('[data-testid="empty-empty"]');
    expect(empty?.style.paddingTop).toBe('40px');
    expect(empty?.querySelector('svg')?.getAttribute('width')).toBe('40');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it('keeps Item size and content density as independent axes', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <BloomScope size="lg" contentDensity="compact">
            <Item title="Inherited compact" testID="inherited-item" />
          </BloomScope>
        </BloomThemeProvider>,
      ),
    );
    expect(
      host.querySelector<HTMLElement>('[data-testid="inherited-item"]')?.style.paddingTop,
    ).toBe('6px');
    expect(
      Array.from(host.querySelectorAll<HTMLElement>('*')).find(
        (node) => node.style.fontSize !== '' && node.textContent === 'Inherited compact',
      )?.style.fontSize,
    ).toBe('16px');

    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <BloomScope size="lg" contentDensity="compact">
            <Item
              size="sm"
              contentDensity="comfortable"
              title="Explicit comfortable"
              testID="explicit-item"
            />
          </BloomScope>
        </BloomThemeProvider>,
      ),
    );
    expect(host.querySelector<HTMLElement>('[data-testid="explicit-item"]')?.style.paddingTop).toBe(
      '10px',
    );
    expect(
      Array.from(host.querySelectorAll<HTMLElement>('*')).find(
        (node) => node.style.fontSize !== '' && node.textContent === 'Explicit comfortable',
      )?.style.fontSize,
    ).toBe('13px');

    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <BloomScope size="lg" contentDensity="compact">
            <Item
              density="compact"
              contentDensity="comfortable"
              title="Explicit density axis"
              testID="explicit-density-item"
            />
          </BloomScope>
        </BloomThemeProvider>,
      ),
    );
    expect(
      host.querySelector<HTMLElement>('[data-testid="explicit-density-item"]')?.style.paddingTop,
    ).toBe('10px');
    expect(
      Array.from(host.querySelectorAll<HTMLElement>('*')).find(
        (node) => node.style.fontSize !== '' && node.textContent === 'Explicit density axis',
      )?.style.fontSize,
    ).toBe('16px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
