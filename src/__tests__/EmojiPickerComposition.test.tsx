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
    const list = screen.UNSAFE_getByType(FlatList);
    expect(list.props.data).toHaveLength(rows + 1);
    expect(list.props.getItemLayout(null, rows)).toEqual({
      length: 44,
      offset: 26 + (rows - 1) * 44,
      index: rows,
    });
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

it.each([undefined, 8, 'auto'] as const)('wraps flow before layout with columns=%s', (columns) => {
  const screen = render(
    <BloomThemeProvider fonts={false}>
      <EmojiPicker groups={groups} columns={columns} scrollable={false} testID="picker" />
    </BloomThemeProvider>,
  );
  expect(screen.getByTestId('picker-body').props.onLayout).toBeUndefined();
  expect(screen.getByTestId('picker-flow').children).toHaveLength(2);
  expect(screen.queryAllByTestId(/^picker-emoji-/)).toHaveLength(5);
});

it('wraps tone controls in narrow containers without shrinking touch targets', () => {
  const screen = render(
    <BloomThemeProvider fonts={false}>
      <EmojiPicker
        groups={groups}
        embedded
        scrollable={false}
        style={{ width: 240 }}
        testID="picker"
      />
    </BloomThemeProvider>,
  );
  fireEvent.press(screen.getByTestId('picker-skin-tone'));
  expect(resolvedStyle(screen.getByTestId('picker-skin-tones').props.style).flexWrap).toBe('wrap');
  for (let tone = 0; tone < 6; tone++) {
    expect(resolvedStyle(screen.getByTestId(`picker-skin-tone-${tone}`).props.style).minWidth).toBe(
      44,
    );
  }
});
