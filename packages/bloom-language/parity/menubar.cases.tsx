import { RiFileCopyLine, RiShareLine } from '@oxy.so/bloom/icons';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@oxy.so/bloom/menubar';

import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const set = () => {};
const run = () => {};
const EditActions = L.actions(() => ({ copy: run, paste: run }));

const fileMenu = () =>
  L.MenubarMenu(
    'File',
    L.Item('New tab').shortcut('Mod+T').onPress(run),
    L.Item('Open…').onPress(run),
    L.Divider(),
    L.Item('Close').destructive().onPress(run),
  );
const bloomFileMenu = () => (
  <MenubarMenu value="File">
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem variant="default" onPress={run} shortcut="Mod+T">
        New tab
      </MenubarItem>
      <MenubarItem variant="default" onPress={run}>
        Open…
      </MenubarItem>
      <MenubarSeparator />
      <MenubarItem variant="destructive" onPress={run}>
        Close
      </MenubarItem>
    </MenubarContent>
  </MenubarMenu>
);

export const MENUBAR_CASES: readonly ParityCase[] = [
  {
    name: 'a menubar',
    language: () =>
      toElement(
        L.Menubar(fileMenu(), L.MenubarMenu('Help', L.Item('About').onPress(run))).label('App'),
      ),
    bloom: () => (
      <Menubar label="App">
        {bloomFileMenu()}
        <MenubarMenu value="Help">
          <MenubarTrigger>Help</MenubarTrigger>
          <MenubarContent>
            <MenubarItem variant="default" onPress={run}>
              About
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    ),
  },
  {
    name: 'an open menu of a menubar, with glyphs, a section, a toggle and a submenu',
    language: () =>
      toElement(
        L.Menubar(
          fileMenu(),
          L.MenubarMenu(
            'Edit',
            L.Item('Copy').icon(RiFileCopyLine).shortcut('Mod+C').tag('copy'),
            L.Item('Paste').shortcut('Mod+V').tag('paste'),
            L.Section(L.Item('Word wrap').checked(true).shortcut('Alt+Z').onPress(set)).title(
              'View',
            ),
            L.Submenu('Share', L.Item('Email').onPress(run)).icon(RiShareLine),
          )
            .id('edit')
            .testID('edit'),
        )
          .openMenu(['edit', set])
          .actions(EditActions())
          .testID('bar'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <Menubar value="edit" onValueChange={set} testID="bar">
            {bloomFileMenu()}
            <MenubarMenu value="edit">
              <MenubarTrigger testID="edit">Edit</MenubarTrigger>
              <MenubarContent>
                <MenubarItem
                  leading={<RiFileCopyLine size="md" fill={c.textSecondary} />}
                  variant="default"
                  onPress={run}
                  shortcut="Mod+C"
                >
                  Copy
                </MenubarItem>
                <MenubarItem variant="default" onPress={run} shortcut="Mod+V">
                  Paste
                </MenubarItem>
                <MenubarSeparator />
                <MenubarGroup>
                  <MenubarLabel>View</MenubarLabel>
                  <MenubarCheckboxItem checked onCheckedChange={set} shortcut="Alt+Z">
                    Word wrap
                  </MenubarCheckboxItem>
                </MenubarGroup>
                <MenubarSeparator />
                <MenubarSub>
                  <MenubarSubTrigger
                    leading={<RiShareLine size="md" fill={c.textSecondary} />}
                    disabled={false}
                  >
                    Share
                  </MenubarSubTrigger>
                  <MenubarSubContent label="Share">
                    <MenubarItem variant="default" onPress={run}>
                      Email
                    </MenubarItem>
                  </MenubarSubContent>
                </MenubarSub>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        )}
      </Themed>
    ),
  },
  {
    name: 'a menubar with a disabled menu, framed',
    language: () =>
      toElement(
        L.Menubar(fileMenu(), L.MenubarMenu('Help', L.Item('About').onPress(run)).disabled())
          .openMenu([undefined, set])
          .padding('xs'),
      ),
    bloom: () => (
      <Menubar
        value={undefined}
        onValueChange={set}
        style={{ paddingTop: 4, paddingBottom: 4, paddingStart: 4, paddingEnd: 4 }}
      >
        {bloomFileMenu()}
        <MenubarMenu value="Help">
          <MenubarTrigger disabled>Help</MenubarTrigger>
          <MenubarContent>
            <MenubarItem variant="default" onPress={run}>
              About
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    ),
  },
];
