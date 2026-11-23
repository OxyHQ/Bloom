import { Text } from 'react-native';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@bloom/context-menu';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'closed trigger': () => (
    <ContextMenu>
      <ContextMenuTrigger label="Row" testID="trigger">
        <Text>Row</Text>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Copy</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
  'open sheet, styled': () => (
    <ContextMenu defaultOpen>
      <ContextMenuTrigger label="Row" style={{ padding: 2 }} disabled>
        <Text>Row</Text>
      </ContextMenuTrigger>
      <ContextMenuContent label="Row menu" style={{ paddingTop: 3 }} testID="content">
        <ContextMenuItem>Copy</ContextMenuItem>
        <ContextMenuItem disabled>Paste</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};
