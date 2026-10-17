import { View, Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { GroupedSectionIcon, GroupedSectionItem } from '../grouped-section';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { resolveAccentColors } from '../theme/accent-colors';
import { contrastRatio, mixColors } from '../styles/color-contrast';
import { SurfacePaint } from '../surface/SurfacePaint';
import { resolveSurfaceTint } from '../surface/shared';
import { resolvedStyle } from './support/rendered-style';

it.each(['light', 'dark'] as const)(
  'uses the filled theme color and darkened glyph and shared icon geometry in %s mode',
  (mode) => {
    let expected: ReturnType<typeof resolveAccentColors> | undefined;
    const glyph = jest.fn(() => <View />);
    function Fixture() {
      const theme = useTheme();
      expected = resolveAccentColors(theme.colors, 'primary', 'solid');
      return <GroupedSectionIcon testID="badge">{glyph}</GroupedSectionIcon>;
    }
    const screen = render(
      <BloomThemeProvider mode={mode}>
        <Fixture />
      </BloomThemeProvider>,
    );
    if (!expected) throw new Error('Theme fixture did not render');
    expect(glyph).toHaveBeenCalledWith({
      color: mixColors(expected.background, '#000000', 0.6),
      size: 16,
    });
    expect(
      resolvedStyle(screen.getByTestId('badge', { includeHiddenElements: true }).props.style),
    ).toMatchObject({
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'transparent',
      pointerEvents: 'none',
    });
    const host = screen.getByTestId('badge', { includeHiddenElements: true });
    const paintType = (SurfacePaint as unknown as { type: unknown }).type;
    const paints = host.findAll((node) => node.type === paintType);
    expect(paints).toHaveLength(1);
    expect(paints[0]?.props).toMatchObject({
      fill: resolveSurfaceTint(expected.background),
      radius: 14,
    });
    expect(host.props['aria-hidden']).toBe(true);
    expect(host.props.accessible).toBe(false);
  },
);

it('accepts a custom accent and explicit geometry without duplicating consumer paint', () => {
  let foreground = '';
  const screen = render(
    <BloomThemeProvider mode="light">
      <GroupedSectionIcon color="#99ddee" size={40} iconSize={20} testID="badge">
        {({ color, size }) => {
          foreground = color;
          return <Text style={{ fontSize: size }}>Icon</Text>;
        }}
      </GroupedSectionIcon>
    </BloomThemeProvider>,
  );
  const style = resolvedStyle(
    screen.getByTestId('badge', { includeHiddenElements: true }).props.style,
  );
  expect(style).toMatchObject({
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
  });
  expect(foreground).toBe(mixColors('#99ddee', '#000000', 0.6));
  expect(contrastRatio(foreground, '#99ddee')).toBeGreaterThanOrEqual(3);
  const host = screen.getByTestId('badge', { includeHiddenElements: true });
  const paintType = (SurfacePaint as unknown as { type: unknown }).type;
  const paints = host.findAll((node) => node.type === paintType);
  expect(paints).toHaveLength(1);
  expect(paints[0]?.props).toMatchObject({ fill: resolveSurfaceTint('#99ddee'), radius: 20 });
});

it('does not tint arbitrary logos and preserves leading inset overrides', () => {
  const screen = render(
    <BloomThemeProvider>
      <GroupedSectionItem
        title="Logo"
        description="Description"
        leftInset={32}
        icon={
          <Text testID="logo" style={{ color: '#123456' }}>
            Brand
          </Text>
        }
      />
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(screen.getByTestId('logo').props.style).color).toBe('#123456');
  expect(resolvedStyle(screen.getByTestId('settings-list-item-content').props.style)).toMatchObject(
    { paddingLeft: 32, paddingRight: 16, paddingVertical: 12, minHeight: 52 },
  );
});
