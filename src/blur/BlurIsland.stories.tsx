import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from 'react-native';
import { Button } from '../button';
import { RiFilterLine } from '../icons/remix/RiFilterLine';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { BlurIsland } from './BlurIsland';

const meta: Meta<typeof BlurIsland> = {
  id: 'base-blur-island',
  title: 'Composition/BlurIsland',
  component: BlurIsland,
};
export default meta;
type Story = StoryObj<typeof BlurIsland>;

/** The bottom toolbar of `docs/blur.mdx`: three islands, each owning the material of its controls. */
function Toolbar() {
  return (
    <View style={{ padding: 24, maxWidth: 420 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <BlurIsland>
          <Button
            iconOnly
            appearance="plain"
            material="shared"
            icon={RiFilterLine}
            accessibilityLabel="Filter"
          />
        </BlurIsland>
        <View style={{ flex: 1 }}>
          <BlurIsland style={{ alignSelf: 'stretch' }}>
            <Button appearance="plain" material="shared" style={{ flex: 1 }}>
              Inbox
            </Button>
          </BlurIsland>
        </View>
        <BlurIsland>
          <Button
            iconOnly
            appearance="plain"
            material="shared"
            icon={RiSearchLine}
            accessibilityLabel="Search"
          />
        </BlurIsland>
      </View>
    </View>
  );
}

export const BottomToolbar: Story = { render: () => <Toolbar /> };

/** A rounded island with a smooth curve instead of the capsule. */
export const Rounded: Story = {
  render: () => (
    <View style={{ padding: 24, maxWidth: 420 }}>
      <BlurIsland radius={20} cornerCurve="smooth" role="group" accessibilityLabel="Formatting">
        <Button appearance="plain" material="shared">
          Bold
        </Button>
        <Button appearance="plain" material="shared">
          Italic
        </Button>
      </BlurIsland>
    </View>
  ),
};
