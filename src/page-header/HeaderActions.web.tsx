import { ScrollArea } from '../layout/ScrollArea.web';
import { ButtonGroup, ButtonGroupItem } from '../button-group/index.web';
import * as Menu from '../dropdown-menu/index.web';
import { createHeaderActions } from './HeaderActionsBase';
export const HeaderActions = createHeaderActions({
  ScrollArea,
  ButtonGroup,
  ButtonGroupItem,
  ...Menu,
});
