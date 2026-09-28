import { Button } from '../button/index.web';
import { Popover, PopoverContent, PopoverTrigger } from '../popover/index.web';
import { createAttachmentMenu } from './create-attachment-menu';

export const AttachmentMenu = createAttachmentMenu({ Button, Popover, PopoverContent, PopoverTrigger });
