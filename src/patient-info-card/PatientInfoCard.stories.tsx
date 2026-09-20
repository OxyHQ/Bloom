import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RiAsterisk } from '../icons/remix/RiAsterisk';
import { RiDropLine } from '../icons/remix/RiDropLine';
import { RiMenLine } from '../icons/remix/RiMenLine';
import { RiStethoscopeLine } from '../icons/remix/RiStethoscopeLine';
import { PatientInfoCard } from './index';
import type { PatientInfoCardDetail } from './types';

const meta: Meta<typeof PatientInfoCard> = {
  title: 'Blocks/Patient Info',
  component: PatientInfoCard,
};

export default meta;

type Story = StoryObj<typeof PatientInfoCard>;

/** A demo patient. */
const DETAILS: PatientInfoCardDetail[] = [
  { icon: RiAsterisk, label: 'Date of Birth', value: '28 July, 1997' },
  { icon: RiMenLine, label: 'Gender', value: 'Male' },
  { icon: RiDropLine, label: 'Blood Type', value: 'A rh+' },
  { icon: RiStethoscopeLine, label: 'GP Doctor', value: 'Mattheus Clarkson' },
];

/** Initials disc, the `+` photo button, and four detail rows. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ padding: 40, width: 360, maxWidth: '100%' }}>
      <PatientInfoCard testID="patient" name="Maya Collins" initials="M" details={DETAILS} />
    </View>
  ),
};

/** A photo, no `+` button, and fewer rows (the rows keep their height; the card does not shrink). */
export const WithPhoto: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ padding: 40, width: 360, maxWidth: '100%' }}>
      <PatientInfoCard
        name="Aspen Lubin"
        avatarSource="https://i.pravatar.cc/132?img=47"
        hideAddPhoto
        details={DETAILS.slice(0, 2)}
      />
    </View>
  ),
};

/** A single instance whose controls are applied directly to the rendered component. */
export const Playground: StoryObj<typeof PatientInfoCard> = {
  args: { name: 'Maya Collins', initials: 'MC', details: DETAILS, hideAddPhoto: false },
  parameters: { controls: { disable: false, include: ['name', 'initials', 'hideAddPhoto'] } },
  argTypes: { name: { control: 'text' }, initials: { control: 'text' }, hideAddPhoto: { control: 'boolean' } },
  render: function Playground(args) {

    return <View style={{ width: 440, maxWidth: '100%' }}><PatientInfoCard {...args} /></View>;
  },
};
