import React, { useContext, useEffect } from 'react';
import { Platform, Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../BloomThemeProvider';
import { BloomColorScope } from '../color-scope/ColorScope';
import { useTheme } from '../use-theme';
import { Portal, PortalOutlet, PortalProvider } from '../../portal/Portal';

jest.mock('nativewind', () => {
  const React = jest.requireActual('react') as typeof import('react');
  const Context = React.createContext<Record<string, string>>({});
  return {
    vars: (value: Record<string, string>) => value,
    VariableContextProvider: ({
      value,
      children,
    }: React.PropsWithChildren<{ value: Record<string, string> }>) => {
      const parent = React.useContext(Context);
      return <Context.Provider value={{ ...parent, ...value }}>{children}</Context.Provider>;
    },
    __variableContext: Context,
  };
});
// The peer boundary is mocked; native file imports are explicit. This checks
// propagation and identity, not native color rendering or device layout.
const variables = (
  jest.requireMock('nativewind') as {
    __variableContext: React.Context<Record<string, string>>;
  }
).__variableContext;
let mounts = 0;
function Probe({ id }: { id: string }) {
  const theme = useTheme();
  const vars = useContext(variables);
  useEffect(() => {
    mounts++;
  }, []);
  return <Text testID={id}>{JSON.stringify({ theme, vars })}</Text>;
}
const originalOS = Platform.OS;
beforeEach(() => {
  Platform.OS = 'ios';
  mounts = 0;
});
afterEach(() => {
  Platform.OS = originalOS;
});
function Fixture({ color }: { color?: string }) {
  return (
    <BloomThemeProvider colorPreset="blue" mode="light" fonts={false}>
      <PortalProvider>
        <BloomColorScope
          mode={color ? 'dark' : undefined}
          tokens={color ? { background: color, foreground: '#fff' } : undefined}
        >
          <Probe id="inside" />
          <Portal>
            <Probe id="portal" />
          </Portal>
        </BloomColorScope>
        <Probe id="outside" />
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>
  );
}
it('provides exact native variables and JS theme through a plain scope and an external portal outlet', () => {
  const { getByTestId, rerender } = render(<Fixture color="#5433eb" />);
  const read = (id: string) => JSON.parse(getByTestId(id).props.children as string);
  for (const id of ['inside', 'portal']) {
    expect(read(id).theme.colors.background).toBe('#5433eb');
    expect(read(id).theme.mode).toBe('dark');
    expect(read(id).vars['--background']).toBe('#5433eb');
    expect(read(id).vars['--color-text']).toBe('#fff');
  }
  expect(read('outside').theme.mode).toBe('light');
  expect(read('outside').vars['--background']).not.toBe('#5433eb');
  expect(mounts).toBe(3);
  rerender(<Fixture color="#abcdef" />);
  expect(read('portal').theme.colors.background).toBe('#abcdef');
  expect(read('portal').vars['--background']).toBe('#abcdef');
  expect(mounts).toBe(3);
  rerender(<Fixture />);
  expect(read('portal')).toEqual(read('outside'));
  expect(mounts).toBe(3);
});
