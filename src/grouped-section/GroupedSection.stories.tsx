import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GroupedSection, GroupedSectionItem, GroupedSectionCollapse } from './index';
const meta: Meta<typeof GroupedSection> = {
  id: 'base-grouped-section',
  title: 'Components/Data Display/Grouped Section',
  component: GroupedSection,
};
export default meta;
type Story = StoryObj<typeof GroupedSection>;
function Disclosure() {
  const [open, setOpen] = useState(false);
  return (
    <GroupedSection title="Account">
      <GroupedSectionItem
        title="Accounts"
        value={open ? 'Hide' : 'Show'}
        onPress={() => setOpen(!open)}
        accessibilityState={{ expanded: open }}
      />
      <GroupedSectionCollapse open={open}>
        <GroupedSectionItem title="Personal" description="Your primary account" />
        <GroupedSectionItem title="Add account" onPress={() => {}} />
      </GroupedSectionCollapse>
      <GroupedSectionItem title="Preferences" onPress={() => {}} />
    </GroupedSection>
  );
}
export const Default: Story = { render: () => <Disclosure /> };
