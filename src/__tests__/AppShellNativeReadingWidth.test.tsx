import * as Native from 'react-native';
import { render } from '@testing-library/react-native';
import { AppShell } from '../app-shell';
import { RiHomeLine } from '../icons/remix';
import { PlatformSurfaceProvider } from '../platform-surface/context';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { fakeWindow } from './support/fake-window';
import { resolvedStyle } from './support/rendered-style';

afterEach(() => jest.restoreAllMocks());

it.each([
  { variant: 'panel' as const, collapsed: true, expected: 45 },
  { variant: 'panel' as const, collapsed: false, expected: 232 },
  { variant: 'rail' as const, collapsed: false, expected: 80 },
])(
  'sizes the initial native reading envelope for $variant collapsed=$collapsed',
  ({ variant, collapsed, expected }) => {
    jest
      .spyOn(Native, 'useWindowDimensions')
      .mockReturnValue({ width: 900, height: 600, scale: 1, fontScale: 1 });
    const screen = render(
      <BloomThemeProvider fonts={false}>
        <PlatformSurfaceProvider value={fakeWindow().adapter}>
          <AppShell
            testID="shell"
            navigationPlacement={variant === 'rail' ? 'rail' : 'sidebar'}
            contentMaxWidth="none"
            header={null}
            sidebar={{
              variant,
              size: 'sm',
              surface: 'docked',
              collapsed,
              items: [{ key: 'home', label: 'Home', icon: RiHomeLine }],
            }}
            panelLayout={{
              flow: 'bounded',
              panels: [{ id: 'main', content: <Native.Text>Page</Native.Text> }],
            }}
          />
        </PlatformSurfaceProvider>
      </BloomThemeProvider>,
    );
    const style = resolvedStyle(screen.getByTestId('shell-content').props.style);
    expect(style).toMatchObject({ width: 900 - expected - 32, flexBasis: 'auto' });
  },
);

it('releases animated geometry across alignment and framing changes and restores it with an aside', () => {
  jest
    .spyOn(Native, 'useWindowDimensions')
    .mockReturnValue({ width: 900, height: 600, scale: 1, fontScale: 1 });
  const adapter = fakeWindow().adapter;
  const view = (aligned: boolean, compact: boolean) => (
    <BloomThemeProvider fonts={false}>
      <PlatformSurfaceProvider value={adapter}>
        <AppShell
          testID="shell"
          variant="feed"
          navigationPlacement="sidebar"
          navigationAlign={aligned ? 'content' : 'edge'}
          framedFrom={compact ? 2000 : 0}
          contentMaxWidth="none"
          header={null}
          aside={<Native.Text>Aside</Native.Text>}
          asideFrom={0}
          sidebar={{
            size: 'sm',
            surface: 'plain',
            collapsed: true,
            items: [{ key: 'home', label: 'Home', icon: RiHomeLine }],
          }}
          panels
        >
          <Native.Text>Page</Native.Text>
        </AppShell>
      </PlatformSurfaceProvider>
    </BloomThemeProvider>
  );
  const screen = render(view(true, false));
  const style = (id: string) => resolvedStyle(screen.getByTestId(id).props.style);
  expect(style('shell-reading-envelope').flexBasis).toBe('auto');
  screen.rerender(view(false, false));
  expect(style('shell-reading-envelope')).toMatchObject({
    width: null,
    maxWidth: null,
    flexGrow: 1,
    flexBasis: 0,
  });
  screen.rerender(view(false, true));
  expect(style('shell-content')).toMatchObject({
    width: null,
    flexGrow: 1,
    flexBasis: '100%',
  });
  screen.rerender(view(true, false));
  expect(style('shell-reading-envelope').flexBasis).toBe('auto');
  expect(typeof style('shell-content').width).toBe('number');
});
