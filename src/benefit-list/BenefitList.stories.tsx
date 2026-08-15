import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BenefitList, BenefitRow } from './index';
import { Person_Stroke2_Corner0_Rounded as PersonIcon } from '../icons/Person';
import { Lock_Stroke2_Corner0_Rounded as LockIcon } from '../icons/Lock';
import { Shield_Stroke2_Corner0_Rounded as ShieldIcon } from '../icons/Shield';

const meta: Meta<typeof BenefitList> = {
  title: 'Data Display/BenefitList',
  component: BenefitList,
};

export default meta;

type Story = StoryObj<typeof BenefitList>;

export const Consent: Story = {
  render: () => (
    <View style={{ width: 360, padding: 24 }}>
      <BenefitList accessibilityLabel="What you're sharing">
        <BenefitRow
          icon={<PersonIcon size="sm" />}
          label="Share your name and profile photo"
        />
        <BenefitRow
          icon={<LockIcon size="sm" />}
          label="Your password is never shared with this app"
        />
        <BenefitRow
          icon={<ShieldIcon size="sm" />}
          label="You can revoke access at any time from settings"
        />
      </BenefitList>
    </View>
  ),
};

export const SingleRow: Story = {
  render: () => (
    <View style={{ width: 360, padding: 24 }}>
      <BenefitList>
        <BenefitRow icon={<ShieldIcon size="sm" />}>
          End-to-end encrypted by default
        </BenefitRow>
      </BenefitList>
    </View>
  ),
};
