import { Text } from 'react-native';
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from '@bloom/menubar';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'bar, closed': () => (
    <Menubar testID="bar">
      <MenubarMenu value="file">
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>New</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="edit">
        <MenubarTrigger disabled>
          <Text>Edit</Text>
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Undo</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  ),
  'bar, open menu, styled': () => (
    <Menubar defaultValue="file" style={{ marginTop: 4 }} label="App">
      <MenubarMenu value="file">
        <MenubarTrigger style={{ margin: 1 }} testID="file">
          File
        </MenubarTrigger>
        <MenubarContent style={{ paddingTop: 2 }}>
          <MenubarItem>New</MenubarItem>
          <MenubarItem disabled>Open</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  ),
};
