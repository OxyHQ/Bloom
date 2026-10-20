import { Button } from '../button/index.web';
import { ScrollArea } from '../layout/ScrollArea.web';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../dropdown-menu/index.web';
import { createBreadcrumb } from './create-breadcrumb';
export const { Breadcrumb, BreadcrumbItem } = createBreadcrumb({
  Button,
  ScrollArea,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
});
