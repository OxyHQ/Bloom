import { ScrollArea } from '../layout/ScrollArea.web';
import { createList } from './ListBase';
import { ListItem } from './ListItem.web';
export const List = createList({ ListItem, ScrollArea });
