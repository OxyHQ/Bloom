import { View } from 'react-native';
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
import { useTheme, withAlpha } from '@oxy.so/bloom/theme';

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

// A toolbar button whose ink a const holds: the theme's colours by a condition.
export function ToolbarAction({ invalid, active }: { invalid: boolean; active: boolean }) {
  const theme = useTheme();
  const tint = invalid ? theme.colors.error : active ? theme.colors.primary : undefined;
  return (
    <Button
      appearance="plain"
      tone="neutral"
      iconOnly
      leadingIcon={RiMoreFill}
      color={tint}
      hoverColor={tint}
    />
  );
}

/** Mention's labeler tab: the open one on the theme's primary at 10%. */
export function LabelerTab() {
  const theme = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: withAlpha(theme.colors.primary, 0.1),
      }}
    />
  );
}
