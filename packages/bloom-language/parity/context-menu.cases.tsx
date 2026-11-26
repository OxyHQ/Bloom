import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@oxy.so/bloom/context-menu';
import { Button } from '@oxy.so/bloom/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@oxy.so/bloom/dropdown-menu';
import { RiDeleteBinLine, RiFileCopyLine, RiMoreFill, RiShareLine } from '@oxy.so/bloom/icons';
import { Text } from '@oxy.so/bloom/typography';

import * as L from '../src/__tests__/support/language.generated';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const set = () => {};
const copy = () => {};
const remove = () => {};
const AT = { x: 40, y: 60 };
const MessageActions = L.actions(() => ({ copy, remove }));
const MessageMenu = L.menu(() => [
  L.Item('Copy').onPress(copy),
  L.Item('Delete').destructive().onPress(remove),
]);

const area = () => L.Text('Hold for options');
const bloomArea = () => <Text>Hold for options</Text>;

export const CONTEXT_MENU_CASES: readonly ParityCase[] = [
  {
    // Mention's post menu: Bloom's dropdown on every platform, as its JSX draws it.
    name: 'a menu drawn as Bloom’s dropdown everywhere',
    language: () =>
      toElement(
        L.Menu(
          L.Button(L.Icon(RiMoreFill)).style('subtle').shape('circle').label('More'),
          L.Item('Copy').onPress(copy),
        )
          .label('More')
          .menuStyle('dropdown'),
      ),
    bloom: () => (
      <DropdownMenu open={false} onOpenChange={set}>
        <DropdownMenuTrigger asChild label="More">
          <Button
            appearance="subtle"
            leadingIcon={RiMoreFill}
            iconOnly
            accessibilityLabel="More"
            onPress={set}
          />
        </DropdownMenuTrigger>
      </DropdownMenu>
    ),
  },
  {
    // Mention's post header menu, which the app opens itself; its audience as a section of choices.
    name: 'a dropdown menu the app holds open, with a section of choices',
    isolated: true,
    language: () =>
      toElement(
        L.Menu(
          L.Button(L.Icon(RiMoreFill)).style('subtle').shape('circle').label('More'),
          L.Item('Copy').onPress(copy),
          L.Section(L.Item('Everyone').tag('public'), L.Item('Private').tag('direct'))
            .title('Who can see this post')
            .selection(['public', set]),
        )
          .label('More')
          .menuStyle('dropdown')
          .presented([true, set]),
      ),
    bloom: () => (
      <DropdownMenu open onOpenChange={set}>
        <DropdownMenuTrigger asChild label="More">
          <Button
            appearance="subtle"
            leadingIcon={RiMoreFill}
            iconOnly
            accessibilityLabel="More"
            onPress={set}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent label="More">
          <DropdownMenuItem variant="default" onPress={copy}>
            Copy
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Who can see this post</DropdownMenuLabel>
          <DropdownMenuRadioGroup value="public" onValueChange={set}>
            <DropdownMenuRadioItem value="public">Everyone</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="direct">Private</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
  {
    name: 'a dropdown menu the app holds closed',
    language: () =>
      toElement(
        L.Menu(
          L.Button(L.Icon(RiMoreFill)).style('subtle').shape('circle').label('More'),
          L.Item('Copy').onPress(copy),
        )
          .label('More')
          .menuStyle('dropdown')
          .presented([false, set]),
      ),
    bloom: () => (
      <DropdownMenu open={false} onOpenChange={set}>
        <DropdownMenuTrigger asChild label="More">
          <Button
            appearance="subtle"
            leadingIcon={RiMoreFill}
            iconOnly
            accessibilityLabel="More"
            onPress={set}
          />
        </DropdownMenuTrigger>
      </DropdownMenu>
    ),
  },
  {
    // A row's own glyph size and ink, over the menu's 20pt quiet ink (Mention's 22pt rows).
    name: 'an open context menu whose rows size and ink their own glyphs',
    isolated: true,
    language: () =>
      toElement(
        L.ContextMenu(
          area(),
          L.Item('Copy')
            .icon(RiFileCopyLine)
            .iconSize('22')
            .iconForeground('foreground')
            .onPress(copy),
          L.Item('Share').icon(RiShareLine).iconSize('sm').iconForeground('primary').onPress(set),
          L.Item('Delete').icon(RiDeleteBinLine).iconSize('22').destructive().onPress(remove),
        ).presentedAt([AT, set]),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <ContextMenu anchor={AT} onAnchorChange={set}>
            <ContextMenuTrigger>{bloomArea()}</ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem
                leading={<RiFileCopyLine width={22} height={22} fill={c.text} />}
                variant="default"
                onPress={copy}
              >
                Copy
              </ContextMenuItem>
              <ContextMenuItem
                leading={<RiShareLine size="sm" fill={c.primary} />}
                variant="default"
                onPress={set}
              >
                Share
              </ContextMenuItem>
              <ContextMenuItem
                leading={<RiDeleteBinLine width={22} height={22} fill={c.error} />}
                variant="destructive"
                onPress={remove}
              >
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )}
      </Themed>
    ),
  },
  {
    // A submenu's own glyph size and ink, as an item's (Mention's 22pt rows).
    name: 'an open context menu whose submenu sizes and inks its own glyph',
    isolated: true,
    language: () =>
      toElement(
        L.ContextMenu(
          area(),
          L.Submenu('Share', L.Item('Email').onPress(set))
            .icon(RiShareLine)
            .iconSize('22')
            .iconForeground('foreground'),
        ).presentedAt([AT, set]),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <ContextMenu anchor={AT} onAnchorChange={set}>
            <ContextMenuTrigger>{bloomArea()}</ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuSub>
                <ContextMenuSubTrigger
                  leading={<RiShareLine width={22} height={22} fill={c.text} />}
                  disabled={false}
                >
                  Share
                </ContextMenuSubTrigger>
                <ContextMenuSubContent label="Share">
                  <ContextMenuItem variant="default" onPress={set}>
                    Email
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
            </ContextMenuContent>
          </ContextMenu>
        )}
      </Themed>
    ),
  },
  {
    name: 'a context menu on a view',
    language: () =>
      toElement(
        L.ContextMenu(
          area(),
          L.Item('Copy').onPress(copy),
          L.Divider(),
          L.Item('Delete').destructive().onPress(remove),
        ),
      ),
    bloom: () => (
      <ContextMenu>
        <ContextMenuTrigger>{bloomArea()}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem variant="default" onPress={copy}>
            Copy
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive" onPress={remove}>
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ),
  },
  {
    name: 'an open context menu, its rows with glyphs, sections and a submenu',
    isolated: true,
    language: () =>
      toElement(
        L.ContextMenu(
          area(),
          L.Item('Copy').icon(RiFileCopyLine).onPress(copy),
          L.Section(L.Item('Pinned').checked(true).onPress(set).keepOpen()).title('View'),
          L.Submenu('Share', L.Item('Email').onPress(set), L.Item('Messages').disabled()).icon(
            RiShareLine,
          ),
          L.Item('Delete').icon(RiDeleteBinLine).destructive().onPress(remove).testID('delete'),
        ).presentedAt([AT, set]),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <ContextMenu anchor={AT} onAnchorChange={set}>
            <ContextMenuTrigger>{bloomArea()}</ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem
                leading={<RiFileCopyLine size="md" fill={c.textSecondary} />}
                variant="default"
                onPress={copy}
              >
                Copy
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <ContextMenuLabel>View</ContextMenuLabel>
                <ContextMenuCheckboxItem checked onCheckedChange={set} keepOpen>
                  Pinned
                </ContextMenuCheckboxItem>
              </ContextMenuGroup>
              <ContextMenuSeparator />
              <ContextMenuSub>
                <ContextMenuSubTrigger
                  leading={<RiShareLine size="md" fill={c.textSecondary} />}
                  disabled={false}
                >
                  Share
                </ContextMenuSubTrigger>
                <ContextMenuSubContent label="Share">
                  <ContextMenuItem variant="default" onPress={set}>
                    Email
                  </ContextMenuItem>
                  <ContextMenuItem variant="default" disabled>
                    Messages
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuItem
                leading={<RiDeleteBinLine size="md" fill={c.error} />}
                variant="destructive"
                onPress={remove}
                testID="delete"
              >
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )}
      </Themed>
    ),
  },
  {
    // Mention's reply settings: a titled radio group, then toggles; the chosen row marked.
    name: 'an open context menu with a section of choices',
    isolated: true,
    language: () =>
      toElement(
        L.ContextMenu(
          area(),
          L.Section(
            L.Item('Anyone').tag('anyone').keepOpen(),
            L.Item('Nobody').tag('nobody').keepOpen().testID('nobody'),
          )
            .title('Who can reply')
            .selection(['nobody', set]),
          L.Divider(),
          L.Item('Allow quotes').checked(true).onPress(set).keepOpen(),
        ).presentedAt([AT, set]),
      ),
    bloom: () => (
      <ContextMenu anchor={AT} onAnchorChange={set}>
        <ContextMenuTrigger>{bloomArea()}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>Who can reply</ContextMenuLabel>
          <ContextMenuRadioGroup value="nobody" onValueChange={set}>
            <ContextMenuRadioItem value="anyone" keepOpen>
              Anyone
            </ContextMenuRadioItem>
            <ContextMenuRadioItem value="nobody" keepOpen testID="nobody">
              Nobody
            </ContextMenuRadioItem>
          </ContextMenuRadioGroup>
          <ContextMenuSeparator />
          <ContextMenuCheckboxItem checked onCheckedChange={set} keepOpen>
            Allow quotes
          </ContextMenuCheckboxItem>
        </ContextMenuContent>
      </ContextMenu>
    ),
  },
  {
    // No row chosen: a selection of undefined marks none.
    name: 'an open context menu whose choices have none chosen, with glyphs',
    isolated: true,
    language: () =>
      toElement(
        L.ContextMenu(
          area(),
          L.Item('Copy').onPress(copy),
          L.Section(L.Item('Share').icon(RiShareLine).tag('share')).selection([undefined, set]),
        ).presentedAt([AT, set]),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <ContextMenu anchor={AT} onAnchorChange={set}>
            <ContextMenuTrigger>{bloomArea()}</ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem variant="default" onPress={copy}>
                Copy
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuRadioGroup value={undefined} onValueChange={set}>
                <ContextMenuRadioItem
                  value="share"
                  leading={<RiShareLine size="md" fill={c.textSecondary} />}
                >
                  Share
                </ContextMenuRadioItem>
              </ContextMenuRadioGroup>
            </ContextMenuContent>
          </ContextMenu>
        )}
      </Themed>
    ),
  },
  {
    name: 'a named context menu on a framed view',
    language: () =>
      toElement(
        L.ContextMenu(area(), L.Item('Copy').onPress(copy))
          .label('Message options')
          .testID('message')
          .padding('md')
          .frame({ width: 'full' }),
      ),
    bloom: () => (
      <ContextMenu>
        <ContextMenuTrigger
          label="Message options"
          testID="message"
          style={{
            paddingTop: 12,
            paddingBottom: 12,
            paddingStart: 12,
            paddingEnd: 12,
            width: '100%',
          }}
        >
          {bloomArea()}
        </ContextMenuTrigger>
        <ContextMenuContent label="Message options">
          <ContextMenuItem variant="default" onPress={copy}>
            Copy
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ),
  },
  {
    name: 'a disabled context menu',
    language: () =>
      toElement(
        L.ContextMenu(area(), L.Item('Copy').onPress(copy)).disabled().presentedAt([null, set]),
      ),
    bloom: () => (
      <ContextMenu anchor={null} onAnchorChange={set}>
        <ContextMenuTrigger disabled>{bloomArea()}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem variant="default" onPress={copy}>
            Copy
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ),
  },
  {
    name: 'tagged rows, resolved by its actions',
    language: () =>
      toElement(
        L.ContextMenu(area(), L.Item('Copy').tag('copy'), L.Item('Delete').tag('remove')).actions(
          MessageActions(),
        ),
      ),
    bloom: () => (
      <ContextMenu>
        <ContextMenuTrigger>{bloomArea()}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem variant="default" onPress={copy}>
            Copy
          </ContextMenuItem>
          <ContextMenuItem variant="default" onPress={remove}>
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ),
  },
  {
    name: 'rows from a menu() content',
    language: () => toElement(L.ContextMenu(area(), MessageMenu())),
    bloom: () => (
      <ContextMenu>
        <ContextMenuTrigger>{bloomArea()}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem variant="default" onPress={copy}>
            Copy
          </ContextMenuItem>
          <ContextMenuItem variant="destructive" onPress={remove}>
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ),
  },
];
