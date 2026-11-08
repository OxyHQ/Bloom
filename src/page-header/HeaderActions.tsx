import { ScrollArea } from '../layout/ScrollArea';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import * as Menu from '../dropdown-menu';
import { createHeaderActions } from './HeaderActionsBase';
export const HeaderActions = createHeaderActions({
  ScrollArea,
  ButtonGroup,
  ButtonGroupItem,
  ...Menu,
});
