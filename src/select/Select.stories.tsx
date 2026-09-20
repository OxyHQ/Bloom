import { useArgs } from 'storybook/preview-api';
import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from '../badge';
import { RiHomeHeartLine, RiHotelBedLine, RiWalkLine } from '../icons/remix';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
} from './index';

const meta: Meta = {
  component: Select,
  title: 'Base/Select',
};

export default meta;

type Story = StoryObj;

type Option = { value: string; label: string; group: string };

const FRUITS: Option[] = [
  { value: 'apple', label: 'Apple', group: 'Pome' },
  { value: 'banana', label: 'Banana', group: 'Tropical' },
  { value: 'cherry', label: 'Cherry', group: 'Stone' },
  { value: 'durian', label: 'Durian', group: 'Tropical' },
  { value: 'elderberry', label: 'Elderberry', group: 'Berry' },
];

/** Enough options that the web dropdown scrolls and its scroll buttons appear. */
const MANY: Option[] = Array.from({ length: 40 }, (_, i) => ({
  value: `option-${i}`,
  label: `Option ${i + 1}`,
  group: 'All',
}));

function BasicSelect() {
  const [value, setValue] = useState<string>('apple');
  return (
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger label="Pick a fruit">
        <SelectValue placeholder="Pick a fruit" />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent
        label="Pick a fruit"
        items={FRUITS}
        renderItem={(item) => (
          <SelectItem value={item.value} label={item.label}>
            <SelectItemIndicator />
            <SelectItemText>{item.label}</SelectItemText>
          </SelectItem>
        )}
      />
    </Select>
  );
}

function UncontrolledSelect() {
  const [value, setValue] = useState<string | undefined>(undefined);
  return (
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger label="Pick a fruit">
        <SelectValue placeholder="No fruit selected" />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent
        label="Pick a fruit"
        items={FRUITS}
        renderItem={(item) => (
          <SelectItem value={item.value} label={item.label}>
            <SelectItemIndicator />
            <SelectItemText>{item.label}</SelectItemText>
          </SelectItem>
        )}
      />
    </Select>
  );
}

export const Basic: Story = {
  parameters: { controls: { disable: true } },
  render: () => <BasicSelect />,
};

function StateSelect({
  size,
  initial,
  disabled,
  testID,
  disabledOption,
}: {
  size?: 'sm' | 'md';
  initial?: string;
  disabled?: boolean;
  testID: string;
  disabledOption?: string;
}) {
  const [value, setValue] = useState<string | undefined>(initial);
  return (
    <Select value={value} onValueChange={setValue} size={size} disabled={disabled}>
      <SelectTrigger label="Pick a fruit" testID={testID}>
        <SelectValue placeholder="All fruits" />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent
        label="Pick a fruit"
        items={FRUITS}
        renderItem={(item) => (
          <SelectItem
            value={item.value}
            label={item.label}
            disabled={item.value === disabledOption}>
            <SelectItemIndicator />
            <SelectItemText>{item.label}</SelectItemText>
          </SelectItem>
        )}
      />
    </Select>
  );
}

/**
 * Trigger states side by side: `md` (38px) and `sm` (28px), a chosen
 * value, the placeholder, and disabled. Hover a trigger for the neutral-100 wash
 * and the darker border; Tab onto one for the 2px accent ring with its 2px
 * offset. Every trigger is a full pill.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: 220, gap: 16 }}>
      <StateSelect testID="select-md" initial="apple" />
      <StateSelect testID="select-placeholder" />
      <StateSelect testID="select-disabled" initial="apple" disabled />
      <StateSelect testID="select-sm" size="sm" initial="banana" />
      <StateSelect testID="select-sm-placeholder" size="sm" />
    </View>
  ),
};

/**
 * The open listbox: a 266px `p-2` panel, 36px rows 4px apart, the chosen row
 * painted with the hover wash plus its tick, and a disabled option in
 * `text-disabled`. Click the trigger to open.
 */
export const OpenList: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: 220, paddingBottom: 280 }}>
      <StateSelect testID="select-open" initial="banana" disabledOption="cherry" />
    </View>
  ),
};

/** The `sm` density: 13px type and `px-2 py-1.5` option rows. */
export const Small: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: 180, paddingBottom: 240 }}>
      <StateSelect testID="select-small" size="sm" initial="banana" disabledOption="cherry" />
    </View>
  ),
};

export const WithPlaceholder: Story = {
  parameters: { controls: { disable: true } },
  render: () => <UncontrolledSelect />,
};

export const Composition: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ gap: 16 }}>
      <BasicSelect />
      <UncontrolledSelect />
    </View>
  ),
};

/**
 * `SelectGroup` + `SelectLabel`, shadcn's own parts for a sectioned list. The
 * group header is rendered by `renderItem` on the first row of each run, which
 * is what keeps `SelectContent`'s flat `items` API.
 */
export const Grouped: Story = {
  parameters: { controls: { disable: true } },
  render: function GroupedSelect() {
    const [value, setValue] = useState<string>('cherry');
    return (
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger label="Pick a fruit">
          <SelectValue placeholder="Pick a fruit" />
          <SelectIcon />
        </SelectTrigger>
        <SelectContent
          label="Pick a fruit"
          items={FRUITS}
          renderItem={(item, index) => {
            const isFirstOfGroup = FRUITS[index - 1]?.group !== item.group;
            const row = (
              <SelectItem value={item.value} label={item.label}>
                <SelectItemIndicator />
                <SelectItemText>{item.label}</SelectItemText>
              </SelectItem>
            );
            return isFirstOfGroup ? (
              <SelectGroup>
                <SelectLabel>{item.group}</SelectLabel>
                {row}
              </SelectGroup>
            ) : (
              row
            );
          }}
        />
      </Select>
    );
  },
};

/**
 * A list longer than the dropdown's `maxHeight` (240). On web the
 * options scroll with the native scrollbar and opening scrolls the selected option
 * into view; on native the sheet's own list scrolls.
 */
export const Scrollable: Story = {
  parameters: { controls: { disable: true } },
  render: function ScrollableSelect() {
    const [value, setValue] = useState<string>('option-0');
    return (
      <View style={{ gap: 12 }}>
        <Text>value: {value}</Text>
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger label="Pick an option">
            <SelectValue placeholder="Pick an option" />
            <SelectIcon />
          </SelectTrigger>
          <SelectContent
            label="Pick an option"
            items={MANY}
            renderItem={(item) => (
              <SelectItem value={item.value} label={item.label}>
                <SelectItemIndicator />
                <SelectItemText>{item.label}</SelectItemText>
              </SelectItem>
            )}
          />
        </Select>
      </View>
    );
  },
};

type MarkedOption = { value: string; label: string };

const STATUSES: (MarkedOption & { tone: 'success' | 'warning' | 'info' })[] = [
  { value: 'completed', label: 'Completed', tone: 'success' },
  { value: 'waiting', label: 'Waiting', tone: 'warning' },
  { value: 'processing', label: 'Processing', tone: 'info' },
];

const ADMISSIONS: (MarkedOption & { icon: typeof RiWalkLine })[] = [
  { value: 'inpatient', label: 'Inpatient', icon: RiHotelBedLine },
  { value: 'outpatient', label: 'Outpatient', icon: RiWalkLine },
  { value: 'discharged', label: 'Discharged', icon: RiHomeHeartLine },
];

/**
 * `leading` on `SelectValue` and `SelectItem`: a status dot or an icon before
 * the label — `gap-[5px]` in the trigger (`gap-1` on `sm`), the row's own 8px
 * gap in the list. A function `leading` receives the selected item, so the
 * trigger's mark follows the value. `DataTableSelect` is this, packaged.
 */
export const LeadingMarks: Story = {
  parameters: { controls: { disable: true } },
  render: function LeadingMarksDemo() {
    const theme = useTheme();
    const [status, setStatus] = useState('waiting');
    const [admission, setAdmission] = useState('outpatient');
    const iconFill = theme.colors.textSecondary;
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        {(['md', 'sm'] as const).map((size) => (
          <View key={size} style={{ width: size === 'md' ? 142 : 132 }}>
            <Select value={status} onValueChange={setStatus} size={size}>
              <SelectTrigger label={`Status (${size})`}>
                <SelectValue
                  leading={(item) => (item ? <Badge dot tone={(item as (typeof STATUSES)[number]).tone} /> : null)}
                />
                <SelectIcon />
              </SelectTrigger>
              <SelectContent
                label="Status"
                items={STATUSES}
                renderItem={(item) => (
                  <SelectItem value={item.value} label={item.label} leading={<Badge dot tone={item.tone} />}>
                    <SelectItemText>{item.label}</SelectItemText>
                  </SelectItem>
                )}
              />
            </Select>
          </View>
        ))}
        <View style={{ width: 150 }}>
          <Select value={admission} onValueChange={setAdmission}>
            <SelectTrigger label="Admission" className="pl-2">
              <SelectValue
                leading={(item) => {
                  const Icon = (item as (typeof ADMISSIONS)[number] | undefined)?.icon;
                  return Icon ? <Icon width={18} height={18} fill={iconFill} /> : null;
                }}
              />
              <SelectIcon />
            </SelectTrigger>
            <SelectContent
              label="Admission"
              items={ADMISSIONS}
              renderItem={(item) => (
                <SelectItem
                  value={item.value}
                  label={item.label}
                  leading={<item.icon width={18} height={18} fill={iconFill} />}
                >
                  <SelectItemText>{item.label}</SelectItemText>
                </SelectItem>
              )}
            />
          </Select>
        </View>
      </View>
    );
  },
};

export const Playground: StoryObj<typeof Select> = {
  args: { value: 'apple', disabled: false },
  parameters: { controls: { disable: false, include: ['value', 'disabled'] } },
  argTypes: { value: { control: 'select', options: ['apple','banana','cherry','durian','elderberry'] }, disabled: { control: 'boolean' } },
  render: function Playground(args) {
    const [, updateArgs] = useArgs();
    return <View style={{ width: 520, maxWidth: '100%' }}><Select {...args} onValueChange={value => updateArgs({ value })}><SelectTrigger label="Pick a fruit"><SelectValue placeholder="Pick a fruit" /><SelectIcon /></SelectTrigger><SelectContent label="Pick a fruit" items={FRUITS} renderItem={item => <SelectItem value={item.value} label={item.label}><SelectItemIndicator /><SelectItemText>{item.label}</SelectItemText></SelectItem>} /></Select></View>;
  },
};
