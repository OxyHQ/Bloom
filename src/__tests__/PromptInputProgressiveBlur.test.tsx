/**
 * `PromptInput` is a composer with THREE mutually exclusive right-hand states —
 * submit, stop, and the empty action — and the whole family exists so an app
 * does not re-derive that from `isLoading` and `value.length` at every call
 * site and get one combination wrong. The dangerous combination is loading with
 * text: a submit button still live there sends a second request.
 *
 * `ProgressiveBlur` is a platform fork whose native side stacks ten thin blur
 * layers because iOS has no variable-blur API. What a jest run can see is that
 * the stack IS the implementation (one `BlurView` would be a hard blur line,
 * which reads as "the gradient looks wrong" rather than as a missing feature)
 * and that `direction` moves the anchor rather than only the gradient.
 */
import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PromptInput } from '../prompt-input';
import { ProgressiveBlur } from '../progressive-blur';
import { hostNodes, resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('PromptInput', () => {
  it('renders its placeholder', () => {
    const { getAllByPlaceholderText } = renderWithTheme(
      <PromptInput value="" onValueChange={() => {}} placeholder="Ask anything" />,
    );
    expect(getAllByPlaceholderText('Ask anything').length).toBeGreaterThan(0);
  });

  it('reports typing to the caller rather than owning the text', () => {
    const onValueChange = jest.fn();
    const { getAllByPlaceholderText } = renderWithTheme(
      <PromptInput value="" onValueChange={onValueChange} placeholder="Ask anything" />,
    );
    const [field] = getAllByPlaceholderText('Ask anything');
    if (field === undefined) throw new Error('the composer rendered no text field');
    fireEvent.changeText(field, 'hello');
    expect(onValueChange).toHaveBeenCalledWith('hello');
  });

  it('shows the empty action only while there is nothing to send', () => {
    const withText = renderWithTheme(
      <PromptInput
        value="hello"
        onValueChange={() => {}}
        emptyAction={<Text>Dictate</Text>}
        placeholder="Ask anything"
      />,
    );
    expect(withText.queryByText('Dictate')).toBeNull();

    const empty = renderWithTheme(
      <PromptInput
        value=""
        onValueChange={() => {}}
        emptyAction={<Text>Dictate</Text>}
        placeholder="Ask anything"
      />,
    );
    expect(empty.getByText('Dictate')).toBeTruthy();
  });

  it('becomes Stop while loading, but only when the caller can actually stop', () => {
    // `isLoading` alone is not the discriminator: a stop button with no handler
    // is a dead control, so the affordance appears exactly when `onStop` does.
    const stoppable = renderWithTheme(
      <PromptInput
        value=""
        isLoading
        onStop={() => {}}
        onValueChange={() => {}}
        emptyAction={<Text>Dictate</Text>}
        placeholder="Ask anything"
      />,
    );
    expect(stoppable.getByLabelText('Stop')).toBeTruthy();
    expect(stoppable.queryByText('Dictate')).toBeNull();

    const unstoppable = renderWithTheme(
      <PromptInput
        value=""
        isLoading
        onValueChange={() => {}}
        emptyAction={<Text>Dictate</Text>}
        placeholder="Ask anything"
      />,
    );
    expect(unstoppable.queryByLabelText('Stop')).toBeNull();
    expect(unstoppable.getByText('Dictate')).toBeTruthy();
  });

  it('disables Send until there is something to send', () => {
    const empty = renderWithTheme(
      <PromptInput value="" onValueChange={() => {}} placeholder="Ask anything" />,
    );
    expect(empty.getByLabelText('Send').props.disabled).toBe(true);

    const typed = renderWithTheme(
      <PromptInput value="hello" onValueChange={() => {}} placeholder="Ask anything" />,
    );
    expect(typed.getByLabelText('Send').props.disabled).toBe(false);
  });

  it('treats whitespace as nothing to send', () => {
    const { getByLabelText } = renderWithTheme(
      <PromptInput value="   " onValueChange={() => {}} placeholder="Ask anything" />,
    );
    expect(getByLabelText('Send').props.disabled).toBe(true);
  });

  it('renders whatever the caller puts on the left of the action bar', () => {
    const { getByText } = renderWithTheme(
      <PromptInput
        value=""
        onValueChange={() => {}}
        actionsLeft={<Text>Attach</Text>}
        placeholder="Ask anything"
      />,
    );
    expect(getByText('Attach')).toBeTruthy();
  });

  it('lets compound children replace the built-in layout entirely', () => {
    const { getByText, queryByPlaceholderText } = renderWithTheme(
      <PromptInput value="" onValueChange={() => {}} placeholder="Ask anything">
        <Text>Custom composer</Text>
      </PromptInput>,
    );
    expect(getByText('Custom composer')).toBeTruthy();
    expect(queryByPlaceholderText('Ask anything')).toBeNull();
  });
});

describe('ProgressiveBlur', () => {
  it('stacks several layers rather than drawing one blur with a hard edge', () => {
    const { UNSAFE_root } = renderWithTheme(<ProgressiveBlur />);
    const layers = UNSAFE_root.findAllByType('BlurView' as never);
    expect(layers.length).toBeGreaterThan(1);
  });

  it('applies the intensity per layer, so the falloff reads as continuous', () => {
    const { UNSAFE_root } = renderWithTheme(<ProgressiveBlur intensity={9} />);
    const layers = UNSAFE_root.findAllByType('BlurView' as never);
    for (const layer of layers) {
      expect(layer.props.intensity).toBe(9);
    }
  });

  it('anchors to the edge it is told to, not always the top', () => {
    const top = renderWithTheme(<ProgressiveBlur direction="top" />);
    const bottom = renderWithTheme(<ProgressiveBlur direction="bottom" />);

    const anchorsOf = (tree: unknown) =>
      hostNodes(tree)
        .map((node) => resolvedStyle(node.props.style))
        .filter((style) => style.top === 0 || style.bottom === 0)
        .map((style) => (style.top === 0 ? 'top' : 'bottom'));

    expect(anchorsOf(top.toJSON())).toContain('top');
    expect(anchorsOf(bottom.toJSON())).toContain('bottom');
  });
});
