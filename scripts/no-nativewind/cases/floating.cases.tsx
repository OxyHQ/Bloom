import type { ReactNode } from 'react';
import { Text } from 'react-native';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSwatchRow,
} from '@bloom/dropdown-menu';
import { BloomScope } from '@bloom/appearance';
import { MenuSurfaceProvider } from '@bloom/floating/context';
import { PopupPanelChrome } from '@bloom/floating/PopupPanel';
import { PlatformSurfaceProvider } from '@bloom/platform-surface/context';
import type { Cases } from '../support/cases';

const noop = () => {};
const SURFACE = { close: noop, presentation: 'dropdown' as const };
const DESKTOP = { platform: 'desktop', capabilities: new Set(['window']) } as never;

/** Every row of the vocabulary, plain and loaded. */
function Rows() {
  return (
    <>
      <DropdownMenuLabel>Account</DropdownMenuLabel>
      <DropdownMenuLabel inset>Inset label</DropdownMenuLabel>
      <DropdownMenuItem>Plain</DropdownMenuItem>
      <DropdownMenuItem
        leading={<Text>L</Text>}
        trailing={<DropdownMenuShortcut>⌘K</DropdownMenuShortcut>}
        style={{ marginTop: 1 }}
        testID="loaded"
      >
        Loaded
      </DropdownMenuItem>
      <DropdownMenuItem inset>Inset</DropdownMenuItem>
      <DropdownMenuItem disabled>Disabled</DropdownMenuItem>
      <DropdownMenuItem disabled>
        <Text>Disabled node</Text>
      </DropdownMenuItem>
      <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
      <DropdownMenuItem current>Current</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem checked onCheckedChange={noop}>
        Checked
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem checked={false} onCheckedChange={noop}>
        Unchecked
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem checked indicatorPosition="trailing" onCheckedChange={noop}>
        Trailing
      </DropdownMenuCheckboxItem>
      <DropdownMenuRadioGroup value="a" onValueChange={noop}>
        <DropdownMenuRadioItem value="a">A</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="b">B</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="c" indicatorPosition="trailing" disabled>
          C
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
      <DropdownMenuGroup style={{ marginBottom: 2 }}>
        <DropdownMenuItem>In group</DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSub defaultOpen>
        <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem>Nested</DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger inset disabled>
          Closed
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem>Hidden</DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSwatchRow
        accessibilityLabel="Tags"
        swatches={[
          { key: 'r', color: '#ef4444', name: 'Red', state: 'on' },
          { key: 'g', color: '#22c55e', name: 'Green', state: 'off', disabled: true },
        ]}
        onSelect={noop}
      />
    </>
  );
}

function Menu({ children, size }: { children: ReactNode; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  return (
    <BloomScope size={size}>
      <MenuSurfaceProvider value={SURFACE}>{children}</MenuSurfaceProvider>
    </BloomScope>
  );
}

export const CASES: Cases = {
  'rows md': () => (
    <Menu>
      <Rows />
    </Menu>
  ),
  'rows xs': () => (
    <Menu size="xs">
      <Rows />
    </Menu>
  ),
  'rows sm': () => (
    <Menu size="sm">
      <Rows />
    </Menu>
  ),
  'rows lg': () => (
    <Menu size="lg">
      <Rows />
    </Menu>
  ),
  'rows desktop': () => (
    <PlatformSurfaceProvider value={DESKTOP}>
      <Menu>
        <PopupPanelChrome style={{ opacity: 1 }}>
          <Rows />
        </PopupPanelChrome>
      </Menu>
    </PlatformSurfaceProvider>
  ),
};
