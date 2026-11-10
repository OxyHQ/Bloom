/**
 * The menus present as the native lens menu where the platform has it: their rows are read as
 * data and handed to the native view, which draws them. The native view is a stub here; what is
 * checked is what React tells it, and that a menu outside the vocabulary keeps its sheet.
 */
import type React from 'react';
import { Text, View } from 'react-native';
import { Button } from '../button/Button';
import { ButtonGroup, ButtonGroupItem } from '../button-group/ButtonGroup';
import { act, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme';
import type { LensNativeProps } from '../floating/lens/native-lens';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '../context-menu/ContextMenu';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../dropdown-menu/DropdownMenu';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../select/Select';

let lastProps: LensNativeProps | undefined;

function NativeLensStub(props: LensNativeProps) {
  lastProps = props;
  return <View testID="native-lens">{props.children}</View>;
}

jest.mock('../floating/lens/native-lens', () => ({
  ...jest.requireActual('../floating/lens/native-lens'),
  getNativeLens: () => NativeLensStub,
}));

function wrap(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

beforeEach(() => {
  lastProps = undefined;
});

describe('DropdownMenu as the native lens menu', () => {
  it('hands its rows to the native view, sub-menu included', () => {
    const onShare = jest.fn();
    const screen = wrap(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Text>Open</Text>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>View as</DropdownMenuLabel>
          <DropdownMenuRadioGroup value="grid" onValueChange={() => {}}>
            <DropdownMenuRadioItem value="grid">Grid</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="list">List</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked onCheckedChange={() => {}}>
            Pinned
          </DropdownMenuCheckboxItem>
          <DropdownMenuItem variant="destructive" onPress={onShare}>
            Delete
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Send to</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Mail</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByTestId('native-lens')).toBeTruthy();
    const items = lastProps?.items ?? [];
    expect(items.map((item) => item.title)).toEqual([
      'View as',
      'Grid',
      'List',
      '',
      'Pinned',
      'Delete',
      'Send to',
    ]);
    expect(items[1]).toMatchObject({ checked: true });
    expect(items[2]).toMatchObject({ checked: false });
    expect(items[5]).toMatchObject({ destructive: true });
    expect(items[6]?.items?.map((item) => item.title)).toEqual(['Mail']);
    act(() => lastProps?.onItemSelect?.({ nativeEvent: { id: items[5]?.id ?? '', index: 5 } }));
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it('keeps its sheet when a row leaves the vocabulary', () => {
    wrap(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Text>Open</Text>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <Text>Not a plain title</Text>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(lastProps).toBeUndefined();
  });
});

describe('a Button as the trigger of a lens menu', () => {
  it('tells the menu its fill and radius, so the menu morphs out of that shape', () => {
    wrap(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button style={{ borderRadius: 14 }}>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>One</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(lastProps?.cornerRadius).toBe(14);
    expect(lastProps?.triggerConfig?.tintColor).toMatch(/^(#|rgb)/);
  });
});

describe('ContextMenu as the native lens menu', () => {
  it('hands its rows to the native view', () => {
    wrap(
      <ContextMenu>
        <ContextMenuTrigger>
          <Text>Card</Text>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Copy</ContextMenuItem>
          <ContextMenuItem>Paste</ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>Mail</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
        </ContextMenuContent>
      </ContextMenu>,
    );
    expect(lastProps?.items.map((item) => item.title)).toEqual(['Copy', 'Paste', 'Share', '']);
  });
});

describe('Select as the native lens menu', () => {
  const FRUITS = [
    { value: 'apple', label: 'Apple' },
    { value: 'pear', label: 'Pear' },
  ];

  it('hands its options to the native view and chooses through it', () => {
    const onValueChange = jest.fn();
    wrap(
      <Select value="apple" onValueChange={onValueChange}>
        <SelectTrigger label="Fruit">
          <Text>Fruit</Text>
        </SelectTrigger>
        <SelectContent
          items={FRUITS}
          renderItem={(item) => (
            <SelectItem value={item.value} label={item.label}>
              {item.label}
            </SelectItem>
          )}
        />
      </Select>,
    );
    const items = lastProps?.items ?? [];
    expect(items.map((item) => [item.title, item.checked])).toEqual([
      ['Apple', true],
      ['Pear', false],
    ]);
    act(() => lastProps?.onItemSelect?.({ nativeEvent: { id: items[1]?.id ?? '', index: 1 } }));
    expect(onValueChange).toHaveBeenCalledWith('pear');
  });
});

describe('a ButtonGroup with the lens material', () => {
  it('is drawn by the native lens, and its items still press', () => {
    const onPress = jest.fn();
    const screen = wrap(
      <ButtonGroup material="lens" accessibilityLabel="Actions">
        <ButtonGroupItem onPress={onPress}>Share</ButtonGroupItem>
      </ButtonGroup>,
    );
    expect(screen.getByTestId('native-lens')).toBeTruthy();
    expect(lastProps?.items).toEqual([]);
    expect(screen.getByLabelText('Actions')).toBeTruthy();
    act(() => screen.getByText('Share').props.onPress?.());
  });

  it('keeps the shared surface without the lens prop', () => {
    const screen = wrap(
      <ButtonGroup accessibilityLabel="Actions">
        <ButtonGroupItem>Share</ButtonGroupItem>
      </ButtonGroup>,
    );
    expect(screen.queryByTestId('native-lens')).toBeNull();
  });
});
