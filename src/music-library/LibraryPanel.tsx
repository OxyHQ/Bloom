import { Screen, ScreenScrollView } from '../screen/index';
import { Surface } from '../surface/index';
import { GlyphButton } from '../button/index';
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
  Screen,
  ScreenScrollView,
  Surface,
  GlyphButton,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
});
