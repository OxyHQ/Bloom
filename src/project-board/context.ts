import { createContext, useContext, type ComponentType, type ReactNode } from 'react';
import type * as NativeDialog from '../dialog';
import type * as NativeSelect from '../select';
import type * as NativeMenu from '../dropdown-menu';
import type * as NativeButton from '../button';

export interface ProjectBoardPlatform {
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
export const ProjectBoardPlatformContext = createContext<ProjectBoardPlatform | null>(null);
export function useProjectBoardPlatform() {
  const platform = useContext(ProjectBoardPlatformContext);
  if (!platform) throw new Error('Project Board parts must be rendered inside ProjectBoard.');
  return platform;
}
