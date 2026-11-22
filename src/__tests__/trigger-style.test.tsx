import type React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { ContextMenu, ContextMenuTrigger } from '../context-menu';
import { DropdownMenu, DropdownMenuTrigger } from '../dropdown-menu';
import { Menubar, MenubarMenu, MenubarTrigger } from '../menubar';
import { Popover, PopoverTrigger } from '../popover';
import { Select, SelectTrigger } from '../select';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { hostNodes, resolvedStyle } from './support/rendered-style';

const MARKER = { minWidth: 137 };

function renderTrigger(children: React.ReactNode) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {children}
    </BloomThemeProvider>,
  );
}

function markerCount(tree: unknown): number {
  return hostNodes(tree).filter((node) => resolvedStyle(node.props.style).minWidth === 137).length;
}

describe('anchored trigger style wiring', () => {
  it.each([
    [
      'ContextMenu',
      <ContextMenu key="context">
        <ContextMenuTrigger style={MARKER} label="Open context menu">
          <Text>Open</Text>
        </ContextMenuTrigger>
      </ContextMenu>,
    ],
    [
      'DropdownMenu',
      <DropdownMenu key="dropdown">
        <DropdownMenuTrigger style={MARKER} label="Open menu">
          <Text>Open</Text>
        </DropdownMenuTrigger>
      </DropdownMenu>,
    ],
    [
      'Popover',
      <Popover key="popover">
        <PopoverTrigger style={MARKER} label="Open popover">
          <Text>Open</Text>
        </PopoverTrigger>
      </Popover>,
    ],
    [
      'Menubar',
      <Menubar key="menubar">
        <MenubarMenu value="file">
          <MenubarTrigger style={MARKER}>File</MenubarTrigger>
        </MenubarMenu>
      </Menubar>,
    ],
    [
      'Select',
      <Select key="select">
        <SelectTrigger style={MARKER} label="Choose model">
          <Text>Automatic</Text>
        </SelectTrigger>
      </Select>,
    ],
  ])('%s lands the public style prop on one node', (_family, trigger) => {
    const rendered = renderTrigger(trigger);
    expect(markerCount(rendered.toJSON())).toBe(1);
  });
});
