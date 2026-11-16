import { fn } from 'storybook/test';
import { useState } from 'react';
import { View } from 'react-native';
import { RiMailLine } from '../icons/remix/RiMailLine';
import { SettingsValueField } from '../settings-modal/SettingsRows';
import { Switch } from '../switch';
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '../select';
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
  const [accounts, setAccounts] = useState(['Personal']);
  return (
    <GroupedSection title="Account">
      <GroupedSectionItem
        title="Accounts"
        value={open ? 'Hide' : 'Show'}
        onPress={() => setOpen(!open)}
        accessibilityState={{ expanded: open }}
      />
      <GroupedSectionCollapse open={open}>
        {accounts.map((title, index) => (
          <GroupedSectionItem
            key={title}
            title={title}
            description={index === 0 ? 'Your primary account' : 'Additional account'}
          />
        ))}
        <GroupedSectionItem
          title="Add account"
          onPress={() => setAccounts((current) => [...current, `Account ${current.length + 1}`])}
        />
      </GroupedSectionCollapse>
      <GroupedSectionItem title="Preferences" onPress={fn().mockName('Preferences.onPress')} />
    </GroupedSection>
  );
}
export const Default: Story = { render: () => <Disclosure /> };

/** `descriptionLines` lifts the two-line clamp (`0` never truncates). */
export const LongDescription: Story = {
  render: () => (
    <GroupedSection title="Policies">
      <GroupedSectionItem
        title="Data retention"
        description="Records are kept for ninety days after an account closes, then removed from every backup within a further thirty days unless the law requires otherwise."
        descriptionLines={0}
      />
      <GroupedSectionItem
        title="Clamped (default)"
        description="Records are kept for ninety days after an account closes, then removed from every backup within a further thirty days unless the law requires otherwise."
      />
    </GroupedSection>
  ),
};

export const Rows: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ padding: 24, width: 581, maxWidth: '100%' }}>
      <GroupedSection separator="line">
        <GroupedSectionItem
          title="Email"
          wrapControl
          rightElement={<SettingsValueField icon={RiMailLine}>hi@example.com</SettingsValueField>}
        />
        <GroupedSectionItem
          title="Device ID"
          description="Truncated, muted"
          wrapControl
          rightElement={
            <SettingsValueField muted>593e2611-b9e3-44e2-1289-ab3f9d21</SettingsValueField>
          }
        />
        <GroupedSectionItem title="Version" value="1.0.0" />
      </GroupedSection>
    </View>
  ),
};

/**
 * A control too wide to sit beside its label wraps under it; the label column
 * never gets narrower than 140px. Allo's Appearance "Colour" chooser used to
 * stay on the label's line on Android and squeeze the description to one word
 * per line, its own text running off the card. Narrow the canvas to watch the
 * chooser drop below and truncate inside its pill.
 */
export const WideTrailingControl: Story = {
  parameters: { controls: { disable: true } },
  render: function WideTrailingControlStory() {
    const [value, setValue] = useState('raspberry');
    const [followAccount, setFollowAccount] = useState(true);
    return (
      <View style={{ padding: 16, width: 380, maxWidth: '100%' }}>
        <GroupedSection separator="line">
          <GroupedSectionItem
            title="Colour"
            description="Warm reds over a gold and cobalt accent"
            wrapControl
            rightElement={
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger label="Colour">
                  <SelectValue />
                  <SelectIcon />
                </SelectTrigger>
                <SelectContent
                  label="Colour"
                  items={[
                    { value: 'raspberry', label: 'Raspberry + Antique Gold + Cobalt' },
                    { value: 'teal', label: 'Teal' },
                  ]}
                  renderItem={(item) => (
                    <SelectItem value={item.value} label={item.label}>
                      <SelectItemIndicator />
                      <SelectItemText>{item.label}</SelectItemText>
                    </SelectItem>
                  )}
                />
              </Select>
            }
          />
          <GroupedSectionItem
            title="Follow account"
            description="Use the account's theme on this device"
            wrapControl
            rightElement={
              <Switch
                checked={followAccount}
                onCheckedChange={setFollowAccount}
                accessibilityLabel="Follow account"
              />
            }
          />
        </GroupedSection>
      </View>
    );
  },
};
