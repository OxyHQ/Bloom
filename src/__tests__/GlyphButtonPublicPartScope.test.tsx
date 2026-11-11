import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { GlyphButton } from '../button/GlyphButton';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

it('keeps GlyphButton numeric diameters independent from control-size scopes on native', () => {
  const screen = render(
    <BloomThemeProvider>
      <GlyphButton testID="default" accessibilityLabel="Default" />
      <BloomScope size="xs">
        <GlyphButton testID="compact-scope-default" accessibilityLabel="Default in xs" />
        <GlyphButton testID="compact-scope-explicit" size={40} accessibilityLabel="40 in xs" />
      </BloomScope>
      <BloomScope size="lg">
        <GlyphButton testID="large-scope-explicit" size={28} accessibilityLabel="28 in lg" />
      </BloomScope>
    </BloomThemeProvider>,
  );

  const dimensions = (id: string) => {
    const style = resolvedStyle(screen.getByTestId(id).props.style);
    return [style.width, style.height];
  };
  expect(dimensions('default')).toEqual([36, 36]);
  expect(dimensions('compact-scope-default')).toEqual([36, 36]);
  expect(dimensions('compact-scope-explicit')).toEqual([40, 40]);
  expect(dimensions('large-scope-explicit')).toEqual([28, 28]);
  screen.unmount();
});
