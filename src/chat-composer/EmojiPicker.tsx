import { Tabs, TabsTrigger } from '../tabs';
import { TextFieldInput } from '../text-field';
import { Surface } from '../surface';
import { Button } from '../button';
import { createEmojiPicker } from './create-emoji-picker';

export const EmojiPicker = createEmojiPicker({
  Surface,
  Button,
  Tabs,
  TabsTrigger,
  TextFieldInput,
});
