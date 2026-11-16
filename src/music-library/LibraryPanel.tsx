import { LibraryItem } from './LibraryItem';
import { Screen, ScreenScrollView } from '../screen/index';
import { Surface } from '../surface/index';
import { Button } from '../button/index';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu/index';
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
