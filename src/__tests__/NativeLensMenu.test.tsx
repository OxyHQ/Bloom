/**
 * The menus present as the native lens menu where the platform has it: their rows are read as
 * data and handed to the native view, which draws them. The native view is a stub here; what is
 * checked is what React tells it, and that a menu outside the vocabulary keeps its sheet.
 */
import { useEffect, useImperativeHandle, useState } from 'react';
import type React from 'react';
import { Text, View } from 'react-native';
import { Button } from '../button/Button';
import { PageHeader } from '../page-header/PageHeader';
import { BlurIsland } from '../blur';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { RiFilterLine } from '../icons/remix/RiFilterLine';
import { Surface } from '../surface/Surface';
import { ComposerPopover } from '../composer-panel/ComposerPopover';
import { BlurWindow } from '../blur';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme';
import { lens } from './lens-stub';
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

jest.mock('../floating/lens/native-lens', () => {
  const { stubLens } = jest.requireActual('./lens-stub');
  return {
    ...jest.requireActual('../floating/lens/native-lens'),
    getNativeLens: () => stubLens,
    useInLensBase: stubLens.useInLensBase,
    useLensBaseMenu: stubLens.useLensBaseMenu,
  };
});

/** What the native view was last given. */
const props = () => lens.last;

function wrap(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

beforeEach(() => {
  lens.reset();
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
    const items = props()?.items ?? [];
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
    act(() => props()?.onItemSelect?.({ nativeEvent: { id: items[5]?.id ?? '', index: 5 } }));
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it('is mounted with its trigger and opens natively: one call to the engine, no remount', () => {
    const screen = wrap(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Text>Open</Text>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Share</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(props()).toMatchObject({ fontFamily: 'Inter' });
    // Bloom's colours, the engine's own glass: the panel at its transparency, a plain trigger
    // morphing out of untinted glass.
    expect(props()?.config?.tintOpacity).toBeUndefined();
    expect(props()?.triggerConfig).toBeUndefined();
    expect(props()?.items.map((item) => item.title)).toEqual(['Share']);
    fireEvent.press(screen.getByText('Open'));
    expect(lens.handle.open).toHaveBeenCalledTimes(1);
    expect(lens.mounts).toBe(1);
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
    expect(props()).toBeUndefined();
  });
});

describe('a lens trigger', () => {
  it('is a lens base tinted with its tone (the base takes the menu back as the upstream trigger)', () => {
    wrap(
      <DropdownMenu>
        <DropdownMenuTrigger asChild lensTone="primary">
          <Text>Open</Text>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Share</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(props()?.lens).toBe(true);
    expect(props()?.triggerConfig).toMatchObject({ tintOpacity: 0.96 });
  });
});

describe('a DropdownMenu whose rows a component of its own renders, only while it is open', () => {
  it('mounts the native view with its trigger, with no rows; the rows open it as they arrive', () => {
    const onDelete = jest.fn();
    const screen = wrap(<Menu onDelete={onDelete} />);
    expect(screen.getByTestId('native-lens')).toBeTruthy();
    expect(props()?.items).toEqual([]);
    expect(lens.handle.open).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Open'));
    // The same base, given its rows: it opens with them.
    expect(lens.mounts).toBe(1);
    expect(lens.handle.open).toHaveBeenCalledTimes(1);
    const items = props()?.items ?? [];
    expect(items.map((item) => item.title)).toEqual(['Share', '', 'Delete']);
    act(() => props()?.onItemSelect?.({ nativeEvent: { id: items[2]?.id ?? '', index: 2 } }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('keeps the rows until the native menu has finished closing, then opens again from the same base', () => {
    const screen = wrap(<Menu onDelete={() => {}} />);
    fireEvent.press(screen.getByText('Open'));
    act(() => props()?.onMenuOpenChange?.({ nativeEvent: { open: true } }));
    // The native menu starts closing: the owner unmounts its rows, the motion goes on.
    act(() => props()?.onMenuOpenChange?.({ nativeEvent: { open: false } }));
    expect(props()?.items).toHaveLength(3);
    act(() => props()?.onMenuClosed?.());
    // Opened again: the same base, its rows again.
    fireEvent.press(screen.getByText('Open'));
    expect(props()?.items).toHaveLength(3);
    expect(lens.handle.open).toHaveBeenCalledTimes(2);
    expect(lens.mounts).toBe(1);
  });

  it('keeps its sheet when those rows leave the vocabulary', () => {
    wrap(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Text>Open</Text>
        </DropdownMenuTrigger>
        <OwnContent>
          <Wrapped />
        </OwnContent>
      </DropdownMenu>,
    );
    // The base around the trigger is given no rows: the sheet draws them.
    expect(props()?.items).toEqual([]);
  });
});

// The owner's component: what a feed row's menu is, so a closed menu does no row work.
function Rows({ onDelete }: { onDelete: () => void }) {
  return (
    <DropdownMenuContent>
      <DropdownMenuItem>Share</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive" onPress={onDelete}>
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

function Menu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Text>Open</Text>
      </DropdownMenuTrigger>
      {open ? <Rows onDelete={onDelete} /> : null}
    </DropdownMenu>
  );
}

function Wrapped() {
  return <DropdownMenuItem>Wrapped</DropdownMenuItem>;
}

function OwnContent({ children }: { children: React.ReactNode }) {
  return <DropdownMenuContent>{children}</DropdownMenuContent>;
}

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
    expect(props()?.cornerRadius).toBe(14);
    expect(props()?.triggerConfig?.tintColor).toMatch(/^(#|rgb)/);
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
    expect(props()?.items.map((item) => item.title)).toEqual(['Copy', 'Paste', 'Share', '']);
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
    const items = props()?.items ?? [];
    expect(items.map((item) => [item.title, item.checked])).toEqual([
      ['Apple', true],
      ['Pear', false],
    ]);
    act(() => props()?.onItemSelect?.({ nativeEvent: { id: items[1]?.id ?? '', index: 1 } }));
    expect(onValueChange).toHaveBeenCalledWith('pear');
  });
});

describe('a ButtonGroup with the lens material', () => {
  it('is drawn by the native lens, and its items still press', () => {
    const onPress = jest.fn();
    const screen = wrap(
      <Button.Group material="lens" accessibilityLabel="Actions">
        <Button onPress={onPress}>Share</Button>
      </Button.Group>,
    );
    expect(screen.getByTestId('native-lens')).toBeTruthy();
    expect(props()?.items).toEqual([]);
    expect(screen.getByLabelText('Actions')).toBeTruthy();
    act(() => screen.getByText('Share').props.onPress?.());
  });

  it('is one base: a menu opened from an item grows out of the group, and its buttons draw no lens', () => {
    const screen = wrap(
      <Button.Group material="lens" accessibilityLabel="Actions">
        <Button material="lens">Share</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Text>More</Text>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Copy</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Button.Group>,
    );
    // One native view: the group's base, holding the menu's rows.
    expect(screen.getAllByTestId('native-lens')).toHaveLength(1);
    expect(props()?.items.map((item) => item.title)).toEqual(['Copy']);
    fireEvent.press(screen.getByText('More'));
    expect(lens.handle.open).toHaveBeenCalledTimes(1);
  });

  it('keeps the shared surface without the lens prop', () => {
    const screen = wrap(
      <Button.Group accessibilityLabel="Actions">
        <Button>Share</Button>
      </Button.Group>,
    );
    expect(screen.queryByTestId('native-lens')).toBeNull();
  });
});

describe('a floating PageHeader', () => {
  it('draws its action group with the lens without a prop, and the bar presentation does not', () => {
    const actions = (
      <Button.Group accessibilityLabel="Header actions">
        <Button>Share</Button>
      </Button.Group>
    );
    const floating = wrap(<PageHeader title="Inbox" actions={actions} />);
    expect(floating.getAllByTestId('native-lens').length).toBeGreaterThan(0);
    floating.unmount();
    const bar = wrap(<PageHeader title="Inbox" presentation="bar" actions={actions} />);
    expect(bar.queryByTestId('native-lens')).toBeNull();
  });
});

describe('a Surface with the lens material', () => {
  it('is drawn by the native lens and holds its content', () => {
    const screen = wrap(
      <Surface material="lens" testID="panel">
        <Text>Panel</Text>
      </Surface>,
    );
    expect(screen.getByTestId('native-lens')).toBeTruthy();
    expect(screen.getByText('Panel')).toBeTruthy();
  });

  it('keeps the shared paint without the prop', () => {
    const screen = wrap(
      <Surface>
        <Text>Panel</Text>
      </Surface>,
    );
    expect(screen.queryByTestId('native-lens')).toBeNull();
  });

  it('keeps the shared paint in a separate window, where there is nothing behind to refract', () => {
    const screen = wrap(
      <BlurWindow>
        <Surface material="lens">
          <Text>Dialog</Text>
        </Surface>
      </BlurWindow>,
    );
    expect(screen.queryByTestId('native-lens')).toBeNull();
    expect(screen.getByText('Dialog')).toBeTruthy();
  });

  it('keeps the shared paint in the ComposerPopover window', () => {
    const anchorRef = {
      current: {
        measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) =>
          cb(100, 400, 80, 32),
      },
    };
    const screen = wrap(
      <ComposerPopover
        open
        onOpenChange={() => {}}
        anchorRef={anchorRef}
        label="Effort"
        side="bottom"
        sideOffset={8}
      >
        <Surface material="lens">
          <Text>Effort</Text>
        </Surface>
      </ComposerPopover>,
    );
    expect(screen.queryByTestId('native-lens')).toBeNull();
    expect(screen.getByText('Effort')).toBeTruthy();
  });
});

describe('a bottom toolbar composed of islands', () => {
  it('draws a circle, a central pill and a circle with the lens', () => {
    const screen = wrap(
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <BlurIsland>
          <Button
            iconOnly
            material="shared"
            appearance="plain"
            icon={RiFilterLine}
            accessibilityLabel="Filter"
          />
        </BlurIsland>
        <BlurIsland>
          <Button material="shared" appearance="plain">
            Inbox
          </Button>
        </BlurIsland>
        <BlurIsland>
          <Button
            iconOnly
            material="shared"
            appearance="plain"
            icon={RiSearchLine}
            accessibilityLabel="Search"
          />
        </BlurIsland>
      </View>,
    );
    expect(screen.getAllByTestId('native-lens')).toHaveLength(3);
    expect(screen.getByLabelText('Filter')).toBeTruthy();
    expect(screen.getByText('Inbox')).toBeTruthy();
  });
});
