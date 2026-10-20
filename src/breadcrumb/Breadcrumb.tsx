import { Button } from '../button';
import { ScrollArea } from '../layout/ScrollArea';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../dropdown-menu';
import { createBreadcrumb } from './create-breadcrumb';
export const { Breadcrumb, BreadcrumbItem } = createBreadcrumb({
  Button,
  ScrollArea,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
});
