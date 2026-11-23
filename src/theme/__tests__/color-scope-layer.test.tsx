import { createContext, useContext, type ReactNode } from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../BloomThemeProvider';
import { BloomColorScope } from '../color-scope/ColorScope';
import { ColorScopeLayerContext, type ColorScopeLayer } from '../color-scope/layer';
import { BloomSeedScope } from '../seed-scope/SeedScope';
import { Portal, PortalOutlet, PortalProvider } from '../../portal/Portal';

/**
 * A stand-in for a styling system that resolves variables from a context, as
 * react-native-css does: each layer merges its scope's record over the parent's.
 */
const Variables = createContext<Record<string, string>>({ '--primary': 'app' });
const Layer: ColorScopeLayer = ({ vars, children }) => {
  const parent = useContext(Variables);
  return <Variables.Provider value={{ ...parent, ...vars }}>{children}</Variables.Provider>;
};
function Probe({ id }: { id: string }) {
  return <Text testID={id}>{useContext(Variables)['--color-primary'] ?? 'app'}</Text>;
}

function Tree({ children }: { children: ReactNode }) {
  return (
    <BloomThemeProvider colorPreset="blue" mode="light" fonts={false}>
      <ColorScopeLayerContext.Provider value={Layer}>
        <PortalProvider>
          {children}
          <PortalOutlet />
        </PortalProvider>
      </ColorScopeLayerContext.Provider>
    </BloomThemeProvider>
  );
}

it('draws each colour scope through the layer with its palette, a portal included', () => {
  const { getByTestId } = render(
    <Tree>
      <Probe id="outside" />
      <BloomColorScope tokens={{ primary: '#5433eb' }}>
        <Probe id="inside" />
        <Portal>
          <Probe id="portal" />
        </Portal>
      </BloomColorScope>
      <BloomSeedScope seed="#123456">
        <Probe id="seed" />
      </BloomSeedScope>
    </Tree>,
  );
  expect(getByTestId('outside').props.children).toBe('app');
  expect(getByTestId('inside').props.children).toBe('#5433eb');
  expect(getByTestId('portal').props.children).toBe('#5433eb');
  expect(getByTestId('seed').props.children).toMatch(/^rgb\(/);
});

it('adds nothing without a layer', () => {
  const { getByTestId } = render(
    <BloomThemeProvider colorPreset="blue" mode="light" fonts={false}>
      <BloomColorScope tokens={{ primary: '#5433eb' }}>
        <Probe id="inside" />
      </BloomColorScope>
    </BloomThemeProvider>,
  );
  expect(getByTestId('inside').props.children).toBe('app');
});
