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
import { BloomScope } from '../appearance';
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

describe('compact density (a desktop form)', () => {
  it('draws 36-point rows in the body style, hairlines inset at the text, a 12 radius and the title as written', () => {
    const screen = render(
      <BloomThemeProvider>
        <GroupedSection
          density="compact"
          title="Dynamic Wallpapers"
          footer="Changes with the time."
        >
          <GroupedSectionItem title="Plain" testID="plain" />
          <GroupedSectionItem title="With icon" icon={<View />} />
          <GroupedSectionItem title="Inset" leftInset={44} />
          <GroupedSectionItem title="Last" />
        </GroupedSection>
      </BloomThemeProvider>,
    );
    expect(cardLayout(screen.getByTestId(GROUPED_SECTION_TEST_ID)).borderRadius).toBe(12);
    const row = resolvedStyle(screen.getAllByTestId('settings-list-item-content')[0]?.props.style);
    expect(row).toMatchObject({
      minHeight: 36,
      paddingLeft: 10,
      paddingRight: 10,
      paddingVertical: 6,
    });
    // The body style (13 on a desktop), regular, not the 15/500 touch label.
    const label = resolvedStyle(screen.getByText('Plain').props.style);
    expect(label.fontWeight).toBe('400');
    expect(label.fontSize).toBe(14);
    // Each hairline starts at the text of the row above it: 10, after an icon 10 + 20 + 8, else the
    // row's own inset. No 2-point gaps.
    const insets = screen
      .getAllByTestId('grouped-section-divider')
      .map((divider) => resolvedStyle(divider.props.style).marginStart);
    expect(insets).toEqual([10, 38, 44]);
    expect(screen.queryByTestId('grouped-section-gap')).toBeNull();
    // The title in the headline style (bold body), as it is written: no capitals forced.
    const title = resolvedStyle(screen.getByText('Dynamic Wallpapers').props.style);
    expect(title.textTransform).toBeUndefined();
    expect(title.fontWeight).toBe('700');
    expect(title.paddingHorizontal).toBe(10);
  });

  it('follows the nearest scope, and an explicit density wins', () => {
    const screen = render(
      <BloomThemeProvider>
        <BloomScope contentDensity="compact">
          <GroupedSection title="Scoped">
            <GroupedSectionItem title="A" />
          </GroupedSection>
          <GroupedSection density="comfortable" title="Touch">
            <GroupedSectionItem title="B" />
          </GroupedSection>
        </BloomScope>
      </BloomThemeProvider>,
    );
    const [scoped, touch] = screen.getAllByTestId(GROUPED_SECTION_TEST_ID);
    expect(cardLayout(scoped!).borderRadius).toBe(12);
    expect(cardLayout(touch!).borderRadius).toBe(28);
    const rows = screen.getAllByTestId('settings-list-item-content');
    expect(resolvedStyle(rows[0]?.props.style).minHeight).toBe(36);
    expect(resolvedStyle(rows[1]?.props.style).minHeight).toBe(52);
    expect(resolvedStyle(screen.getByText('Touch').props.style).textTransform).toBe('uppercase');
  });
});
