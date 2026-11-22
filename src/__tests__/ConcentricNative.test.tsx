import { I18nManager } from 'react-native';
import { render } from '@testing-library/react-native';
import { ConcentricView } from '../concentric';
import { Surface } from '../surface/Surface';
import { Card } from '../card/Card';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

jest.mock('react-native', () => ({
  ...jest.requireActual('../../__mocks__/react-native'),
  PlatformColor: (...names: string[]) => ({ semantic: names }),
}));
it('shares actual Surface and Card material geometry with inset children', () => {
  const screen = render(
    <BloomThemeProvider>
      <Surface radius={32} style={{ padding: 8, borderWidth: 2 }}>
        <Card radius="concentric" border="none" style={{ padding: 4 }} testID="card">
          <ConcentricView radius="concentric" testID="child" />
        </Card>
      </Surface>
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(screen.getByTestId('card').props.style).borderTopLeftRadius).toBe(22);
  expect(resolvedStyle(screen.getByTestId('child').props.style).borderTopLeftRadius).toBe(18);
});

it('supports reset boundaries, unequal edges, negative margins and pill inheritance', () => {
  const screen = render(
    <ConcentricView
      radius={{ topStart: 32, topEnd: 20, bottomStart: 12, bottomEnd: 8 }}
      style={{ paddingHorizontal: 10, paddingVertical: 4, borderWidth: 2 }}
    >
      <ConcentricView radius="concentric" style={{ margin: 2 }} testID="asymmetric" />
      <ConcentricView reset>
        <ConcentricView radius="concentric" testID="reset" />
      </ConcentricView>
      <ConcentricView radius={9999} style={{ padding: 16 }}>
        <ConcentricView radius="concentric" testID="pill" />
      </ConcentricView>
    </ConcentricView>,
  );
  expect(resolvedStyle(screen.getByTestId('asymmetric').props.style)).toMatchObject({
    borderTopLeftRadius: 24,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 0,
  });
  expect(resolvedStyle(screen.getByTestId('reset').props.style).borderTopLeftRadius).toBe(0);
  expect(resolvedStyle(screen.getByTestId('pill').props.style).borderTopLeftRadius).toBe(9999);
});
