import { ScrollArea } from '../layout/ScrollArea';
import { Button } from '../button';
import * as Menu from '../dropdown-menu';
import { createHeaderActions } from './HeaderActionsBase';
export const HeaderActions = createHeaderActions({
  ScrollArea,
  Button,
  ...Menu,
});
