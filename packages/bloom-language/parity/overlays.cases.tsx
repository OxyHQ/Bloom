import { Command } from '@oxy.so/bloom/command';
import { RiLogoutBoxRLine, RiQuillPenLine, RiUserLine } from '@oxy.so/bloom/icons';
import { SettingsModal } from '@oxy.so/bloom/settings-modal';
import { Text } from '@oxy.so/bloom/typography';

import * as L from '../src/primitives';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const noop = () => {};
const change = (_open: boolean) => {};

const commands: ParityCase[] = [
  {
    name: 'an open palette: a command, then a group',
    // Presented: it draws into the page's portal root, so each side has a page of its own.
    isolated: true,
    language: () =>
      toElement(
        L.Command(
          L.CommandItem('New post').icon(RiQuillPenLine).shortcut('⌘N').keywords('write'),
          L.CommandGroup(
            'Go to',
            L.CommandItem('Settings').id('settings').subtitle('Preferences'),
            L.CommandItem('Archive').disabled(),
          ),
        )
          .presented(true)
          .onPresentedChange(change)
          .placeholder('Search')
          .emptyLabel('Nothing')
          .testID('palette'),
      ),
    bloom: () => (
      <Command
        open
        onOpenChange={change}
        items={[
          {
            id: 'New post',
            label: 'New post',
            icon: RiQuillPenLine,
            keywords: ['write'],
            shortcut: '⌘N',
            onSelect: noop,
          },
          {
            id: 'settings',
            label: 'Settings',
            description: 'Preferences',
            group: 'Go to',
            onSelect: noop,
          },
          { id: 'Archive', label: 'Archive', group: 'Go to', disabled: true, onSelect: noop },
        ]}
        placeholder="Search"
        emptyText="Nothing"
        testID="palette"
      />
    ),
  },
  {
    name: 'a closed palette',
    drawsNothing: ['web'],
    language: () => toElement(L.Command(L.CommandItem('New post'))),
    bloom: () => (
      <Command
        open={false}
        onOpenChange={noop}
        items={[{ id: 'New post', label: 'New post', onSelect: noop }]}
      />
    ),
  },
];

const settings: ParityCase[] = [
  {
    name: 'open settings on a page',
    // Presented: it draws into the page's portal root, so each side has a page of its own.
    isolated: true,
    language: () =>
      toElement(
        L.SettingsModal(
          L.SettingsGroup(
            'Account',
            L.SettingsItem('Profile', RiUserLine)
              .id('profile')
              .content(() => L.Text('Your profile')),
            L.SettingsItem('Sign out', RiLogoutBoxRLine).onPress(noop),
          ),
        )
          .presented(true)
          .onPresentedChange(change)
          .selection('profile')
          .onSelect(noop)
          .initialView('page')
          .testID('settings'),
      ),
    bloom: () => (
      <SettingsModal
        open
        onClose={noop}
        groups={[
          {
            label: 'Account',
            items: [
              { key: 'profile', label: 'Profile', icon: RiUserLine, page: 'profile' },
              { key: 'Sign out', label: 'Sign out', icon: RiLogoutBoxRLine, onPress: noop },
            ],
          },
        ]}
        pages={{ profile: { title: 'Profile', content: () => <Text>Your profile</Text> } }}
        page="profile"
        onPageChange={noop}
        initialView="page"
        testID="settings"
      />
    ),
  },
  {
    name: 'floating header, a full-bleed page titled its own way',
    // Presented: it draws into the page's portal root, so each side has a page of its own.
    isolated: true,
    language: () =>
      toElement(
        L.SettingsModal(
          L.SettingsGroup(
            'General',
            L.SettingsItem('Profile', RiUserLine)
              .content(() => L.Text('Your profile'))
              .title('You')
              .fullBleed(),
          ).id('general'),
        )
          .presented(true)
          .presentation('floating'),
      ),
    bloom: () => (
      <SettingsModal
        open
        groups={[
          {
            key: 'general',
            label: 'General',
            items: [{ key: 'Profile', label: 'Profile', icon: RiUserLine, page: 'Profile' }],
          },
        ]}
        pages={{
          Profile: { title: 'You', fullBleed: true, content: () => <Text>Your profile</Text> },
        }}
        headerPresentation="floating"
      />
    ),
  },
];

export const OVERLAY_CASES: ParityCase[] = [...commands, ...settings];
