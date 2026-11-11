import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../typography';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ChoiceList } from './index';
import { useTheme } from '../theme/use-theme';

const meta: Meta<typeof ChoiceList> = {
  id: 'base-choice-list',
  title: 'Components/Inputs/ChoiceList',
  component: ChoiceList,
};

export default meta;

type Story = StoryObj<typeof ChoiceList>;

const ACCOUNTS = [
  { value: 'ada', label: 'Ada Lovelace' },
  { value: 'bea', label: 'Bea Ramos' },
  { value: 'carlos', label: 'Carlos Ruiz' },
];

/**
 * A login window's accounts: one keyboard stop, the arrows moving between the
 * accounts, Space or Return choosing the one whose password is asked for.
 */
export const Accounts: Story = {
  parameters: { controls: { disable: true } },
  render: function AccountsStory() {
    const theme = useTheme();
    const [value, setValue] = useState('ada');
    return (
      <View style={{ gap: 16, alignItems: 'center' }}>
        <ChoiceList
          label="Accounts"
          value={value}
          onValueChange={setValue}
          options={ACCOUNTS}
          style={{ gap: 28 }}
          renderContent={(option, { selected }) => (
            <>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: theme.colors.primary,
                  opacity: selected ? 1 : 0.6,
                }}
              />
              <Text
                style={{
                  marginTop: 10,
                  color: theme.colors.text,
                  fontWeight: selected ? '600' : '400',
                  opacity: selected ? 1 : 0.6,
                }}
              >
                {option.label}
              </Text>
            </>
          )}
        />
        <Text style={{ color: theme.colors.textSecondary }}>Password for {value}</Text>
      </View>
    );
  },
};
