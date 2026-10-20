import React from 'react';
import { I18nManager, Linking, Text, View } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb';
import { DropdownMenuItem } from '../dropdown-menu';
import { MenuSurfaceProvider } from '../floating/context';
import { pressHost } from './support/press-host';
import { resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('Breadcrumb', () => {
  it('is a named navigation landmark with a chevron BETWEEN items only', () => {
    const { getByTestId, getByLabelText } = renderWithTheme(
      <Breadcrumb testID="nav">
        <BreadcrumbItem href="#a" testID="a">
          Home
        </BreadcrumbItem>
        <BreadcrumbItem onPress={() => {}}>Projects</BreadcrumbItem>
        <BreadcrumbItem current>Board</BreadcrumbItem>
      </Breadcrumb>,
    );
    expect(getByTestId('nav').props.role).toBe('navigation');
    expect(getByLabelText('Breadcrumb')).toBeTruthy();
    const list = getByTestId('nav').findAll((node) => node.props.role === 'list')[0]!;
    // 3 items + 2 separators, each separator hidden from assistive tech.
    const host = (predicate: (props: Record<string, any>) => boolean) =>
      list.findAll((node) => typeof node.type === 'string' && predicate(node.props));
    expect(
      host((props) => props['aria-hidden'] === true && props.style?.width === 12),
    ).toHaveLength(2);
    expect(host((props) => props.role === 'listitem')).toHaveLength(3);
  });

  it('renders href items as links and onPress items as buttons, named by their label', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <Breadcrumb>
        <BreadcrumbItem href="#home" testID="link">
          Home
        </BreadcrumbItem>
        <BreadcrumbItem onPress={onPress} testID="button">
          Projects
        </BreadcrumbItem>
      </Breadcrumb>,
    );
    expect(getByTestId('link').props.accessibilityRole).toBe('link');
    expect(getByTestId('link').props.accessibilityLabel).toBe('Home');
    const button = getByTestId('button');
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Projects');
    pressHost(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('uses normal md 14/20 labels and a 44pt native target', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <BreadcrumbItem onPress={() => {}} testID="item">
        Projects
      </BreadcrumbItem>,
    );
    expect(resolvedStyle(getByTestId('item').props.style)).toMatchObject({
      gap: 6,
      paddingLeft: 4,
      paddingRight: 4,
      paddingTop: 0,
      paddingBottom: 0,
      minHeight: 44,
    });
    expect(resolvedStyle(getByText('Projects').props.style)).toMatchObject({
      fontSize: 14,
      lineHeight: 20,
    });
  });

  it('darkens an item on hover and paints the hover pill', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <BreadcrumbItem onPress={() => {}} testID="item">
        Projects
      </BreadcrumbItem>,
    );
    const rest = resolvedStyle(getByText('Projects').props.style).color;
    expect(resolvedStyle(getByTestId('item').props.style).backgroundColor).toBe('transparent');
    fireEvent(getByTestId('item'), 'hoverIn');
    expect(resolvedStyle(getByText('Projects').props.style).color).not.toBe(rest);
    expect(resolvedStyle(getByTestId('item').props.style).backgroundColor).not.toBe('transparent');
  });

  it('renders the current page as a non-interactive item in the darker colour', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <Breadcrumb>
        <BreadcrumbItem onPress={() => {}}>Projects</BreadcrumbItem>
        <BreadcrumbItem current testID="current">
          Board
        </BreadcrumbItem>
      </Breadcrumb>,
    );
    const current = getByTestId('current');
    expect(current.props.role).toBe('listitem');
    expect(current.props.onPress).toBeUndefined();
    expect(resolvedStyle(getByText('Board').props.style).color).not.toBe(
      resolvedStyle(getByText('Projects').props.style).color,
    );
  });
  it('renders a leading node (an avatar mark) before the label, keeping the label as the name', () => {
    const { getByTestId, getByLabelText } = renderWithTheme(
      <Breadcrumb>
        <BreadcrumbItem href="#team" leading={<View testID="mark" />}>
          Design team
        </BreadcrumbItem>
        <BreadcrumbItem current>Home</BreadcrumbItem>
      </Breadcrumb>,
    );
    const link = getByLabelText('Design team');
    expect(link.findAll((node) => node.props.testID === 'mark').length).toBeGreaterThan(0);
    expect(getByTestId('mark')).toBeTruthy();
  });

  describe('separator direction', () => {
    const i18n = I18nManager as { isRTL: boolean };
    afterEach(() => {
      i18n.isRTL = false;
    });

    const separators = (ui: React.ReactElement) =>
      renderWithTheme(ui)
        .getByTestId('nav')
        .findAll((node) => typeof node.type === 'string' && node.props['aria-hidden'] === true);

    const crumbs = (props: Record<string, unknown> = {}) => (
      <Breadcrumb testID="nav" {...props}>
        <BreadcrumbItem href="#a">Home</BreadcrumbItem>
        <BreadcrumbItem current>Board</BreadcrumbItem>
      </Breadcrumb>
    );

    it('points the chevron the reading direction: unmirrored left-to-right, scaleX -1 right-to-left', () => {
      const [ltr] = separators(crumbs());
      expect(resolvedStyle(ltr!.props.style).transform).toBeUndefined();
      i18n.isRTL = true;
      const [rtl] = separators(crumbs());
      expect(resolvedStyle(rtl!.props.style).transform).toEqual([{ scaleX: -1 }]);
    });

    it('renders a caller separator in place of the chevron, hidden from assistive tech', () => {
      const nodes = separators(crumbs({ separator: <Text testID="slash">/</Text> }));
      expect(nodes).toHaveLength(1);
      expect(nodes[0]!.findAll((node) => node.props.testID === 'slash').length).toBeGreaterThan(0);
      // No chevron alongside it.
      expect(nodes[0]!.props.style?.width).toBeUndefined();
    });
  });
});

it('opens a native href through Linking while a router callback takes precedence', () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  const navigate = jest.fn();
  try {
    const ui = renderWithTheme(
      <Breadcrumb>
        <BreadcrumbItem href="https://example.test/home" testID="native-link">
          Home
        </BreadcrumbItem>
        <BreadcrumbItem href="https://example.test/page" onPress={navigate} testID="native-router">
          Page
        </BreadcrumbItem>
      </Breadcrumb>,
    );
    pressHost(ui.getByTestId('native-link'));
    expect(open).toHaveBeenCalledWith('https://example.test/home');
    pressHost(ui.getByTestId('native-router'));
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledTimes(1);
  } finally {
    open.mockRestore();
  }
});

it('measures each explicit item size and reserves current space when native layout changes', () => {
  const ui = renderWithTheme(
    <Breadcrumb overflow="collapse" testID="trail">
      <BreadcrumbItem size="lg" href="#home">
        Home
      </BreadcrumbItem>
      <BreadcrumbItem current>Current</BreadcrumbItem>
    </Breadcrumb>,
  );
  const measure = ui.getByTestId('trail-measure-0', { includeHiddenElements: true });
  const label = measure.findAll(
    (node) => typeof node.type === 'string' && node.props.children === 'Home' && node.props.style,
  )[0]!;
  expect(resolvedStyle(label.props.style)).toMatchObject({ fontSize: 16, lineHeight: 22 });
  fireEvent(measure, 'layout', { nativeEvent: { layout: { width: 60 } } });
  fireEvent(ui.getByTestId('trail-measure-1', { includeHiddenElements: true }), 'layout', {
    nativeEvent: { layout: { width: 90 } },
  });
  fireEvent(ui.getByTestId('trail'), 'layout', { nativeEvent: { layout: { width: 300 } } });
  expect(ui.queryByTestId('trail-overflow')).toBeNull();
  fireEvent(ui.getByTestId('trail'), 'layout', { nativeEvent: { layout: { width: 80 } } });
  expect(ui.getByTestId('trail-overflow')).toBeTruthy();
});

it('uses the same native URL dispatch and dismissal for a hidden-ancestor menu row', () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  const close = jest.fn();
  const navigate = jest.fn();
  try {
    const ui = renderWithTheme(
      <MenuSurfaceProvider value={{ close, presentation: 'sheet' }}>
        <DropdownMenuItem href="https://example.test/home" testID="link">
          Home
        </DropdownMenuItem>
        <DropdownMenuItem
          href="https://example.test/page"
          onPress={navigate}
          keepOpen
          testID="router"
        >
          Page
        </DropdownMenuItem>
      </MenuSurfaceProvider>,
    );
    expect(ui.getByTestId('link').props.accessibilityRole).toBe('link');
    pressHost(ui.getByTestId('link'));
    expect(open).toHaveBeenCalledWith('https://example.test/home');
    expect(close).toHaveBeenCalledTimes(1);
    pressHost(ui.getByTestId('router'));
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  } finally {
    open.mockRestore();
  }
});
