import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@oxy.so/bloom/context-menu';
import { RiDeleteBinLine, RiFileCopyLine, RiShareLine } from '@oxy.so/bloom/icons';
import { Text } from '@oxy.so/bloom/typography';

import * as L from '../src/index';
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
