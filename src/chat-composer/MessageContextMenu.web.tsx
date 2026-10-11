import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '../dropdown-menu/index.web';
import { ReactionPicker } from './ReactionPicker.web';
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
