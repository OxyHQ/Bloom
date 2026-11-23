import { Text } from 'react-native';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@bloom/dropdown-menu';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'closed trigger': () => (
    <DropdownMenu>
      <DropdownMenuTrigger label="Actions" testID="trigger">
        <Text>Open</Text>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Rename</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  'open sheet, styled': () => (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger label="Actions" style={{ margin: 2 }} disabled>
        <Text>Open</Text>
      </DropdownMenuTrigger>
      <DropdownMenuContent label="Menu" style={{ paddingTop: 3 }} testID="content" size="sm">
        <DropdownMenuLabel>File</DropdownMenuLabel>
        <DropdownMenuItem>Rename</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
