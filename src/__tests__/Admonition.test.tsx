import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { Admonition, AdmonitionContent, AdmonitionRoot } from '../admonition';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { hostNodes, resolvedStyle } from './support/rendered-style';

const cases = [
  ['info', 'info'], ['tip', 'success'], ['warning', 'warning'], ['error', 'error'],
] as const;

describe.each(['light', 'dark'] as const)('Admonition in %s mode', mode => {
  it.each(cases)('pairs the %s surface with its readable icon and independent outline', (type, tone) => {
    let colors: ReturnType<typeof useTheme>['colors'];
    function Probe() {
      colors = useTheme().colors;
      return <Admonition type={type}>Read this carefully.</Admonition>;
    }
    const view = render(<BloomThemeProvider mode={mode} colorPreset="arctic-signal"><Probe /></BloomThemeProvider>);
    const nodes = hostNodes(view.toJSON());
    const surface = nodes.find(node => resolvedStyle(node.props.style).backgroundColor === colors[`${tone}Subtle`]);
    expect(surface).toBeDefined();
    expect(resolvedStyle(surface!.props.style)).toMatchObject({ padding: 16, borderRadius: 16 });
    expect(resolvedStyle(surface!.props.style).opacity).toBeUndefined();
    const border = nodes.find(node => resolvedStyle(node.props.style).borderColor === colors[tone]);
    expect(resolvedStyle(border!.props.style)).toMatchObject({ borderWidth: 1, opacity: 0.3, position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 });
    expect(border!.props.pointerEvents).toBe('none');
    expect(nodes.some(node => node.props.fill === colors[`${tone}SubtleForeground`])).toBe(true);
    expect(view.getByText('Read this carefully.')).toBeTruthy();
  });

  it('preserves compound rich content and root style overrides', () => {
    const view = render(<BloomThemeProvider mode={mode}>
      <AdmonitionRoot style={{ marginTop: 24, padding: 20 }}>
        <AdmonitionContent><Text>Title</Text><Text>Paragraph</Text></AdmonitionContent>
      </AdmonitionRoot>
    </BloomThemeProvider>);
    expect(view.getByText('Title')).toBeTruthy();
    expect(view.getByText('Paragraph')).toBeTruthy();
    expect(hostNodes(view.toJSON()).some(node => {
      const style = resolvedStyle(node.props.style);
      return style.marginTop === 24 && style.padding === 20;
    })).toBe(true);
  });
});
