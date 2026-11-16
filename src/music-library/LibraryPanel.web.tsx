import { LibraryItem } from './LibraryItem.web';
import { Screen, ScreenScrollView } from '../screen/index.web';
import { Surface } from '../surface/index.web';
import { Button } from '../button/index.web';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu/index.web';
import { createLibraryPanel } from './LibraryPanelBase';

export const LibraryPanel = createLibraryPanel({
  LibraryItem,
  Screen,
  ScreenScrollView,
  Surface,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
});
