import type { Meta, StoryObj } from '@storybook/react-vite';
import { Surface } from '../surface';
import { Card } from '../card';
import { View } from 'react-native';
import { useWindowBreakpoint } from '../hooks/use-width-class';
import { useTheme } from '../theme/use-theme';
import { ConcentricView } from './ConcentricView';

const meta: Meta<typeof ConcentricView> = {
  id: 'base-concentric',
  title: 'Composition/Concentric',
  component: ConcentricView,
};
export default meta;
type Story = StoryObj<typeof ConcentricView>;
function Examples() {
  const { colors } = useTheme();
  const tier = useWindowBreakpoint();
  const wide = tier !== 'base' && tier !== 'sm';
  return (
    <View style={{ padding: 24, gap: 20, maxWidth: 760 }}>
      <ConcentricView
        radius={32}
        style={{
          padding: wide ? 20 : 12,
          borderWidth: 2,
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
        }}
        testID="padded-parent"
      >
        <ConcentricView
          radius="concentric"
          style={{ height: 80, backgroundColor: colors.background }}
          testID="padded-child"
        />
        <ConcentricView style={{ padding: 4 }}>
          <ConcentricView style={{ padding: 8 }}>
            <ConcentricView
              radius="concentric"
              style={{ margin: -4, height: 80, backgroundColor: colors.background }}
              testID="wrapped-child"
            />
          </ConcentricView>
        </ConcentricView>
      </ConcentricView>
      <ConcentricView
        radius={32}
        style={{
          paddingStart: 24,
          paddingEnd: 8,
          paddingTop: 16,
          paddingBottom: 4,
          backgroundColor: colors.backgroundSecondary,
        }}
      >
        <ConcentricView
          radius="concentric"
          style={{ height: 50, backgroundColor: colors.background }}
          testID="logical-padding"
        />
      </ConcentricView>
      <ConcentricView radius={32} style={{ padding: 8, borderWidth: 2 }}>
        <ConcentricView radius="concentric" style={{ margin: 4, padding: 4 }} testID="owner">
          <ConcentricView radius="concentric" style={{ height: 30 }} testID="owner-child" />
        </ConcentricView>
        <Surface radius="concentric" testID="surface-owner" style={{ margin: 4, height: 50 }} />
        <Card
          radius="concentric"
          border="none"
          testID="card-owner"
          style={{ margin: 4, height: 50 }}
        />
      </ConcentricView>
      <Surface
        radius={32}
        style={{ padding: 8, borderWidth: 2, borderColor: colors.border }}
        testID="surface"
      >
        <Card radius="concentric" border="none" style={{ padding: 4 }} testID="card">
          <ConcentricView
            radius="concentric"
            style={{ height: 80, backgroundColor: colors.background }}
            testID="card-child"
          />
        </Card>
      </Surface>
      <ConcentricView
        radius={{ topStart: 32, topEnd: 20, bottomStart: 12, bottomEnd: 8 }}
        style={{
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderWidth: 2,
          borderColor: colors.border,
          backgroundColor: colors.backgroundSecondary,
        }}
      >
        <ConcentricView
          radius="concentric"
          style={{ margin: 2, height: 80, backgroundColor: colors.background }}
          testID="asymmetric"
        />
        <ConcentricView reset>
          <ConcentricView
            radius="concentric"
            style={{ height: 60, backgroundColor: colors.background }}
            testID="reset"
          />
        </ConcentricView>
      </ConcentricView>
      <ConcentricView
        radius={9999}
        style={{ padding: 16, backgroundColor: colors.backgroundSecondary }}
      >
        <ConcentricView
          radius="concentric"
          testID="pill"
          style={{ height: 60, backgroundColor: colors.background }}
        />
      </ConcentricView>
    </View>
  );
}
export const Nested: Story = { render: () => <Examples /> };
