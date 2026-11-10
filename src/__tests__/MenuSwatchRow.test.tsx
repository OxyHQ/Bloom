/**
 * A menu's row of colour swatches on NATIVE (`floating/menu-swatch-row.tsx`):
 * in a phone's sheet a row of 44pt buttons, each a checkbox named by its name
 * and checked true, false or mixed for the screen reader; in a platform popup
 * (an OxyOS window) one row of the panel's keyboard navigation, with ← and →
 * its own and the arrow the menu's again at either end, its caption saying
 * what the swatch reached does.
 */
import type React from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

// Explicit native owners, not the web barrels.
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSwatchRow,
  DropdownMenuTrigger,
} from '../dropdown-menu/DropdownMenu';
import type { MenuSwatch } from '../floating/types';
import {
  SWATCH_GEOMETRY,
  swatchAcross,
  swatchChecked,
  swatchGlyph,
  swatchGlyphColor,
} from '../floating/menu-swatch-row';
import { BloomProvider } from '../provider';
import { PortalHost } from './support/portal-host';
import { mixColors } from '../styles/color-contrast';
import type { PlatformSurfaceAdapter, PopupSurfaceProps } from '../platform-surface/types';

const SWATCHES: MenuSwatch[] = [
  { key: 'red', color: '#ff3b30', name: 'Red', state: 'on', caption: 'Remove Red' },
  { key: 'orange', color: '#ff9500', name: 'Orange', state: 'off', caption: 'Add Orange' },
  { key: 'yellow', color: '#ffcc00', name: 'Yellow', state: 'mixed', caption: 'Add Yellow' },
  { key: 'green', color: '#34c759', name: 'Green', state: 'off', disabled: true },
  { key: 'blue', color: '#007aff', name: 'Blue', state: 'off', caption: 'Add Blue' },
];

describe('the swatch’s rules', () => {
  it('draws its state at rest and what a press does when lit', () => {
    expect(swatchGlyph('on', false)).toBe('check');
    expect(swatchGlyph('mixed', false)).toBe('mixed');
    expect(swatchGlyph('off', false)).toBeNull();
    expect(swatchGlyph('on', true)).toBe('remove');
    expect(swatchGlyph('mixed', true)).toBe('add');
    expect(swatchGlyph('off', true)).toBe('add');
  });

  it('announces mixed as mixed, never as unchecked', () => {
    expect(swatchChecked('on')).toBe(true);
    expect(swatchChecked('off')).toBe(false);
    expect(swatchChecked('mixed')).toBe('mixed');
  });

  it('moves across enabled swatches, mirrored right to left, and stops at the ends', () => {
    expect(swatchAcross(SWATCHES, 0, 'ArrowRight', false)).toBe(1);
    expect(swatchAcross(SWATCHES, 2, 'ArrowRight', false)).toBe(4);
    expect(swatchAcross(SWATCHES, 4, 'ArrowRight', false)).toBeNull();
    expect(swatchAcross(SWATCHES, 0, 'ArrowLeft', false)).toBeNull();
    expect(swatchAcross(SWATCHES, 0, 'ArrowLeft', true)).toBe(1);
    expect(swatchAcross(SWATCHES, 4, 'ArrowLeft', false)).toBe(2);
    expect(swatchAcross(SWATCHES, 4, 'ArrowRight', true)).toBe(2);
  });
});

function Menu({
  onSelect,
  keepOpen,
  inSub = false,
}: {
  onSelect: (key: string) => void;
  keepOpen?: boolean;
  inSub?: boolean;
}) {
  const row = (
    <DropdownMenuSwatchRow
      accessibilityLabel="Tags"
      swatches={SWATCHES}
      onSelect={onSelect}
      keepOpen={keepOpen}
      testID="tags"
    />
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Pressable testID="trigger">
          <Text>Actions</Text>
        </Pressable>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onPress={() => onSelect('open')}>Open</DropdownMenuItem>
        {inSub ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Tags</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>{row}</DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : (
          row
        )}
        <DropdownMenuItem onPress={() => onSelect('tags…')}>Tags…</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe('the swatch’s paint, light and dark', () => {
  function circle(mode: 'light' | 'dark', key: string) {
    const screen = render(
      <BloomProvider mode={mode}>
        <PortalHost>
          <Menu onSelect={() => {}} />
        </PortalHost>
      </BloomProvider>,
    );
    fireEvent.press(screen.getByTestId('trigger'));
    const box = screen.getByTestId(`tags-${key}`);
    return box.children[0] as unknown as { props: { style: Record<string, unknown> } };
  }

  it('fills with the application’s colour and rings it with its own hue toward the panel’s opposite', () => {
    const light = circle('light', 'red').props.style;
    expect(light.backgroundColor).toBe('#ff3b30');
    expect(light.borderColor).toBe(mixColors('#ff3b30', '#000000', 0.22));
    const dark = circle('dark', 'red').props.style;
    expect(dark.backgroundColor).toBe('#ff3b30');
    expect(dark.borderColor).toBe(mixColors('#ff3b30', '#FFFFFF', 0.22));
  });

  it('draws its glyph white where white holds 3:1 on the colour, else near-black', () => {
    expect(swatchGlyphColor('#ff3b30')).toBe('#FFFFFF');
    expect(swatchGlyphColor('#007aff')).toBe('#FFFFFF');
    expect(swatchGlyphColor('#ffcc00')).toBe('#1C1C1E');
    expect(swatchGlyphColor('#ff9500')).toBe('#1C1C1E');
    const glyphFill = (key: string) => {
      const glyph = circle('light', key).props as unknown as {
        children: { props: { fill: string } } | null;
      };
      return glyph.children?.props.fill;
    };
    // Red is on (a tick), Yellow mixed (a dash), each drawn in its colour's glyph.
    expect(glyphFill('red')).toBe('#FFFFFF');
    expect(glyphFill('yellow')).toBe('#1C1C1E');
  });
});

describe('DropdownMenuSwatchRow in a sheet', () => {
  function open(ui: React.ReactElement) {
    const screen = render(
      <BloomProvider mode="light">
        <PortalHost>{ui}</PortalHost>
      </BloomProvider>,
    );
    fireEvent.press(screen.getByTestId('trigger'));
    return screen;
  }

  it('is a row of checkboxes named by their names, checked true, false or mixed', () => {
    const screen = open(<Menu onSelect={() => {}} />);
    const red = screen.getByTestId('tags-red');
    expect(red.props.accessibilityRole).toBe('checkbox');
    expect(red.props.accessibilityLabel).toBe('Red');
    // `aria-checked` is the one spelling: React Native folds it into `accessibilityState`.
    expect(red.props['aria-checked']).toBe(true);
    expect(screen.getByTestId('tags-orange').props['aria-checked']).toBe(false);
    expect(screen.getByTestId('tags-yellow').props['aria-checked']).toBe('mixed');
    const green = screen.getByTestId('tags-green');
    expect(green.props.disabled).toBe(true);
    expect(green.props.onPress).toBeUndefined();
  });

  it('takes a finger: 44pt boxes, and no caption line, which needs a hover', () => {
    const screen = open(<Menu onSelect={() => {}} />);
    expect(screen.getByTestId('tags-red')).toHaveStyle({
      width: SWATCH_GEOMETRY.touch.box,
      height: SWATCH_GEOMETRY.touch.box,
    });
    expect(screen.queryByText('Remove Red', { includeHiddenElements: true })).toBeNull();
  });

  it('a press calls onSelect with the swatch’s key and closes the menu', () => {
    const onSelect = jest.fn();
    const screen = open(<Menu onSelect={onSelect} />);
    fireEvent.press(screen.getByTestId('tags-yellow'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('yellow');
    expect(screen.queryByTestId('tags')).toBeNull();
  });

  it('keepOpen keeps the menu open', () => {
    const onSelect = jest.fn();
    const screen = open(<Menu onSelect={onSelect} keepOpen />);
    fireEvent.press(screen.getByTestId('tags-red'));
    expect(onSelect).toHaveBeenCalledWith('red');
    expect(screen.getByTestId('tags')).toBeTruthy();
  });

  it('a disabled swatch presses nothing', () => {
    const onSelect = jest.fn();
    const screen = open(<Menu onSelect={onSelect} />);
    fireEvent.press(screen.getByTestId('tags-green'));
    expect(onSelect).not.toHaveBeenCalled();
  });
});

/** The caption line: hidden from assistive technology, so found among hidden elements. */
const caption = (screen: ReturnType<typeof render>, text: string) =>
  screen.getByText(text, { includeHiddenElements: true });

describe('DropdownMenuSwatchRow in a platform popup (a desktop window)', () => {
  function adapter(popup: (props: PopupSurfaceProps) => void): PlatformSurfaceAdapter {
    return {
      platform: 'test',
      capabilities: new Set(['popup-surface', 'window']),
      PopupSurface: (props) => {
        popup(props);
        return <View testID="platform-popup">{props.children}</View>;
      },
    };
  }

  function open(ui: React.ReactElement) {
    const popup = jest.fn();
    const screen = render(
      <BloomProvider mode="light" platform={adapter(popup)}>
        <PortalHost>{ui}</PortalHost>
      </BloomProvider>,
      // Each host view's ref stands for it by its testID, so a focus sent is told apart.
      { createNodeMock: (element) => ({ testID: (element.props as { testID?: string }).testID }) },
    );
    fireEvent.press(screen.getByTestId('trigger'));
    const key = (name: string) =>
      act(() => {
        const props = popup.mock.calls[popup.mock.calls.length - 1]?.[0] as
          | PopupSurfaceProps
          | undefined;
        props?.onKey?.(name);
      });
    return { screen, key };
  }

  it('is one row to ↓ and ↑, ← and → move across it, Enter presses the swatch reached', () => {
    const onSelect = jest.fn();
    const { screen, key } = open(<Menu onSelect={onSelect} />);
    key('ArrowDown');
    key('ArrowDown');
    expect(caption(screen, 'Remove Red')).toBeTruthy();
    key('ArrowRight');
    expect(caption(screen, 'Add Orange')).toBeTruthy();
    key('ArrowRight');
    key('ArrowRight');
    // Green is disabled.
    expect(caption(screen, 'Add Blue')).toBeTruthy();
    key('ArrowLeft');
    key('Enter');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('yellow');
    expect(screen.queryByTestId('platform-popup')).toBeNull();
  });

  it('↓ leaves the row for the next one', () => {
    const onSelect = jest.fn();
    const { key } = open(<Menu onSelect={onSelect} />);
    key('ArrowDown');
    key('ArrowDown');
    key('ArrowRight');
    key('ArrowDown');
    key('Enter');
    expect(onSelect).toHaveBeenCalledWith('tags…');
  });

  it('takes ← only while there is a swatch that way: from the first it closes the submenu', () => {
    const onSelect = jest.fn();
    const { screen, key } = open(<Menu onSelect={onSelect} inSub />);
    key('ArrowDown');
    key('ArrowDown');
    key('ArrowRight');
    expect(screen.getByTestId('tags')).toBeTruthy();
    expect(caption(screen, 'Remove Red')).toBeTruthy();
    key('ArrowRight');
    key('ArrowLeft');
    // Back on Red, and the submenu still open.
    expect(caption(screen, 'Remove Red')).toBeTruthy();
    key('ArrowLeft');
    expect(screen.queryByTestId('tags')).toBeNull();
  });

  it('the screen reader follows the swatch the keys reach', () => {
    jest.useFakeTimers();
    const sent = jest
      .spyOn(AccessibilityInfo, 'sendAccessibilityEvent')
      .mockImplementation(() => {});
    try {
      const { screen, key } = open(<Menu onSelect={() => {}} />);
      key('ArrowDown');
      key('ArrowDown');
      key('ArrowRight');
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(screen.getByTestId('tags')).toBeTruthy();
      expect(sent).toHaveBeenLastCalledWith({ testID: 'tags-orange' }, 'focus');
    } finally {
      sent.mockRestore();
      jest.useRealTimers();
    }
  });
});
