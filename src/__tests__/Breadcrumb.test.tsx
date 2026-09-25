import React from 'react';
import { I18nManager, Text, View } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb';
import { borderRadius } from '../styles/tokens';
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
    expect(host((props) => props['aria-hidden'] === true && props.style?.width === 12)).toHaveLength(2);
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
    expect(getByTestId('link').props.role).toBe('link');
    expect(getByTestId('link').props.accessibilityLabel).toBe('Home');
    const button = getByTestId('button');
    expect(button.props.role).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Projects');
    pressHost(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('uses the geometry: 12/16 medium label, 2×4 padding, −4 margin, pill', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <BreadcrumbItem onPress={() => {}} testID="item">
        Projects
      </BreadcrumbItem>,
    );
    expect(resolvedStyle(getByTestId('item').props.style)).toMatchObject({
      gap: 6,
      paddingLeft: 4,
      paddingRight: 4,
      paddingTop: 2,
      paddingBottom: 2,
      marginLeft: -4,
      marginRight: -4,
      borderRadius: borderRadius.full,
    });
    expect(resolvedStyle(getByText('Projects').props.style)).toMatchObject({
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.15,
      fontWeight: '500',
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
