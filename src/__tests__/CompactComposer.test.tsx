import React, { useState } from 'react';
import { Text, TextInput } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { CompactComposer } from '../chat-composer/CompactComposer';
import { acceptsComposerText } from '../chat-composer/compact-text';
import { GlyphButton } from '../button/GlyphButton';
import { CollapsibleFrame } from '../collapsible/CollapsibleFrame';
import { MediaAttachmentIcon } from '../icons/social/MediaAttachmentIcon';
import type { CompactComposerProps } from '../chat-composer/compact-types';

function mount(props: Partial<CompactComposerProps> = {}) {
  const change = jest.fn();
  const submit = jest.fn();
  const expand = jest.fn();
  function Editor() {
    const [value, setValue] = useState(props.value ?? '');
    return (
      <BloomThemeProvider mode="light">
        <CompactComposer
          maxLength={5}
          testID="editor"
          onSubmit={submit}
          onExpand={expand}
          {...props}
          value={value}
          onChangeText={(next) => {
            change(next);
            setValue(next);
          }}
        />
      </BloomThemeProvider>
    );
  }
  return { ...render(<Editor />), change, submit, expand };
}

it('preserves the input and rejected text while pulsing each new limit attempt', () => {
  const view = mount();
  const input = view.UNSAFE_getByType(TextInput);
  fireEvent.changeText(input, 'abcde');
  expect(input.props.value).toBe('abcde');
  fireEvent.changeText(input, 'abcdef');
  expect(input.props.value).toBe('abcde');
  expect(view.change).toHaveBeenCalledTimes(1);
  expect(view.UNSAFE_getByType(GlyphButton).props.attention).toBe(1);
  fireEvent.changeText(input, 'abcdefg');
  expect(view.UNSAFE_getByType(GlyphButton).props.attention).toBe(2);
  expect(view.UNSAFE_getByType(TextInput)).toBe(input);
  expect(view.UNSAFE_getByType(GlyphButton).props.size).toBe(32);
});

it('keeps legacy over-limit drafts editable without permitting submission', () => {
  const view = mount({ value: 'long draft' });
  const input = view.UNSAFE_getByType(TextInput);
  fireEvent.press(view.getByTestId('editor-submit'));
  expect(view.submit).not.toHaveBeenCalled();
  fireEvent.changeText(input, 'shorter');
  expect(input.props.value).toBe('shorter');
  fireEvent.changeText(input, 'changed');
  expect(input.props.value).toBe('changed');
  fireEvent.changeText(input, 'changed!');
  expect(input.props.value).toBe('changed');
  fireEvent.changeText(input, 'valid');
  fireEvent.press(view.getByTestId('editor-submit'));
  expect(view.submit).toHaveBeenCalledTimes(1);
});

it('keeps focus expansion separate from content expansion and resets the owner on unmount', () => {
  const onFocusChange = jest.fn();
  const view = mount({ onFocusChange });
  const input = view.UNSAFE_getByType(TextInput);
  expect(view.UNSAFE_getByType(CollapsibleFrame).props.open).toBe(false);
  fireEvent(input, 'focus', {});
  expect(onFocusChange).toHaveBeenLastCalledWith(true);
  expect(view.UNSAFE_getByType(CollapsibleFrame).props.open).toBe(true);
  fireEvent(input, 'blur', {});
  expect(onFocusChange).toHaveBeenLastCalledWith(false);
  expect(view.UNSAFE_getByType(CollapsibleFrame).props.open).toBe(false);
  fireEvent.changeText(input, 'draft');
  expect(view.UNSAFE_getByType(CollapsibleFrame).props.open).toBe(true);
  expect(view.UNSAFE_getByType(TextInput)).toBe(input);
  view.unmount();
  expect(onFocusChange).toHaveBeenLastCalledWith(false);
});

it('submits attachment-only content and lets application permissions fence every control', () => {
  const pick = jest.fn();
  const view = mount({
    attachments: <Text>Photo preview</Text>,
    attachmentActions: [
      {
        id: 'media',
        label: 'Attach photo',
        icon: MediaAttachmentIcon,
        onPress: pick,
      },
    ],
  });
  fireEvent.press(view.getByLabelText('Attach photo'));
  expect(pick).toHaveBeenCalledTimes(1);
  fireEvent.press(view.getByTestId('editor-submit'));
  expect(view.submit).toHaveBeenCalledTimes(1);
  const disabled = mount({ value: 'hello', busy: true });
  fireEvent.press(disabled.getByTestId('editor-submit'));
  fireEvent.press(disabled.getByTestId('editor-maximize'));
  fireEvent.changeText(disabled.UNSAFE_getByType(TextInput), 'bye');
  expect(disabled.submit).not.toHaveBeenCalled();
  expect(disabled.expand).not.toHaveBeenCalled();
  expect(disabled.change).toHaveBeenCalledWith('bye');
  expect(disabled.UNSAFE_getByType(TextInput).props.value).toBe('bye');
});

it('uses UTF-16 length and never silently truncates an incoming draft', () => {
  expect(acceptsComposerText('', 'x'.repeat(250), 250)).toBe(true);
  expect(acceptsComposerText('', 'x'.repeat(251), 250)).toBe(false);
  expect(acceptsComposerText('x'.repeat(250), 'y'.repeat(250), 250)).toBe(true);
  expect(acceptsComposerText('', '😀', 1)).toBe(false);
  expect(acceptsComposerText('', '😀', 2)).toBe(true);
  expect(acceptsComposerText('abcdef', 'fedcba', 3)).toBe(true);
  expect(acceptsComposerText('abcdef', 'abcdefg', 3)).toBe(false);
  expect(acceptsComposerText('abcdef', '', 3)).toBe(true);
});
