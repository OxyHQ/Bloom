import { ScrollArea } from '../layout/ScrollArea.web';
import { Button } from '../button/index.web';
import * as Menu from '../dropdown-menu/index.web';
import { createHeaderActions } from './HeaderActionsBase';
export const HeaderActions = createHeaderActions({
  ScrollArea,
  Button,
  ...Menu,
});
