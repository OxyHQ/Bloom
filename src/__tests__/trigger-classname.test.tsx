import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { ContextMenu, ContextMenuTrigger } from '../context-menu';
import { DropdownMenu, DropdownMenuTrigger } from '../dropdown-menu';
import { Menubar, MenubarMenu, MenubarTrigger } from '../menubar';
import { Popover, PopoverTrigger } from '../popover';
import { Select, SelectTrigger } from '../select';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { classNamesOn, hostNodes } from './support/rendered-style';

const MARKER_CLASS = 'min-w-[137px]';

function renderTrigger(children: React.ReactNode) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {children}
    </BloomThemeProvider>,
  );
}

function markerCount(tree: unknown): number {
  return hostNodes(tree).filter((node) =>
    classNamesOn(node.props.style).some((className) =>
      className.split(/\s+/).includes(MARKER_CLASS),
    ),
  ).length;
}

describe('anchored trigger className wiring', () => {
  it.each([
    [
      'ContextMenu',
      <ContextMenu key="context">
        <ContextMenuTrigger className={MARKER_CLASS} label="Open context menu">
          <Text>Open</Text>
        </ContextMenuTrigger>
      </ContextMenu>,
    ],
    [
      'DropdownMenu',
      <DropdownMenu key="dropdown">
        <DropdownMenuTrigger className={MARKER_CLASS} label="Open menu">
          <Text>Open</Text>
        </DropdownMenuTrigger>
      </DropdownMenu>,
    ],
    [
      'Popover',
      <Popover key="popover">
        <PopoverTrigger className={MARKER_CLASS} label="Open popover">
          <Text>Open</Text>
        </PopoverTrigger>
      </Popover>,
    ],
    [
      'Menubar',
      <Menubar key="menubar">
        <MenubarMenu value="file">
          <MenubarTrigger className={MARKER_CLASS}>File</MenubarTrigger>
        </MenubarMenu>
      </Menubar>,
    ],
    [
      'Select',
      <Select key="select">
        <SelectTrigger className={MARKER_CLASS} label="Choose model">
          <Text>Automatic</Text>
        </SelectTrigger>
      </Select>,
    ],
  ])('%s does not drop the public className prop', (_family, trigger) => {
    const rendered = renderTrigger(trigger);
    expect(markerCount(rendered.toJSON())).toBe(1);
  });
});
