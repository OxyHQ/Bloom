import React from 'react';
import { View, Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import {
  GroupedSection,
  GroupedSectionItem,
  GroupedSectionDivider,
  GroupedSectionCollapse,
} from '../grouped-section';
import { SettingsListGroup, SettingsListItem, SettingsListDivider } from '../settings-list';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { GROUPED_SECTION_TEST_ID } from '../grouped-section/surface';
import { SurfacePaint } from '../surface/SurfacePaint';
import { cardLayout } from './support/card-surface';
import { resolvedStyle } from './support/rendered-style';

it('keeps compatibility names bound to the exact canonical component objects', () => {
  expect(SettingsListGroup).toBe(GroupedSection);
  expect(SettingsListItem).toBe(GroupedSectionItem);
  expect(SettingsListDivider).toBe(GroupedSectionDivider);
});

it('renders the neutral family with intrinsic rounded spacing and arbitrary row content', () => {
  const screen = render(
    <BloomThemeProvider>
      <GroupedSection>
        <GroupedSectionItem title="Account" />
        <View>
          <Text>Storage</Text>
        </View>
      </GroupedSection>
    </BloomThemeProvider>,
  );
  expect(screen.getByText('Account')).toBeTruthy();
  expect(screen.getByText('Storage')).toBeTruthy();
  expect(cardLayout(screen.getByTestId(GROUPED_SECTION_TEST_ID))).toMatchObject({
    borderRadius: 28,
    backgroundColor: 'transparent',
  });
});

it('paints one actual shared material behind all transparent rows, without per-row rims', () => {
  const screen = render(
    <BloomThemeProvider>
      <GroupedSection>
        <GroupedSectionItem title="Account" />
        <GroupedSectionItem title="Settings" />
      </GroupedSection>
    </BloomThemeProvider>,
  );
  const group = screen.getByTestId(GROUPED_SECTION_TEST_ID);
  const paint = (SurfacePaint as unknown as { type: unknown }).type;
  expect(group.findAll((node) => node.type === paint)).toHaveLength(1);
  for (const row of screen.getAllByTestId('grouped-section-row')) {
    expect(row.findAll((node) => node.type === paint)).toHaveLength(0);
    expect(resolvedStyle(row.props.style).backgroundColor).toBe('transparent');
  }
  expect(resolvedStyle(screen.getByTestId('grouped-section-gap').props.style).height).toBe(2);
});

it('flattens fragments into spaced rows while preserving their keyed identity', () => {
  let mounts = 0;
  function StatefulRow() {
    React.useEffect(() => {
      mounts += 1;
    }, []);
    return <Text>Stateful</Text>;
  }
  const draw = (extra: boolean) => (
    <BloomThemeProvider>
      <GroupedSection>
        {extra ? <GroupedSectionItem key="extra" title="Extra" /> : null}
        <React.Fragment key="account">
          <StatefulRow key="stateful" />
          <GroupedSectionItem key="settings" title="Settings" />
        </React.Fragment>
      </GroupedSection>
    </BloomThemeProvider>
  );
  const screen = render(draw(false));
  expect(screen.getAllByTestId('grouped-section-row')).toHaveLength(2);
  const before = mounts;
  screen.rerender(draw(true));
  expect(screen.getAllByTestId('grouped-section-row')).toHaveLength(3);
  expect(mounts).toBe(before);
});

it('reveals rows through shared measured motion without adding a second material or closed-state gaps', () => {
  const draw = (open: boolean) => (
    <BloomThemeProvider>
      <GroupedSection>
        <GroupedSectionItem title="Account summary" />
        <GroupedSectionCollapse open={open} testID="accounts-reveal" transition={{ duration: 0 }}>
          <GroupedSectionItem title="Other account" />
          <GroupedSectionItem title="Add account" />
        </GroupedSectionCollapse>
        <GroupedSectionItem title="Manage account" />
      </GroupedSection>
    </BloomThemeProvider>
  );
  const screen = render(draw(false));
  expect(screen.queryByText('Other account')).toBeNull();
  expect(screen.getAllByTestId('grouped-section-gap')).toHaveLength(1);
  screen.rerender(draw(true));
  expect(screen.getByText('Other account')).toBeTruthy();
  expect(screen.getAllByTestId('grouped-section-gap')).toHaveLength(3);
  const paint = (SurfacePaint as unknown as { type: unknown }).type;
  expect(
    screen.getByTestId(GROUPED_SECTION_TEST_ID).findAll((node) => node.type === paint),
  ).toHaveLength(1);
  screen.rerender(draw(false));
  expect(screen.getAllByTestId('grouped-section-gap')).toHaveLength(1);
  expect(screen.getByText('Manage account')).toBeTruthy();
});

it('forwards selection, busy state and testID to the actual interactive row', () => {
  const onPress = jest.fn();
  const screen = render(
    <BloomThemeProvider>
      <GroupedSectionItem
        title="Account"
        testID="account-row"
        onPress={onPress}
        accessibilityState={{ selected: true, busy: true }}
      />
    </BloomThemeProvider>,
  );
  const row = screen.getByTestId('account-row');
  expect(row.props.accessibilityState).toMatchObject({ selected: true, busy: true });
  expect(row.props['aria-selected']).toBe(true);
  expect(row.props['aria-busy']).toBe(true);
  fireEvent.press(row);
  expect(onPress).toHaveBeenCalledTimes(1);
});

it.each([
  { disabled: true, accessibilityState: { disabled: false, selected: true } },
  { disabled: false, accessibilityState: { disabled: true, busy: true } },
])('combines disabled constraints without losing other row state: %j', (props) => {
  const onPress = jest.fn();
  const screen = render(
    <BloomThemeProvider>
      <GroupedSectionItem title="Account" testID="account-row" onPress={onPress} {...props} />
    </BloomThemeProvider>,
  );
  const row = screen.getByTestId('account-row');
  expect(row.props.accessibilityState).toEqual({ ...props.accessibilityState, disabled: true });
  expect(row.props.disabled).toBe(true);
  expect(row.props.onPress).toBeUndefined();
  expect(row.props.onPressIn).toBeUndefined();
});

it('preserves state and identity for static rows without adding a button', () => {
  const screen = render(
    <BloomThemeProvider>
      <GroupedSectionItem
        title="Account"
        testID="account-row"
        accessibilityState={{ selected: true, busy: true }}
      />
    </BloomThemeProvider>,
  );
  const row = screen.getByTestId('account-row');
  expect(row.props.accessibilityState).toMatchObject({ selected: true, busy: true });
  expect(row.props['aria-selected']).toBe(true);
  expect(row.props['aria-busy']).toBe(true);
  expect(row.props.onPress).toBeUndefined();
});
