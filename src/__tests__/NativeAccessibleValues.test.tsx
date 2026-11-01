import React from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { GroupedSection, GroupedSectionItem } from '../grouped-section';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '../select/index';
import { MeterRing } from '../stat-bar';

/**
 * What a screen reader on a native desktop (OxyOS's, VoiceOver, TalkBack) reads of three
 * controls whose words used to be lost: an accessible element is read as one, by its name, its
 * value and its role, never by the text inside it. A grouped row read its title twice and never
 * its value; a select's trigger never said its choice; an install ring at 0.42 of 1 said nothing.
 */
function wrap(children: React.ReactNode) {
  return render(<BloomThemeProvider mode="light">{children}</BloomThemeProvider>);
}

describe('GroupedSectionItem on native', () => {
  it('reads a row without a press or a control as one element: its title and its value', () => {
    const screen = wrap(
      <GroupedSection>
        <GroupedSectionItem title="Version" value="0.1" testID="version" />
      </GroupedSection>,
    );
    const row = screen.getByTestId('version');
    expect(row.props.accessible).toBe(true);
    expect(row.props.accessibilityLabel).toBe('Version');
    expect(row.props['aria-valuetext']).toBe('0.1');
    // Never a role-less container named like its title.
    expect(row.props.accessibilityRole).toBeUndefined();
  });

  it('is no element when it holds a control of its own, which is read by its own name', () => {
    const screen = wrap(
      <GroupedSection>
        <GroupedSectionItem
          title="Reduce motion"
          testID="motion"
          rightElement={
            <View accessible accessibilityRole="switch" accessibilityLabel="Reduce motion" />
          }
        />
      </GroupedSection>,
    );
    const row = screen.getByTestId('motion');
    expect(row.props.accessible).toBe(false);
    expect(row.props.accessibilityLabel).toBeUndefined();
    expect(row.props.accessibilityRole).toBeUndefined();
  });

  it('reads a pressable row its value with its name', () => {
    const screen = wrap(
      <GroupedSection>
        <GroupedSectionItem title="Theme" value="Dark" onPress={() => {}} testID="theme" />
      </GroupedSection>,
    );
    const row = screen.getByTestId('theme');
    expect(row.props.accessibilityRole).toBe('button');
    expect(row.props.accessibilityLabel).toBe('Theme');
    expect(row.props['aria-valuetext']).toBe('Dark');
  });
});

describe('Select on native', () => {
  const items = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];
  it("reads its trigger's chosen value with its name", () => {
    const screen = wrap(
      <Select value="dark">
        <SelectTrigger label="Appearance" testID="appearance">
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          label="Appearance"
          items={items}
          renderItem={(item) => (
            <SelectItem value={item.value} label={item.label}>
              <SelectItemText>{item.label}</SelectItemText>
            </SelectItem>
          )}
        />
      </Select>,
    );
    const trigger = screen.getByLabelText('Appearance');
    expect(trigger.props.accessibilityRole).toBe('button');
    expect(trigger.props.accessibilityValue).toEqual({ text: 'Dark' });
  });

  it('reads no value while nothing is chosen (the placeholder is no choice)', () => {
    const screen = wrap(
      <Select>
        <SelectTrigger label="Appearance">
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent
          items={items}
          renderItem={(item) => (
            <SelectItem value={item.value} label={item.label}>
              <SelectItemText>{item.label}</SelectItemText>
            </SelectItem>
          )}
        />
      </Select>,
    );
    expect(screen.getByLabelText('Appearance').props.accessibilityValue).toBeUndefined();
    expect(screen.getByText('Choose')).toBeTruthy();
  });
});

describe('MeterRing on native', () => {
  it('says how far along it is as a share when its caller gives no words', () => {
    const screen = wrap(
      <MeterRing value={0.42} max={1} accessibilityLabel="Installing" testID="ring" />,
    );
    expect(screen.getByTestId('ring').props['aria-valuetext']).toBe('42%');
  });

  it("keeps the caller's words", () => {
    const screen = wrap(
      <MeterRing value={3} max={10} valueText="3 of 10" accessibilityLabel="Steps" testID="ring" />,
    );
    expect(screen.getByTestId('ring').props['aria-valuetext']).toBe('3 of 10');
  });
});
