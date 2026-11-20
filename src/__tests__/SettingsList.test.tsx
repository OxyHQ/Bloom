jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Path: 'Path',
  Defs: 'Defs',
  LinearGradient: 'LinearGradient',
  Stop: 'Stop',
  Rect: 'Rect',
}));

import type React from 'react';
import { resolveSurfaceTint } from '../surface/shared';
import { cardLayout } from './support/card-surface';
import { useSurfaceFill } from '../styles/surface-levels';
import { useCardFill } from '../card/use-card-fill';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { GROUPED_SECTION_TEST_ID } from '../grouped-section/surface';
import { GroupedSection, GroupedSectionItem } from '../grouped-section/GroupedSection';
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

describe('GroupedSectionItem', () => {
  it('renders title and description', () => {
    const { getByText } = renderWithTheme(
      <GroupedSectionItem title="Title" description="Description" />,
    );

    expect(getByText('Title')).toBeTruthy();
    expect(getByText('Description')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <GroupedSectionItem title="Press me" onPress={onPress} />,
    );

    // The row's own host node, found by the label the item derives from
    // `title`. Pressing the title `Text` instead would walk up past the row to
    // `<GroupedSectionItem onPress={…}>` in this file's own JSX and report a call
    // the component had no part in.
    pressHost(getByLabelText('Press me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('sets accessibility props when pressable', () => {
    const { getByLabelText } = renderWithTheme(
      <GroupedSectionItem
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
    const { getByTestId } = renderWithTheme(<GroupedSectionItem title="Inset" leftInset={32} />);

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

    expect(lines(<GroupedSectionItem title="Carrer del Forn 12, 08002" />)).toBe(1);
    expect(
      lines(<GroupedSectionItem title="Carrer del Forn 12, 08002" titleNumberOfLines={2} />),
    ).toBe(2);
    expect(
      lines(<GroupedSectionItem title="Carrer del Forn 12, 08002" titleNumberOfLines={0} />),
    ).toBeUndefined();
  });
});

describe('GroupedSectionItem description lines', () => {
  const lines = (props: { descriptionLines?: number }): number | undefined => {
    const { getByText } = renderWithTheme(
      <GroupedSectionItem title="Policy" description="A long description" {...props} />,
    );
    return getByText('A long description').props.numberOfLines as number | undefined;
  };

  it('keeps two lines by default, and takes a count or 0 for no clamp', () => {
    expect(lines({})).toBe(2);
    expect(lines({ descriptionLines: 4 })).toBe(4);
    expect(lines({ descriptionLines: 1 })).toBe(1);
    expect(lines({ descriptionLines: 0 })).toBeUndefined();
  });
});

describe('GroupedSection', () => {
  // The colours the provider resolves, read through the same hook the group uses,
  // so the assertion names roles rather than hex values that move with presets.
  function surfaceOf(variant?: 'plain' | 'filled') {
    let colors!: ReturnType<typeof useTheme>['colors'];
    let cardFill = '';
    let publishedFill = '';
    function PublishedProbe() {
      publishedFill = useSurfaceFill();
      return null;
    }
    function Probe() {
      colors = useTheme().colors;
      cardFill = useCardFill();
      return null;
    }
    const { toJSON, UNSAFE_root } = renderWithTheme(
      <>
        <Probe />
        <GroupedSection variant={variant}>
          <GroupedSectionItem title="Row" />
          <PublishedProbe />
        </GroupedSection>
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
    // Shared material paints below the transparent layout host.
    for (const material of UNSAFE_root.findAll(
      (node) => node.props.radius != null && typeof node.props.fill === 'string',
    )) {
      backgrounds.push(material.props.fill);
    }
    return { backgrounds, colors, cardFill, publishedFill };
  }

  it('paints the canonical card material by default', () => {
    const { backgrounds, colors, cardFill, publishedFill } = surfaceOf();
    expect(publishedFill).toBe(cardFill);
    expect(backgrounds).not.toContain(colors.backgroundSecondary);
  });

  it('paints the secondary background when filled, for a card-coloured parent', () => {
    const { backgrounds, colors } = surfaceOf('filled');
    expect(backgrounds).toContain(resolveSurfaceTint(colors.backgroundSecondary));
    expect(backgrounds).not.toContain(colors.card);
  });
});

describe('GroupedSection card radius', () => {
  it.each([
    [undefined, 28],
    ['radius-28', 28],
  ] as const)('applies %s to the actual painted card', (radius, expected) => {
    const screen = renderWithTheme(
      <GroupedSection radius={radius}>
        <GroupedSectionItem title="Account" />
      </GroupedSection>,
    );
    expect(
      resolvedStyle(screen.getByTestId(GROUPED_SECTION_TEST_ID).props.style).borderRadius,
    ).toBe(expected);
  });
});

it('separates grouped settings with parent-colored spacing by default', () => {
  const screen = renderWithTheme(
    <GroupedSection>
      <GroupedSectionItem title="First" />
      <GroupedSectionItem title="Second" />
    </GroupedSection>,
  );
  const group = screen.getByTestId(GROUPED_SECTION_TEST_ID);
  expect(cardLayout(group)).toMatchObject({
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderRadius: 28,
  });
  expect(resolvedStyle(screen.getByTestId('grouped-section-gap').props.style).height).toBe(2);
  expect(screen.queryAllByTestId('grouped-section-divider')).toHaveLength(0);
});

it('keeps explicit legacy divider separation and supports no separator', () => {
  const screen = renderWithTheme(
    <GroupedSection separator="line" radius="radius-16">
      <GroupedSectionItem title="First" />
      <GroupedSectionItem title="Second" />
    </GroupedSection>,
  );
  expect(screen.queryAllByTestId('grouped-section-divider')).toHaveLength(1);
  expect(resolvedStyle(screen.getByTestId(GROUPED_SECTION_TEST_ID).props.style).borderRadius).toBe(
    16,
  );
  screen.unmount();
  const plain = renderWithTheme(
    <GroupedSection separator="none">
      <GroupedSectionItem title="First" />
      <GroupedSectionItem title="Second" />
    </GroupedSection>,
  );
  expect(plain.queryAllByTestId('grouped-section-divider')).toHaveLength(0);
});
