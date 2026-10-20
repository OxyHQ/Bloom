import { FlatList } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { EmojiPicker } from '../chat-composer/EmojiPicker';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const groups = [{ key: 'people', label: 'People', emojis: ['👍', '👋', '👏', '🙏', '💪'] }];

it('fits complete cells to the container and updates row chunking when it narrows', () => {
  const screen = render(
    <BloomThemeProvider fonts={false}>
      <EmojiPicker groups={groups} columns="auto" testID="picker" />
    </BloomThemeProvider>,
  );
  const cell = screen.getByTestId('picker-emoji-👍');
  expect(resolvedStyle(cell.props.style).height).toBe(44);
  const resize = (width: number) =>
    fireEvent(screen.getByTestId('picker-body'), 'layout', {
      nativeEvent: { layout: { width, height: 100 } },
    });
  for (const [width, rows] of [
    [220, 1],
    [100, 3],
    [44, 5],
    [0, 5],
  ] as const) {
    resize(width);
    // Exact measured row offsets keep virtualization and category jumps aligned.
    expect(screen.UNSAFE_getByType(FlatList).props.data).toHaveLength(rows + 1);
    expect(resolvedStyle(screen.getByTestId('picker-emoji-👍').props.style).width).toBe(44);
  }
});

it('selects a tone-modified emoji on the first native press', () => {
  const choose = jest.fn();
  const screen = render(
    <BloomThemeProvider fonts={false}>
      <EmojiPicker
        groups={groups}
        scrollable={false}
        skinTone={3}
        onSelectEmoji={choose}
        testID="picker"
      />
    </BloomThemeProvider>,
  );
  fireEvent.press(screen.getByTestId('picker-emoji-👍'));
  expect(choose).toHaveBeenCalledWith('👍🏽');
});

it('uses intrinsic wrapping in auto flow before any layout callback', () => {
  const screen = render(
    <BloomThemeProvider fonts={false}>
      <EmojiPicker groups={groups} columns="auto" scrollable={false} testID="picker" />
    </BloomThemeProvider>,
  );
  expect(screen.getByTestId('picker-body').props.onLayout).toBeUndefined();
  expect(screen.getByTestId('picker-grid').children).toHaveLength(2);
  expect(screen.queryAllByTestId(/^picker-emoji-/)).toHaveLength(5);
});
