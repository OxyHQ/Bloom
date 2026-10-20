import { Screen, ScreenScrollView } from '../screen/index.web';
import { Surface } from '../surface/index.web';
import { GlyphButton } from '../button/index.web';
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
