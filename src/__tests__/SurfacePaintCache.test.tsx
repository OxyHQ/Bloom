import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { SurfacePaint } from '../surface/SurfacePaint';
import { resolvedStyle } from './support/rendered-style';
const original = Platform.OS;
afterEach(() => {
  Platform.OS = original;
});
it('caches only Android decorative material and delivers changed paint and geometry to the same native view', () => {
  Platform.OS = 'android';
  const fixture = (
    mode: 'light' | 'dark',
    fill: string,
    radius: number,
    material = true,
    reduceTransparency = false,
  ) => (
    <BloomThemeProvider mode={mode} fonts={false} reduceTransparency={reduceTransparency}>
      <SurfacePaint testID="paint" fill={fill} radius={radius} rim={material} sheen={material} />
    </BloomThemeProvider>
  );
  const tree = render(fixture('light', '#eeeeee', 12));
  const originalView = tree.getByTestId('paint');
  const before = resolvedStyle(originalView.props.style);
  expect(originalView.props.renderToHardwareTextureAndroid).toBe(true);
  expect(originalView.children).toHaveLength(0);
  tree.rerender(fixture('dark', '#202020', 24));
  const updated = tree.getByTestId('paint');
  expect(updated).toBe(originalView);
  const after = resolvedStyle(updated.props.style);
  expect(after.backgroundColor).toBe('#202020');
  expect(after.borderRadius).toBe(24);
  expect(after.boxShadow).not.toBe(before.boxShadow);
  tree.rerender(fixture('dark', '#202020', 24, false));
  expect(tree.getByTestId('paint').props.renderToHardwareTextureAndroid).toBe(false);
  tree.rerender(fixture('dark', '#202020', 24, true, true));
  expect(tree.getByTestId('paint').props.renderToHardwareTextureAndroid).toBe(false);
  expect(resolvedStyle(tree.getByTestId('paint').props.style).boxShadow).toBeUndefined();
});
it('does not request Android texture allocation for iOS paint', () => {
  Platform.OS = 'ios';
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <SurfacePaint testID="paint" fill="#fff" />
    </BloomThemeProvider>,
  );
  expect(tree.getByTestId('paint').props.renderToHardwareTextureAndroid).toBe(false);
});
