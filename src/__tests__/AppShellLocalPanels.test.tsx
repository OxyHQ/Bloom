import { render } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';
import { AppShellPanels } from '../app-shell';
import { ContentPanel } from '../content-panel';
import { AppShellRegionContext, useAppShellRegion } from '../layout/app-shell-region';
import { BottomEdgeProvider, useBottomEdgeInset, useClaimBottomEdge } from '../layout/bottom-edge';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function Probe() {
  const region = useAppShellRegion();
  const edge = useBottomEdgeInset();
  return <Text testID="geometry">{JSON.stringify({ region, edge })}</Text>;
}
function Claim() {
  useClaimBottomEdge(80);
  return null;
}

it('creates a bounded local work area without inheriting page frame or bottom clearance', () => {
  const screen = render(
    <BloomThemeProvider>
      <BottomEdgeProvider>
        <Claim />
        <AppShellRegionContext.Provider
          value={{
            flow: 'document',
            framed: true,
            gutter: 12,
            viewportInset: { top: 64, bottom: 12 },
            bottomReserve: 80,
            underBottomBar: false,
            revealed: false,
            maskColor: '#ffffff',
          }}
        >
          <ContentPanel>
            <AppShellPanels
              scope="local"
              layout={{ panels: [{ id: 'board', content: <Probe /> }] }}
            />
          </ContentPanel>
        </AppShellRegionContext.Provider>
      </BottomEdgeProvider>
    </BloomThemeProvider>,
  );
  const { region, edge } = JSON.parse(screen.getByTestId('geometry').props.children);
  expect(region.flow).toBe('bounded');
  expect(region.viewportInset).toEqual({ top: 0, bottom: 0 });
  expect(region.bottomReserve).toBe(0);
  expect(edge).toBe(0);
});

it('still rejects accidental page-panel nesting and direct nesting inside a local panel', () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  for (const local of [false, true]) {
    expect(() =>
      render(
        <BloomThemeProvider>
          <ContentPanel>
            <AppShellPanels
              scope={local ? 'local' : 'region'}
              layout={{
                panels: [
                  {
                    id: 'child',
                    content: local ? (
                      <ContentPanel>
                        <Text>Invalid</Text>
                      </ContentPanel>
                    ) : (
                      <Text>Invalid</Text>
                    ),
                  },
                ],
              }}
            />
          </ContentPanel>
        </BloomThemeProvider>,
      ),
    ).toThrow('ContentPanel cannot be nested');
  }
  error.mockRestore();
});

it('reserves the bottom bar by default and, under it, clears it inside the panel scroller', () => {
  const geometry = (underBottomBar: boolean) => {
    const screen = render(
      <BloomThemeProvider>
        <BottomEdgeProvider>
          <Claim />
          <AppShellRegionContext.Provider
            value={{
              flow: 'bounded',
              framed: false,
              gutter: 0,
              viewportInset: { top: 0, bottom: 0 },
              bottomReserve: 0,
              underBottomBar,
              revealed: false,
              maskColor: '#ffffff',
            }}
          >
            <AppShellPanels
              testID="group"
              layout={{ panels: [{ id: 'main', scroll: 'panel', content: <Text>Row</Text> }] }}
            />
          </AppShellRegionContext.Provider>
        </BottomEdgeProvider>
      </BloomThemeProvider>,
    );
    const scroller = screen
      .getAllByTestId('group-main-scroll')
      .find((node) => node.props.contentContainerStyle);
    const result = {
      group: StyleSheet.flatten(screen.getByTestId('group').props.style).paddingBottom,
      content: StyleSheet.flatten(scroller?.props.contentContainerStyle).paddingBottom,
    };
    screen.unmount();
    return result;
  };
  expect(geometry(false)).toEqual({ group: 80, content: undefined });
  expect(geometry(true)).toEqual({ group: 0, content: 80 });
});
