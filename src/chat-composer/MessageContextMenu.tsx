import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { ReactionPicker } from './ReactionPicker';
import { createMessageContextMenu } from './create-message-context-menu';

export const MessageContextMenu = createMessageContextMenu({
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  ReactionPicker,
});
