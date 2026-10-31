import { useEffect } from 'react';
import * as Native from 'react-native';
import { render } from '@testing-library/react-native';
import { AppShell } from '../app-shell';
import { RiHomeLine } from '../icons/remix';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

afterEach(() => jest.restoreAllMocks());

it('extends only adjacent frame edges and keeps the header mounted when toggled', () => {
  jest
    .spyOn(Native, 'useWindowDimensions')
    .mockReturnValue({ width: 900, height: 600, scale: 1, fontScale: 1 });
  let mounts = 0;
  function Header() {
    useEffect(() => {
      mounts++;
    }, []);
    return <Native.Text>Workspace</Native.Text>;
  }
  const view = (
    span: 'panel' | 'frame',
    nav: boolean,
    appearance: 'separated' | 'joined' = 'separated',
  ) => (
    <BloomThemeProvider fonts={false}>
      <AppShell
        testID="shell"
        variant="dashboard"
        framedFrom={0}
        gutter={8}
        frameInset={{ top: 0, start: 10, end: 14, bottom: 8 }}
        header={null}
        sidebar={
          nav
            ? { surface: 'plain', items: [{ key: 'home', label: 'Home', icon: RiHomeLine }] }
            : undefined
        }
        panelLayout={{
          header: <Header />,
          headerSpan: span,
          appearance,
          panels: [{ id: 'main', content: <Native.Text>Page</Native.Text> }],
        }}
      />
    </BloomThemeProvider>
  );
  const screen = render(view('panel', false));
  const span = () => resolvedStyle(screen.getByTestId('shell-panels-header-span').props.style);
  expect(span()).toMatchObject({ marginStart: 0, marginEnd: 0 });
  screen.rerender(view('frame', false));
  expect(span()).toMatchObject({ marginStart: -10, marginEnd: -14 });
  expect(mounts).toBe(1);
  screen.rerender(view('frame', true));
  expect(span()).toMatchObject({ marginStart: 0, marginEnd: -14 });
  screen.rerender(view('frame', true, 'joined'));
  expect(screen.queryByTestId('shell-panels-header-span')).toBeNull();
});
