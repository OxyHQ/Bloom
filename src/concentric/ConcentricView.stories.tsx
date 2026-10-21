import type { Meta, StoryObj } from '@storybook/react-vite';
import { Surface } from '../surface';
import { Card } from '../card';
import { StyledView } from '../styles/styled-primitives';
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
  return (
    <StyledView style={{ padding: 24, gap: 20, maxWidth: 760 }}>
      <ConcentricView
        className="rounded-[32px] p-3 md:p-5 border-2"
        style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.border }}
        testID="class-parent"
      >
        <StyledView
          className="rounded-concentric"
          style={{ height: 80, backgroundColor: colors.background }}
          testID="class-child"
        />
        <ConcentricView className="p-1">
          <ConcentricView className="p-2">
            <ConcentricView
              radius="concentric"
              className="-m-1"
              style={{ height: 80, backgroundColor: colors.background }}
              testID="wrapped-child"
            />
          </ConcentricView>
        </ConcentricView>
      </ConcentricView>
      <ConcentricView
        radius={32}
        className="ps-6 pe-2 pt-4 pb-1"
        style={{ backgroundColor: colors.backgroundSecondary }}
      >
        <StyledView
          className="rounded-s-concentric"
          style={{ height: 50, backgroundColor: colors.background }}
          testID="logical-start"
        />
      </ConcentricView>
      <ConcentricView radius={32} className="p-2 border-2">
        <ConcentricView className="rounded-concentric m-1 p-1" testID="owner-class">
          <ConcentricView radius="concentric" style={{ height: 30 }} testID="owner-child" />
        </ConcentricView>
        <Surface className="rounded-concentric m-1" testID="surface-class" style={{ height: 50 }} />
        <Card
          className="rounded-concentric m-1"
          border="none"
          testID="card-class"
          style={{ height: 50 }}
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
    </StyledView>
  );
}
export const Nested: Story = { render: () => <Examples /> };
