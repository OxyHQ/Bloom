import {
  createContext,
  useContext,
  type ComponentType,
  type ReactNode,
} from 'react';
import type * as NativeButton from '../button';
import type * as NativeDialog from '../dialog';
import type * as NativeMenu from '../dropdown-menu';
import type * as NativeSelect from '../select';
import type * as NativeTooltip from '../tooltip';

export interface ProjectBoardPlatform {
  Tooltip: typeof NativeTooltip.Tooltip;
  TooltipTrigger: typeof NativeTooltip.TooltipTrigger;
  TooltipContent: typeof NativeTooltip.TooltipContent;
  TicketGenieSurface: ComponentType<{ children: ReactNode }>;
  TicketCornerGenieSurface: ComponentType<{ children: ReactNode }>;
  Button: typeof NativeButton.Button;
  CloseButton: typeof NativeButton.CloseButton;
  Dialog: typeof NativeDialog.Dialog;
  Portal: ComponentType<{ children?: ReactNode }>;
  Select: typeof NativeSelect.Select;
  SelectTrigger: typeof NativeSelect.SelectTrigger;
  SelectValue: typeof NativeSelect.SelectValue;
  SelectContent: typeof NativeSelect.SelectContent;
  SelectItem: typeof NativeSelect.SelectItem;
  SelectItemText: typeof NativeSelect.SelectItemText;
  SelectItemIndicator: typeof NativeSelect.SelectItemIndicator;
  DropdownMenu: typeof NativeMenu.DropdownMenu;
  DropdownMenuTrigger: typeof NativeMenu.DropdownMenuTrigger;
  DropdownMenuContent: typeof NativeMenu.DropdownMenuContent;
  DropdownMenuItem: typeof NativeMenu.DropdownMenuItem;
  DropdownMenuCheckboxItem: typeof NativeMenu.DropdownMenuCheckboxItem;
  DropdownMenuLabel: typeof NativeMenu.DropdownMenuLabel;
}
export const ProjectBoardPlatformContext =
  createContext<ProjectBoardPlatform | null>(null);
/** The plot starts its own reveal after the panel has reached its live pixels. */
export const TicketGenieEnteredContext = createContext(true);
export function useProjectBoardPlatform() {
  const platform = useContext(ProjectBoardPlatformContext);
  if (!platform)
    throw new Error(
      'Project Board parts must be rendered inside ProjectBoard.',
    );
  return platform;
}
