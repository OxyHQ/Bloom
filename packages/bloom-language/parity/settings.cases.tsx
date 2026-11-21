import { RiMailLine, RiSmartphoneLine } from '@oxy.so/bloom/icons';
import {
  SettingsDateField,
  SettingsSection,
  SettingsSelect,
  SettingsTextField,
  SettingsValueField,
} from '@oxy.so/bloom/settings-modal';
import { tokens } from '@oxy.so/bloom/styles';
import { Text } from '@oxy.so/bloom/typography';

import * as S from '../src/controls/settings';
import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const { space } = tokens;
const choose = (_value: 'always' | 'wifi' | 'never') => {};
const commit = (_value: string) => {};
const change = (_date: Date) => {};
const AUTOPLAY = [
  { value: 'always', label: 'Always' },
  { value: 'wifi', label: 'On Wi-Fi' },
  { value: 'never', label: 'Never' },
] as const;
const BORN = new Date(1997, 6, 28);
const EARLIEST = new Date(1900, 0, 1);
const LATEST = new Date(2020, 0, 1);
const iso = (date: Date) => date.toISOString().slice(0, 10);

/** The settings pages' rows, each beside the Bloom row an app writes in a settings page today. */
export const SETTINGS_CASES: ParityCase[] = [
  {
    name: 'a section: label, description, action and its rows',
    language: () =>
      toElement(
        S.SettingsSection('Devices', S.SettingsValue('Pixel 9').icon(RiSmartphoneLine))
          .description('Where you are signed in')
          .trailing(L.Text('Manage'))
          .testID('devices'),
      ),
    bloom: () => (
      <SettingsSection
        label="Devices"
        description="Where you are signed in"
        action={<Text>Manage</Text>}
        testID="devices"
      >
        <SettingsValueField icon={RiSmartphoneLine}>Pixel 9</SettingsValueField>
      </SettingsSection>
    ),
  },
  {
    name: 'an unlabelled section, its label inset as the Tools page’s, in a frame',
    language: () =>
      toElement(
        S.SettingsSection(undefined, S.SettingsValue('a1b2c3').muted()).inset('sm').padding('md'),
      ),
    bloom: () => (
      <SettingsSection
        inset={space.sm}
        style={{
          paddingTop: space.md,
          paddingBottom: space.md,
          paddingStart: space.md,
          paddingEnd: space.md,
        }}
      >
        <SettingsValueField muted>a1b2c3</SettingsValueField>
      </SettingsSection>
    ),
  },
  {
    name: 'a compact select in a row',
    language: () =>
      toElement(S.SettingsSelect('Autoplay videos', ['wifi', choose], AUTOPLAY).testID('autoplay')),
    bloom: () => (
      <SettingsSelect
        label="Autoplay videos"
        value="wifi"
        onChange={choose}
        items={AUTOPLAY}
        testID="autoplay"
      />
    ),
  },
  ...ENUMS.controlSize.map((size) => ({
    name: `a field-sized ${size} select, disabled, its width and a capped trigger`,
    language: () =>
      toElement(
        S.SettingsSelect('Autoplay videos', ['never', choose], AUTOPLAY)
          .compact(false)
          .size(size)
          .disabled()
          .width('200')
          .frame({ maxWidth: '160' }),
      ),
    bloom: () => (
      <SettingsSelect
        label="Autoplay videos"
        value="never"
        onChange={choose}
        items={AUTOPLAY}
        compact={false}
        size={size}
        disabled
        width={200}
        style={{ maxWidth: 160 }}
      />
    ),
  })),
  {
    name: 'a text field that commits its draft',
    language: () =>
      toElement(
        S.SettingsTextField('Email', ['ana@oxy.so', commit])
          .icon(RiMailLine)
          .placeholder('you@example.com')
          .keyboard('email-address')
          .contentType('email')
          .testID('email'),
      ),
    bloom: () => (
      <SettingsTextField
        label="Email"
        value="ana@oxy.so"
        onCommit={commit}
        icon={RiMailLine}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="email"
        testID="email"
      />
    ),
  },
  {
    name: 'a disabled text field with no saved toast',
    language: () =>
      toElement(S.SettingsTextField('Name', ['Ana', commit]).disabled().savedToast(false)),
    bloom: () => (
      <SettingsTextField
        label="Name"
        value="Ana"
        onCommit={commit}
        disabled
        showSavedToast={false}
      />
    ),
  },
  {
    name: 'a date field',
    language: () => toElement(S.SettingsDateField('Birthday', [BORN, change]).testID('born')),
    bloom: () => (
      <SettingsDateField label="Birthday" value={BORN} onChange={change} testID="born" />
    ),
  },
  {
    name: 'a date field in a range, read its own way',
    language: () =>
      toElement(
        S.SettingsDateField('Birthday', [BORN, change])
          .minDate(EARLIEST)
          .maxDate(LATEST)
          .dateFormat(iso)
          .savedToast(false),
      ),
    bloom: () => (
      <SettingsDateField
        label="Birthday"
        value={BORN}
        onChange={change}
        minDate={EARLIEST}
        maxDate={LATEST}
        formatDate={iso}
        showSavedToast={false}
      />
    ),
  },
];
