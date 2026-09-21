jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Path: 'Path',
}));

import React from 'react';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { SettingsListGroup, SettingsListItem } from '../settings-list/SettingsList';
import { useTheme } from '../theme/use-theme';
import { pressHost } from './support/press-host';
import { resolvedStyle } from './support/rendered-style';

let consoleErrorSpy: jest.SpyInstance;

beforeAll(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('SettingsListItem', () => {
  it('renders title and description', () => {
    const { getByText } = renderWithTheme(
      <SettingsListItem title="Title" description="Description" />,
    );

    expect(getByText('Title')).toBeTruthy();
    expect(getByText('Description')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <SettingsListItem title="Press me" onPress={onPress} />,
    );

    // The row's own host node, found by the label the item derives from
    // `title`. Pressing the title `Text` instead would walk up past the row to
    // `<SettingsListItem onPress={…}>` in this file's own JSX and report a call
    // the component had no part in.
    pressHost(getByLabelText('Press me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('sets accessibility props when pressable', () => {
    const { getByLabelText } = renderWithTheme(
      <SettingsListItem
        title="Accessible"
        onPress={() => {}}
        accessibilityLabel="Custom label"
        accessibilityHint="Custom hint"
      />,
    );

    const node = getByLabelText('Custom label');
    expect(node.props.accessibilityRole).toBe('button');
    expect(node.props.accessibilityLabel).toBe('Custom label');
    expect(node.props.accessibilityHint).toBe('Custom hint');
  });

  it('respects left inset when provided', () => {
    const { getByTestId } = renderWithTheme(
      <SettingsListItem title="Inset" leftInset={32} />,
    );

    const content = getByTestId('settings-list-item-content');
    expect(content.props['data-left-inset']).toBe(32);
  });

  /**
   * The title is clamped to ONE line by default, which is right for a setting
   * — the title is a noun ("Language") and the value sits on the right. It is
   * wrong for a row whose title IS the content: `place-details`' address row
   * lost the postcode and the town at 390 wide, silently, because the part
   * that gets cut is the part that identifies the place.
   *
   * Both directions are asserted, because the prop only earns its place if the
   * default is unchanged.
   */
  it('clamps the title to one line by default and to whatever it is told', () => {
    const lines = (ui: React.ReactElement): number | undefined => {
      const { getByText } = renderWithTheme(ui);
      return getByText('Carrer del Forn 12, 08002').props.numberOfLines as number | undefined;
    };

    expect(lines(<SettingsListItem title="Carrer del Forn 12, 08002" />)).toBe(1);
    expect(lines(<SettingsListItem title="Carrer del Forn 12, 08002" titleNumberOfLines={2} />)).toBe(2);
    expect(
      lines(<SettingsListItem title="Carrer del Forn 12, 08002" titleNumberOfLines={0} />),
    ).toBeUndefined();
  });
});

describe('SettingsListGroup', () => {
  // The colours the provider resolves, read through the same hook the group uses,
  // so the assertion names roles rather than hex values that move with presets.
  function surfaceOf(variant?: 'plain' | 'filled') {
    let colors!: ReturnType<typeof useTheme>['colors'];
    function Probe() {
      colors = useTheme().colors;
      return null;
    }
    const { toJSON } = renderWithTheme(
      <>
        <Probe />
        <SettingsListGroup variant={variant}>
          <SettingsListItem title="Row" />
        </SettingsListGroup>
      </>,
    );
    const backgrounds: string[] = [];
    const walk = (node: unknown) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) return node.forEach(walk);
      const { props, children } = node as { props?: { style?: unknown }; children?: unknown };
      const bg = resolvedStyle(props?.style).backgroundColor;
      if (typeof bg === 'string') backgrounds.push(bg);
      walk(children);
    };
    walk(toJSON());
    return { backgrounds, colors };
  }

  it('paints the card colour by default', () => {
    const { backgrounds, colors } = surfaceOf();
    expect(backgrounds).toContain(colors.card);
    expect(backgrounds).not.toContain(colors.backgroundSecondary);
  });

  it('paints the secondary background when filled, for a card-coloured parent', () => {
    const { backgrounds, colors } = surfaceOf('filled');
    expect(backgrounds).toContain(colors.backgroundSecondary);
    expect(backgrounds).not.toContain(colors.card);
  });
});
