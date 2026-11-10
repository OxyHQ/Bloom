import { render } from '@testing-library/react-native';
import { AddressList } from '../address';
import { BloomScope } from '../appearance';
import type { BloomContentDensity, BloomSize } from '../appearance';
import { Button } from '../button';
import { Item } from '../item';
import { Portal, PortalOutlet, PortalProvider } from '../portal/Portal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { hostNodes, resolvedStyle } from './support/rendered-style';

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
    <BloomThemeProvider>
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
    const screen = render(<Subject {...props} />);
    expect(resolvedStyle(screen.getByTestId('addresses').props.style).gap).toBe(listGap);
    expect(resolvedStyle(screen.getByTestId('home-row-tile').props.style).width).toBe(tile);
    expect(resolvedStyle(screen.getByTestId('home-row-title').props.style).fontSize).toBe(title);
    expect(resolvedStyle(screen.getByTestId('home-row').props.style).paddingVertical).toBe(
      paddingVertical,
    );
    expect(resolvedStyle(screen.getByTestId('portal-action').props.style).height).toBe(action);
    expect(resolvedStyle(screen.getByTestId('nested-badge').props.style).height).toBe(32);
    screen.unmount();
  },
);

it('scales AddressList loading and empty states under local scope', () => {
  const loading = render(
    <BloomThemeProvider>
      <BloomScope size="xs">
        <AddressList sections={[]} loading loadingRows={1} testID="loading" />
      </BloomScope>
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(loading.getByTestId('loading').props.style).gap).toBe(12);
  expect(
    resolvedStyle(loading.getByTestId('loading-placeholder-0').props.style).paddingHorizontal,
  ).toBe(12);
  const loadingHosts = hostNodes(loading.toJSON());
  expect(loadingHosts.some((node) => resolvedStyle(node.props.style).width === 32)).toBe(true);
  loading.unmount();

  const empty = render(
    <BloomThemeProvider>
      <BloomScope size="lg">
        <AddressList sections={[]} testID="empty" />
      </BloomScope>
    </BloomThemeProvider>,
  );
  const emptyHosts = hostNodes(empty.toJSON());
  expect(emptyHosts.some((node) => resolvedStyle(node.props.style).paddingVertical === 40)).toBe(
    true,
  );
  expect(emptyHosts.some((node) => node.props.width === 40 && node.props.height === 40)).toBe(true);
});

it('keeps Item size and content density as independent axes', () => {
  const inherited = render(
    <BloomThemeProvider>
      <BloomScope size="lg" contentDensity="compact">
        <Item title="Inherited compact" testID="inherited-item" />
      </BloomScope>
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(inherited.getByTestId('inherited-item').props.style).paddingVertical).toBe(
    6,
  );
  expect(resolvedStyle(inherited.getByText('Inherited compact').props.style).fontSize).toBe(16);

  const explicit = render(
    <BloomThemeProvider>
      <BloomScope size="lg" contentDensity="compact">
        <Item
          size="sm"
          contentDensity="comfortable"
          title="Explicit comfortable"
          testID="explicit-item"
        />
      </BloomScope>
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(explicit.getByTestId('explicit-item').props.style).paddingVertical).toBe(10);
  expect(resolvedStyle(explicit.getByText('Explicit comfortable').props.style).fontSize).toBe(13);

  const explicitDensity = render(
    <BloomThemeProvider>
      <BloomScope size="lg" contentDensity="compact">
        <Item
          density="compact"
          contentDensity="comfortable"
          title="Explicit density axis"
          testID="explicit-density-item"
        />
      </BloomScope>
    </BloomThemeProvider>,
  );
  expect(
    resolvedStyle(explicitDensity.getByTestId('explicit-density-item').props.style).paddingVertical,
  ).toBe(10);
  expect(
    resolvedStyle(explicitDensity.getByText('Explicit density axis').props.style).fontSize,
  ).toBe(16);
});
