import { Button } from '../button';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { createAttachmentMenu } from './create-attachment-menu';

export const AttachmentMenu = createAttachmentMenu({
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
});
