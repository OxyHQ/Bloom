import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { resolveSurfaceMaterial } from '../surface/resolve-surface-material';
import { cardLayout } from './support/card-surface';
import { Card } from '../card';
import { UsageCard } from '../usage-card';
import { GroupedSection, GroupedSectionItem } from '../grouped-section';
import {
  SurfaceLevelProvider,
  useSurfaceFill,
  useSurfaceLevelValue,
  type SurfaceLevel,
} from '../styles/surface-levels';
import { resolvedStyle } from './support/rendered-style';

it.each(['light', 'dark'] as const)(
  'shares Card/UsageCard fill and depth, including nested surfaces (%s)',
  (mode) => {
    for (const level of [0, 1, 3] as const) {
      const samples: Record<string, { fill: string; level: SurfaceLevel }> = {};
      function Probe({ name }: { name: string }) {
        samples[name] = { fill: useSurfaceFill(), level: useSurfaceLevelValue() };
        return <Text>{name}</Text>;
      }
      function Fixture() {
        const theme = useTheme();
        return (
          <SurfaceLevelProvider
            level={level}
            fill={level === 0 ? theme.colors.background : theme.colors.card}
          >
            <Card>
              <Probe name="card" />
            </Card>
            <UsageCard footer={<Probe name="usage" />} />
            <GroupedSection>
              <Probe name="group" />
              <Card>
                <Probe name="nested-card" />
              </Card>
              <GroupedSection>
                <Probe name="nested-group" />
              </GroupedSection>
              <UsageCard footer={<Probe name="nested-usage" />} />
            </GroupedSection>
            <GroupedSection separator="line">
              <Probe name="line" />
            </GroupedSection>
          </SurfaceLevelProvider>
        );
      }
      const screen = render(
        <BloomThemeProvider mode={mode}>
          <Fixture />
        </BloomThemeProvider>,
      );
      expect(samples.group).toEqual(samples.card);
      expect(samples.group).toEqual(samples.usage);
      expect(samples.group).toEqual(samples.line);
      expect(samples.group?.level).toBe(Math.min(level + 1, 3));
      expect(samples['nested-group']).toEqual(samples['nested-card']);
      expect(samples['nested-group']).toEqual(samples['nested-usage']);
      expect(samples['nested-group']?.fill).not.toBe(samples.group?.fill);
      for (const row of screen.getAllByTestId('grouped-section-row')) {
        const style = resolvedStyle(row.props.style);
        expect(style.borderWidth ?? 0).toBe(0);
      }
      screen.unmount();
    }
  },
);

it.each(['light', 'dark'] as const)(
  'preserves explicit variant fills and open gaps (%s)',
  (mode) => {
    const samples: Record<string, string> = {};
    function Probe({ name }: { name: string }) {
      samples[name] = useSurfaceFill();
      return null;
    }
    function Fixture() {
      const theme = useTheme();
      samples.card = resolveSurfaceMaterial({
        fill: theme.colors.card,
        parentFill: theme.colors.background,
      }).publishedFill;
      samples.parent = theme.colors.background;
      samples.filled = resolveSurfaceMaterial({
        fill: theme.colors.backgroundSecondary,
        parentFill: theme.colors.background,
      }).publishedFill;
      return (
        <>
          <GroupedSection variant="plain">
            <Probe name="plain" />
            <GroupedSectionItem title="Row" />
          </GroupedSection>
          <GroupedSection variant="filled">
            <Probe name="filled-row" />
          </GroupedSection>
        </>
      );
    }
    const screen = render(
      <BloomThemeProvider mode={mode}>
        <Fixture />
      </BloomThemeProvider>,
    );
    expect(samples.plain).toBe(samples.card);
    expect(samples['filled-row']).toBe(samples.filled);
    for (const group of screen.getAllByTestId('settings-list-group')) {
      expect(cardLayout(group)).toMatchObject({
        backgroundColor: 'transparent',
        borderRadius: 28,
      });
    }
    expect(resolvedStyle(screen.getByTestId('grouped-section-gap').props.style)).toMatchObject({
      height: 2,
      backgroundColor: samples.parent,
    });
    expect(screen.queryByTestId('grouped-section-divider')).toBeNull();
  },
);
