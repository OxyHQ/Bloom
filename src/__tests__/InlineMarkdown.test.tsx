import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { InlineMarkdown } from '../markdown';
import { parseInlineMarkdown, truncateInlineMarkdown } from '../markdown/inline';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function mount(child: React.ReactNode) {
  return render(
    <BloomThemeProvider colorPreset="teal" mode="light">
      <Text>{child}</Text>
    </BloomThemeProvider>,
  );
}

describe('standalone inline Markdown', () => {
  it('shares bold formatting and leaves code untouched while decorating plain text', () => {
    const renderText = jest.fn((text: string) => text);
    const view = mount(
      <InlineMarkdown
        source={'Use **Deck** and `**literal**` [#tag](/tag)'}
        renderText={renderText}
      />,
    );
    expect(StyleSheet.flatten(view.getByText('Deck').props.style)).toMatchObject({
      fontWeight: '600',
    });
    expect(view.getByText('**literal**')).toBeTruthy();
    expect(renderText).toHaveBeenCalledWith('Deck');
    expect(renderText).not.toHaveBeenCalledWith('**literal**');
    expect(renderText).not.toHaveBeenCalledWith('#tag');
  });

  it('passes the original link label after clipping and appends an inline suffix', () => {
    const nodes = truncateInlineMarkdown(parseInlineMarkdown('[@Alice](/@alice) hello'), 3).nodes;
    const renderLink = jest.fn(({ children }: { children: React.ReactNode }) => (
      <Text testID="mention">{children}</Text>
    ));
    const view = mount(
      <InlineMarkdown nodes={nodes} renderLink={renderLink} suffix={<Text>Read more</Text>} />,
    );
    expect(view.getByText('@Al…')).toBeTruthy();
    expect(view.getByText('Read more')).toBeTruthy();
    expect(renderLink).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/@alice', label: '@Alice' }),
    );
  });

  it('retains default links when a custom renderer returns undefined and isolates the press', () => {
    const onLinkPress = jest.fn();
    const view = mount(
      <InlineMarkdown
        source="[go](/route)"
        renderLink={() => undefined}
        onLinkPress={onLinkPress}
      />,
    );
    const event = { preventDefault: jest.fn(), stopPropagation: jest.fn() };
    fireEvent.press(view.getByText('go'), event);
    expect(onLinkPress).toHaveBeenCalledWith('/route');
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
  });

  it('never supplies unsafe links to custom renderers, even from caller-provided nodes', () => {
    const renderLink = jest.fn();
    const view = mount(
      <InlineMarkdown
        nodes={[
          {
            type: 'link',
            url: 'javascript:alert(1)',
            children: [{ type: 'text', value: 'unsafe' }],
          },
        ]}
        renderLink={renderLink}
      />,
    );
    expect(view.getByText('unsafe').props.role).toBeUndefined();
    expect(renderLink).not.toHaveBeenCalled();
  });

  it('closes streaming emphasis without needing a Markdown document context', () => {
    const view = mount(<InlineMarkdown source="**Deck" streaming />);
    expect(StyleSheet.flatten(view.getByText('Deck').props.style)).toMatchObject({
      fontWeight: '600',
    });
  });
});
