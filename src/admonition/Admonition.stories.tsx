import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Admonition,
  AdmonitionRoot,
  AdmonitionRow,
  AdmonitionIcon,
  AdmonitionContent,
  AdmonitionText,
  AdmonitionButton,
} from './index';

const meta: Meta<typeof Admonition> = {
  title: 'Feedback/Admonition',
  component: Admonition,
};

export default meta;

type Story = StoryObj<typeof Admonition>;

/**
 * The five types. `type` picks both the icon and the border colour — it is the
 * only prop that decides anything, so an admonition never needs a colour prop.
 */
export const Types: Story = {
  render: () => (
    <View style={{ gap: 12, width: 460 }}>
      <Admonition type="info">
        Your session is signed in on three devices.
      </Admonition>
      <Admonition type="tip">
        Press ⌘K anywhere to open the command palette.
      </Admonition>
      <Admonition type="warning">
        Changing your handle breaks existing links to your profile.
      </Admonition>
      <Admonition type="error">
        We could not reach the server. Nothing was saved.
      </Admonition>
      <Admonition type="apology">
        This part of the app is still being rebuilt.
      </Admonition>
    </View>
  ),
};

/**
 * The composed form, for anything the all-in-one shape cannot express — here an
 * action beside the message. The parts read the type from the root's context,
 * so the icon stays in step with the border without being told twice.
 */
export const WithAction: Story = {
  render: () => (
    <View style={{ width: 460 }}>
      <AdmonitionRoot type="warning">
        <AdmonitionRow>
          <AdmonitionIcon />
          <AdmonitionContent>
            <AdmonitionText>
              Two-factor authentication is off for this account.
            </AdmonitionText>
            <AdmonitionButton onPress={() => {}}>Turn on</AdmonitionButton>
          </AdmonitionContent>
        </AdmonitionRow>
      </AdmonitionRoot>
    </View>
  ),
};
