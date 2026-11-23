// Menus drawn as Bloom's dropdown on every platform: a trigger and its rows.
import { Button } from '@oxy.so/bloom/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@oxy.so/bloom/dropdown-menu';
import { RiMoreFill, RiShareLine } from '@oxy.so/bloom/icons';
import { Icon, toElement } from '@oxy.so/bloom-language';

export function PostMore({ share, block }: { share: () => void; block: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild label="More">
        <Button iconOnly appearance="plain" leadingIcon={RiMoreFill} accessibilityLabel="More" />
      </DropdownMenuTrigger>
      <DropdownMenuContent label="More">
        <DropdownMenuItem
          leading={toElement(Icon(RiShareLine).size('sm').foreground('primary'))}
          onPress={share}
        >
          Share
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onPress={block}>
          Block
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
